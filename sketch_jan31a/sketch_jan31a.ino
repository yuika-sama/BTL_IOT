    #include <WiFi.h>
    #include <PubSubClient.h>
    #include <ArduinoJson.h>
    #include "DHT.h"
    #include <WiFiManager.h>

    // --- CẤU HÌNH MQTT ---
    const char* mqtt_server   = "10.45.77.200"; 
    const int   mqtt_port     = 2204;           
    const char* mqtt_username = "yuika";
    const char* mqtt_password = "G1nkosora";

    // --- TOPICS ---
    const char* TOPIC_DATA    = "sensor/data";    
    const char* TOPIC_CTRL    = "device/control"; 
    const char* TOPIC_STATUS  = "device/status";  
    const char* TOPIC_SYNC    = "device/sync";

    // --- PINOUT ---
    #define PIN_DHT_DATA  14
    #define PIN_MQ4_A0    39  
    #define PIN_MQ4_D0    5   
    #define PIN_LDR_AO    36  
    #define PIN_LED_TEMP  21 
    #define PIN_LED_HUM   19
    #define PIN_LED_LDR   22
    #define PIN_LED_GAS   23 

    #define PIN_LED_A 18
    #define PIN_LED_B 26

    // --- KHAI BÁO CẢM BIẾN ---
    DHT dht(PIN_DHT_DATA, DHT11);

    WiFiClient espClient;
    PubSubClient client(espClient);

    // --- BIẾN QUẢN LÝ TRẠNG THÁI LED ---
    bool active_temp = false;
    bool active_hum  = false;
    bool active_ldr  = false;
    bool active_gas  = false; 

    bool active_led_a = false;
    bool active_led_b = false;

    unsigned long lastMsg = 0;
    const long interval = 2000; 

    void send_sensor_data(String sensor_name, float value) {
        if (isnan(value)) return;
        StaticJsonDocument<128> doc;
        doc["sensor"] = sensor_name;
        doc["value"]  = value;
        char buffer[128];
        serializeJson(doc, buffer);
        client.publish(TOPIC_DATA, buffer);
    }

    void send_current_status() {
        StaticJsonDocument<200> doc;
        doc["temp_led"] = active_temp ? "ON" : "OFF";
        doc["hum_led"]  = active_hum  ? "ON" : "OFF";
        doc["ldr_led"]  = active_ldr  ? "ON" : "OFF";
        doc["gas_led"]  = active_gas  ? "ON" : "OFF"; 
        doc["led_a"]    = active_led_a ? "ON" : "OFF";
        doc["led_b"]    = active_led_b ? "ON" : "OFF";
        char buffer[200];
        serializeJson(doc, buffer);
        client.publish(TOPIC_STATUS, buffer);
    }

    void update_hardware() {
        digitalWrite(PIN_LED_TEMP, active_temp ? HIGH : LOW);
        digitalWrite(PIN_LED_HUM,  active_hum  ? HIGH : LOW);
        digitalWrite(PIN_LED_LDR,  active_ldr  ? HIGH : LOW);
        digitalWrite(PIN_LED_GAS,  active_gas  ? HIGH : LOW);
        digitalWrite(PIN_LED_A,    active_led_a ? HIGH : LOW);
        digitalWrite(PIN_LED_B,    active_led_b ? HIGH : LOW);
    }

    void callback(char* topic, byte* payload, unsigned int length) {
        String msg = "";
        for (int i = 0; i < length; i++) msg += (char)payload[i];
        msg.trim();
        msg.toUpperCase();

        Serial.println("Lệnh điều khiển LED: " + msg);

        if (msg == "ALL_ON") {
            active_temp = active_hum = active_ldr = active_gas = true;
        } 
        else if (msg == "ALL_OFF") {
            active_temp = active_hum = active_ldr = active_gas = false;
        }
        else if (msg == "TEMP_ON")   active_temp = true;
        else if (msg == "TEMP_OFF")  active_temp = false;
        else if (msg == "HUM_ON")    active_hum  = true;
        else if (msg == "HUM_OFF")   active_hum  = false;
        else if (msg == "LDR_ON")    active_ldr  = true;
        else if (msg == "LDR_OFF")   active_ldr  = false;
        else if (msg == "GAS_ON")    active_gas  = true;   
        else if (msg == "GAS_OFF")   active_gas  = false;
        else if (msg == "LED_A_ON")  active_led_a = true;
        else if (msg == "LED_A_OFF") active_led_a = false;
        else if (msg == "LED_B_ON")  active_led_b = true;
        else if (msg == "LED_B_OFF") active_led_b = false;

        update_hardware();
        send_current_status();
    }

    void reconnect() {
        while (!client.connected()) {
            Serial.print("Đang kết nối MQTT...");
            String clientId = "ESP32_MQ4_Client_" + String(random(0xffff), HEX);
            if (client.connect(clientId.c_str(), mqtt_username, mqtt_password)) {
                Serial.println("Đã kết nối!");
                client.subscribe(TOPIC_CTRL);

                StaticJsonDocument<128> syncDoc;
                syncDoc["msg"] = "SYNC_REQUEST";
                syncDoc["clientId"] = clientId;
                char syncBuffer[128];
                serializeJson(syncDoc, syncBuffer);
                client.publish(TOPIC_SYNC, syncBuffer);
                
                send_current_status();
            } else {
                delay(5000);
            }
        }
    }

    void setup() {
        Serial.begin(115200);
        
        pinMode(PIN_LED_TEMP, OUTPUT); 
        pinMode(PIN_LED_HUM,  OUTPUT);
        pinMode(PIN_LED_LDR,  OUTPUT); 
        pinMode(PIN_LED_GAS,  OUTPUT);
        pinMode(PIN_LED_A,    OUTPUT);
        pinMode(PIN_LED_B,    OUTPUT);
        
        pinMode(PIN_MQ4_D0, INPUT); 
        
        update_hardware();
        dht.begin(); 

        WiFiManager wm;
        if(!wm.autoConnect("ESP32_MQ4_Config", "12345678")) {
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

            // --- GỬI DATA SENSOR ---
            send_sensor_data("temperature", dht.readTemperature());
            send_sensor_data("humidity", dht.readHumidity());
            
            // Đọc và gửi dữ liệu Ánh sáng
            float ldr_val = (1.0 - (analogRead(PIN_LDR_AO) / 4095.0)) * 100.0;
            send_sensor_data("light", ldr_val);
            
            // Đọc và gửi dữ liệu Gas
            int gas_analog = (1.0 - (analogRead(PIN_MQ4_A0)/1023.0))*100.0;
            send_sensor_data("gas_raw", (float)gas_analog);
        }
    }