#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "DHT.h"
#include <GP2YDustSensor.h>
#include <WiFiManager.h>

// --- CẤU HÌNH LOCAL BROKER ---
const char* mqtt_server   = "10.124.144.200"; 
const int   mqtt_port     = 2204;          
const char* mqtt_username = "yuika";
const char* mqtt_password = "G1nkosora";

// --- TOPICS ---
const char* TOPIC_DATA   = "datasensor";
const char* TOPIC_STATUS = "status";
const char* TOPIC_CTRL   = "devicecontrol";

// --- PINOUT ---
#define PIN_DHT_DATA 14
#define PIN_DUST_LED 5
#define PIN_DUST_IN 34
#define PIN_SENSOR_AO 36
#define PIN_LED_TEMP 21 
#define PIN_LED_HUM 19
#define PIN_LED_LDR 22
#define PIN_LED_DUST 23

DHT dht(PIN_DHT_DATA, DHT11);
GP2YDustSensor dustSensor(GP2YDustSensorType::GP2Y1010AU0F, PIN_DUST_LED, PIN_DUST_IN);

WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastMsg = 0;
bool blink_mode = false;          
unsigned long lastBlink = 0;      
bool blink_state = false;        

void send_led_status() {
    StaticJsonDocument<200> doc;
    doc["temp_led"] = digitalRead(PIN_LED_TEMP) ? "ON" : "OFF";
    doc["hum_led"]  = digitalRead(PIN_LED_HUM) ? "ON" : "OFF";
    doc["ldr_led"]  = digitalRead(PIN_LED_LDR) ? "ON" : "OFF";
    doc["dust_led"] = digitalRead(PIN_LED_DUST) ? "ON" : "OFF";
    char buffer[200];
    serializeJson(doc, buffer);
    client.publish(TOPIC_STATUS, buffer);
}

void callback(char* topic, byte* payload, unsigned int length) {
    String msg = "";
    for (int i = 0; i < length; i++) msg += (char)payload[i];
    msg.trim();
    
    Serial.println("Lệnh nhận được: " + msg);

    if (msg != "fx2") blink_mode = false;

    if (msg == "temp_on")        digitalWrite(PIN_LED_TEMP, HIGH);
    else if (msg == "temp_off")  digitalWrite(PIN_LED_TEMP, LOW);
    else if (msg == "hum_on")     digitalWrite(PIN_LED_HUM, HIGH);
    else if (msg == "hum_off")    digitalWrite(PIN_LED_HUM, LOW);
    else if (msg == "ldr_on")     digitalWrite(PIN_LED_LDR, HIGH);
    else if (msg == "ldr_off")    digitalWrite(PIN_LED_LDR, LOW);
    else if (msg == "dust_on")    digitalWrite(PIN_LED_DUST, HIGH);
    else if (msg == "dust_off")   digitalWrite(PIN_LED_DUST, LOW);
    else if (msg == "all_on") {
        digitalWrite(PIN_LED_TEMP, HIGH); digitalWrite(PIN_LED_HUM, HIGH);
        digitalWrite(PIN_LED_LDR, HIGH); digitalWrite(PIN_LED_DUST, HIGH);
    }
    else if (msg == "all_off") {
        digitalWrite(PIN_LED_TEMP, LOW); digitalWrite(PIN_LED_HUM, LOW);
        digitalWrite(PIN_LED_LDR, LOW); digitalWrite(PIN_LED_DUST, LOW);
    }
    send_led_status();
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Dang ket noi Local Broker...");
    String clientId = "ESP32_Local_" + String(random(0xffff), HEX);
    if (client.connect(clientId.c_str(), mqtt_username, mqtt_password)) {
      Serial.println("Thanh cong!");
      client.subscribe(TOPIC_CTRL);
    } else {
      Serial.print("Loi, rc=");
      Serial.println(client.state());
      delay(5000);
    }
  }
}

void setup() {
    Serial.begin(115200);
    pinMode(PIN_LED_TEMP, OUTPUT); 
    pinMode(PIN_LED_HUM, OUTPUT);
    pinMode(PIN_LED_LDR, OUTPUT); 
    pinMode(PIN_LED_DUST, OUTPUT);
    
    dht.begin(); 
    dustSensor.begin();

    // --- CẤU HÌNH WIFI MANAGER ---
    WiFiManager wm;
    bool res;
    res = wm.autoConnect("ESP32_Config_AP", "12345678"); 
    if(!res) {
        Serial.println("Failed to connect");
    } else {
        Serial.println("WiFi Connected! :)");
    }

    client.setServer(mqtt_server, mqtt_port);
    client.setCallback(callback);
}

void loop() {
    if (!client.connected()) reconnect();
    client.loop();

    if (blink_mode) {
        if (millis() - lastBlink > 1000) {
            lastBlink = millis();
            blink_state = !blink_state;
            
            digitalWrite(PIN_LED_TEMP, blink_state);
            digitalWrite(PIN_LED_HUM,  blink_state);
            
            digitalWrite(PIN_LED_DUST, !blink_state);
            digitalWrite(PIN_LED_LDR,  !blink_state);
        }
    }

    if (millis() - lastMsg > 2000) {
        lastMsg = millis();
        StaticJsonDocument<200> doc;
        if (isnan(t)) t = 0;
        doc["t"] = dht.readTemperature();
        doc["h"] = dht.readHumidity();
        doc["l"] = (1.0 - (analogRead(PIN_SENSOR_AO) / 4095.0)) * 100.0;
        doc["d"] = dustSensor.getDustDensity();
        
        char buffer[200];
        serializeJson(doc, buffer);
        client.publish(TOPIC_DATA, buffer);
    }
}