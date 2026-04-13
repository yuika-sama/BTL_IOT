# Sơ Đồ Phần Cứng: ESP32 IoT Sensor Controller

## 1. Tổng Quan Kết Nối

```
                    ┌─────────────────────────────────────┐
                    │       ESP32 DEVKIT V1               │
                    │   (30 pins, 3.3V logic)             │
                    └─────────────┬───────────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
         │                   5V INPUT                      │
         │            (from USB or 5V adapter)            │
         │                        │                        │
    ┌────▼─────┐            ┌─────▼─────┐          ┌──────▼──────┐
    │  DHT11   │            │  MQ-4 Sensor    │  │ LDR Circuit  │
    │(Temp/Hum)│            │  Board          │  │ (Light)      │
    └─────┬────┘            └────────┬────────┘  └─────┬────────┘
          │                          │                  │
    ┌─────┴────────┬─────────────────┼──────────────────┴─────────┐
    │              │                 │                            │
 PIN14        PIN39,PIN5         PIN36                       GND (0V)
 (Signal)     (Analog,Digital)   (Analog)
    │              │                 │
    └──────┬───────┴─────────────────┴────────────────────────────┘
           │
      ┌────▼─────────────────────────────────────────────────────┐
      │          4x LED Outputs (GPIO)                           │
      │  PIN21 → LED_TEMP                                        │
      │  PIN19 → LED_HUM                                         │
      │  PIN22 → LED_LDR                                         │
      │  PIN23 → LED_GAS                                         │
      └────────────────────────────────────────────────────────┘
```

---

## 2. ESP32 DevKit Pinout Details

### 2.1 Pin Assignment Table

```
┌─────────┬──────────────┬──────────────┬──────────────────────────┐
│ Pin No. │ GPIO Label   │ Function     │ Used For                 │
├─────────┼──────────────┼──────────────┼──────────────────────────┤
│ 14      │ GPIO14       │ Digital I/O  │ DHT11 Data Signal        │
│ 5       │ GPIO5        │ Digital I/O  │ MQ-4 Digital Output      │
│ 36      │ GPIO36/ADC1  │ Analog Input │ LDR Analog Input         │
│ 39      │ GPIO39/ADC1  │ Analog Input │ MQ-4 Analog Input        │
│ 21      │ GPIO21       │ Digital Out  │ LED Temperature          │
│ 19      │ GPIO19       │ Digital Out  │ LED Humidity             │
│ 22      │ GPIO22       │ Digital Out  │ LED Light                │
│ 23      │ GPIO23       │ Digital Out  │ LED Gas                  │
├─────────┼──────────────┼──────────────┼──────────────────────────┤
│ GND     │ GND          │ Ground Ref   │ All signals return here  │
│ 5V      │ 5V (VBUS)    │ Power supply │ From USB or external     │
│ 3V3     │ 3.3V         │ Logic supply │ ESP32 core voltage       │
└─────────┴──────────────┴──────────────┴──────────────────────────┘

Key Notes:
- ADC1_0 = GPIO36 (PIN_SENSOR_AO) - LDR
- ADC1_3 = GPIO39 (PIN_MQ4_A0)   - MQ-4
- GPIO14 = PIN_DHT_DATA - DHT11
- GPIO5 = PIN_MQ4_D0 - MQ-4 Digital threshold alert
- GPIO21, 19, 22, 23 = LED control outputs (HIGH=ON, LOW=OFF)
```

---

## 3. Detailed Component Wiring

### 3.1 DHT11 Cảm Biến Nhiệt Độ & Độ Ẩm

```
              DHT11 Sensor Module
              ┌─────────┐
              │  DHT11  │
              └┬───┬────┬┘
               │   │    │
              VCC DATA GND
               │   │    │
        [4.7kΩ Pull-up]
               │   │    │
           ┌───▼───┴────┴──────────────┐
           │                            │
          5V                         GND (0V)
         (ESP32 5V)             (ESP32 GND)
                        ▲
                        │
                     PIN 14 (GPIO14)
                   Data Signal IN
                        
Wiring Diagram:
┌────────────┐
│   ESP32    │
│  ┌──────┐  │
│  │ GND  ├──┼──◀─── GND (Black wire)
│  │ PIN14├──┼──◀─── DATA (Yellow wire)
│  │  5V  ├──┼──◀─── VCC (Red wire)
│  └──────┘  │
└────────────┘
     ▲
     │ Pull-up Resistor (4.7kΩ)
     │  ┌──────────┐
     └──┤ ├ 4.7kΩ  │
        └──────────┘
        Connected between PIN14 & 5V

Component Specs:
- Operating Voltage: 3.3V to 5.5V
- Humidity Range: 20-90% RH (±5% accuracy)
- Temperature Range: 0-50°C (±2°C accuracy)
- Sampling Period: Min 2 seconds
- Power Consumption: ~500µA (active), 100µA (idle)
```

**Bill of Materials for DHT11**:
- 1x DHT11 Sensor Module (or bare sensor with capacitor)
- 1x 4.7kΩ Resistor (pull-up for data line)

---

### 3.2 MQ-4 Cảm Biến Khí Gas (Methane)

#### Analog Signal Path (PIN 39)

```
                MQ-4 Sensor Board
              ┌──────────────┐
              │    MQ-4      │
              │   Chip       │
              └──────────────┘
                      │
            ┌─────────┼─────────┐
            │         │         │
           A0        D0        GND
        (Analog)  (Digital)   (Power)
            │         │         │
            │         │         │
    ┌───────┼─────────┼─────────┼────┐
    │   MQ-4 Sensor Board            │
    │  ┌────┐  ┌────┐  ┌────┐  ┌──┐ │
    │  │ A0 ├──┤ D0 ├──┤VCC ├──┤GND│ │
    │  └────┘  └────┘  └────┘  └──┘ │
    └───┬──────────────┬───────┬─────┘
        │              │       │
        │              │       └─────── GND
        │              │               (0V, Black)
        │              │
        │         PIN 5 (GPIO5)
        │    Digital Threshold Alert
        │
    PIN 39 (GPIO39/ADC1_3)
    Analog Sensor Output

Voltage Divider Inside Sensor Board:
┌──────┐
│  5V  │  (+) Power supply
└──┬───┘
   │
   ├──[R_series]──┬──→ A0 (to PIN39)
   │              │
   │            [R_sensor] 
   │              │      ← Changes with gas concentration
   │              │
   └──────────────┴──→ GND (0V)

Digital Output Behavior:
- Threshold level set by potentiometer on sensor board
- D0 = HIGH (3.3V) when below threshold (no gas)
- D0 = LOW (0V) when above threshold (gas detected)
```

**ESP32 ADC Conversion**:
```cpp
int raw_adc = analogRead(PIN_MQ4_A0);  // Returns 0-4095 (12-bit)

// ADC Conversion:
// 0 ADC     → 0.0V  (all gas detected)
// 4095 ADC  → ~3.3V (no gas)

// Formula in code:
int gas_analog = (1.0 - (raw_adc / 10000.0)) * 100.0;
// Note: divisor is 10000, not 4095 (may need adjustment)

// Example readings:
// raw = 0    → gas = 100%  (maximum gas)
// raw = 5000 → gas = 50%   
// raw = 4095 → gas ≈ -9%   (no gas, negative means needs calibration)
```

**Bill of Materials for MQ-4**:
- 1x MQ-4 Sensor Module (pre-built with board)
- Sensor board includes: load resistor, filtering cap, potentiometer

---

### 3.3 LDR 光センサー (Light Sensor)

#### Voltage Divider Configuration

```
                    5V Power Supply
                         │
                         │
                    ┌────┴────┐
                    │ [R_1]   │  (Fixed resistor, typically 10kΩ)
                    │  10kΩ   │
                    └────┬────┘
                         │
                    PIN36 (GPIO36/ADC1_0)
                        ▲
                        │ Analog Input
                    ┌────┴────┐
                    │  [R_2]  │  (LDR - Light Dependent Resistor)
                    │   LDR   │  
                    │         │  ← Resistance changes with light
                    └────┬────┘
                         │
                        GND (0V)

Voltage Divider Formula:
V_out = V_in × R_2 / (R_1 + R_2)

Where:
- V_in = 5V
- R_1 = 10kΩ (fixed)
- R_2 = LDR resistance (varies with light)

Light Conditions:
┌──────────────┬─────────────┬──────────────┬─────────────┐
│ Light Level  │ LDR Resist. │ V_out        │ ADC Value   │
├──────────────┼─────────────┼──────────────┼─────────────┤
│ Bright (direct sun) │ ~500Ω   │ ~0.2V        │ 100-200    │
│ Normal indoor       │ ~5kΩ    │ ~0.7V        │ 500-700    │
│ Dim (low light)     │ ~50kΩ   │ ~3.0V        │ 2400-3000  │
│ Dark (no light)     │ ~100kΩ  │ ~3.3V        │ ~4095      │
└──────────────┴─────────────┴──────────────┴─────────────┘

ESP32 ADC Reading:
┌────────────────────────────────────────────┐
│  Voltage Input        ADC Value             │
│  0V ────────────────→ 0                     │
│  1.65V ──────────────→ 2048                 │
│  3.3V ────────────────→ 4095                │
│  5V ────────────────→ (out of range)        │
└────────────────────────────────────────────┘

⚠️  WARNING: ADC max is 3.3V! Voltage divider needed.
    Without divider, 5V input would damage GPIO36.

Code Usage:
float raw_adc = analogRead(PIN_SENSOR_AO);  // 0-4095
float light_percent = (1.0 - (raw_adc / 4095.0)) * 100.0;
// Maps: 0 ADC → 100% (bright), 4095 ADC → 0% (dark)
```

**Bill of Materials for LDR**:
- 1x LDR (Light Dependent Resistor) - common part
- 1x 10kΩ Resistor (1/4W, 5% tolerance)
- Wiring to sensor board or breadboard

---

### 3.4 LED Indicators (4x)

```
For each LED (4 identical circuits):

    GPIO Output (3.3V max from ESP32)
           │
        PIN 21┐  PIN 19┐  PIN 22┐  PIN 23┐
           │      │       │       │
           │      │       │       │
    ┌──────▼──────▼───────▼───────▼──────┐
    │                                     │
    │     ┌─────────────────────────┐    │
    │     │  4x LED Control Circuit │    │
    │     └─────────────────────────┘    │
    │                                     │
    │  ┌─────────────────────────────┐   │
    │  │ GPIO21 (TEMP_LED)        ┌──┐  │
    │  │  ──────[330Ω]────[LED]──┤ ├─┴──→ GND
    │  │                          └──┘    │
    │  │ GPIO19 (HUM_LED)         ┌──┐  │
    │  │  ──────[330Ω]────[LED]──┤ ├─┴──→ GND
    │  │                          └──┘    │
    │  │ GPIO22 (LDR_LED)         ┌──┐  │
    │  │  ──────[330Ω]────[LED]──┤ ├─┴──→ GND
    │  │                          └──┘    │
    │  │ GPIO23 (GAS_LED)         ┌──┐  │
    │  │  ──────[330Ω]────[LED]──┤ ├─┴──→ GND
    │  │                          └──┘    │
    │  └─────────────────────────────┘   │
    │                                     │
    └─────────────────────────────────────┘

Detailed LED Circuit (for each pin):

     ESP32 GPIO (3.3V logic)
              │
          ┌───┴───┐
          │GPIO21 │ ← Pin in HIGH state = 3.3V
          └───┬───┘
              │
          [330Ω]            ← Current Limiting Resistor
              │              (Prevents LED burnout)
              │
          ┌───┴───┐
          │ ◇─◇   │ ← LED (typically red, 2V forward voltage)
          └───┬───┘
              │
             GND (0V, Black wire)

Current Calculation:
I = (V_gpio - V_led) / R
I = (3.3V - 2.0V) / 330Ω
I ≈ 4mA ← Safe for ESP32 GPIO (max 20mA per pin)

Resistor Selection:
For LED forward voltage ≈ 2V:
- R_needed = (3.3V - 2.0V) / I_desired
- For I = 5mA: R = 260Ω → Use 330Ω (next standard value)
- For I = 10mA: R = 130Ω → Use 150Ω

LED Logic:
GPIO HIGH (3.3V) → 4mA flows → LED lights
GPIO LOW (0V)    → No current → LED off

Code:
digitalWrite(PIN_LED_TEMP, HIGH);   // LED ON
digitalWrite(PIN_LED_TEMP, LOW);    // LED OFF
```

**Bill of Materials for LEDs**:
- 4x LED (5mm, red or any color) - 2V forward voltage
- 4x 330Ω Resistor (1/4W, 5% tolerance)
- Optional: 4x NPN transistor (2N2222) if higher current needed

---

## 4. Complete Breadboard Wiring Layout

```
                    ┌─────────────────────────────────────────┐
                    │        5V Rail (Red)                    │
                    │ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ │
                    ├─────────────────────────────────────────┤
                    │        GND Rail (Black)                 │
                    │ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ │
                    └─────────────────────────────────────────┘

Row 1-10 (Sensor Connections):
┌───┬────────────────────────────────────────────────────────┬───┐
│   │ a  b  c  d  e  f │ g  h  i  j  k  l  m  n  o  p      │   │
├───┼────────────────────────────────────────────────────────┼───┤
│1  │DHT│  │  │ ◇  ◇  │ ◇  ◇  ◇  ◇  ◇  GND                  │5V │ ← VCC (+)
│2  │GND│  │  │    4.7k     │  ◇  ◇  ◇  ◇  ◇  ◇             │GND│ ← GND (-)
│3  │   │  │  │         ◇  │ PIN14(DHT)                      │   │
│4  │ MQ-4 Sensor Board                                      │   │
│5  │ A0 ──────── 39(GPIO39/ADC)                            │ 5V │
│6  │ D0 ──────── 5(GPIO5/Digital)                          │GND │
│7  │       GND ────→ GND Rail                              │   │
│   │                                                        │   │
│8  │ LDR Circuit: 10kΩ from 5V to PIN36, LDR to GND       │ 5V │
│9  │         PIN 36 (GPIO36/ADC) ──┬── 10kΩ ──┐            │GND │
│10 │                              LDR           │            │   │
│   │                               ──────→ GND              │   │
├───┼────────────────────────────────────────────────────────┼───┤
│   │Lead Placement:                                        │   │
│   │ - Keep short wires (< 5cm)                            │   │
│   │ - Avoid long jumpers for analog signals (noise)       │   │
│   │ - Keep analog (PIN36, PIN39) away from PWM signals    │   │
│   │ - Use separate GND pins for power and signals         │   │
└───┴────────────────────────────────────────────────────────┴───┘

LED Section (Rows 15-20):
┌───┬────────────────────────────────────────────────────────┬───┐
│15 │PIN21 ──[330Ω]──[LED]── GND (TEMP)                    │ 5V │
│16 │PIN19 ──[330Ω]──[LED]── GND (HUM)                     │GND │
│17 │PIN22 ──[330Ω]──[LED]── GND (LDR)                     │   │
│18 │PIN23 ──[330Ω]──[LED]── GND (GAS)                     │ 5V │
│   │                                                        │GND │
│19 │ (4 identical LED circuits arranged vertically)        │   │
└───┴────────────────────────────────────────────────────────┴───┘

Legend:
◇     = Both/hole on breadboard
─     = Wire jumper connection
[330Ω] = Resistor (show value and orientation)
[LED]  = LED (long leg to +, short leg to -)
GND    = Connected to ground rail
5V     = Connected to 5V power rail
PIN14, PIN39, etc = ESP32 pin numbers
```

---

## 5. Power Distribution Scheme

```
External Power Source
        │
    ┌───┴─────┐
    │ 5V/1A+  │  USB-C or Micro-USB or 5V adapter
    │ GND     │
    └───┬─────┘
        │
        ├──[Schottky Diode]──┐  (Optional protection)
        │                    │
        ▼                    ▼
    ┌───────────┐
    │ ESP32 VCC │ ← 5V input
    │ GND       │ ← Ground reference
    └─────┬─────┘
          │
          ├─ Internal 3.3V regulator (on DevKit)
          │  ↓
          ├─ 3.3V logic supply (GPIO, ADC)
          │
          └─ 5V rail supply
             ├─ DHT11 VCC
             ├─ MQ-4 VCC (through sensor board)
             ├─ LDR voltage divider
             └─ Potential LED power (if high current)

Decoupling Capacitors (Recommended):
┌─────────────────────────────────────────┐
│ Components to add for stability:        │
│                                         │
│ 1. 100µF Electrolytic Cap               │
│    ├─ Across 5V to GND                  │
│    └─ Near ESP32 VCC pin                │
│                                         │
│ 2. 0.1µF Ceramic Cap (x4)               │
│    ├─ Near each analog sensor VCC       │
│    └─ DHT11, MQ-4, LDR inputs           │
│                                         │
│ 3. 1µF Film Cap                         │
│    └─ LDR divider output (optional,     │
│       for noise filtering)              │
└─────────────────────────────────────────┘

Current Budget:
┌────────────────────┬──────────┬──────────┐
│ Component          │ Typical  │ Max      │
├────────────────────┼──────────┼──────────┤
│ ESP32 core         │ 80mA     │ 160mA    │
│ WiFi active        │ 100mA    │ 240mA    │
│ DHT11 sensor       │ 0.5mA    │ 2.5mA    │
│ MQ-4 sensor        │ 150mA    │ 250mA    │
│ 4x LEDs (active)   │ 20mA     │ 40mA     │
├────────────────────┼──────────┼──────────┤
│ TOTAL (normal)     │ 350mA    │ ~1A      │
│ With WiFi burst    │ ~500mA   │ ~1.5A    │
└────────────────────┴──────────┴──────────┘

⚠️  Power Recommendation:
- USB 5V at least 1A capable
- Or 5V adapter 2A+ for reliability
- Avoid cheap USB cables (voltage drop)
```

---

## 6. Signal Integrity Notes

### 6.1 Analog Signal Protection

```
Noise Sources & Solutions:

1. DHT11 Data Line (PIN 14):
   ├─ Problem: Single-wire digital can be sensitive at distance
   ├─ Solution: 
   │  ├─ 4.7kΩ pull-up resistor (as in current design) ✓
   │  └─ Keep wire < 50cm
   └─ Additional: Add 10nF cap between DATA and GND (optional)

2. MQ-4 Analog (PIN 39):
   ├─ Problem: 0-4095 ADC reading from sensor with 5V swing
   ├─ Solution:
   │  ├─ Use ESP32 internal ADC with averaging
   │  ├─ Average 10+ samples before using value
   │  └─ Keep wire from sensor < 20cm
   └─ Current code risk: No averaging → noisy readings

3. LDR Analog (PIN 36):
   ├─ Problem: Voltage divider output varies 0.2V to 3.3V
   ├─ Solution:
   │  ├─ 10kΩ resistor selection minimizes noise
   │  └─ Optional 1µF cap parallel to LDR for smoothing
   └─ Code improvement: Add moving average filter

4. LED Switching Noise:
   ├─ When LEDs turn on, they create voltage spikes
   ├─ Solution: Keep LED circuits separate from sensor circuits
   │  ├─ Use different GND paths if possible
   │  └─ Or add 100µF cap on 5V rail for dampening
   └─ Current design: OK (no high-speed switching)

Recommended ADC Averaging Firmware:
┌─────────────────────────────────────────┐
│ void readAnalogSmoothed(int pin) {      │
│   int sum = 0;                          │
│   for (int i = 0; i < 10; i++) {        │
│     sum += analogRead(pin);             │
│   }                                     │
│   return sum / 10;  // Average          │
│ }                                       │
└─────────────────────────────────────────┘
```

### 6.2 GND Star Point Configuration

```
Best Practice: Single Primary GND Point

┌─────────────────────────────────────────┐
│         Primary GND Star Point           │
│       (On Breadboard or PCB)             │
│                                          │
│            ┌────────────────┐            │
│            │  GND Common    │            │
│            │  Junction ★    │            │
│            └────┬───────────┘            │
│                │                        │
│     ┌──────────┼──────────┬─────┐      │
│     │          │          │     │      │
│  GND-ESP32  GND-Sensors GND-LEDs GND-PS│
│     │          │          │     │      │
│  (Pin)      (VCC-) from Power Supply    │
│                                          │
│ Benefit: Avoids ground loops            │
│          Reduces noise coupling         │
└─────────────────────────────────────────┘

Current Design: Uses single GND rail ✓
```

---

## 7. Component Shopping List

### Core Components

| Qty | Component | Spec | Notes |
|-----|-----------|------|-------|
| 1 | ESP32 DevKit | 30-pin, V1 or V2 | USB-C or Micro-USB |
| 1 | DHT11 | Temperature + Humidity | ~$2, 5-pin module |
| 1 | MQ-4 | Methane/Gas sensor | ~$3-5, pre-built board |
| 1 | LDR | GL5516 or equivalent | ~$0.50 |
| 1 | Resistor 4.7kΩ | 1/4W, 5% | DHT11 pull-up |
| 1 | Resistor 10kΩ | 1/4W, 5% | LDR voltage divider |
| 4 | Resistor 330Ω | 1/4W, 5% | LED current limiter |
| 4 | LED | 5mm red or any color | ~$0.10 each |
| 1 | Breadboard | 830 tie-points | Full-size preferred |
| 1 | Jumper wires | M-M assortment | 10+ pieces needed |
| 1 | USB Power | 5V/2A min | For ESP32 power |

### Optional Protection Components

| Qty | Component | Purpose |
|-----|-----------|---------|
| 1 | 100µF Cap | Power supply decoupling |
| 4 | 0.1µF Cap | Sensor VCC filtering |
| 1 | 1µF Cap | LDR output filtering |
| 4 | 2N2222 NPN | High-current LED drivers (if needed) |
| 1 | Schottky Diode | USB reverse polarity protection |

---

## 8. Assembly Instructions

### Step 1: Prepare ESP32 DevKit
```
1. Install USB driver (CH340 for most boards)
2. Verify COM port in Device Manager
3. Test with Arduino IDE: Upload simple sketch
4. Confirm 3.3V and GND are usable
```

### Step 2: Build DHT11 Module
```
      [5V Rail] ← Connect DHT VCC here
         │
    [4.7kΩ] ← Between 5V and PIN14
         │
      PIN14 ← Connect DHT DATA here
         │
    [GND] ← Connect DHT GND here
```

### Step 3: Connect MQ-4 Sensor
```
      [5V Rail] ← Sensor board VCC
         │
     PIN39 ← Sensor board A0 (analog)
     PIN5  ← Sensor board D0 (digital, optional)
         │
    [GND] ← Sensor board GND
```

### Step 4: Build LDR Voltage Divider
```
      [5V Rail]
         │
      [10kΩ]
         │
      PIN36 ← Tap here for ADC input
         │
       [LDR]
         │
      [GND]
```

### Step 5: Install LED Indicators
```
For each LED (4 total):
PIN21 → [330Ω] → [LED] → [GND]
PIN19 → [330Ω] → [LED] → [GND]
PIN22 → [330Ω] → [LED] → [GND]
PIN23 → [330Ω] → [LED] → [GND]

LED Polarity: Long leg (+) toward resistor, short leg (-) toward GND
```

### Step 6: Power Up Test
```
1. Connect 5V USB power to ESP32
2. Check for smoke/shorts ❌
3. Verify LEDs don't light up initially (GNIOs start LOW)
4. Check voltage on PIN39 ADC (should be ~1-3V from sensor)
5. Check voltage on PIN36 ADC (should change with light)
6. Monitor DHT11 output on PIN14 (requires logic analyzer or code)
```

### Step 7: Software Upload
```
1. Open Arduino IDE (or PlatformIO)
2. Configure board: ESP32 Dev Module
3. Load sketch_jan31a.ino
4. Select correct COM port
5. Upload (Ctrl+U or upload button)
6. Monitor Serial output (115200 baud)
7. Expected first message: "WiFi connecting..."
```

---

## 9. Troubleshooting Guide

### Visual Inspection Checklist

```
❑ Power connections:
  ❑ 5V wire (red) properly seated
  ❑ GND wire (black) properly connected
  ❑ No reversed polarity

❑ Data connections:
  ❑ PIN14 → DHT DATA with pull-up resistor visible
  ❑ PIN39 → MQ-4 A0 (short wire)
  ❑ PIN36 → LDR voltage divider (10kΩ resistor visible)

❑ GPIO connections:
  ❑ PIN21, 19, 22, 23 → LED resistors → LEDs
  ❑ LED long leg (anode) toward resistor
  ❑ LED short leg (cathode) toward GND

❑ Resistor values:
  ❑ Brown-Violet-Red = 470Ω? NO → Check
  ❑ Brown-Black-Green = 1MΩ? NO → Check
  ❑ Yellow-Violet-Red = 4700Ω (4.7k) ✓
  ❑ Brown-Black-Red = 1000Ω (1k)? → Check
```

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| No 3.3V output | Bad USB cable | Try different cable |
| DHT always NaN | Wrong pullup value | Verify 4.7kΩ |
| MQ-4 always 4095 | Sensor disconnected | Check PIN39 wire |
| LEDs always ON | GPIO stuck HIGH | Check code/boot |
| Noise on ADC | Long wires | Shorten < 20cm |
| Sensor values noisy | No averaging | Add firmware averaging |

---

## 10. Electrical Specifications Reference

### ESP32 GPIO Specifications
```
┌─────────────────────────────────────────┐
│ GPIO Electrical Characteristics          │
├─────────────────────────────────────────┤
│ Output HIGH Level (Voh):     2.5V - 3.3V│
│ Output LOW Level (Vol):      0V - 0.5V  │
│ Max Output Current:          20mA/pin   │
│ Total GPIO current (all):    40mA       │
│ Input HIGH voltage:          > 2.0V     │
│ Input LOW voltage:           < 1.0V     │
│ ADC reference voltage:       0 - 3.3V   │
│ ADC resolution:              12-bit     │
└─────────────────────────────────────────┘
```

### 5V Rail Maximum Rating
```
┌─────────────────────────────────────────┐
│ Safe Operating Limits                    │
├─────────────────────────────────────────┤
│ Input Voltage (absolute max):  5.5V     │
│ Above 5.5V → Risk of latch-up│
│                                         │
│ Recommended Input Range:      4.75-5.25V│
│ (USB 2.0 spec)                         │
│                                         │
│ Max Current Draw:             2A        │
│ (USB 5V bus typical limit)   │
└─────────────────────────────────────────┘
```

---

## 11. Design Review Checklist

| Aspect | Current Design | Status | Notes |
|--------|---|---|---|
| Power Supply | 5V from USB 1A+ | ✓ Adequate | Add ferrite if issues |
| Ground Reference | Single point | ✓ Good | Star-point implemented |
| Analog protection | No caps added | ❌ Optional | Recommend decoupling |
| Signal integrity | No shielding | ✓ OK for short distance | Keep wires < 50cm |
| Overcurrent protection | None | ⚠️ Risk | Consider polyfuse 1A |
| ESD protection | None | ⚠️ Risk | Handle carefully |
| Pull-up resistor | 4.7k on DHT | ✓ Correct | Value verified |

---

## 12. PCB Design Recommendations (Future)

If converting to PCB:

```
Layer Stack:
┌─────────────┐
│ Layer 1: Silkscreen (Labels)
├─────────────┤
│ Layer 2: Top Copper (Signals)
├─────────────┤
│ Layer 3: Ground Plane ← Critical!
├─────────────┤
│ Layer 4: Bottom Copper (Power)
└─────────────┘

Critical Design Rules:
- ADC traces away from switching signals
- GND plane as continuous as possible
- Separate analog and digital GND with one connection at source
- Via spacing: Min 8mil drill, 12mil pad
- Trace width: 12-20mil for signal, 40-60mil for power
```

---

**Hardware Documentation Status**: Complete  
**Last Updated**: 2026-04-05  
**Version**: 1.0  
**Scope**: Breadboard prototype design
