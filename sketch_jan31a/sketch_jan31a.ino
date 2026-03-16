#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "DHT.h"
#include <GP2YDustSensor.h>
#include <WiFiManager.h>

// --- CẤU HÌNH MQTT ---
const char* mqtt_server   = "10.124.144.200"; 
const int   mqtt_port     = 2204;          
const char* mqtt_username = "yuika";
const char* mqtt_password = "G1nkosora";

// --- TOPICS ---
const char* TOPIC_DATA    = "sensor/data";    // Gửi dữ liệu từng sensor
const char* TOPIC_CTRL    = "device/control"; // Lắng nghe lệnh bật tắt
const char* TOPIC_STATUS  = "device/status";  // Phản hồi trạng thái đồng bộ

// --- PINOUT ---
#define PIN_DHT_DATA  14
#define PIN_DUST_LED  5
#define PIN_DUST_IN   34
#define PIN_SENSOR_AO 36
#define PIN_LED_TEMP  21 
#define PIN_LED_HUM   19
#define PIN_LED_LDR   22
#define PIN_LED_DUST  23

// --- KHAI BÁO CẢM BIẾN ---
DHT dht(PIN_DHT_DATA, DHT11);
GP2YDustSensor dustSensor(GP2YDustSensorType::GP2Y1010AU0F, PIN_DUST_LED, PIN_DUST_IN);

WiFiClient espClient;
PubSubClient client(espClient);

// --- BIẾN QUẢN LÝ TRẠNG THÁI ---
bool active_temp = false;
bool active_hum  = false;
bool active_ldr  = false;
bool active_dust = false;

unsigned long lastMsg = 0;
const long interval = 2000; // Tần suất gửi data

// Hàm gửi dữ liệu sensor đơn lẻ
void send_sensor_data(String sensor_name, float value) {
    if (isnan(value)) return;
    
    StaticJsonDocument<128> doc;
    doc["sensor"] = sensor_name;
    doc["value"]  = value;
    
    char buffer[128];
    serializeJson(doc, buffer);
    client.publish(TOPIC_DATA, buffer);
}

// Hàm gửi trạng thái hiện tại của tất cả LED/Sensors về Server (để đồng bộ UI)
void send_current_status() {
    StaticJsonDocument<200> doc;
    doc["temp"] = active_temp ? "ON" : "OFF";
    doc["hum"]  = active_hum  ? "ON" : "OFF";
    doc["ldr"]  = active_ldr  ? "ON" : "OFF";
    doc["dust"] = active_dust ? "ON" : "OFF";
    
    char buffer[200];
    serializeJson(doc, buffer);
    client.publish(TOPIC_STATUS, buffer);
}

// Hàm cập nhật LED dựa trên các biến trạng thái
void update_hardware() {
    digitalWrite(PIN_LED_TEMP, active_temp ? HIGH : LOW);
    digitalWrite(PIN_LED_HUM,  active_hum  ? HIGH : LOW);
    digitalWrite(PIN_LED_LDR,  active_ldr  ? HIGH : LOW);
    digitalWrite(PIN_LED_DUST, active_dust ? HIGH : LOW);
}

// Xử lý lệnh nhận được từ MQTT
void callback(char* topic, byte* payload, unsigned int length) {
    String msg = "";
    for (int i = 0; i < length; i++) msg += (char)payload[i];
    msg.trim();
    msg.toUpperCase(); // Chuẩn hóa lệnh thành chữ hoa

    Serial.println("Lệnh nhận được: " + msg);

    // 2 Lệnh bật/tắt tất cả
    if (msg == "ALL_ON") {
        active_temp = active_hum = active_ldr = active_dust = true;
    } 
    else if (msg == "ALL_OFF") {
        active_temp = active_hum = active_ldr = active_dust = false;
    }
    // 8 Lệnh bật/tắt từng thiết bị
    else if (msg == "TEMP_ON")   active_temp = true;
    else if (msg == "TEMP_OFF")  active_temp = false;
    else if (msg == "HUM_ON")    active_hum  = true;
    else if (msg == "HUM_OFF")   active_hum  = false;
    else if (msg == "LDR_ON")    active_ldr  = true;
    else if (msg == "LDR_OFF")   active_ldr  = false;
    else if (msg == "DUST_ON")   active_dust = true;
    else if (msg == "DUST_OFF")  active_dust = false;

    update_hardware();
    send_current_status();
}

void reconnect() {
    while (!client.connected()) {
        Serial.print("Đang kết nối MQTT...");
        String clientId = "ESP32_Client_" + String(random(0xffff), HEX);
        if (client.connect(clientId.c_str(), mqtt_username, mqtt_password)) {
            Serial.println("Đã kết nối!");
            client.subscribe(TOPIC_CTRL);
            send_current_status();
        } else {
            Serial.print("Thất bại, rc=");
            Serial.print(client.state());
            delay(5000);
        }
    }
}

void setup() {
    Serial.begin(115200);
    
    // Cấu hình PIN
    pinMode(PIN_LED_TEMP, OUTPUT); 
    pinMode(PIN_LED_HUM,  OUTPUT);
    pinMode(PIN_LED_LDR,  OUTPUT); 
    pinMode(PIN_LED_DUST, OUTPUT);
    update_hardware();

    dht.begin(); 
    dustSensor.begin();

    // Cấu hình WiFi thông qua WiFiManager
    WiFiManager wm;
    if(!wm.autoConnect("ESP32_Config_AP", "12345678")) {
        Serial.println("Không thể kết nối WiFi, đang khởi động lại...");
        delay(3000);
        ESP.restart();
    }

    client.setServer(mqtt_server, mqtt_port);
    client.setCallback(callback);
}

void loop() {
    if (!client.connected()) reconnect();
    client.loop();

    unsigned long now = millis();
    if (now - lastMsg > interval) {
        lastMsg = now;

        // Chỉ gửi dữ liệu nếu sensor đó đang ở trạng thái ACTIVE
        if (active_temp) {
            send_sensor_data("temperature", dht.readTemperature());
        }
        
        if (active_hum) {
            send_sensor_data("humidity", dht.readHumidity());
        }
        
        if (active_ldr) {
            float ldr_val = (1.0 - (analogRead(PIN_SENSOR_AO) / 4095.0)) * 100.0;
            send_sensor_data("light", ldr_val);
        }
        
        if (active_dust) {
            send_sensor_data("dust", dustSensor.getDustDensity());
        }
    }
}