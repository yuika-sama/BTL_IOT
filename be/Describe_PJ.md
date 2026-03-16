# Tài liệu Thiết kế Cơ sở dữ liệu (ERD) - Dự án IoT Smart Home

## 1. Tổng quan hệ thống

Hệ thống sử dụng cơ sở dữ liệu MySQL để lưu trữ cấu hình thiết bị, dữ liệu cảm biến thời gian thực, lịch sử thao tác và các cảnh báo hệ thống. Tất cả các bảng đều sử dụng CHAR(36) cho khóa chính (id) để hỗ trợ định dạng UUID.

## 2. Chi tiết các bảng (Entities)

### 2.1. Bảng devices (Thiết bị đầu ra)

Định nghĩa các thiết bị chấp hành trên mạch (ví dụ: Đèn LED, Quạt, Máy bơm).

* **id**: Khóa chính (UUID).
* **name**: Tên thiết bị
* **status**: Trạng thái hiển thị (ví dụ: "active", "inactive").
* **auto\_toggle**: Chế độ tự động (1: Bật chế độ tự động dựa trên cảm biến, 0: Điều khiển tay).
* **value**: Trạng thái vật lý hiện tại (1: ON, 0: OFF).
* **created\_at**: Thời điểm khởi tạo thiết bị.

### 2.2. Bảng sensors (Cảm biến)

Định nghĩa các loại cảm biến có trên mạch và các ngưỡng an toàn.

* **id**: Khóa chính (UUID).
* **device\_id**: Khóa ngoại liên kết với bảng devices (Nếu cảm biến gắn liền với thiết bị cụ thể).
* **name**: Tên cảm biến (ví dụ: "Temperature", "Humidity", "Gas").
* **unit**: Đơn vị đo (ví dụ: "°C", "%", "ppm").
* **threshold\_min**: Ngưỡng dưới (Dùng để kích hoạt cảnh báo).
* **threshold\_max**: Ngưỡng trên (Dùng để kích hoạt cảnh báo).
* **created\_at**: Thời điểm khởi tạo cảm biến trong hệ thống.

### 2.3. Bảng data\_sensors (Dữ liệu đo đạc)

Lưu trữ giá trị đo được từ các cảm biến theo thời gian thực.

* **id**: Khóa chính (UUID).
* **sensor\_id**: Khóa ngoại liên kết với bảng sensors.
* **value**: Giá trị đo được (Kiểu số thực FLOAT).
* **created\_at**: Thời điểm ghi nhận dữ liệu (Thời gian thực).

### 2.4. Bảng action\_history (Lịch sử thao tác)

Ghi lại mọi hành động bật/tắt thiết bị để phục vụ việc kiểm soát và truy vết.

* **id**: Khóa chính (UUID).
* **device\_id**: Khóa ngoại liên kết với bảng devices.
* **command**: Lệnh đã thực hiện (ví dụ: "TEMP\_ON", "ALL\_OFF").
* **executor**: Người thực hiện (ví dụ: "User\_Admin", "System\_Auto").
* **status**: Trạng thái lệnh (ví dụ: "Success", "Failed").
* **created\_at**: Thời điểm thực hiện thao tác.

### 2.5. Bảng alerts (Cảnh báo)

Lưu trữ các thông báo khi dữ liệu cảm biến vượt ngưỡng (threshold\_min/threshold\_max).

* **id**: Khóa chính (UUID).
* **sensor\_id**: Liên kết với cảm biến gây ra cảnh báo.
* **device\_id**: Liên kết với thiết bị liên quan (nếu có).
* **title**: Tiêu đề cảnh báo (ví dụ: "Nhiệt độ quá cao").
* **description**: Nội dung chi tiết cảnh báo.
* **severity**: Mức độ nghiêm trọng (ví dụ: "Warning", "Critical").
* **created\_at**: Thời điểm xảy ra cảnh báo.

---

## 3. Mối quan hệ giữa các bảng (Relationships)

* **Devices - Sensors (1:N)**: Một thiết bị (board điều khiển) có thể quản lý nhiều cảm biến.
* **Sensors - Data\_sensors (1:N)**: Một cảm biến sẽ sinh ra nhiều bản ghi dữ liệu theo thời gian.
* **Devices - Action\_history (1:N)**: Một thiết bị có thể có nhiều lượt thao tác điều khiển được lưu lại.
* **Sensors/Devices - Alerts (1:N)**: Khi cảm biến hoặc thiết bị có vấn đề, hệ thống sẽ sinh ra nhiều bản ghi cảnh báo liên quan.

---

## 4. Luồng dữ liệu chính trong dự án

* **Luồng ghi dữ liệu**: ESP32 gửi MQTT -> Backend nhận sensor/data -> Insert vào data\_sensors.
* **Luồng cảnh báo**: Backend nhận dữ liệu -> So sánh với threshold\_min/max trong bảng sensors -> Nếu vượt ngưỡng, Insert vào bảng alerts.
* **Luồng điều khiển**: Người dùng nhấn nút trên Web -> Socket.io gửi lệnh tới Backend -> Backend gửi MQTT tới Hardware -> Nếu thành công, ghi log vào action\_history và cập nhật value trong bảng devices.
* **Luồng đồng bộ (Sync)**: ESP32 gửi device/sync khi khởi động -> Backend Query bảng devices -> Gửi lệnh điều khiển tương ứng để phục hồi trạng thái mạch.
