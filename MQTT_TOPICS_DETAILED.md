# Chi Tiết MQTT Topics - Hệ Thống IoT

## Tổng Quan Mạng MQTT

```
┌─────────────────────────────────────────────────────────────────┐
│                   MQTT Broker 192.168.11.101:2204              │
│                   (Username: yuika, Password: G1nkosora)        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    ┌─────────────────┐          ┌──────────────┐               │
│    │   ESP32 Device  │◄────────►│  Backend API │               │
│    │  (Hardware)     │          │  (Node.js)   │               │
│    └────────┬────────┘          └──────┬───────┘               │
│             │                         │                        │
│    Topics:  │                         │                        │
│    - Publish: sensor/data             │                        │
│    - Publish: device/status       Topics:                      │
│    - Publish: device/sync         ├─ Subscribe: device/control │
│    - Subscribe: device/control    ├─ Publish: device/control   │
│                                   └─ Listen: sensor/*          │
│                                                                 │
│    ┌──────────────────┐           ┌─────────────┐              │
│    │   Frontend (React)│           │  Dashboard  │              │
│    │  (Browser)       │───────────►│   Page      │              │
│    └──────────────────┘ Socket.IO  └─────────────┘              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4 Topics Chính Trong Hệ Thống

### 1️⃣ `sensor/data` 

#### Định Nghĩa

| Thuộc Tính | Giá Trị |
|-----------|--------|
| **Tên Topic** | `sensor/data` |
| **Mục Đích** | Ghi dữ liệu cảm biến từ thiết bị lên MQTT broker |
| **Hướng Dữ Liệu** | ESP32 → MQTT Broker → Backend |
| **Cơ Chế** | PUBLISH (one-way broadcast) |
| **QoS** | 0 (Fire-and-forget) |
| **Retain** | NO |
| **Tần Suất** | 2 lần/giây (mỗi cycle 2 sensor readings) |
| **Người Publish** | ESP32 Hardware |
| **Người Subscribe** | Backend Node.js Server |

#### Chi Tiết Hướng Dữ Liệu

```
ESP32 Hardware
    │
    ├─ đọc: dht.readTemperature()
    ├─ đọc: dht.readHumidity()
    ├─ đọc: analogRead(PIN_SENSOR_AO)  [LDR]
    ├─ đọc: analogRead(PIN_MQ4_A0)     [GAS]
    │
    ├─ serialize to JSON
    │
    ├─ client.publish("sensor/data", json_buffer)
    │
    ▼
MQTT Broker (192.168.11.101:2204)
    │
    ├─ lưu vào memory buffer
    │ 
    ▼
Backend Node.js Server
    │
    ├─ subscribe("sensor/data")
    ├─ on message received → call socketService.emit()
    │ 
    ▼
Socket.IO Server
    │
    ├─ emit realtime to all connected clients
    │
    ▼
Frontend Dashboard (React)
    │
    ├─ receive via Socket.IO listener
    ├─ update chart + display values
```

#### Payload Format

**Mỗi message là một JSON object độc lập**:

```json
{
  "sensor": "temperature",
  "value": 26.5
}
```

**Hoặc**:
```json
{
  "sensor": "humidity",
  "value": 75.3
}
```

**Hoặc**:
```json
{
  "sensor": "light",
  "value": 42.1
}
```

**Hoặc**:
```json
{
  "sensor": "gas_raw",
  "value": 18.7
}
```

#### Cách Hardware Gửi (Code)

```cpp
void send_sensor_data(String sensor_name, float value) {
    if (isnan(value)) return;  // Bỏ qua nếu invalid
    
    StaticJsonDocument<128> doc;
    doc["sensor"] = sensor_name;  // "temperature" | "humidity" | "light" | "gas_raw"
    doc["value"]  = value;         // float value
    
    char buffer[128];
    serializeJson(doc, buffer);
    
    client.publish("sensor/data", buffer);  // Gửi 1 message
}

// Called từ loop():
send_sensor_data("temperature", dht.readTemperature());
send_sensor_data("humidity", dht.readHumidity());
send_sensor_data("light", (1.0 - (analogRead(PIN_SENSOR_AO) / 4095.0)) * 100.0);
send_sensor_data("gas_raw", (1.0 - (analogRead(PIN_MQ4_A0)/10000.0))*100.0);
```

**Trong 1 chu kỳ (2 giây), sẽ có 4 messages riêng biệt**:
```
Message 1: {"sensor":"temperature","value":26.5}
Message 2: {"sensor":"humidity","value":75.3}
Message 3: {"sensor":"light","value":42.1}
Message 4: {"sensor":"gas_raw","value":18.7}
```

#### Cách Backend Nhận

```javascript
// Backend mqttService.js
client.on('message', (topic, message) => {
    if (topic === 'sensor/data') {
        try {
            const payload = JSON.parse(message.toString());
            const { sensor, value } = payload;
            
            // Lưu vào database
            db.query('INSERT INTO data_sensors ...');
            
            // Broadcast qua Socket.IO
            io.emit('sensor_update', {
                sensor: sensor,
                value: value,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Parse error:', error);
        }
    }
});
```

#### Use Cases

| Trường Hợp | Chi Tiết |
|-----------|---------|
| **Realtime Monitoring** | Frontend nhận dữ liệu 2s/lần qua Socket.IO, update chart |
| **Data Logging** | Backend lưu vào MySQL `data_sensors` table |
| **Alerts** | Backend kiểm tra giá trị vượt ngưỡng → gửi alert |
| **History Query** | Frontend query dữ liệu từ API → graph hiển thị |

---

### 2️⃣ `device/control`

#### Định Nghĩa

| Thuộc Tính | Giá Trị |
|-----------|--------|
| **Tên Topic** | `device/control` |
| **Mục Đích** | Điều khiển state của thiết bị (LED on/off) từ backend |
| **Hướng Dữ Liệu** | Backend/Frontend → MQTT Broker → ESP32 Hardware |
| **Cơ Chế** | SUBSCRIBE (two-way acknowledgment) |
| **QoS** | 1 (At-least-once delivery) |
| **Retain** | NO |
| **Tần Suất** | As needed (manual commands từ user) |
| **Người Publish** | Backend Node.js Server |
| **Người Subscribe** | ESP32 Hardware |

#### Chi Tiết Hướng Dữ Liệu

```
Frontend Dashboard (React)
    │
    ├─ User clicks button: "Bật LED Nhiệt Độ"
    ├─ API call: deviceService.toggleStatus(deviceId)
    │
    ▼
Backend Node.js Server
    │
    ├─ Receive: POST /api/device/toggle
    ├─ Build MQTT command: "TEMP_ON"
    ├─ Publish to MQTT: topic="device/control", message="TEMP_ON"
    │
    ▼
MQTT Broker (192.168.11.101:2204)
    │
    ├─ Queue message
    │
    ▼
ESP32 Hardware
    │
    ├─ on callback(topic, payload):
    ├─ Parse message: msg = "TEMP_ON"
    ├─ Update state: active_temp = true
    ├─ Update hardware: digitalWrite(PIN_LED_TEMP, HIGH)
    ├─ Publish status update: device/status
    │
    ▼
Response Back to Frontend
    │
    ├─ Backend receives device/status
    ├─ Update database
    ├─ Send response to Frontend
    ├─ Frontend updates UI: LED shows as ON
```

#### Payload Format

**Raw String Format (NOT JSON)**:

```
TEMP_ON
```

hoặc

```
ALL_OFF
```

**Danh sách Tất Cả Commands**:

| Command | Tác Dụng | Kích Hoạt Từ |
|---------|---------|------------|
| `ALL_ON` | Bật tất cả 4 LED | Toggle All |
| `ALL_OFF` | Tắt tất cả 4 LED | Toggle All |
| `TEMP_ON` | Bật LED Temp | Toggle Temp |
| `TEMP_OFF` | Tắt LED Temp | Toggle Temp |
| `HUM_ON` | Bật LED Humidity | Toggle Humidity |
| `HUM_OFF` | Tắt LED Humidity | Toggle Humidity |
| `LDR_ON` | Bật LED Light | Toggle Light |
| `LDR_OFF` | Tắt LED Light | Toggle Light |
| `GAS_ON` | Bật LED Gas | Toggle Gas |
| `GAS_OFF` | Tắt LED Gas | Toggle Gas |

#### Cách Hardware Nhận (Code)

```cpp
void callback(char* topic, byte* payload, unsigned int length) {
    // Topic param = "device/control"
    // payload = byte array: [84, 69, 77, 80, 95, 79, 78] (for "TEMP_ON")
    
    // Convert byte array → String
    String msg = "";
    for (int i = 0; i < length; i++) 
        msg += (char)payload[i];
    
    msg.trim();
    msg.toUpperCase();  // "TEMP_ON" (case-insensitive)
    
    Serial.println("Lệnh điều khiển LED: " + msg);
    
    // Switch on command
    if (msg == "ALL_ON") {
        active_temp = active_hum = active_ldr = active_gas = true;
    }
    else if (msg == "ALL_OFF") {
        active_temp = active_hum = active_ldr = active_gas = false;
    }
    else if (msg == "TEMP_ON") {
        active_temp = true;
    }
    else if (msg == "TEMP_OFF") {
        active_temp = false;
    }
    // ... etc for other LEDs ...
    
    // Update GPIO
    update_hardware();
    
    // Send confirmation
    send_current_status();
}
```

#### Cách Backend Gửi

```javascript
// Backend deviceController.js
async function toggleStatus(deviceId, command) {
    try {
        // Validate command
        const validCommands = ['ALL_ON', 'ALL_OFF', 'TEMP_ON', 'TEMP_OFF', ...];
        if (!validCommands.includes(command)) {
            throw new Error('Invalid command');
        }
        
        // Publish to MQTT
        mqttClient.publish('device/control', command, { qos: 1 }, (err) => {
            if (err) {
                throw new Error('MQTT publish failed');
            }
            // Success
        });
        
        // Wait for acknowledgment from device/status topic
        // Then respond to frontend
    } catch (error) {
        // Error handling
    }
}
```

#### Use Cases

| Trường Hợp | Chi Tiết |
|-----------|---------|
| **Manual Control** | User bấm nút Dashboard → API gửi command |
| **Automation** | Backend rules → auto publish command |
| **Scheduling** | Cron job → publish command on schedule |
| **Scene Control** | Bấm "Night Mode" → publish "ALL_OFF" |

---

### 3️⃣ `device/status`

#### Định Nghĩa

| Thuộc Tính | Giá Trị |
|-----------|--------|
| **Tên Topic** | `device/status` |
| **Mục Đích** | Báo cáo trạng thái hiện tại của LED từ thiết bị |
| **Hướng Dữ Liệu** | ESP32 Hardware → MQTT Broker → Backend → Frontend |
| **Cơ Chế** | PUBLISH (confirmatory response) |
| **QoS** | 1 (At-least-once) |
| **Retain** | YES ⭐ (giữ last message) |
| **Tần Suất** | Khi có thay đổi + 1 lần khi reconnect |
| **Người Publish** | ESP32 Hardware |
| **Người Subscribe** | Backend Node.js Server |

#### Chi Tiết Hướng Dữ Liệu

```
ESP32 Hardware
    │
    ├─ Nhận command từ device/control
    ├─ Cập nhật GPIO pins
    │
    ├─ Gọi: send_current_status()
    │
    ├─ Serialize state to JSON
    │
    ├─ Publish to "device/status" topic (QoS=1, RETAIN=YES)
    │
    ▼
MQTT Broker (192.168.11.101:2204)
    │
    ├─ Receive message
    ├─ Update last_status = {...}
    ├─ Keep in memory (RETAIN flag)
    │
    ▼
Backend Node.js Server
    │
    ├─ Subscribe to "device/status"
    ├─ Receive status update
    ├─ Store in database: UPDATE devices SET status='ON' WHERE id=1
    ├─ Emit to frontend via Socket.IO
    │
    ▼
Frontend Dashboard (React)
    │
    ├─ Receive status update
    ├─ Update UI: LED button shows as ON/OFF
    ├─ Provide feedback to user
```

#### Payload Format

**JSON Object với trạng thái tất cả 4 LED**:

```json
{
  "temp_led": "ON",
  "hum_led": "OFF",
  "ldr_led": "ON",
  "gas_led": "OFF"
}
```

**Hoặc**:
```json
{
  "temp_led": "ON",
  "hum_led": "ON",
  "ldr_led": "ON",
  "gas_led": "ON"
}
```

#### Cách Hardware Gửi (Code)

```cpp
void send_current_status() {
    StaticJsonDocument<200> doc;
    doc["temp_led"] = active_temp ? "ON" : "OFF";
    doc["hum_led"]  = active_hum  ? "ON" : "OFF";
    doc["ldr_led"]  = active_ldr  ? "ON" : "OFF";
    doc["gas_led"]  = active_gas  ? "ON" : "OFF";
    
    char buffer[200];
    serializeJson(doc, buffer);
    
    client.publish("device/status", buffer, true);  // true = RETAIN
}

// Called khi nào?
// 1. Khi boot/reconnect (send_current_status() in reconnect())
// 2. Sau khi nhận command (send_current_status() in callback())
```

#### Cách Backend Nhận

```javascript
// Backend mqttService.js
client.on('message', (topic, message) => {
    if (topic === 'device/status') {
        try {
            const payload = JSON.parse(message.toString());
            const { temp_led, hum_led, ldr_led, gas_led } = payload;
            
            // Update database
            await db.query(
                'UPDATE devices SET temp_status=?, hum_status=?, ldr_status=?, gas_status=? WHERE id=?',
                [temp_led, hum_led, ldr_led, gas_led, 1]
            );
            
            // Broadcast to frontend
            io.emit('device_status_update', {
                temp_led,
                hum_led,
                ldr_led,
                gas_led,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Status parse error:', error);
        }
    }
});
```

#### Vai Trò của RETAIN Flag

**RETAIN = YES** có nghĩa:
- Khi có device mới kết nối subscribe topic này
- Nó sẽ **nhập tức nhận được last message** trên broker
- Không cần phải đợi ESP32 gửi lại

**Ví dụ Timeline**:
```
14:00:00 - ESP32 publish: {"temp_led":"ON",...} → Broker RETAIN
14:00:05 - Backend disconnect
14:00:30 - Backend reconnect & subscribe device/status
           → Immediately receive: {"temp_led":"ON",...} (retained)
           → Know current state không cần chờ ESP32 gửi
```

#### Use Cases

| Trường Hợp | Chi Tiết |
|-----------|---------|
| **Status Sync** | Backend biết trạng thái hiện tại của device |
| **UI Update** | Frontend hiển thị đúng LED state |
| **Recovery** | Khi backend restart, RETAIN message cung cấp last state |
| **Audit Log** | Lưu thay đổi status vào database |

---

### 4️⃣ `device/sync`

#### Định Nghĩa

| Thuộc Tính | Giá Trị |
|-----------|--------|
| **Tên Topic** | `device/sync` |
| **Mục Đích** | Báo hiệu khi device kết nối/tái kết nối MQTT |
| **Hướng Dữ Liệu** | ESP32 Hardware → MQTT Broker → Backend |
| **Cơ Chế** | PUBLISH (one-way notification) |
| **QoS** | 1 (At-least-once) |
| **Retain** | NO |
| **Tần Suất** | 1 lần khi reconnect (không định kỳ) |
| **Người Publish** | ESP32 Hardware |
| **Người Subscribe** | Backend Node.js Server |

#### Chi Tiết Hướng Dữ Liệu

```
ESP32 Hardware Boot
    │
    ├─ setup() hoàn tất
    ├─ loop() bắt đầu
    │
    ├─ if (!client.connected()) reconnect()
    │
    ▼
reconnect() Function
    │
    ├─ Thố lại MQTT connection
    ├─ if (client.connect(...)) → SUCCESS
    │
    ├─ client.subscribe("device/control")
    │
    ├─ Publish to device/sync: {"msg":"SYNC_REQUEST","clientId":"ESP32_MQ4_Client_A1F3"}
    │
    ├─ send_current_status()  [publish to device/status]
    │
    ▼
MQTT Broker
    │
    ├─ Receive SYNC_REQUEST
    │
    ▼
Backend Node.js Server
    │
    ├─ on('message', 'device/sync')
    ├─ Parse clientId
    ├─ Record in database: device online at <timestamp>
    ├─ Emit 'device_connected' to frontend
    │
    ▼
Frontend Dashboard
    │
    ├─ Update device connection indicator: 🟢 ONLINE
    ├─ Show to user: "Device liên kết thành công"
```

#### Payload Format

**JSON Object với metadata**:

```json
{
  "msg": "SYNC_REQUEST",
  "clientId": "ESP32_MQ4_Client_A1F3"
}
```

**Giải thích**:
- `msg`: Loại message (always "SYNC_REQUEST")
- `clientId`: Unique ID của ESP32 session hiện tại (random hex)
  - Format: `ESP32_MQ4_Client_` + random 4-digit hex
  - Mục đích: Track device reconnect vs initial connect

#### Cách Hardware Gửi (Code)

```cpp
void reconnect() {
    while (!client.connected()) {
        Serial.print("Đang kết nối MQTT...");
        
        // Tạo unique client ID
        String clientId = "ESP32_MQ4_Client_" + String(random(0xffff), HEX);
        // Ví dụ: "ESP32_MQ4_Client_F2BC"
        
        if (client.connect(clientId.c_str(), mqtt_username, mqtt_password)) {
            // SUCCESS
            Serial.println("Đã kết nối!");
            
            // Subscribe to control commands
            client.subscribe(TOPIC_CTRL);  // "device/control"
            
            // Send sync notification
            StaticJsonDocument<128> syncDoc;
            syncDoc["msg"] = "SYNC_REQUEST";
            syncDoc["clientId"] = clientId;
            
            char syncBuffer[128];
            serializeJson(syncDoc, syncBuffer);
            
            client.publish(TOPIC_SYNC, syncBuffer);  // "device/sync"
            
            // Send current status
            send_current_status();  // "device/status"
            
        } else {
            // FAILURE - retry
            delay(5000);
        }
    }
}
```

#### Cách Backend Nhận

```javascript
// Backend mqttService.js
client.on('message', (topic, message) => {
    if (topic === 'device/sync') {
        try {
            const payload = JSON.parse(message.toString());
            const { msg, clientId } = payload;
            
            if (msg === 'SYNC_REQUEST') {
                // Record device connection
                const timestamp = new Date();
                
                // Option 1: Simple log
                console.log(`Device connected: ${clientId} at ${timestamp}`);
                
                // Option 2: Database update
                await db.query(
                    'UPDATE devices SET last_connected=?, status="online", session_id=? WHERE id=?',
                    [timestamp, clientId, 1]
                );
                
                // Option 3: Broadcast to frontend
                io.emit('device_connected', {
                    deviceId: 1,
                    clientId: clientId,
                    timestamp: timestamp,
                    message: 'Device kết nối thành công'
                });
                
                // Option 4: Alert if reconnect (session change)
                const lastSessionId = await db.query('SELECT session_id FROM devices WHERE id=1');
                if (lastSessionId && lastSessionId !== clientId) {
                    console.log('RECONNECT DETECTED - device was offline');
                }
            }
        } catch (error) {
            console.error('Sync parse error:', error);
        }
    }
});
```

#### Use Cases

| Trường Hợp | Chi Tiết |
|-----------|---------|
| **Online Status** | Backend biết device online/offline |
| **Reconnect Detection** | Phát hiện khi device restart |
| **Health Check** | Monitor device uptime |
| **Session Management** | Track different session vs persistent logout |
| **Alert User** | Frontend notify user "Device online" |

---

## Tóm Tắt So Sánh 4 Topics

| Topic | Hướng | Loại | QoS | Retain | Tần Suất | Mục Đích |
|-------|-------|------|-----|--------|---------|---------|
| `sensor/data` | ESP→Backend | Publish | 0 | NO | 2/s | Đọc cảm biến |
| `device/control` | Backend→ESP | Publish | 1 | NO | Ad-hoc | Điều khiển LED |
| `device/status` | ESP→Backend | Publish | 1 | **YES** | On-change | Báo trạng thái |
| `device/sync` | ESP→Backend | Publish | 1 | NO | 1×reconnect | Báo online |

---

## Message Flow Timeline - Ví Dụ Đầy Đủ

### Scenario: User Bấm "Bật LED Nhiệt Độ"

```
Time: 14:30:00

┌─────────────────────────────────────────────────────────────────┐
│ 1. User Action (Frontend React)                                 │
├─────────────────────────────────────────────────────────────────┤
  14:30:00.000
  └─ User clicks "Bật LED Nhiệt Độ" button on Dashboard
  └─ Frontend calls: deviceService.toggleStatus(deviceId, 'TEMP')
     
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 2. Backend API Call                                             │
├─────────────────────────────────────────────────────────────────┤
  14:30:00.050
  └─ POST /api/device/toggle {deviceId: 1, command: 'TEMP'}
  └─ Backend controller receives request
  └─ Validate command → "TEMP_ON" (status currently OFF)
     
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 3. Publish to device/control Topic                              │
├─────────────────────────────────────────────────────────────────┤
  14:30:00.100
  └─ Backend MQTT client publishes:
     Topic: device/control
     Message: TEMP_ON
     QoS: 1
     Retain: NO
     
  └─ MQTT Broker receives & queues message
     
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 4. ESP32 Receives Command                                       │
├─────────────────────────────────────────────────────────────────┤
  14:30:00.150 (Δ50ms later, network latency)
  └─ ESP32 callback(topic="device/control", payload="TEMP_ON")
  └─ Parse message → "TEMP_ON"
  └─ Update state: active_temp = true
  └─ Call update_hardware():
     └─ digitalWrite(PIN_LED_TEMP, HIGH)
  └─ LED physically lights up 🟡
     
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 5. Publish Status Back                                          │
├─────────────────────────────────────────────────────────────────┤
  14:30:00.200
  └─ ESP32 calls send_current_status():
     Topic: device/status
     Message: {"temp_led":"ON","hum_led":"OFF","ldr_led":"OFF","gas_led":"OFF"}
     QoS: 1
     Retain: YES  ← Important for recovery
     
  └─ MQTT Broker receives & stores (retained)
     
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 6. Backend Receives Status Update                               │
├─────────────────────────────────────────────────────────────────┤
  14:30:00.250 (Δ50ms)
  └─ Backend MQTT client receives device/status
  └─ Parse JSON → {temp_led: "ON", ...}
  └─ Update database: UPDATE devices SET temp_status='ON'
  └─ Emit via Socket.IO: 'device_status_update'
     
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 7. Frontend Realtime Update                                     │
├─────────────────────────────────────────────────────────────────┤
  14:30:00.300 (Δ50ms)
  └─ Frontend Socket.IO listener receives status
  └─ Update React state: updateDeviceStatus(...)
  └─ Re-render Dashboard component
  └─ LED button now shows: ON 🟡 +  Green indicator
     
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 8. API Response to User                                         │
├─────────────────────────────────────────────────────────────────┤
  14:30:00.400
  └─ Backend API responds to initial toggle request:
     {
       "success": true,
       "data": {
         "deviceId": 1,
         "temp_led": "ON",
         "timestamp": "2026-04-05T14:30:00Z"
       }
     }
     
  └─ Frontend receives response
  └─ Confirm success toast: "✓ LED Nhiệt Độ bật thành công"
     
└─────────────────────────────────────────────────────────────────┘

TOTAL TIME: ~400ms from click to visual confirmation
```

---

## Concurrent Sensor Data Flow (Simultaneous)

```
Trong khi đó (parallel with control flow):

Time: 14:30:02.000 (2 seconds sau)

┌─────────────────────────────────────────────────────────────────┐
│ ESP32 Loop - 2-Second Sensor Cycle                              │
├─────────────────────────────────────────────────────────────────┤
  14:30:02.000
  └─ if (now - lastMsg > 2000) trigger:
  
  14:30:02.010
  └─ send_sensor_data("temperature", 26.5)
     Topic: sensor/data
     Message: {"sensor":"temperature","value":26.5}
     QoS: 0
     
  14:30:02.020
  └─ send_sensor_data("humidity", 75.3)
     Topic: sensor/data
     Message: {"sensor":"humidity","value":75.3}
     
  14:30:02.030
  └─ send_sensor_data("light", 42.1)
     Topic: sensor/data
     Message: {"sensor":"light","value":42.1}
     
  14:30:02.040
  └─ send_sensor_data("gas_raw", 18.7)
     Topic: sensor/data
     Message: {"sensor":"gas_raw","value":18.7}
     
└─────────────────────────────────────────────────────────────────┘

↓ MQTT Broker receives all 4 messages (no retention)

┌─────────────────────────────────────────────────────────────────┐
│ Backend Receives Sensor Data                                    │
├─────────────────────────────────────────────────────────────────┤
  14:30:02.060
  └─ for each sensor/data message:
     ├─ Parse JSON
     ├─ Validate range
     ├─ INSERT INTO data_sensors table
     └─ io.emit('sensor_update', data) via Socket.IO
     
└─────────────────────────────────────────────────────────────────┘

↓ Socket.IO

┌─────────────────────────────────────────────────────────────────┐
│ Frontend Updates Chart                                          │
├─────────────────────────────────────────────────────────────────┤
  14:30:02.100
  └─ Listener receives sensor_update event
  └─ Add datapoint to Chart.js
  └─ Chart animates new point
  └─ Display: Temperature: 26.5°C, Humidity: 75.3%, ...
     
└─────────────────────────────────────────────────────────────────┘

(Repeats every 2 seconds)
```

---

## Network Diagram - Chi Tiết

```
                          ┌──────────────────┐
                          │   Frontend      │
                          │   (React App)    │
                          │   Port: 3000     │
                          └────────┬─────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │  HTTP/WebSocket (Socket.IO) │
                    └──────────────┬──────────────┘
                                   │
             ┌─────────────────────┴─────────────────────┐
             │                                           │
             ▼                                           ▼
    ┌──────────────────┐                      ┌──────────────────┐
    │  Backend Server  │                      │  MQTT Broker     │
    │  (Node.js)       │                      │ 192.168.11.101   │
    │  Port: 5000      │                      │ Port: 2204       │
    └──────────┬───────┘                      └────────┬─────────┘
               │                                       │
               │ ┌─ Subscribe: sensor/data             │
               │ ├─ Subscribe: device/status           │
               │ ├─ Subscribe: device/sync             │
               │ └─ Publish: device/control            │
               │                                       │
               └──────────────────┬────────────────────┘
                                  │
                      ┌───────────────────────┐
                      │  MQTT Protocol        │
                      │  (QoS 0/1, JSON/Raw)  │
                      └───────────────────────┘
                                  │
                                 WiFi
                                  │
                ┌─────────────────────────────────┐
                │  ESP32 Microcontroller           │
                │  (Hardware Device)               │
                │  192.168.11.XXX                  │
                └──────────────┬──────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
          ┌─────────▼────────┐   ┌────────▼────────┐
          │  INPUT (Sensors) │   │ OUTPUT (GPIO)   │
          ├──────────────────┤   ├─────────────────┤
          │ ┌─ DHT11 (Temp)  │   │ ┌─ PIN 21 (LED) │
          │ ├─ DHT11 (Hum)   │   │ ├─ PIN 19 (LED) │
          │ ├─ LDR (Light)   │   │ ├─ PIN 22 (LED) │
          │ └─ MQ4 (Gas)     │   │ └─ PIN 23 (LED) │
          └──────────────────┘   └─────────────────┘
```

---

## Troubleshooting Topic Communication

### Message Lost Detection

```
┌─────────────────────────────────────────────────────────────────┐
│ Problem: User clicked button but LED didn't turn on             │
├─────────────────────────────────────────────────────────────────┤

1. Check device/control message published?
   mosquitto_sub -v -h 192.168.11.101 -p 2204 -u yuika -P G1nkosora -t "device/control"
   → If no message appears when user clicks → Backend not publishing
   
2. Check device/status message received?
   mosquitto_sub -v -h 192.168.11.101 -p 2204 -u yuika -P G1nkosora -t "device/status"
   → If message appears but Frontend not updating → Socket.IO issue
   
3. Check ESP32 callback triggered?
   Open Serial Monitor (115200 baud)
   → If "Lệnh điều khiển LED: ..." appears but LED not lighting → GPIO issue
   → If nothing appears → WiFi/MQTT disconnected
   
4. Check Backend receiving status?
   Backend logs:
   console.log('device/status received:', payload);
   → If no log → MQTT subscribe failed
   → If log but wrong data → JSON parse error

═════════════════════════════════════════════════════════════════

| Symptom | Likely Cause | How to Check |
|---------|------------|---|
| LED on ESP32 lights but Frontend doesn't show | device/status not published | Serial monitor + MQTT test|
| Frontend shows ON but ESP32 LED off | device/control command lost | MQTT broker logs |
| Complete no-response | WiFi disconnected | Serial monitor (WiFi msg) |
| All LED commands fail | MQTT acl.conf blocking topic | Backend logs + MQTT broker |

```

---

## Summary Table

```
┌──────────────────┬───────────┬─────────────┬─────────┬────────┬──────────────┐
│ Topic            │ Direction │ Type        │ QoS     │Retain  │ JSON/Raw     │
├──────────────────┼───────────┼─────────────┼─────────┼────────┼──────────────┤
│ sensor/data      │ ESP → BE  │ PUBLISH     │ 0       │ NO     │ JSON         │
│ device/control   │ BE → ESP  │ SUBSCRIBE   │ 1       │ NO     │ Raw String   │
│ device/status    │ ESP → BE  │ PUBLISH     │ 1       │ YES    │ JSON         │
│ device/sync      │ ESP → BE  │ PUBLISH     │ 1       │ NO     │ JSON         │
└──────────────────┴───────────┴─────────────┴─────────┴────────┴──────────────┘
```

---

**Document Status**: Chi tiết hoàn chỉnh  
**Last Updated**: 2026-04-05  
**Scope**: MQTT Topic Communication Reference
