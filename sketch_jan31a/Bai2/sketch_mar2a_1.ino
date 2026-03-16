#include "DHT.h"
#include <GP2YDustSensor.h> 

// --- CẤU HÌNH PIN SENSOR ---
#define PIN_SENSOR_DO   32  
#define PIN_SENSOR_AO   36 

#define PIN_DHT_DATA    14
#define PIN_DUST_LED    5
#define PIN_DUST_IN     34

// --- CẤU HÌNH LED ---
#define PIN_LED_TEMP    21 
#define PIN_LED_HUM     19
#define PIN_LED_LDR     22
#define PIN_LED_DUST    23

// Khởi tạo đối tượng cảm biến
DHT dht(PIN_DHT_DATA, DHT11);
GP2YDustSensor dustSensor(GP2YDustSensorType::GP2Y1010AU0F, PIN_DUST_LED, PIN_DUST_IN);

unsigned long previousTime = 0;
const long interval = 1000;

void setup() {
  Serial.begin(115200);
  
  // Khởi động các cảm biến
  dht.begin();
  dustSensor.begin();
  
  pinMode(PIN_SENSOR_DO, INPUT);
  pinMode(PIN_SENSOR_AO, INPUT);

  // Setup các chân LED
  pinMode(PIN_LED_TEMP, OUTPUT);
  pinMode(PIN_LED_HUM, OUTPUT);
  pinMode(PIN_LED_LDR, OUTPUT);
  pinMode(PIN_LED_DUST, OUTPUT);

  // Đảm bảo tắt đèn lúc mới cấp điện
  digitalWrite(PIN_LED_TEMP, LOW);
  digitalWrite(PIN_LED_HUM, LOW);
  digitalWrite(PIN_LED_LDR, LOW);
  digitalWrite(PIN_LED_DUST, LOW);
}

void loop() {
  unsigned long currentTime = millis();

  if (currentTime - previousTime >= interval) {
    previousTime = currentTime;

    // --- 1. BẬT ĐÈN ---
    digitalWrite(PIN_LED_TEMP, HIGH);
    delay(200);
    digitalWrite(PIN_LED_DUST, HIGH);
    delay(200);
    digitalWrite(PIN_LED_HUM, HIGH);
    delay(200);
    digitalWrite(PIN_LED_LDR, HIGH);
    delay(200);

    // --- 2. ĐỌC DỮ LIỆU CẢM BIẾN ---
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    
    int sensorAnalogVal = 4095 - analogRead(PIN_SENSOR_AO); 
    
    float dustVal = dustSensor.getDustDensity(); 

    if (isnan(t) || isnan(h)) { t = 0; h = 0; }

    // --- 3. IN RA SERIAL ---
    Serial.print("T: "); Serial.print(t);
    Serial.print(" | H: "); Serial.print(h);
    Serial.print(" | L: "); Serial.print(sensorAnalogVal);
    Serial.print(" | Dust: "); Serial.println(dustVal);

    // --- 4. CHỜ 0.1S RỒI TẮT ĐÈN ---
    delay(200); 

    digitalWrite(PIN_LED_TEMP, LOW);
    delay(200);
    digitalWrite(PIN_LED_DUST, LOW);
    delay(200);
    digitalWrite(PIN_LED_HUM, LOW);
    delay(200);
    digitalWrite(PIN_LED_LDR, LOW);
    delay(200);
  }
}