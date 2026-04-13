# Tài liệu dự án — Kiến trúc & Luồng nghiệp vụ

Phiên bản: 1.0

Tài liệu này tóm tắt kiến trúc hệ thống, các luồng nghiệp vụ chính, map tới file/dòng quan trọng trong repo, giải thích chi tiết cách hoạt động, lý do thiết kế, và đề xuất cải tiến.

---

## Mục lục
- **Tóm tắt kiến trúc**
- **Luồng nghiệp vụ chính**
  - Telemetry (sensor data)
  - Điều khiển thiết bị (control)
  - Đồng bộ trạng thái (sync)
- **Map file & dòng quan trọng**
- **Giải thích chi tiết + lý do thiết kế**
- **Đề xuất cải tiến (ưu tiên)**
- **Kết luận & bước tiếp theo**

---

## Tóm tắt kiến trúc

- Backend: Node.js (Express) + Socket.io + MQTT client + MySQL. Khởi tạo server tại [be/src/server.js](be/src/server.js#L1-L80) và routes ở [be/src/app.js](be/src/app.js#L1-L40).
- Xử lý MQTT & business logic tập trung ở [be/src/services/mqttService.js](be/src/services/mqttService.js#L1-L220) (parse, persist, emit, sync, control helpers).
- DB wrapper: [be/src/config/db.js](be/src/config/db.js#L1-L40).
- API controllers: [be/src/controllers/*.js](be/src/controllers/dashboardController.js#L1-L200), [be/src/controllers/dataSensorController.js](be/src/controllers/dataSensorController.js#L1-L220), [be/src/controllers/deviceController.js](be/src/controllers/deviceController.js#L1-L200).
- Frontend: Vite + React. Socket client: [fe/src/services/socketService.js](fe/src/services/socketService.js#L1-L200) + hook [fe/src/hooks/useSocket.jsx](fe/src/hooks/useSocket.jsx#L1-L80). API client: [fe/src/services/baseApi.js](fe/src/services/baseApi.js#L1-L80).

---

## Luồng nghiệp vụ chính

### 1) Telemetry — Thiết bị → MQTT → Backend → DB → FE realtime

- Flow steps (ngắn):
  1. Thiết bị publish JSON lên topic `sensor/data`.
  2. Backend nhận message trong MQTT `message` handler: [be/src/services/mqttService.js](be/src/services/mqttService.js#L188-L216).
  3. Parse payload → `extractSensorReadings`: [be/src/services/mqttService.js](be/src/services/mqttService.js#L20-L90).
  4. Lưu mỗi reading vào DB → `insertSensorData` / `persistSensorReading`: [be/src/services/mqttService.js](be/src/services/mqttService.js#L110-L160) (ghi vào `data_sensors`). DB wrapper: [be/src/config/db.js](be/src/config/db.js#L1-L40).
  5. Emit realtime: `emitSensorUpdate` gửi `sensor_update` tới Socket.io clients: [be/src/services/mqttService.js](be/src/services/mqttService.js#L130-L151).
  6. FE nhận qua `socketService.onSensorData`: [fe/src/services/socketService.js](fe/src/services/socketService.js#L92-L104) và hook [fe/src/hooks/useSocket.jsx](fe/src/hooks/useSocket.jsx#L1-L40). Dashboard xử lý update: [fe/src/pages/Dashboard.jsx](fe/src/pages/Dashboard.jsx#L190-L240).

### 2) Điều khiển thiết bị — FE → Backend → MQTT → Hardware → FE

- Flow steps (ngắn):
  1. FE gọi endpoint `POST /api/devices/:id/toggle` qua `deviceService.toggleStatus`: [fe/src/services/deviceService.js](fe/src/services/deviceService.js#L1-L22).
  2. Route mapping: [be/src/routes/deviceRoutes.js](be/src/routes/deviceRoutes.js#L1-L9) → controller `toggleDevice`: [be/src/controllers/deviceController.js](be/src/controllers/deviceController.js#L1-L140).
  3. Controller ghi `action_history` (status=`waiting`) và set device.status=`waiting` trước khi publish.
  4. Controller gọi `mqttService.sendCommandAndWaitWithReconnect(...)`: [be/src/services/mqttService.js](be/src/services/mqttService.js#L568-L604). Logic này: đảm bảo kết nối, publish command, chờ `device/status` từ HW hoặc timeout + retry reconnect.
  5. Publish command thực tế: `publishControl`: [be/src/services/mqttService.js](be/src/services/mqttService.js#L450-L490).
  6. Khi backend nhận `device/status` (từ HW), nó gọi `updateDeviceStatus` để resolve các waiter và emit `device_status_update` cho FE: [be/src/services/mqttService.js](be/src/services/mqttService.js#L188-L216).
  7. FE nhận `device_status_update` → cập nhật UI devices: [fe/src/pages/Dashboard.jsx](fe/src/pages/Dashboard.jsx#L220-L260).

### 3) Đồng bộ trạng thái (Sync)

- Mô tả: Khi MQTT connect hoặc khi backend phát hiện hardware activity, backend gọi `requestDeviceStateSync` → `syncDeviceStatesFromDatabase()` để publish state mong muốn cho từng thiết bị (thực hiện tuần tự + sleep): [be/src/services/mqttService.js](be/src/services/mqttService.js#L500-L570).

---

## Map file & dòng quan trọng (quick reference)

- `be/src/server.js` — server + socket init + periodic connection status emit: [be/src/server.js](be/src/server.js#L1-L80)
- `be/src/app.js` — express routes mount: [be/src/app.js](be/src/app.js#L1-L40)
- `be/src/services/mqttService.js` — core MQTT logic:
  - parsing & extract: [be/src/services/mqttService.js](be/src/services/mqttService.js#L20-L90)
  - insert / persist sensor: [be/src/services/mqttService.js](be/src/services/mqttService.js#L110-L160)
  - message handler & device status emit: [be/src/services/mqttService.js](be/src/services/mqttService.js#L188-L216)
  - publish / wait / reconnect: [be/src/services/mqttService.js](be/src/services/mqttService.js#L420-L604)
- `be/src/config/db.js` — MySQL pool + `query(...)`: [be/src/config/db.js](be/src/config/db.js#L1-L40)
- `be/src/controllers/deviceController.js` — `toggleDevice` flow (action_history, update device status): [be/src/controllers/deviceController.js](be/src/controllers/deviceController.js#L1-L140)
- `be/src/controllers/dataSensorController.js` — build aggregate queries + search: [be/src/controllers/dataSensorController.js](be/src/controllers/dataSensorController.js#L1-L220)
- Frontend key files:
  - `fe/src/services/socketService.js` — socket client wrapper: [fe/src/services/socketService.js](fe/src/services/socketService.js#L1-L200)
  - `fe/src/hooks/useSocket.jsx` — hook tiện lợi: [fe/src/hooks/useSocket.jsx](fe/src/hooks/useSocket.jsx#L1-L80)
  - `fe/src/pages/Dashboard.jsx` — UI realtime và device control: [fe/src/pages/Dashboard.jsx](fe/src/pages/Dashboard.jsx#L170-L340)
  - `fe/src/services/baseApi.js` — axios instance & interceptors: [fe/src/services/baseApi.js](fe/src/services/baseApi.js#L1-L80)

---

## Giải thích chi tiết + vì sao thiết kế như vậy

1) Telemetry

- Cách hoạt động (code-level): `mqttClient.on('message', ...)` parse JSON → `extractSensorReadings` (hỗ trợ cả payload dạng { sensor, value } và batch key:value) → gọi `persistSensorReading` → `insertSensorData` (tạo id bằng `randomUUID()` và dùng `toMySqlDateTime`) → sau khi insert backend gọi `emitSensorUpdate` gửi sự kiện `sensor_update` cho tất cả client socket.
- Vì sao: lưu vào DB để giữ lịch sử đầy đủ (cho chart, pagination, search) và emit realtime để UI phản hồi nhanh. Thiết kế này đơn giản, dễ hiểu và phù hợp với khối lượng thấp/trung bình.
- Hạn chế: viết trực tiếp vào DB trong luồng xử lý MQTT có thể gây bottleneck nếu thiết bị gửi dữ liệu với tần suất cao. Không có batching hay backpressure.

2) Control (send-and-wait)

- Cách hoạt động: Controller xây command dựa trên `device.name` → ghi `action_history` (status `waiting`) → gọi `sendCommandAndWaitWithReconnect` (chắc chắn kết nối MQTT, publish, sau đó chờ `waitForDeviceState` resolve dựa trên `latestDeviceStatus` và `pendingStatusWaiters`). Nếu success → cập nhật `devices.value` và `action_history.status='success'`, nếu timeout/error → set status `failed`.
- Vì sao: UX mong muốn là client nhận ngay kết quả thao tác (thành công/thất bại). Dùng cơ chế chờ ack giúp thông báo chính xác cho người dùng.
- Hạn chế: endpoint HTTP bị block trong thời chờ (tối đa vài giây) → khó scale nếu nhiều concurrent control requests; phụ thuộc vào tính ổn định của MQTT/hardware; việc chờ sync trong process chính làm tăng độ phức tạp.

3) Sync

- Mô tả: Khi kết nối MQTT mới hoặc phát hiện hardware activity, backend đồng bộ trạng thái devices từ DB ra hardware bằng cách publish lần lượt từng command (có sleep nhỏ giữa các publish). Mục tiêu giữ consistency giữa DB và HW.

---

## Đề xuất cải tiến (ưu tiên)

1. Short-term (ít thay đổi, ít rủi ro)
  - Thêm validation payload MQTT trước khi persist (ví dụ schema + `ajv`).
  - Thêm logging/metrics quanh: inserts/sec, mqtt publish failures, pending waiters count.
  - Tăng timeout hiện rõ và trả status 202/timeout message rõ ràng cho client nếu muốn tránh block lâu.

2. Medium-term (thay đổi kiến trúc nhẹ)
  - Tách write-heavy path: buffer/batch inserts (ví dụ collect N readings hoặc theo thời gian rồi insert batch) hoặc push vào queue (e.g., Redis Stream / RabbitMQ) và xử lý bởi worker để không block MQTT handler.
  - Control: chuyển model trả kết quả sang async pattern: API trả `202 Accepted` + `action_history.id`, FE nhận kết quả qua `device_status_update` socket khi operation hoàn tất.
  - Dùng topic per-device: `device/{id}/control` & `device/{id}/status` để dễ debug và giảm collision.

3. Long-term (scale & reliability)
  - Dùng time-series DB (InfluxDB / TimescaleDB) cho telemetry nếu volume lớn.
  - Dùng message queue để xử lý control/retry (đặc biệt nếu cần đảm bảo ordering & retry logic phức tạp).
  - Sử dụng MQTT TLS + client auth, và cân nhắc QoS 1/2 cho các message control quan trọng.

---

## Kết luận & bước tiếp theo (tuỳ chọn)

- Tôi đã tạo bản tóm tắt này để bạn có thể nắm nhanh kiến trúc, luồng và các file/dòng quan trọng.
- Nếu bạn muốn tôi có thể tiếp tục với một trong các bước sau (chọn 1):
  - Tạo sơ đồ Mermaid cho 2–3 luồng chính (telemetry & control).
  - Tạo PR mẫu để tách việc persist sensor sang worker queue (prototype code + tests).
  - Viết checklist để harden MQTT (TLS, QoS, authentication) và thêm unit tests cho `mqttService`.

---

File này được tạo tự động bởi công cụ hỗ trợ phát triển; nếu cần mở rộng chi tiết vào từng hàm, tôi sẽ bổ sung.
