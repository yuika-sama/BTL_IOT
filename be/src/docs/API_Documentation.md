# IoT System API Documentation

## Base URL

```
http://localhost:5000/api
```

## Table of Contents

- [Devices API](#devices-api)
- [Sensors API](#sensors-api)
- [Data Sensors API](#data-sensors-api)
- [Action History API](#action-history-api)
- [Alerts API](#alerts-api)
- [Response Format](#response-format)
- [Error Handling](#error-handling)

---

## Devices API

### 1. Get All Devices Info (Dashboard)

Lấy thông tin tất cả các thiết bị đang kết nối để hiển thị trên Dashboard.

**Endpoint:** `GET /devices/info`

**Description:**

- API này được sử dụng trong Dashboard và Automation page
- Chỉ trả về các thiết bị đã kết nối (`is_connected = true`)
- Bao gồm thông tin về trạng thái device (ON/OFF), status (waiting/success/failed), và chế độ tự động

**Query Parameters:** None

**Response:**

```json
{
  "success": true,
  "message": "Get all devices info successfully",
  "data": [
    {
      "id": "uuid",
      "name": "dev_temp_led",
      "value": 1,
      "status": "success",
      "is_connected": true,
      "auto_toggle": 0
    }
  ]
}
```

**Response Fields:**

- `id`: UUID của thiết bị
- `name`: Tên thiết bị (dev_temp_led, dev_hum_led, dev_ldr_led, dev_dust_led)
- `value`: Trạng thái ON (1) hoặc OFF (0)
- `status`: Trạng thái command (success, waiting, failed)
- `is_connected`: Trạng thái kết nối với broker MQTT
- `auto_toggle`: Chế độ tự động (1) hoặc thủ công (0)

---

### 2. Toggle Device Status (Dashboard)

Bật/tắt thiết bị (Manual mode) - Gửi lệnh ON/OFF qua MQTT.

**Endpoint:** `PATCH /devices/:id/toggle`

**Description:**

- API này chuyển đổi trạng thái thiết bị từ ON→OFF hoặc OFF→ON
- Tự động tắt chế độ `auto_toggle` khi sử dụng
- Tạo action history với status 'waiting'
- Gửi command qua MQTT đến ESP32
- Sử dụng timeout 10s để chờ confirmation từ hardware
- Broadcast status 'waiting' qua WebSocket ngay lập tức

**URL Parameters:**

- `id` (required): UUID của device

**Request Body:** None

**Response (Waiting state):**

```json
{
  "success": true,
  "message": "Device command sent, waiting for confirmation...",
  "data": {
    "id": "uuid",
    "status": "waiting",
    "value": 0,
    "target_value": 1
  }
}
```

**Response (Success - via WebSocket):**

```json
{
  "device_id": "uuid",
  "status": "success",
  "value": 1,
  "timestamp": "2026-02-19T10:30:00.000Z"
}
```

**Error Response (Device not connected):**

```json
{
  "success": false,
  "message": "Device is not connected",
  "statusCode": 503
}
```

**Flow:**

1. Client gửi request PATCH /devices/:id/toggle
2. Backend validate device tồn tại và đang connected
3. Tạo action_history với status 'waiting'
4. Update device status = 'waiting' và auto_toggle = 0
5. Broadcast 'waiting' qua WebSocket
6. Gửi MQTT command đến ESP32
7. Chờ confirmation từ hardware (10s timeout)
8. ESP32 xác nhận → Backend update status = 'success', broadcast qua WebSocket
9. Frontend nhận WebSocket và cập nhật UI

---

### 3. Toggle Auto Mode (Automation)

Bật/tắt chế độ tự động cho thiết bị.

**Endpoint:** `PATCH /devices/:id/auto-toggle`

**Description:**

- Chuyển đổi giữa chế độ AUTO (1) và MANUAL (0)
- Khi bật AUTO, thiết bị sẽ tự động bật/tắt dựa trên ngưỡng cảm biến
- Tạo action history với command 'ENABLE_AUTO' hoặc 'DISABLE_AUTO'
- Broadcast thay đổi qua WebSocket với field `auto_toggle`

**URL Parameters:**

- `id` (required): UUID của device

**Request Body:** None

**Response:**

```json
{
  "success": true,
  "message": "Device auto-toggle ENABLED",
  "data": {
    "id": "uuid",
    "name": "dev_temp_led",
    "value": 1,
    "status": "success",
    "is_connected": true,
    "auto_toggle": 1,
    "created_at": "2026-02-19T10:00:00.000Z",
    "updated_at": "2026-02-19T10:30:00.000Z"
  }
}
```

**Use Case:**

- User ở Automation page toggle switch để bật/tắt chế độ tự động
- Khi AUTO ON: Thiết bị sẽ tự động điều chỉnh dựa trên threshold của sensor
- Khi MANUAL: User phải tự điều khiển thiết bị từ Dashboard

---

## Sensors API

### 1. Get Latest Sensor Values (Dashboard)

Lấy giá trị mới nhất của 4 loại cảm biến để hiển thị trên Dashboard.

**Endpoint:** `GET /sensors/latest`

**Description:**

- Lấy giá trị hiện tại của 4 sensors: nhiệt độ, độ ẩm, ánh sáng, bụi mịn
- Sử dụng sensor IDs từ environment variables
- Dùng cho InforCard component trên Dashboard
- Backend tự động fetch theo config (TEMPERATURE_ID, HUMIDITY_ID, LIGHT_ID, DUST_ID)

**Query Parameters:** None

**Response:**

```json
{
  "success": true,
  "message": "Get latest sensor values successfully",
  "data": {
    "temperature": {
      "id": "uuid",
      "sensor_id": "sensor-uuid",
      "value": 25.5,
      "timestamp": "2026-02-19T10:30:00.000Z",
      "name": "Nhiệt độ",
      "unit": "°C"
    },
    "humidity": {
      "id": "uuid",
      "sensor_id": "sensor-uuid",
      "value": 65.2,
      "timestamp": "2026-02-19T10:30:00.000Z",
      "name": "Độ ẩm",
      "unit": "%"
    },
    "light": {
      "id": "uuid",
      "sensor_id": "sensor-uuid",
      "value": 450,
      "timestamp": "2026-02-19T10:30:00.000Z",
      "name": "Ánh sáng",
      "unit": "lux"
    },
    "dust": {
      "id": "uuid",
      "sensor_id": "sensor-uuid",
      "value": 35.8,
      "timestamp": "2026-02-19T10:30:00.000Z",
      "name": "Bụi",
      "unit": "µg/m³"
    }
  }
}
```

---

## Data Sensors API

### 1. Get Initial Chart Data (Dashboard)

Lấy dữ liệu ban đầu cho 4 charts (temperature, humidity, light, dust) trên Dashboard.

**Endpoint:** `GET /data-sensors/initial-chart-data`

**Description:**

- Lấy 20 điểm dữ liệu gần nhất cho mỗi sensor
- Sắp xếp từ cũ đến mới (oldest first) để vẽ chart đúng timeline
- Chạy Promise.all để fetch song song 4 sensors
- Dùng cho component Chart để hiển thị biểu đồ realtime

**Query Parameters:**

```
limit : Số lượng điểm dữ liệu cho mỗi sensor (default: 20)
```

**Response:**

```json
{
  "success": true,
  "message": "Get initial chart data successfully",
  "data": {
    "temperature": [
      {
        "timestamp": "2026-02-19T10:00:00.000Z",
        "value": 25.5
      },
      {
        "timestamp": "2026-02-19T10:05:00.000Z",
        "value": 25.8
      }
    ],
    "humidity": [
      {
        "timestamp": "2026-02-19T10:00:00.000Z",
        "value": 65.2
      }
    ],
    "light": [
      {
        "timestamp": "2026-02-19T10:00:00.000Z",
        "value": 450
      }
    ],
    "dust": [
      {
        "timestamp": "2026-02-19T10:00:00.000Z",
        "value": 35.8
      }
    ]
  }
}
```

**How it works:**

1. Frontend gọi API khi Dashboard mount
2. Backend fetch 4 sensors song song theo limit=20
3. Data được sort oldest→newest để chart vẽ đúng timeline
4. Frontend lưu vào state và vẽ chart
5. WebSocket sẽ push data mới realtime sau đó

---

### 2. Get Sensor History (Data Sensor Page)

Lấy lịch sử dữ liệu của 4 sensors với phân trang, tìm kiếm, filter.

**Endpoint:** `GET /data-sensors/history`

**Description:**

- Hiển thị bảng dữ liệu lịch sử tất cả 4 sensors theo timestamp
- Mỗi row chứa timestamp và 4 giá trị (temperature, humidity, light, dust)
- Hỗ trợ search theo giá trị số, filter theo loại sensor, sort theo field
- Sử dụng pivot logic để gộp 4 sensors cùng timestamp vào 1 row

**Query Parameters:**

```
page       : Số trang (default: 1)
limit      : Số lượng items/trang (default: 10)
search     : Tìm kiếm theo giá trị số hoặc thời gian
filterType : Filter theo loại (all, temperature, humidity, light, dust, time)
sortBy     : Field để sort (timestamp, temperature, humidity, light, dust)
sortOrder  : asc hoặc desc (default: desc)
```

**Example Request:**

```
GET /data-sensors/history?page=1&limit=10&filterType=temperature&search=25&sortOrder=desc
```

**Response:**

```json
{
  "success": true,
  "message": "Get sensor history successfully",
  "data": {
    "data": [
      {
        "id": 1,
        "temperature": 25.5,
        "humidity": 65.2,
        "light": 450,
        "dust": 35.8,
        "timestamp": "2026-02-19T10:30:00.000Z"
      },
      {
        "id": 2,
        "temperature": 26.0,
        "humidity": 64.8,
        "light": 460,
        "dust": 36.2,
        "timestamp": "2026-02-19T10:25:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

**Search Logic:**

- **Numeric search:** Tìm giá trị sensor với ROUND để flexible matching
  - Search "25.5" sẽ match "25.50", "25.500", etc.
- **Text search:** Tìm theo device name hoặc formatted time
- **Time search:** Format DD/MM/YYYY HH:MM:SS để tìm kiếm dễ dàng

**Pivot Logic:**

- Backend group tất cả sensors cùng timestamp vào 1 row
- Mỗi row có 4 fields: temperature, humidity, light, dust + timestamp
- Nếu sensor nào thiếu data thì để null

---

### 3. Get Aggregate Data (Charts)

Lấy dữ liệu tổng hợp (AVG, MIN, MAX) theo interval (minute/hour/day).

**Endpoint:** `GET /data-sensors/aggregate/:sensorId`

**Description:**

- Tính toán AVG, MIN, MAX của sensor theo interval
- Dùng cho chart phân tích xu hướng dài hạn
- Hỗ trợ 3 intervals: minute, hour, day

**URL Parameters:**

- `sensorId` (required): UUID của sensor

**Query Parameters:**

```
interval : Khoảng thời gian (minute, hour, day) - default: hour
limit    : Số lượng buckets (default: 24)
```

**Example Request:**

```
GET /data-sensors/aggregate/sensor-uuid?interval=hour&limit=24
```

**Response:**

```json
{
  "success": true,
  "message": "Get aggregate data successfully",
  "data": [
    {
      "time_bucket": "2026-02-19 10:00:00",
      "avg_value": 25.5,
      "min_value": 24.0,
      "max_value": 27.0,
      "count": 12
    },
    {
      "time_bucket": "2026-02-19 11:00:00",
      "avg_value": 26.2,
      "min_value": 25.0,
      "max_value": 28.0,
      "count": 12
    }
  ]
}
```

**Use Case:**

- Xem xu hướng nhiệt độ trung bình theo giờ trong 24h
- Phân tích độ ẩm trung bình theo ngày trong 1 tuần
- Tìm min/max ánh sáng trong ngày

---

## Action History API

### 1. Get All Action History (Action History Page)

Lấy lịch sử tất cả các hành động điều khiển thiết bị.

**Endpoint:** `GET /action-history`

**Description:**

- Hiển thị lịch sử ON/OFF device và bật/tắt AUTO mode
- Hỗ trợ search Vietnamese terms (bật→ON, tắt→OFF, tự động→auto)
- Phân biệt manual control (ON/OFF) và auto toggle (ENABLE_AUTO/DISABLE_AUTO)
- Theo dõi executor (user/system) và status (waiting/success/failed)

**Query Parameters:**

```
page       : Số trang (default: 1)
limit      : Số lượng items/trang (default: 10)
search     : Tìm kiếm (hỗ trợ tiếng Việt)
filterType : Filter theo loại (all, name, action, status, user, time)
sortBy     : Field để sort (timestamp, device_name, value, status, executor)
sortOrder  : asc hoặc desc (default: desc)
```

**Example Request:**

```
GET /action-history?page=1&limit=10&filterType=action&search=bật&sortOrder=desc
```

**Response:**

```json
{
  "success": true,
  "message": "Get all action history successfully",
  "data": {
    "data": [
      {
        "id": "uuid",
        "device_name": "dev_temp_led",
        "value": "ON",
        "status": "success",
        "executor": "user",
        "timestamp": "2026-02-19T10:30:00.000Z",
        "auto_toggle": null
      },
      {
        "id": "uuid",
        "device_name": "dev_hum_led",
        "value": "OFF",
        "status": "waiting",
        "executor": "user",
        "timestamp": "2026-02-19T10:25:00.000Z",
        "auto_toggle": null
      },
      {
        "id": "uuid",
        "device_name": "dev_ldr_led",
        "value": "ENABLE_AUTO",
        "status": "success",
        "executor": "user",
        "timestamp": "2026-02-19T10:20:00.000Z",
        "auto_toggle": "ENABLE_AUTO"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

**Field Descriptions:**

- `value`: Command được gửi (ON, OFF, ENABLE_AUTO, DISABLE_AUTO)
- `status`: Trạng thái thực thi
  - `waiting`: Đang chờ xác nhận từ hardware
  - `success`: Thành công
  - `failed`: Thất bại
- `executor`: Người/hệ thống thực hiện
  - `user`: User điều khiển thủ công
  - `system`: Hệ thống tự động điều khiển theo threshold
- `auto_toggle`: Không null nếu là action bật/tắt AUTO mode

**Vietnamese Search Terms:**

```
"bật", "bat" → ON
"tắt", "tat" → OFF
"tự động", "tu dong" → auto (finds all auto-related)
"bật tự động" → ENABLE_AUTO
"tắt tự động" → DISABLE_AUTO
"thành công", "thanh cong" → success
"thất bại", "that bai" → failed
"chờ", "đợi", "cho doi" → waiting
```

---

### 2. Get Action History Statistics(???)

Lấy thống kê tổng quan về action history.

**Endpoint:** `GET /action-history/statistics`

**Description:**

- Tổng số actions trong N ngày
- Phân loại theo status (success/failed/waiting)
- Phân loại theo command (ON/OFF/AUTO)
- Phân tích theo executor (user/system)

**Query Parameters:**

```
days : Số ngày để thống kê (default: 7)
```

**Response:**

```json
{
  "success": true,
  "message": "Get action history statistics successfully",
  "data": {
    "total_actions": 150,
    "by_status": {
      "success": 140,
      "failed": 5,
      "waiting": 5
    },
    "by_command": {
      "ON": 70,
      "OFF": 65,
      "ENABLE_AUTO": 8,
      "DISABLE_AUTO": 7
    },
    "by_executor": {
      "user": 120,
      "system": 30
    },
    "success_rate": 93.3
  }
}
```

---

## Alerts API

### 1. Get All Alerts (Notification Page)

Lấy tất cả các alerts/notifications với phân trang, tìm kiếm, filter.

**Endpoint:** `GET /alerts`

**Description:**

- Hiển thị cảnh báo khi sensor vượt ngưỡng (threshold_min/max)
- Hỗ trợ search Vietnamese severity terms
- Phân loại theo mức độ: high, medium, low, normal

**Query Parameters:**

```
page       : Số trang (default: 1)
limit      : Số lượng items/trang (default: 10)
search     : Tìm kiếm (hỗ trợ tiếng Việt)
filterType : Filter theo loại (all, name, severity, time)
sortBy     : Field để sort (timestamp, severity)
sortOrder  : asc hoặc desc (default: desc)
```

**Example Request:**

```
GET /alerts?page=1&limit=10&filterType=severity&search=cao&sortOrder=desc
```

**Response:**

```json
{
  "success": true,
  "message": "Get all alerts successfully",
  "data": {
    "data": [
      {
        "id": "uuid",
        "severity": "high",
        "device_name": "dev_temp_led",
        "timestamp": "2026-02-19T10:30:00.000Z",
        "title": "Nhiệt độ cao",
        "description": "Nhiệt độ đã vượt ngưỡng 30°C, hiện tại: 32.5°C"
      },
      {
        "id": "uuid",
        "severity": "medium",
        "device_name": "dev_dust_led",
        "timestamp": "2026-02-19T10:25:00.000Z",
        "title": "Bụi mịn cao",
        "description": "Bụi mịn vượt mức cho phép 50µg/m³, hiện tại: 65µg/m³"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 30,
      "totalPages": 3
    }
  }
}
```

**Severity Levels:**

- `high`: Nghiêm trọng - Vượt ngưỡng quá nhiều
- `medium`: Cảnh báo - Vượt ngưỡng ít
- `low`: Thông tin - Gần ngưỡng
- `normal`: Bình thường - Trong ngưỡng

**Vietnamese Severity Search:**

```
"nghiêm trọng", "nghiem trong" → high
"cao" → high
"cảnh báo", "canh bao" → medium
"trung bình", "trung binh" → medium
"thông tin", "thong tin" → low
"thấp", "thap" → low
"bình thường", "binh thuong" → normal
```

---

### 2. Get Alert Statistics(???)

Lấy thống kê tổng quan về alerts.

**Endpoint:** `GET /alerts/statistics`

**Description:**

- Tổng số alerts trong N ngày
- Phân loại theo severity
- Alerts theo từng device

**Query Parameters:**

```
days : Số ngày để thống kê (default: 7)
```

**Response:**

```json
{
  "success": true,
  "message": "Get alert statistics successfully",
  "data": {
    "total_alerts": 50,
    "by_severity": {
      "high": 10,
      "medium": 25,
      "low": 10,
      "normal": 5
    },
    "by_device": {
      "dev_temp_led": 15,
      "dev_hum_led": 10,
      "dev_dust_led": 20,
      "dev_ldr_led": 5
    },
    "latest_alerts": [
      {
        "id": "uuid",
        "severity": "high",
        "device_name": "dev_temp_led",
        "timestamp": "2026-02-19T10:30:00.000Z",
        "title": "Nhiệt độ cao"
      }
    ]
  }
}
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Success message",
  "data": {}
}
```

### Paginated Response

```json
{
  "success": true,
  "message": "Success message",
  "data": [],
  "pagination": {
    "totalItems": 100,
    "totalPages": 10,
    "currentPage": 1,
    "pageSize": 10
  }
}
```

### Created Response (201)

```json
{
  "success": true,
  "message": "Resource created",
  "data": {}
}
```

---

## Error Handling

### Error Response Structure

```json
{
  "success": false,
  "message": "Error message",
  "statusCode": 400
}
```

### HTTP Status Codes

- `200 OK`: Request thành công
- `201 Created`: Resource được tạo thành công
- `400 Bad Request`: Request không hợp lệ (thiếu params, validation failed)
- `404 Not Found`: Resource không tồn tại
- `500 Internal Server Error`: Lỗi server
- `503 Service Unavailable`: Service không khả dụng (device not connected)

### Common Errors

**400 Bad Request:**

```json
{
  "success": false,
  "message": "Name is required",
  "statusCode": 400
}
```

**404 Not Found:**

```json
{
  "success": false,
  "message": "Device not found",
  "statusCode": 404
}
```

**503 Service Unavailable:**

```json
{
  "success": false,
  "message": "Device is not connected",
  "statusCode": 503
}
```

---

## WebSocket Events

Backend sử dụng Socket.io để broadcast realtime updates.

### Events

#### 1. `sensorData`

Broadcast khi có data sensor mới từ MQTT.

**Payload:**

```json
{
  "type": "temperature",
  "value": 25.5,
  "timestamp": "2026-02-19T10:30:00.000Z",
  "sensor_id": "uuid"
}
```

#### 2. `deviceStatus`

Broadcast khi device thay đổi trạng thái.

**Payload:**

```json
{
  "device_id": "uuid",
  "status": "success",
  "value": 1,
  "is_connected": true,
  "auto_toggle": 0,
  "timestamp": "2026-02-19T10:30:00.000Z"
}
```

#### 3. `alert`

Broadcast khi có alert mới.

**Payload:**

```json
{
  "id": "uuid",
  "severity": "high",
  "device_id": "uuid",
  "sensor_id": "uuid",
  "title": "Nhiệt độ cao",
  "description": "Nhiệt độ vượt ngưỡng",
  "timestamp": "2026-02-19T10:30:00.000Z"
}
```

---

## MQTT Topics

### Subscribe Topics

```
iot/device/+/data    # Nhận sensor data từ hardware
iot/device/+/status  # Nhận status updates từ hardware
iot/device/+/will    # Last Will Testament - detect disconnect
```

### Publish Topics

```
iot/device/{id}/command  # Gửi command tới hardware (ON/OFF)
```

### Command Format

```json
{
  "led_temp": 1,
  "led_hum": 0,
  "led_ldr": 1,
  "led_dust": 0
}
```

---

## Environment Variables Required

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=iot_db

# MQTT
MQTT_BROKER=mqtts://your-broker.hivemq.cloud
MQTT_PORT=8883
MQTT_USERNAME=username
MQTT_PASSWORD=password

# Sensor IDs
TEMPERATURE_ID=uuid
HUMIDITY_ID=uuid
LIGHT_ID=uuid
DUST_ID=uuid

# Device IDs
DEVICE_TEMPERATURE_ID=uuid
DEVICE_HUMIDITY_ID=uuid
DEVICE_LIGHT_ID=uuid
DEVICE_DUST_ID=uuid

# Server
PORT=5000
NODE_ENV=development
```

---
