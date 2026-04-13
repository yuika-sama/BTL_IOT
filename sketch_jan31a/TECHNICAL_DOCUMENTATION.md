# Tài Liệu Kỹ Thuật: ESP32 MQTT Sensor Controller

## Mục Lục
1. [Tổng Quan Hệ Thống](#1-tổng-quan-hệ-thống)
2. [Kiến Trúc Phần Cứng](#2-kiến-trúc-phần-cứng)
3. [Cấu Hình Mạng & MQTT](#3-cấu-hình-mạng--mqtt)
4. [Luồng Khởi Động (Setup Flow)](#4-luồng-khởi-động-setup-flow)
5. [Luồng Chính (Main Loop)](#5-luồng-chính-main-loop)
6. [Ghi Dữ Liệu Cảm Biến](#6-ghi-dữ-liệu-cảm-biến)
7. [Điều Khiển LED & Trạng Thái](#7-điều-khiển-led--trạng-thái)
8. [MQTT Communication Protocol](#8-mqtt-communication-protocol)
9. [Xử Lý Lỗi & Khôi Phục](#9-xử-lý-lỗi--khôi-phục)
10. [Quản Lý Năng Lượng & Timing](#10-quản-lý-năng-lượng--timing)
11. [Kiểm Thử & Gỡ Rối](#11-kiểm-thử--gỡ-rối)
12. [Sơ Đồ Trình Tự](#12-sơ-đồ-trình-tự)

---

## 1. Tổng Quan Hệ Thống

### Mục Đích
ESP32 microcontroller hoạt động như một **MQTT IoT Gateway** để:
- Đọc dữ liệu từ 4 cảm biến (nhiệt độ, độ ẩm, ánh sáng, khí gas)
- Phát hành dữ liệu theo chu kỳ 2 giây tới MQTT broker
- Nhận lệnh điều khiển từ MQTT để bật/tắt 4 LED tương ứng
- Báo cáo trạng thái LED hiện tại qua MQTT topic
- Tự động kết nối WiFi bằng WiFiManager + đồng bộ trạng thái

### Các Thành Phần Chính
| Thành Phần | Vai Trò |
|-----------|--------|
| **ESP32** | Bộ vi xử lý chính, WiFi + Bluetooth |
| **DHT11** | Cảm biến nhiệt độ & độ ẩm (digital) |
| **MQ-4** | Cảm biến khí gas (analog: A0, digital: D0) |
| **LDR** | Photoresistor cảm biến ánh sáng (analog) |
| **4x LED** | Chỉ thị trạng thái (TEMP, HUM, LDR, GAS) |
| **MQTT Broker** | 192.168.11.101:2204 |

### Dòng Năng Lượng
```
Mains 5V
    ↓
    └─ ESP32 (Dev Board)
         ├─ DHT11 (pull-up resistor)
         ├─ MQ-4 Sensor Board
         ├─ LDR + Voltage Divider
         └─ 4x LED (via resistor & driver)
```

---

## 2. Kiến Trúc Phần Cứng

### 2.1 Bảng Chân (Pinout) Kết Nối

```
┌──────────────────────────────────────────────────────────────┐
│                        ESP32 DevKit                          │
├──────────────────────────────────────────────────────────────┤
│ Cảm Biến Digital:                                            │
│   PIN 14 ────── DHT11 Data (với pull-up 4.7kΩ)             │
│   PIN 5  ────── MQ-4 Digital Output (gas threshold)         │
│                                                              │
│ Cảm Biến Analog (ADC):                                      │
│   PIN 39 (ADC1_3) ───── MQ-4 Analog Output (AO)            │
│   PIN 36 (ADC1_0) ───── LDR Analog Input (light sensor)    │
│                                                              │
│ Xuất Điều Khiển:                                            │
│   PIN 21 ────── LED Temperature (TEMP_LED)                 │
│   PIN 19 ────── LED Humidity (HUM_LED)                     │
│   PIN 22 ────── LED Light (LDR_LED)                        │
│   PIN 23 ────── LED Gas (GAS_LED)                          │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Chi Tiết Kết Nối Cảm Biến

#### DHT11 (Cảm Biến Nhiệt Độ & Độ Ẩm)
- **Protocol**: Single-wire digital (1-Wire không phải Dallas 1-Wire)
- **Độ chính xác**: ±2°C nhiệt độ, ±5% độ ẩm
- **Tốc độ đọc**: ~1 lần/2 giây (có độ trễ nội bộ)
- **Kết nối**:
  - VCC ─ 5V
  - GND ─ GND
  - DATA ─ PIN 14 (có pull-up 4.7kΩ)

#### MQ-4 (Cảm Biến Khí Gas)
- **Cảm biến**: CH4 (Methane), có cả analog + digital output
- **Analog Output (PIN 39 - ADC)**:
  - Phạm vi: 0-4095 (ADC 12-bit)
  - Giá trị thấp = khí cao, giá trị cao = không có khí
  - Công thức hiện tại: `gas_raw = (1 - raw/10000) * 100 %`
  
- **Digital Output (PIN 5)**:
  - LOW  = Khí vượt ngưỡng (alarm)
  - HIGH = Khí bình thường
  - Ngưỡng cài đặt trên sensor board

#### LDR - Light Dependent Resistor
- **Cảm biến**: Photoresistor
- **Cấu hình**: Voltage divider
  ```
  5V ──[R_fixed 10kΩ]──┬──── GND
                       │
                    PIN 36 (ADC)
  ```
- **Giá trị ADC**: 0-4095
  - 0 = Tối đen
  - 4095 = Sáng tối đa
- **Công thức hiện tại**: `light = (1 - raw/4095) * 100 %`

### 2.3 Kết Nối LED Chỉ Thị

Mỗi LED được điều khiển qua GPIO output:
```
ESP32 GPIO ──[9V LED + 330Ω resistor]──── GND
         └── Có thể thêm NPN transistor nếu yêu cầu dòng cao
```

| LED | PIN | Ý Nghĩa | Nguồn Kích Hoạt |
|-----|-----|---------|-----------------|
| TEMP_LED | 21 | Trạng thái cảm biến nhiệt độ | MQTT command |
| HUM_LED | 19 | Trạng thái cảm biến độ ẩm | MQTT command |
| LDR_LED | 22 | Trạng thái cảm biến ánh sáng | MQTT command |
| GAS_LED | 23 | Trạng thái cảm biến khí gas | MQTT command |

---

## 3. Cấu Hình Mạng & MQTT

### 3.1 WiFi Configuration

#### WiFiManager (Chế Độ Auto-Config)
```
Lần chạy đầu tiên:
  1. ESP32 không tìm thấy WiFi cấu hình trước
  2. Bật AP (Access Point): "ESP32_MQ4_Config" 
  3. Mật khẩu: "12345678"
  4. Điều hướng đến: 192.168.4.1 trên browser
  5. Chọn WiFi và nhập mật khẩu
  6. ESP32 lưu vào EEPROM và reconnect

Lần chạy tiếp theo:
  1. Tự động kết nối WiFi đã lưu
  2. Không cần bước manual setup
```

**Code thực hiện** (lines 118-120):
```cpp
WiFiManager wm;
if(!wm.autoConnect("ESP32_MQ4_Config", "12345678")) {
    ESP.restart();  // Khởi động lại nếu không kết nối được
}
```

**Lỗi & Khôi Phục**:
- Nếu WiFi mất: Cố gắng reconnect bên trong `loop()`
- Hard reset EEPROM: Nhấn RST 10 lần nhanh để xóa WiFi cấu hình
- Kiểm tra Serial Monitor: 115200 baud

### 3.2 MQTT Configuration

```
MQTT Server: 192.168.11.101
Port: 2204
Username: yuika
Password: G1nkosora
Protocol: MQTT 3.1.1
Keep alive: Default (60s)
Clean session: Default (true)
```

**Khôi Phục Kết Nối**:
```cpp
void reconnect() {
    while (!client.connected()) {
        String clientId = "ESP32_MQ4_Client_" + String(random(0xffff), HEX);
        if (client.connect(clientId, mqtt_username, mqtt_password)) {
            // Thành công
            client.subscribe(TOPIC_CTRL);
            // Gửi SYNC_REQUEST & trạng thái hiện tại
            send_current_status();
        } else {
            delay(5000);  // Chờ 5 giây trước khi thử lại
        }
    }
}
```

---

## 4. Luồng Khởi Động (Setup Flow)

### 4.1 Trình Tự Khởi Động

```
setup() 
  │
  ├─ Serial.begin(115200)
  │   └─ Baud rate: 115200
  │
  ├─ GPIO Configuration
  │   ├─ PIN 21, 19, 22, 23 ─→ OUTPUT (LED control)
  │   └─ PIN 5 ─→ INPUT (MQ-4 digital)
  │
  ├─ update_hardware()
  │   └─ Set all LEDs to LOW (OFF)
  │
  ├─ dht.begin()
  │   └─ Khởi tạo DHT11 sensor
  │
  ├─ WiFiManager.autoConnect()
  │   ├─ Nếu có WiFi cấu hình → kết nối
  │   ├─ Nếu không → bật AP chế độ
  │   └─ Nếu thất bại → ESP.restart()
  │
  └─ MQTT Setup
      ├─ client.setServer("192.168.11.101", 2204)
      └─ client.setCallback(callback)
         └─ Đăng ký hàm xử lý MQTT messages
```

### 4.2 Thời Gian Khởi Động

| Giai Đoạn | Thời Gian | Ghi Chú |
|-----------|-----------|--------|
| Serial init | ~100ms | Tùy baud rate |
| GPIO setup | ~50ms | Gần như tức thì |
| DHT init | ~500ms | Cài đặt sensor |
| WiFi connect | 3-10 giây | Tùy RSSI & SSID |
| MQTT connect | 1-5 giây | Tùy network |
| **Tổng** | **5-20 giây** | Tùy điều kiện |

---

## 5. Luồng Chính (Main Loop)

### 5.1 Cấu Trúc Loop

```cpp
void loop() {
    // Phase 1: Kiểm tra & tái kết nối MQTT
    if (!client.connected()) reconnect();
    
    // Phase 2: Xử lý MQTT messages & callbacks
    client.loop();
    
    // Phase 3: Kiểm tra chu kỳ đọc cảm biến (2 giây)
    unsigned long now = millis();
    if (now - lastMsg > 2000) {  // interval = 2000ms
        lastMsg = now;
        
        // Đọc & gửi 4 cảm biến
        send_sensor_data("temperature", dht.readTemperature());
        send_sensor_data("humidity", dht.readHumidity());
        send_sensor_data("light", calculate_light_percent());
        send_sensor_data("gas_raw", calculate_gas_percent());
    }
}
```

### 5.2 Timing & Interval Management

**Biến Tracking**:
```cpp
unsigned long lastMsg = 0;          // Timestamp lần gửi lần trước
const long interval = 2000;         // 2000ms = 2 giây

trong loop():
    unsigned long now = millis();   // Thời gian hiện tại
    if (now - lastMsg > 2000) {     // Đã qua 2 giây?
        lastMsg = now;              // Cập nhật timestamp
        // Gửi dữ liệu
    }
```

**Lý Do Không Dùng delay()**:
- `delay()` làm khoá toàn bộ ESP32
- WiFi/MQTT không thể xử lý messages trong `delay()`
- Giải pháp: Dùng `millis()` + non-blocking checking

### 5.3 Ưu Tiên Xử Lý

1. **Cao nhất**: MQTT reconnect + callback (realtime commands)
2. **Trung bình**: Sensor data publish (2 giây/lần)
3. **Thấp nhất**: Serial logging

---

## 6. Ghi Dữ Liệu Cảm Biến

### 6.1 Hàm send_sensor_data()

```cpp
void send_sensor_data(String sensor_name, float value) {
    if (isnan(value)) return;  // Kiểm tra giá trị hợp lệ
    
    StaticJsonDocument<128> doc;
    doc["sensor"] = sensor_name;
    doc["value"]  = value;
    
    char buffer[128];
    serializeJson(doc, buffer);
    client.publish(TOPIC_DATA, buffer);  // Publish to "sensor/data"
}
```

**JSON Format Output**:
```json
{
  "sensor": "temperature",
  "value": 26.5
}
```

### 6.2 Chu Kỳ Đọc & Gửi

| Cảm Biến | Hàm Đọc | Chu Kỳ | Format |
|----------|---------|--------|--------|
| DHT11 Temp | `dht.readTemperature()` | 2s | float °C |
| DHT11 Humidity | `dht.readHumidity()` | 2s | float % RH |
| LDR Light | `analogRead(PIN_SENSOR_AO)` | 2s | 0-100% |
| MQ-4 Gas | `analogRead(PIN_MQ4_A0)` | 2s | 0-100% |

### 6.3 Chi Tiết Tính Toán Từng Cảm Biến

#### Temperature & Humidity (DHT11)
```cpp
float temp = dht.readTemperature();  // -40°C to 80°C
float hum = dht.readHumidity();      // 20% to 90% RH

// NaN check inside send_sensor_data()
if (isnan(temp)) return;  // Bỏ qua nếu lỗi đọc
```

**Chú ý**: DHT sensor có latency ~2 giây giữa các lần đọc. Nếu đọc quá nhanh → giá trị cũ hoặc NaN.

#### Light Sensor (LDR)
```cpp
// ADC value: 0 (dark) to 4095 (bright)
float raw = analogRead(PIN_SENSOR_AO);  // 0-4095
float light_percent = (1.0 - (raw / 4095.0)) * 100.0;
                                    // Returns 0-100%
send_sensor_data("light", light_percent);
```

**Công thức giải thích**:
- `raw / 4095.0` = normalize to 0-1
- `1.0 - ...` = invert (0 analog = 100% light, 4095 analog = 0% light)
- `* 100` = percent

#### Gas Sensor (MQ-4)
```cpp
// ADC value: 0-4095 (Sensor board scales input)
float raw = analogRead(PIN_MQ4_A0);  // 0-4095
float gas_percent = (1.0 - (raw / 10000.0)) * 100.0;
                                    // Returns 0-100%
send_sensor_data("gas_raw", gas_percent);
```

**Chú ý lỗi tiềm ẩn**:
- Divisor là 10000 chứ không phải 4095
- Có lẽ MQ-4 sensor board đã scale/map analog output
- Hoặc có thể là lỗi: nên là 4095?

**Khuyến nghị**: Kiểm tra actual ADC output bằng Serial:
```cpp
Serial.println("MQ-4 raw: " + String(analogRead(PIN_MQ4_A0)));
```

### 6.4 Error Handling During Sensor Read

**DHT11 Failures**:
```cpp
float temp = dht.readTemperature();
if (isnan(temp)) {
    // Skip this reading, try again next cycle
    return;
}
// Proceed with valid data
```

**Nguyên nhân NaN**:
- DHT sensor mới khởi động
- Kết nối bị lỏng
- Timing too fast (< 2 second gap)
- Sensor hư hỏng

---

## 7. Điều Khiển LED & Trạng Thái

### 7.1 MQTT Callback - Nhận Lệnh Điều Khiển

```cpp
void callback(char* topic, byte* payload, unsigned int length) {
    // Chuyển payload byte array thành String
    String msg = "";
    for (int i = 0; i < length; i++) 
        msg += (char)payload[i];
    
    msg.trim();
    msg.toUpperCase();  // Quy đổi thành UPPERCASE

    Serial.println("Lệnh điều khiển LED: " + msg);

    // Switch-case logic trên msg
    if (msg == "ALL_ON") {
        // Bật tất cả LED
        active_temp = active_hum = active_ldr = active_gas = true;
    }
    else if (msg == "ALL_OFF") {
        // Tắt tất cả LED
        active_temp = active_hum = active_ldr = active_gas = false;
    }
    // ... 8 lệnh riêng lẻ ...
    
    // Cập nhật phần cứng
    update_hardware();
    
    // Báo cáo trạng thái mới
    send_current_status();
}
```

### 7.2 Các Lệnh Hợp Lệ

| Lệnh | Tác Dụng | Quy Chuẩn |
|------|---------|---------|
| `ALL_ON` | Bật tất cả 4 LED | Quy chuẩn |
| `ALL_OFF` | Tắt tất cả 4 LED | Quy chuẩn |
| `TEMP_ON` | Bật LED nhiệt độ | Riêng lẻ |
| `TEMP_OFF` | Tắt LED nhiệt độ | Riêng lẻ |
| `HUM_ON` | Bật LED độ ẩm | Riêng lẻ |
| `HUM_OFF` | Tắt LED độ ẩm | Riêng lẻ |
| `LDR_ON` | Bật LED ánh sáng | Riêng lẻ |
| `LDR_OFF` | Tắt LED ánh sáng | Riêng lẻ |
| `GAS_ON` | Bật LED khí gas | Riêng lẻ |
| `GAS_OFF` | Tắt LED khí gas | Riêng lẻ |

**Topic gửi lệnh**: `device/control`

### 7.3 Hàm update_hardware()

```cpp
void update_hardware() {
    // Cập nhật LED GPIO pins theo state variables
    digitalWrite(PIN_LED_TEMP, active_temp ? HIGH : LOW);
    digitalWrite(PIN_LED_HUM,  active_hum  ? HIGH : LOW);
    digitalWrite(PIN_LED_LDR,  active_ldr  ? HIGH : LOW);
    digitalWrite(PIN_LED_GAS,  active_gas  ? HIGH : LOW);
}
```

**Thực thi**:
1. Sau khi nhận MQTT command
2. Cập nhật state variables (`active_*`)
3. Gọi `update_hardware()` ngay lập tức
4. Gọi `send_current_status()` để báo cáo

**Thời gian phản ứng**: < 50ms

### 7.4 Hàm send_current_status()

```cpp
void send_current_status() {
    StaticJsonDocument<200> doc;
    doc["temp_led"] = active_temp ? "ON" : "OFF";
    doc["hum_led"]  = active_hum  ? "ON" : "OFF";
    doc["ldr_led"]  = active_ldr  ? "ON" : "OFF";
    doc["gas_led"]  = active_gas  ? "ON" : "OFF";
    
    char buffer[200];
    serializeJson(doc, buffer);
    client.publish(TOPIC_STATUS, buffer);  // Publish to "device/status"
}
```

**JSON Output**:
```json
{
  "temp_led": "ON",
  "hum_led": "OFF",
  "ldr_led": "ON",
  "gas_led": "OFF"
}
```

**Khi nào ghi**:
1. Cấu hình lúc MQTT reconnect
2. Khi nhận lệnh từ `device/control` topic
3. **Không** ghi định kỳ (chỉ khi thay đổi)

---

## 8. MQTT Communication Protocol

### 8.1 Topics & Message Flow

```
┌─────────────────────────────────────────────────┐
│             MQTT Broker (192.168.11.101:2204)   │
├─────────────────────────────────────────────────┤
│                                                 │
│  Topic: device/control (SUBSCRIBE)              │
│  ├─ Message: "ALL_ON", "TEMP_OFF", ...         │
│  ├─ QoS: 0 (fire and forget)                   │
│  └─ Msg/sec: Varies (manual commands)          │
│                                                 │
│  Topic: device/status (PUBLISH)                │
│  ├─ JSON: {"temp_led":"ON","hum_led":"OFF"...} │
│  ├─ QoS: 1 (at least once)                     │
│  └─ Msg/sec: 1 per control + 1 at reconnect    │
│                                                 │
│  Topic: device/sync (PUBLISH)                  │
│  ├─ JSON: {"msg":"SYNC_REQUEST","clientId":"..."} │
│  ├─ QoS: 1                                     │
│  └─ Msg/sec: 1 at reconnect                    │
│                                                 │
│  Topic: sensor/data (PUBLISH)                  │
│  ├─ JSON: {"sensor":"temperature","value":25.5} │
│  ├─ QoS: 0 (best effort)                       │
│  └─ Msg/sec: 4 msgs/cycle × 1 cycle/2sec      │
│              = 2 msgs/sec total                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 8.2 Payload Formats

#### sensor/data Topic
```json
{
  "sensor": "temperature" | "humidity" | "light" | "gas_raw",
  "value": <float>
}
```

**Examples**:
```json
{"sensor": "temperature", "value": 26.5}
{"sensor": "humidity", "value": 75.3}
{"sensor": "light", "value": 42.1}
{"sensor": "gas_raw", "value": 18.7}
```

#### device/status Topic
```json
{
  "temp_led": "ON" | "OFF",
  "hum_led": "ON" | "OFF",
  "ldr_led": "ON" | "OFF",
  "gas_led": "ON" | "OFF"
}
```

**Example**:
```json
{
  "temp_led": "ON",
  "hum_led": "OFF",
  "ldr_led": "ON",
  "gas_led": "OFF"
}
```

#### device/sync Topic
```json
{
  "msg": "SYNC_REQUEST",
  "clientId": "ESP32_MQ4_Client_A1F3"
}
```

**Ghi chú**: Được gửi khi reconnect để backend biết device online.

#### device/control Topic (INCOMING)
- **Raw String payload** (không JSON)
- Values: "ALL_ON", "ALL_OFF", "TEMP_ON", "TEMP_OFF", ...
- Case-insensitive (code quy đổi UPPERCASE)

### 8.3 Connection Keep-Alive

```cpp
client.setServer("192.168.11.101", 2204);
client.setCallback(callback);

// PubSubClient library defaults:
// - Keep-alive: 60 seconds
// - Auto ping/pong: YES
// - Clean session: YES
```

**Nếu broker yêu cầu keep-alive**:
```cpp
// Arduino MQTT library sẽ tự động gửi PINGREQ
// Không cần code thêm
```

---

## 9. Xử Lý Lỗi & Khôi Phục

### 9.1 WiFi Connection Failures

**Trường hợp 1: Có WiFi cấu hình nhưng mất kết nối**
```
Lần 1: WiFi disconnect
  ↓ 
Loop detects MQTT disconnect
  ↓
reconnect() → client.connect() attempts → fails (no WiFi)
  ↓
delay(5000) → retry
  ↓
Lần 2: WiFi reconnect tự động
  ↓
MQTT reconnect thành công
```

**Trường hợp 2: WiFiManager không kết nối (lần đầu)**
```
ESP.restart() triggered
  ↓
Reset, vào setup() lại
  ↓
Mở AP "ESP32_MQ4_Config" 
  ↓
User cấu hình WiFi qua 192.168.4.1
  ↓
autoConnect() thành công
  ↓
Tiếp tục loop()
```

### 9.2 MQTT Connection Recovery

```cpp
void reconnect() {
    while (!client.connected()) {
        String clientId = "ESP32_MQ4_Client_" + String(random(0xffff), HEX);
        
        if (client.connect(clientId.c_str(), mqtt_username, mqtt_password)) {
            // SUCCESS PATH
            Serial.println("Đã kết nối!");
            client.subscribe(TOPIC_CTRL);
            
            // Sync state
            StaticJsonDocument<128> syncDoc;
            syncDoc["msg"] = "SYNC_REQUEST";
            syncDoc["clientId"] = clientId;
            char syncBuffer[128];
            serializeJson(syncDoc, syncBuffer);
            client.publish(TOPIC_SYNC, syncBuffer);
            
            send_current_status();
        } else {
            // FAILURE PATH
            Serial.println("MQTT connect failed, reconnecting in 5s...");
            delay(5000);  // Blocking delay acceptable in reconnect loop
        }
    }
}
```

**Lỗi có thể gặp**:
| Lỗi | Nguyên Nhân | Giải Pháp |
|-----|-----------|---------|
| connect() trả về false | WiFi không online | Chờ WiFi reconnect tự động |
| Username/password sai | Credentials cũ | Cập nhật MQTT_USERNAME/PASSWORD |
| Broker không phản hồi | IP/port sai hoặc broker down | Kiểm tra ping 192.168.11.101 |
| Timeout > 30s | Broker bận | Tăng retry delay hoặc check broker logs |

### 9.3 Sensor Read Failures

**DHT11 NaN Detection**:
```cpp
float temp = dht.readTemperature();
if (isnan(temp)) {
    // Skip publish
    return;
}
// Proceed with valid value
```

**Recovery**:
- DHT sensor tự động reset sau 2 giây
- Lần đọc kế tiếp (2s later) sẽ lại thử
- Nếu persistently NaN: kiểm tra wiring + sensor health

**MQ-4 Anomaly Detection** (proposed):
```cpp
// Hiện tại không implement
// nhưng nên thêm:
if (raw_gas > 4000) {
    // Sensor bị treo? (analog max)
    // => Send alert?
}
```

### 9.4 Watchdog Timeout Handling

**Hiện tại**: Không cấu hình ESP32 watchdog timer

**Khuyến nghị** (optional):
```cpp
#include <esp_task_wdt.h>

void setup() {
    // ...
    esp_task_wdt_init(15, true);  // 15 second watchdog
    esp_task_wdt_add(NULL);       // Subscribe current task
}

void loop() {
    esp_task_wdt_reset();  // Reset watchdog timer
    // ... rest of code ...
}
```

---

## 10. Quản Lý Năng Lượng & Timing

### 10.1 CPU & WiFi Power Consumption

| State | Estimated Current | Notes |
|-------|-------------------|-------|
| Deep Sleep | 10 µA | Not used in this code |
| Idle (WiFi on) | 30-50 mA | Between sensor reads |
| WiFi TX | 80-150 mA | During MQTT publish |
| Full Active | 150-200 mA | All peripherals active |

**Nhật ký tiêu thụ điều khiển LED**:
- Bật LED: +2-5 mA per LED (tùy wattage)
- 4 LED ON: +8-20 mA thêm

**Tối ưu hóa** (nếu cần pin):
```cpp
// Hiện tại publish mỗi 2 giây
const long interval = 2000;  // Tăng lên 5000 để giảm WiFi TX

// Hoặc dùng sleep:
esp_sleep_enable_timer_wakeup(2 * 1000000);  // 2 second wakeup
esp_light_sleep_start();
```

### 10.2 Timing Constraints

**Critical Path**:
```
setup()
  ├─ WiFi connect: 3-10s (blocking)
  ├─ MQTT connect: 1-5s (blocking)
  └─ TOTAL: 4-15s before first sensor read

loop() - per cycle:
  ├─ MQTT check: < 10ms
  ├─ Sensor read: < 50ms (DHT query is slow)
  ├─ JSON serialize: < 10ms
  ├─ MQTT publish: < 20ms (async)
  └─ TOTAL per cycle: ~100ms every 2 seconds
```

**Non-blocking guarantees**:
```cpp
client.loop();  // Must be called frequently (< 100ms)
```

Nếu `loop()` không gọi `client.loop()` > 30 giây:
- MQTT server sẽ close connection (keep-alive timeout)
- Reconnect tự động ở lần tiếp theo

---

## 11. Kiểm Thử & Gỡ Rối

### 11.1 Serial Monitoring

```bash
# Baud rate: 115200
# Terminal: Arduino IDE Serial Monitor hoặc PlatformIO
```

**Output mong đợi**:
```
Đang kết nối MQTT...
Đã kết nối!
Lệnh điều khiển LED: TEMP_ON
[Lặp lại mỗi 2 giây]
```

### 11.2 MQTT Testing with MQTT Client

```bash
# Subscribe để nhận sensor data:
mosquitto_sub -h 192.168.11.101 -p 2204 \
  -u yuika -P G1nkosora \
  -t "sensor/data"

# Gửi command để test callback:
mosquitto_pub -h 192.168.11.101 -p 2204 \
  -u yuika -P G1nkosora \
  -t "device/control" \
  -m "TEMP_ON"

# Watch device status:
mosquitto_sub -h 192.168.11.101 -p 2204 \
  -u yuika -P G1nkosora \
  -t "device/status"
```

### 11.3 Debugging Checklist

| Vấn đề | Kiểm Tra |
|--------|---------|
| WiFi không kết nối | Xem SSID "ESP32_MQ4_Config" → cấu hình lại |
| MQTT không kết nối | Kiểm tra IP 192.168.11.101 ping được không |
| Không nhận cảm biến | Kiểm tra Serial output for "NaN" |
| LED không bật | Kiểm tra GPIO pins + 5V cấp |
| MQTT messages không nhận | Kiểm tra topic + check MQTT broker logs |

### 11.4 Test Cases

**Test 1: Power-On Integration**
```
1. Power on ESP32
2. Verify WiFi connects (Serial output)
3. Verify MQTT connects
4. Verify sensor data flowing (mosquitto_sub)
5. Send MQTT command → LED should light
Result: PASS / FAIL
```

**Test 2: Sensor Accuracy**
```
1. Read DHT11 temperature
2. Compare with reference thermometer
3. Verify within ±2°C
4. Test range: -10°C to 50°C if possible
Result: Accuracy: ±X°C
```

**Test 3: Command Responsiveness**
```
1. Measure time from MQTT command publish
2. To LED physical light-up
3. Expected: < 100ms
Result: Measured time: __ms
```

**Test 4: WiFi Dropout Recovery**
```
1. Unplug WiFi / block signal
2. Measure reconnection time
3. Resume MQTT operations
Expected: < 30 seconds
Result: Actual time: __s
```

### 11.5 Common Issues & Solutions

| Lỗi | Giải Pháp |
|-----|----------|
| DHT returns NaN constantly | Check wiring, add 10kΩ pull-up to DATA pin |
| MQTT "username/password" error | Verify username/password in code vs broker config |
| WiFi disconnects frequently | Check WiFi signal strength (-60dBm minimum) |
| Sensor values always 0 | Check ADC pins not floating, add pull-down |
| LED does not respond | Test GPIO pin voltage with multimeter |

---

## 12. Sơ Đồ Trình Tự

### 12.1 Startup Sequence Diagram

```
┌─────────┐                    ┌──────────┐                    ┌──────────┐
│  ESP32  │                    │ WiFi AP  │                    │MQTT Broker│
└────┬────┘                    └────┬─────┘                    └────┬─────┘
     │                              │                               │
     │─── Power-on, setup() ───────►│                               │
     │                              │                               │
     │                   Khởi tạo GPIO/DHT                         │
     │                              │                               │
     │◄── Found WiFi SSID ──────────┤                               │
     │                              │                               │
     │─── WiFiManager autoConnect ──►│                               │
     │                              │                               │
     │◄── WiFi Connected ───────────│                               │
     │                              │                               │
     │───────── Attempt MQTT ──────────────────────────────────────►│
     │                              │                               │
     │◄─── MQTT Connected ───────────────────────────────────────────│
     │                              │                               │
     │─── SUBSCRIBE device/control──►│                               │
     │                              │                               │
     │─── PUBLISH device/status ───────────────────────────────────►│
     │                              │                               │
     │─── PUBLISH device/sync ────────────────────────────────────►│
     │                              │                               │
     └─────────────────────────────────────────────────────────────►
               [Main Loop Starts]
```

### 12.2 Main Loop Sequence

```
┌──────────┐                    ┌──────────────┐                ┌──────────┐
│  Loop()  │                    │ Sensor/GPIO  │                │MQTT Broker│
└────┬─────┘                    └────┬─────────┘                └────┬─────┘
     │                               │                              │
     │─ Check MQTT Connection ──────►│                              │
     │                               │                              │
     │─ client.loop() ────────────────────────────────────────────►│
     │                               │           (keep-alive ping)  │
     │◄─ Potential Messages ──────────────────────────────────────◄│
     │   (if any)                    │                              │
     │                               │                              │
     │─ Check 2s Timer ──────────────┤                              │
     │                               │                              │
     ├─ Read Temp/Humidity ──────────►│– DHT11 query (blocking)     │
     │◄──────── Done ────────────────┤                              │
     │                               │                              │
     ├─ Read Light ──────────────────►│– Analog read (< 1ms)        │
     │◄──────── Done ────────────────┤                              │
     │                               │                              │
     ├─ Read Gas ────────────────────►│– Analog read (< 1ms)        │
     │◄──────── Done ────────────────┤                              │
     │                               │                              │
     │─ Publish 4 Messages ──────────────────────────────────────►│
     │   (sensor/data × 4)           │                              │
     │                               │                              │
     └───► Next Loop [5-10ms idle]──────────────────────────────────►
```

### 12.3 LED Control Sequence

```
┌──────────┐                    ┌─────────┐                     ┌──────────┐
│MQTT Srv  │                    │  Loop   │                     │LED/GPIO  │
└────┬─────┘                    └────┬────┘                     └────┬─────┘
     │                               │                              │
     │─ Publish to device/control ──►│                              │
     │   Message: "TEMP_ON"          │                              │
     │                               │                              │
     │                          callback() called                   │
     │                               │                              │
     │                               ├─ Parse message               │
     │                               ├─ active_temp = true          │
     │                               ├─ update_hardware() ──────────►│
     │                               │                    digitalWrite
     │                               ├─ send_current_status() ─────────┐
     │                               │  (publish to device/status)    │
     │                               │                              │
     │◄─ device/status message ──────┴──────────────────────────────┘
     │   {"temp_led":"ON",...}
     │
     └─► Continue...
```

---

## 13. Tối Ưu Hóa & Mở Rộng

### 13.1 Cải Tiến Hiện Tại

**Vấn đề Được Biết**:
1. Gas sensor divisor (10000 vs 4095?) - cần xác nhận
2. Không có data validation/range check cho ADC
3. Không có error alerting (e.g., persistent NaN)
4. LED feedback không có thời gian yêu cầu to off
5. Không track uptime/connectivity metrics

### 13.2 Các Tính Năng Có Thể Thêm

```cpp
// 1. Moving average for smooth readings
float rolling_temps[5];
int temp_index = 0;
float get_avg_temperature() {
    // Average last 5 readings
}

// 2. LED timeout (auto-off after N minutes)
unsigned long led_on_times[4];
void check_led_timeout() {
    for (int i = 0; i < 4; i++) {
        if (millis() - led_on_times[i] > 300000) {  // 5 min
            // Auto off
        }
    }
}

// 3. Sensor health check
void health_check() {
    if (consecutive_nans > 10) {
        // Send alert to backend
    }
}
```

### 13.3 Configuration as Constants

```cpp
// Move hardcoded values to top for easy config:
const char* WIFI_SSID = "ESP32_MQ4_Config";
const char* WIFI_PASS = "12345678";
const char* MQTT_SERVER = "192.168.11.101";
const int MQTT_PORT = 2204;
const char* MQTT_USER = "yuika";
const char* MQTT_PASS = "G1nkosora";
const long SENSOR_READ_INTERVAL = 2000;
const int MQTT_RECONNECT_DELAY = 5000;
```

---

## 14. Tài Liệu Tham Khảo

### 14.1 Libaries Used
- **WiFi.h**: Built-in ESP32 library
- **PubSubClient.h**: MQTT client (Version 2.7+)
- **ArduinoJson.h**: JSON serialization
- **DHT.h**: DHT sensor library
- **WiFiManager.h**: WiFi configuration manager

### 14.2 Datasheets & Resources
- [ESP32 Datasheet](https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf)
- [DHT11 Datasheet](https://www.mouser.com/datasheet/2/758/DHT11-9539-1.pdf)
- [MQ-4 Sensor Manual](https://datasheetspdf.com/pdf-file/735819/Hanwei/MQ-4/1)
- [PubSubClient Library Docs](https://pubsubclient.knolleary.net/)

### 14.3 Version Control
| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-05 | Initial hardware documentation |

---

## 15. Troubleshooting Decision Tree

```
Hardware Not Responding?
├─ Check Power
│  ├─ 5V present on VCC? ───► No → Plug power supply
│  └─ GND connected? ────────► No → Connect GND
│
├─ Check Serial Output
│  ├─ 115200 baud visible? ──► No → Check USB cable
│  ├─ "WiFi connecting..."? ─► No → WiFiManager issue
│  └─ "Đã kết nối" MQTT? ────► No → goto MQTT Debug
│
├─ Check Sensors
│  ├─ DHT working? ──── Read Serial: "NaN"? ──► Yes → Check DHT wiring
│  ├─ LDR responding?── Analog value 0-4095 visible on Serial? 
│  └─ MQ-4 responding?─ Analog value 0-4095 visible on Serial?
│
├─ Check LEDs
│  ├─ Physical light-up when powered? ─► No → Check 5V to LED
│  ├─ Respond to MQTT command? ────► No → Check GPIO pins
│  └─ Blink on startup? ────────────► No → Check update_hardware()
│
└─ Check Network
   ├─ WiFi SSID visible? ──────► No → Check WiFi credentials
   ├─ MQTT broker reachable? ──► No → Check IP/port/firewall
   └─ Mosquitto running? ──────► No → Start MQTT service
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-04-05  
**Status**: Production Documentation  
**Author**: IoT System Documentation  
