# IoT Backend API Documentation

## 1. Overview
Backend stack:
- Node.js + Express
- MySQL (mysql2/promise)
- MQTT (device control)
- Socket.IO (realtime)

Default server:
- HTTP host: `http://localhost:5000`
- REST base path: `/api`

## 2. Run Backend
```bash
cd be
npm install
npm run dev
```

Production mode:
```bash
npm start
```

## 3. Environment Variables
Required:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `MQTT_SERVER`, `MQTT_PORT`, `MQTT_USERNAME`, `MQTT_PASSWORD`

Optional:
- `HARDWARE_HEARTBEAT_TIMEOUT_MS` (default `15000`)

## 4. API Conventions

### 4.1 Content Type
- Request: `application/json`
- Response: `application/json`

### 4.2 Common Success Envelope
```json
{
  "success": true,
  "data": {},
  "pagination": {}
}
```

### 4.3 Common Error Envelope
```json
{
  "success": false,
  "message": "Error message",
  "error": "Error detail"
}
```

### 4.4 Important Behavior
- Some business failures still return HTTP `200` with `success: true` but `data.status: "failed"`.
- Main example: `POST /api/devices/:id/toggle` when MQTT/hardware cannot confirm state.

## 5. Endpoint Summary
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Health check |
| GET | `/api/dashboard/devices` | Device list for dashboard |
| GET | `/api/dashboard/sensors/initial` | Initial chart series |
| GET | `/api/dashboard/sensors/latest` | Latest sensor values |
| GET | `/api/data-sensors` | Sensor history list |
| GET | `/api/alerts` | Alert list |
| GET | `/api/alerts/daily-count` | Alert count by date |
| GET | `/api/alerts/count-by-days` | Alert count by N days |
| GET | `/api/action-history` | Action history list |
| GET | `/api/action-history/daily-count` | Action count by date |
| GET | `/api/action-history/count-by-days` | Action count by N days |
| POST | `/api/devices/:id/toggle` | Toggle device on/off |
| POST | `/api/devices/:id/toggle-auto` | Toggle auto mode |

## 6. Detailed REST APIs

### 6.1 GET /
Health check endpoint.

#### Request
- Path params: none
- Query params: none
- Request body: none

#### Success Response
- Status: `200`
```json
{
  "message": "IoT Backend Server is Running"
}
```

---

### 6.2 GET /api/dashboard/devices
Get all devices for dashboard.

#### Request
- Path params: none
- Query params: none
- Request body: none

#### Success Response
- Status: `200`
```json
{
  "success": true,
  "data": [
    {
      "id": "2cf6f228-13ef-4f2f-8dd8-b6f0d8abf0e2",
      "name": "dev_temp_led",
      "status": "success",
      "auto_toggle": 0,
      "value": 1,
      "created_at": "2026-04-04T08:05:01.000Z",
      "is_connected": 1
    }
  ]
}
```

#### Error Response
- Status: `500`
```json
{
  "success": false,
  "message": "Khong the tai danh sach thiet bi",
  "error": "..."
}
```

---

### 6.3 GET /api/dashboard/sensors/initial
Get initial timeseries for 4 sensors.

#### Request
- Path params: none
- Query params:

| Name | Type | Required | Default | Constraints | Description |
|---|---|---|---|---|---|
| `limit` | number | No | `20` | `1..100` | Points per sensor series |

- Request body: none

#### Success Response
- Status: `200`
```json
{
  "success": true,
  "data": {
    "temperature": [
      { "timestamp": "2026-04-04T08:00:00.000Z", "value": 29.4 }
    ],
    "humidity": [
      { "timestamp": "2026-04-04T08:00:00.000Z", "value": 64.2 }
    ],
    "light": [
      { "timestamp": "2026-04-04T08:00:00.000Z", "value": 71.8 }
    ],
    "gas": [
      { "timestamp": "2026-04-04T08:00:00.000Z", "value": 12.1 }
    ]
  }
}
```

#### Error Response
- Status: `500`
```json
{
  "success": false,
  "message": "Khong the tai du lieu khoi tao cho dashboard",
  "error": "..."
}
```

---

### 6.4 GET /api/dashboard/sensors/latest
Get latest values of 4 sensors.

#### Request
- Path params: none
- Query params: none
- Request body: none

#### Success Response
- Status: `200`
```json
{
  "success": true,
  "data": {
    "temperature": 29.4,
    "humidity": 64.2,
    "light": 71.8,
    "gas": 12.1,
    "timestamp": "2026-04-04T08:00:00.000Z"
  }
}
```

#### Error Response
- Status: `500`
```json
{
  "success": false,
  "message": "Khong the tai du lieu moi nhat cua cam bien",
  "error": "..."
}
```

---

### 6.5 GET /api/data-sensors
Get sensor history with paging/filter/search/sort.

#### Request
- Path params: none
- Query params:

| Name | Type | Required | Default | Constraints | Description |
|---|---|---|---|---|---|
| `page` | number | No | `1` | `>=1` | Current page |
| `limit` | number | No | `10` | `1..100` | Page size |
| `search` | string | No | empty | - | Search keyword |
| `filter` | string | No | `all` | `all,temperature,humidity,light,gas,time` | Filter field |
| `order` | string | No | `desc` | `asc,desc` | Sort by timestamp |

- Request body: none

#### Success Response
- Status: `200`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "temperature": 29.4,
      "humidity": 64.2,
      "light": 71.8,
      "gas": 12.1,
      "timestamp": "2026-04-04T08:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 120,
    "totalPages": 12,
    "offset": 0
  }
}
```

#### Error Response
- Status: `500`
```json
{
  "success": false,
  "message": "Khong the tai lich su du lieu cam bien",
  "error": "..."
}
```

---

### 6.6 GET /api/alerts
Get alerts list with paging/filter/search/sort.

#### Request
- Path params: none
- Query params:

| Name | Type | Required | Default | Constraints | Description |
|---|---|---|---|---|---|
| `page` | number | No | `1` | `>=1` | Current page |
| `limit` | number | No | `10` | `1..100` | Page size |
| `search` | string | No | empty | - | Search keyword |
| `filter` | string | No | `all` | `all,name,severity,title,description,time` | Filter field |
| `order` | string | No | `desc` | `asc,desc` | Sort by created_at |

- Request body: none

#### Success Response
- Status: `200`
```json
{
  "success": true,
  "data": [
    {
      "id": "f952...",
      "sensor_id": "a11c...",
      "device_id": "2cf6...",
      "device_name": "dev_temp_led",
      "sensor_name": "Temperature",
      "title": "Temperature vuot nguong tren",
      "description": "Temperature = 45C, vuot nguong toi da 40C.",
      "severity": "high",
      "timestamp": "2026-04-04T08:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 32,
    "totalPages": 4,
    "offset": 0
  }
}
```

#### Error Response
- Status: `500`
```json
{
  "success": false,
  "message": "Khong the tai danh sach canh bao",
  "error": "..."
}
```

---

### 6.7 GET /api/alerts/daily-count
Get alert severity counts for one date.

#### Request
- Path params: none
- Query params:

| Name | Type | Required | Default | Constraints | Description |
|---|---|---|---|---|---|
| `date` | string | No | today | `YYYY-MM-DD` | Date for counting |

- Request body: none

#### Success Response
- Status: `200`
```json
{
  "success": true,
  "data": {
    "date": "2026-04-04",
    "total_count": 12,
    "high_count": 2,
    "medium_count": 5,
    "low_count": 3,
    "normal_count": 2
  }
}
```

#### Error Responses
- Status: `400` (invalid date)
```json
{
  "success": false,
  "message": "Dinh dang date khong hop le. Vi du: 2026-03-17"
}
```

- Status: `500`
```json
{
  "success": false,
  "message": "Khong the tai thong ke canh bao theo ngay",
  "error": "..."
}
```

---

### 6.8 GET /api/alerts/count-by-days
Get alert severity counts for N recent days.

#### Request
- Path params: none
- Query params:

| Name | Type | Required | Default | Constraints | Description |
|---|---|---|---|---|---|
| `days` | number | No | `7` | `1..90` | Number of days |

- Request body: none

#### Success Response
- Status: `200`
```json
{
  "success": true,
  "data": [
    {
      "date": "2026-04-01",
      "total_count": 8,
      "high_count": 1,
      "medium_count": 4,
      "low_count": 2,
      "normal_count": 1
    }
  ]
}
```

#### Error Response
- Status: `500`
```json
{
  "success": false,
  "message": "Khong the tai thong ke canh bao theo nhieu ngay",
  "error": "..."
}
```

---

### 6.9 GET /api/action-history
Get action history with paging/filter/search/sort.

#### Request
- Path params: none
- Query params:

| Name | Type | Required | Default | Constraints | Description |
|---|---|---|---|---|---|
| `page` | number | No | `1` | `>=1` | Current page |
| `limit` | number | No | `10` | `1..100` | Page size |
| `search` | string | No | empty | - | Search keyword |
| `filter` | string | No | `all` | `all,name,action,status,user,time` | Filter field |
| `sensorFilter` | string | No | `all` | `all,humidity,gas,light,temperature` | Filter by sensor-type device name |
| `order` | string | No | `desc` | `asc,desc` | Sort by created_at |

- Request body: none

#### Time Search Formats (when `filter=time`)
- Full: `DD/MM/YYYY HH:mm:ss`, `DD/MM/YYYY HH:mm`, `DD/MM/YYYY HH`
- Date only: `DD/MM/YYYY` or `YYYY-MM-DD`
- Short: `MM/YYYY`, `MM/YYYY HH`, `MM/YYYY HH:mm:ss`, `DD/YYYY HH:mm:ss`...

#### Success Response
- Status: `200`
```json
{
  "success": true,
  "data": [
    {
      "id": "c41e...",
      "device_id": "2cf6...",
      "device_name": "dev_temp_led",
      "command": "TEMP_ON",
      "auto_toggle": null,
      "value": "ON",
      "executor": "user",
      "status": "success",
      "timestamp": "2026-04-04T08:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 74,
    "totalPages": 8,
    "offset": 0
  }
}
```

#### Error Response
- Status: `500`
```json
{
  "success": false,
  "message": "Khong the tai lich su thao tac",
  "error": "..."
}
```

---

### 6.10 GET /api/action-history/daily-count
Get on/off counts for one date.

#### Request
- Path params: none
- Query params:

| Name | Type | Required | Default | Constraints | Description |
|---|---|---|---|---|---|
| `date` | string | No | today | `YYYY-MM-DD` | Date for counting |

- Request body: none

#### Success Response
- Status: `200`
```json
{
  "success": true,
  "data": {
    "date": "2026-04-04",
    "on_count": 9,
    "off_count": 5
  }
}
```

#### Error Responses
- Status: `400` (invalid date)
```json
{
  "success": false,
  "message": "Dinh dang date khong hop le. Vi du: 2026-03-16"
}
```

- Status: `500`
```json
{
  "success": false,
  "message": "Khong the tai thong ke lich su thao tac theo ngay",
  "error": "..."
}
```

---

### 6.11 GET /api/action-history/count-by-days
Get on/off counts for N recent days.

#### Request
- Path params: none
- Query params:

| Name | Type | Required | Default | Constraints | Description |
|---|---|---|---|---|---|
| `days` | number | No | `7` | `1..90` | Number of days |

- Request body: none

#### Success Response
- Status: `200`
```json
{
  "success": true,
  "data": [
    {
      "date": "2026-04-01",
      "on_count": 5,
      "off_count": 3
    }
  ]
}
```

#### Error Response
- Status: `500`
```json
{
  "success": false,
  "message": "Khong the tai thong ke lich su thao tac theo nhieu ngay",
  "error": "..."
}
```

---

### 6.12 POST /api/devices/:id/toggle
Toggle device state manually (ON/OFF).

#### Request
- Path params:

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Device ID |

- Query params: none
- Request body: none (an empty JSON body is accepted but not required)

#### Success Response (toggle success)
- Status: `200`
```json
{
  "success": true,
  "data": {
    "id": "2cf6...",
    "name": "dev_temp_led",
    "value": 1,
    "status": "success",
    "auto_toggle": 0,
    "command": "TEMP_ON"
  }
}
```

#### Business Failure Response (still HTTP 200)
Example when reconnect MQTT timeout after 10 seconds:
```json
{
  "success": true,
  "data": {
    "id": "2cf6...",
    "name": "dev_temp_led",
    "value": 0,
    "status": "failed",
    "auto_toggle": 0,
    "command": "TEMP_ON"
  },
  "message": "Mat ket noi toi thiet bi. Da thu ket noi lai MQTT trong 10 giay nhung khong thanh cong."
}
```

#### Error Responses
- Status: `404`
```json
{
  "success": false,
  "message": "Khong tim thay thiet bi"
}
```

- Status: `500`
```json
{
  "success": false,
  "message": "Khong the bat/tat thiet bi",
  "error": "..."
}
```

---

### 6.13 POST /api/devices/:id/toggle-auto
Toggle auto mode for one device.

#### Request
- Path params:

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Device ID |

- Query params: none
- Request body: none (an empty JSON body is accepted but not required)

#### Success Response
- Status: `200`
```json
{
  "success": true,
  "data": {
    "id": "2cf6...",
    "name": "dev_temp_led",
    "value": 1,
    "status": "success",
    "auto_toggle": 1,
    "command": "ENABLE_AUTO"
  }
}
```

#### Error Responses
- Status: `404`
```json
{
  "success": false,
  "message": "Khong tim thay thiet bi"
}
```

- Status: `500`
```json
{
  "success": false,
  "message": "Khong the bat/tat che do tu dong",
  "error": "..."
}
```

## 7. Socket.IO Realtime Reference
Socket URL:
- `http://localhost:5000`

| Start -> End | Event | Payload | Mo ta |
|---|---|---|---|
| Server -> Client | `connection_status` | `{ "success": true, "mqttConnected": true, "hardwareConnected": true, "message": "He thong ket noi on dinh", "timestamp": "2026-04-04T10:00:00.000Z" }` | Trang thai ket noi realtime. Backend emit dinh ky moi 2 giay. |
| Server -> Client | `sensor_update` | `{ "type": "temperature", "sensor": "temperature", "value": 28.5, "timestamp": "2026-04-04T10:00:00.000Z" }` | Du lieu cam bien realtime sau khi backend nhan duoc MQTT sensor payload. |
| Server -> Client | `device_status_update` | Shape A (hardware): `{ "temp_led": "ON", "hum_led": "OFF", "ldr_led": "ON", "gas_led": "OFF" }`<br>Shape B (backend sync/control): `{ "device_id": "2cf6...", "value": 1, "status": "success", "auto_toggle": 0 }` | Cap nhat trang thai thiet bi. Co the den tu feedback hardware hoac tu backend dong bo/auto-control. |
| Server -> Client | `alert_update` | `{ "sensor_id": "a11c...", "device_id": "2cf6...", "title": "Temperature vuot nguong tren", "description": "Temperature = 45C, vuot nguong toi da 40C.", "severity": "high", "timestamp": "2026-04-04T10:00:00.000Z" }` | Emit khi backend tao canh bao moi tu sensor threshold. |
| Client -> Server | `send_command` | `"TEMP_ON"` | UI gui lenh dieu khien den backend de publish qua MQTT topic control. |

## 8. Postman
Provided files:
- `postman/IOT_Backend.postman_collection.json`
- `postman/IOT_Backend.postman_environment.json`

Quick start:
1. Import both files into Postman.
2. Select environment `IOT Backend Local`.
3. Update `baseUrl` if needed (default `http://localhost:5000`).
4. Run requests by folder.
