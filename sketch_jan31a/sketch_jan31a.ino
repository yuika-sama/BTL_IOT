#include "DHT.h"

// --- 1. KHAI BÁO CHÂN SENSOR ---
#define DHT_PIN         14    // D14: Đọc DHT
#define DHT_TYPE        DHT11

#define LDR_PIN         13    // D13: Đọc LDR (Analog)

#define GP2Y_LED_PIN    5     // D5: Điều khiển LED trong cảm biến bụi
#define GP2Y_ANALOG_PIN 39    // VN (GPIO 39): Đọc Analog bụi (Chỉ Input)

// --- 2. KHAI BÁO CHÂN LED HIỂN THỊ ---
#define LED_DHT_PIN     21    // D21: Báo trạng thái DHT
#define LED_LDR_PIN     22    // D22: Báo trạng thái LDR
#define LED_DUST_PIN    23    // D23: Báo trạng thái Bụi

// --- 3. BIẾN & ĐỐI TƯỢNG ---
DHT dht(DHT_PIN, DHT_TYPE);

// Hàm đọc bụi chuẩn Sharp
float readDust() {
  digitalWrite(GP2Y_LED_PIN, LOW); // Bật LED hồng ngoại
  delayMicroseconds(280);
  
  int raw = analogRead(GP2Y_ANALOG_PIN);
  
  delayMicroseconds(40);
  digitalWrite(GP2Y_LED_PIN, HIGH); // Tắt LED
  delayMicroseconds(9680);
  
  // Tính toán
  float voltage = raw * (3.3 / 4095.0);
  float dust = (0.17 * voltage - 0.1) * 1000;
  if (dust < 0) dust = 0;
  return dust;
}

void setup() {
  Serial.begin(115200);

  // Cấu hình chân LED (Output)
  pinMode(LED_DHT_PIN, OUTPUT);
  pinMode(LED_LDR_PIN, OUTPUT);
  pinMode(LED_DUST_PIN, OUTPUT);

  // Cấu hình chân Cảm biến
  pinMode(LDR_PIN, INPUT);
  pinMode(GP2Y_LED_PIN, OUTPUT);
  pinMode(GP2Y_ANALOG_PIN, INPUT);

  // Khởi động DHT
  dht.begin();

  // Test nháy tất cả LED 1 lần để báo khởi động xong
  digitalWrite(LED_DHT_PIN, HIGH);
  digitalWrite(LED_LDR_PIN, HIGH);
  digitalWrite(LED_DUST_PIN, HIGH);
  delay(1000);
  digitalWrite(LED_DHT_PIN, LOW);
  digitalWrite(LED_LDR_PIN, LOW);
  digitalWrite(LED_DUST_PIN, LOW);

  Serial.println("--- START SYSTEM TEST ---");
  Serial.println("Temp(C) | Hum(%) | Light(Raw) | Dust(ug/m3)");
}

void loop() {
  // --- A. TEST DHT ---
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  
  if (isnan(t) || isnan(h)) {
    Serial.print("DHT Error | ");
    digitalWrite(LED_DHT_PIN, LOW); // Lỗi thì tắt LED
  } else {
    Serial.print("T:"); Serial.print(t, 1);
    Serial.print(" H:"); Serial.print(h, 0); 
    Serial.print(" | ");
    // Đọc OK -> Nháy LED DHT
    digitalWrite(LED_DHT_PIN, HIGH);
  }

  // --- B. TEST LDR ---
  int ldrVal = 4095 - analogRead(LDR_PIN);
  Serial.print("LDR:"); Serial.print(ldrVal); Serial.print(" | ");
  // Đọc OK -> Nháy LED LDR
  digitalWrite(LED_LDR_PIN, HIGH);

  // --- C. TEST DUST ---
  float dustVal = readDust();
  Serial.print("Dust:"); Serial.print(dustVal, 1);
  // Đọc OK -> Nháy LED Dust
  digitalWrite(LED_DUST_PIN, HIGH);

  Serial.println(); // Xuống dòng

  // Giữ đèn sáng 200ms cho mắt kịp nhìn thấy
  delay(200); 

  // Tắt hết LED để chuẩn bị cho lần đo sau (tạo hiệu ứng nháy)
  digitalWrite(LED_DHT_PIN, LOW);
  digitalWrite(LED_LDR_PIN, LOW);
  digitalWrite(LED_DUST_PIN, LOW);

  // Đợi 2 giây đo tiếp
  delay(2000);
}