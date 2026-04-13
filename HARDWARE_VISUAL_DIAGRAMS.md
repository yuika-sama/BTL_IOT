# Sơ Đồ Chi Tiết Kết Nối & Mạch Điện

## 1. Sơ Đồ Block Diagram - Tổng Quan

```
┌─────────────────────────────────────────────────────────────────────┐
│                           SYSTEM BLOCK DIAGRAM                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                         ┌──────────────────┐                        │
│                         │   WiFi Router    │                        │
│                         │  192.168.11.xxx  │                        │
│                         └────────┬─────────┘                        │
│                                  │ (Wireless)                       │
│                    ┌─────────────┴──────────────┐                   │
│                    │                            │                   │
│                    ▼                            ▼                   │
│          ┌──────────────────┐         ┌──────────────┐              │
│          │   ESP32 Device   │         │Backend Server│              │
│          │  (This project)  │         │  Node.js/DB  │              │
│          └────────┬─────────┘         └──────┬───────┘              │
│                   │                          │                      │
│     ┌─────────────┴──────────────────────────┴────────┐             │
│     │          (MQTT via WiFi)                       │             │
│     │    broker: 192.168.11.101:2204                 │             │
│     │                                                │             │
│     │ Topics:                                        │             │
│     │ - sensor/data (ESP→BE)                         │             │
│     │ - device/control (BE→ESP)                      │             │
│     │ - device/status (ESP→BE)                       │             │
│     │ - device/sync (ESP→BE)                         │             │
│     │                                                │             │
│     └────────────────────────────────────────────────┘             │
│                          ▲                                          │
│                          │                                          │
│         ┌────────────────┴───────────────────┐                      │
│         │    GPIO Connections (8 pins)      │                      │
│         │                                    │                      │
│   Input:│   Output:                          │                      │
│   • PIN14 - DHT11 Data      • PIN21 - LED_TEMP                     │
│   • PIN39 - MQ4 Analog      • PIN19 - LED_HUM                      │
│   • PIN36 - LDR Analog      • PIN22 - LED_LDR                      │
│   • PIN5 -  MQ4 Digital     • PIN23 - LED_GAS                      │
│                                    │                                │
│         └───────────────────┬──────┘                                │
│                             ▼                                       │
│         ┌────────────────────────────────────┐                     │
│         │    External Components             │                     │
│         ├────────────────────────────────────┤                     │
│         │ ⚙ DHT11  (Temp + Humidity)        │                     │
│         │ ⚙ MQ-4   (Gas Methane)             │                     │
│         │ ⚙ LDR    (Light Level)             │                     │
│         │ 💡 4x LED (Status Indicators)      │                     │
│         │ ◆ Resistors & Caps (Passive)      │                     │
│         └────────────────────────────────────┘                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Chi Tiết Kết Nối Pin

### 2.1 ESP32 Pin Mapping

```
         ┌─────────────────────────────────────┐
         │      ESP32 DevKit V1 (30-pin)       │
         │                                     │
    VIN ─┼─ ① Vin (5V input)                  │
    GND ─┼─ ② GND (Ground)                    │
     EN ─┼─ ③ EN (Enable)                     │
   IO36 ─┼─ ④ IO36 → PIN_SENSOR_AO (LDR)    │ ← ADC1_0
   IO39 ─┼─ ⑤ IO39 → PIN_MQ4_A0 (Gas)        │ ← ADC1_3
    GND ─┼─ ⑥ GND                             │
    IO34─┼─ ⑦ IO34 (unused)                   │
    IO35─┼─ ⑧ IO35 (unused)                   │
    IO32─┼─ ⑨ IO32 (unused)                   │
    IO33─┼─ ⑩ IO33 (unused)                   │
    IO25─┼─ ⑪ IO25 (unused)                   │
    IO26─┼─ ⑫ IO26 (unused)                   │
    IO27─┼─ ⑬ IO27 (unused)                   │
    IO14─┼─ ⑭ IO14 → PIN_DHT_DATA (DHT11)   │
    IO12─┼─ ⑮ IO12 (unused)                   │
    GND ─┼─ ⑯ GND                             │
         │                                     │
   3.3V ─┼─ ⑰ 3V3 (3.3V out - logic supply)  │
     EN ─┼─ ⑱ EN (Enable/Reset)               │
    IO23─┼─ ⑲ IO23 → PIN_LED_GAS (LED4)      │
    IO22─┼─ ⑳ IO22 → PIN_LED_LDR (LED3)      │
    RXD ─┼─ ㉑ Rx (UART RX - reserved)        │
    TXD ─┼─ ㉒ Tx (UART TX - reserved)        │
    IO21─┼─ ㉓ IO21 → PIN_LED_TEMP (LED1)    │
    GND ─┼─ ㉔ GND                             │
    IO19─┼─ ㉕ IO19 → PIN_LED_HUM (LED2)     │
    IO18─┼─ ㉖ IO18 (unused)                   │
    IO5 ─┼─ ㉗ IO5 → PIN_MQ4_D0 (Gas digital)│
    IO17─┼─ ㉘ IO17 (unused)                   │
    IO16─┼─ ㉙ IO16 (unused)                   │
    GND ─┼─ ㉚ GND                             │
         │                                     │
         └─────────────────────────────────────┘

🔴 Red   = Power inputs/outputs
🌳 Green = Configured GPIO pins
⚪ White = Unused/reserved pins
⚫ Black = Ground connections (GND)
```

### 2.2 Physical Pin Numbering vs GPIO Numbers

```
┌──────────────────────────────────────────────────────┐
│ Important Distinction:                               │
│                                                      │
│ "PIN14" in Arduino IDE = GPIO14                      │
│ "PIN39" in Arduino IDE = GPIO39                      │
│                                                      │
│ These are the LOGICAL GPIO numbers used in code:     │
│   pinMode(PIN_DHT_DATA, ...)                         │
│   digitalWrite(PIN_LED_TEMP, ...)                    │
│                                                      │
│ The PHYSICAL position on the board is different!     │
│ Example: GPIO14 is on physical pin ⑭ (14th from top)│
└──────────────────────────────────────────────────────┘
```

---

## 3. 상세 회路도 - DHT11

```
                    ── DHT11 Sensor Module ──
                    
                    Front View (DIP format):
                    ┌─────────────────┐
                    │ ╭ DHT11 Module  │
                    │ │               │
                    │ │ ┌─┬─┬─┬─┐    │
                    │ │ │1│2│3│4│    │  Pin 1 = VCC (5V)
                    │ │ └─┴─┴─┴─┘    │  Pin 2 = DATA (signal)
                    │ │               │  Pin 3 = NC (not used)
                    │ │ Module Label  │  Pin 4 = GND
                    │ │ DHT11         │
                    │ │               │
                    └─────────────────┘
                     │   │   │   │
                     │   │   │   │
                    VCC DATA NC GND
                     │   │       │
    ┌────────────────┼───┼───┐   │
    │                │   │   │   │
    │                │   │   │   │
    │          ┌──────┴──[ ]┘   │  ← 4.7kΩ pull-up
    │          │                │
    │       [GND]         (Signal return)
    │          │
    │    ┌─────┴─────────┐
    │    │               │
    │    ▼               ▼
 ┌──────────────────────────────────┐
 │   ESP32 Connection              │
 │                                 │
 │  VCC from DHT11 ──→ 5V Rail    │
 │  DATA from DHT11 ──→ PIN 14     │
 │  GND from DHT11 ──→ GND Rail    │
 │                                 │
 │  Pull-up: 4.7kΩ between         │
 │           PIN14 and 5V Rail     │
 │                                 │
 └──────────────────────────────────┘

Signal Timing (DHT11):
┌──────────────────────────────────────────┐
│ Idle: DATA line → 5V (HIGH)              │
│                                          │
│ When reading:                            │
│ 1. Signal pull-down pulse (~80µs)        │
│ 2. Device ready pulse (~80µs)            │
│ 3. Send 40 bits (8 bits each value)      │
│    - Bit '0': 50µs LOW + 26µs HIGH       │
│    - Bit '1': 50µs LOW + 70µs HIGH       │
│                                          │
│ Reading Interval: Minimum 2 seconds      │
│                  (Rate limited)          │
└──────────────────────────────────────────┘
```

---

## 4. 회로도 - MQ-4 & Analog Readings

```
                 ┌──────────────────────────┐
                 │  MQ-4 Sensor Board       │
                 │  (Pre-built Module)      │
                 └──────────────────────────┘
                  ┌─  A0   (Analog Output)
                  ├─  D0   (Digital Output / Threshold)
                  ├─  VCC  (Power In: 5V)
                  └─  GND  (Ground Return)
                   │     │        │       │
        ┌──────────┼─────┼────┐   │       │
        │          │     │    │   │       │
        │      ┌───┴─────┴────┴───┴─┐    │
        │      │  Voltage Divider    │    │
        │      │  Inside Sensor Brd  │    │
        │      │                     │    │
        │   5V─┤[R_load]─┬─→ A0 OUT │    │
        │      │     │   │  (to PIN39)   │
        │      │   [R_sensor]         │    │
        │      │     │   │             │
        │      └─────┴───┴─→ GND       │
        │                              │
        └──────|||||||||||||||||────────┘
               Sensor Element (responds to gas)

Sensor Characteristics:
- Resistance: 10kΩ to 100kΩ (depends on gas level)
- Highest resistance = No gas
- Lowest resistance = High gas concentration
- Response time: ~10 seconds to reach 90% stable reading
```

### MQ-4 Output Mapping

```
          MQ-4 ADC Value Scale
┌────────────────────────────────────────┐
│ ADC Value    │ Meaning                  │
├──────────────┼────────────────────────┤
│ 0 - 500      │ High gas concentration │
│              │ (Alarm threshold)      │
│              │ Digital output = LOW   │
├──────────────┼────────────────────────┤
│ 500 - 2000   │ Moderate gas level     │
├──────────────┼────────────────────────┤
│ 2000 - 3500  │ Normal / Low gas       │
├──────────────┼────────────────────────┤
│ 3500 - 4095  │ No gas detected        │
│              │ Digital output = HIGH  │
└────────────────────────────────────────┘

Current Code Formula:
int gas_raw = (1.0 - (raw_adc / 10000.0)) * 100.0;

Example Conversions:
raw_adc = 4095  → gas_raw ≈ -9%   (needs calibration)
raw_adc = 3500  → gas_raw ≈ 65%   (normal air)
raw_adc = 2000  → gas_raw ≈ 80%   (some gas present)
raw_adc = 1000  → gas_raw ≈ 90%   (significant gas)
raw_adc = 0     → gas_raw = 100%   (max gas)

⚠️  Issue: Divisor 10000 may be incorrect!
    Recommendation: Verify with actual sensor reading
    Consider using 4095 instead for proper scaling
```

---

## 5. 회로도 - LDR Voltage Divider

```
Voltage Divider Circuit:

         5V Supply
           ││
           ││ Power Rail (red line on breadboard)
           ││
      ┌────┴────┐
      │          │
    [R1]         │  R1 = 10kΩ fixed resistor
    10kΩ        │
      │          │
      ├──────────●───→ PIN36 (GPIO36/ADC1_0)
      │   ▲      
      │ Tap point for ADC reading
      │
    [R2]
   (LDR)  ← Resistance varies with light
    50Ω-100kΩ
      │
      │
     ││ (GND)
     ││ Ground Rail (black line on breadboard)

Voltage Calculation (Voltage Divider Formula):
V_out(PIN36) = V_in × R2 / (R1 + R2)
             = 5V × R_ldr / (10kΩ + R_ldr)

Light Conditions & Results:
┌──────────────────┬─────────────┬───────────┬────────────┐
│ Condition        │ R_LDR       │ V_out     │ ADC Value  │
├──────────────────┼─────────────┼───────────┼────────────┤
│ Bright (sun)     │ ~500Ω       │ ~0.2V     │ ~160       │
│ Normal Office    │ ~5kΩ        │ ~0.7V     │ ~570       │
│ Dim/Twilight     │ ~50kΩ       │ ~2.5V     │ ~2048      │
│ Dark Room        │ ~100kΩ      │ ~3.2V     │ ~3932      │
│ Complete Dark    │ ~1MΩ+       │ ~3.3V     │ ~4095      │
└──────────────────┴─────────────┴───────────┴────────────┘

Code Reading:
float raw_adc = analogRead(PIN_SENSOR_AO);  // 0-4095
float light_percent = (1.0 - (raw_adc / 4095.0)) * 100.0;

Example:
raw = 0    → light = 100% (brightest)
raw = 2048 → light = 50%  (mid light)
raw = 4095 → light = 0%   (darkest)
```

---

## 6. 회로도 - LED Indicator Circuits

```
4x Identical LED Control Circuits:

         ┌──────────────────────────────────────┐
         │   ESP32 GPIO Output Stage            │
         ├──────────────────────────────────────┤
         │                                      │

        PIN21 (GPIO21) ─ HIGH/LOW logic (3.3V)
            │
            │
        ┌───▼───────────────────────┐
        │                           │
        │  ┌─ Current Limiting   ─┐ │
        │  │ Resistor [330Ω]      │ │
        │  │ 1/4W 5% tolerance    │ │
        │  └──────────┬───────────┘ │
        │             │             │
        │    ┌────────▼──────┐      │
        │    │               │      │
        │    │  LED (RED)    │      │
        │    │  5mm, 2V Vf   │      │
        │    │               │      │
        │    └────────┬──────┘      │
        │             │             │
        │          [GND]            │
        │             │             │
        └─────────────┴─────────────┘

LED Polarity (IMPORTANT❗):
┌────────────────────────────────────┐
│           LED Symbol               │
│                                    │
│  Anode (+) ───►| ───┐─  Cathode (-│
│                                    │
│  Longer lead ──────→ Anode         │
│  Shorter lead ─────→ Cathode       │
│                                    │
│  In Circuit:                       │
│  Anode  → [Resistor] → GPIO (HIGH) │
│  Cathode ──────────→ GND           │
└────────────────────────────────────┘

Current Flow (When PIN21 = LOW = 0V):
      (No voltage difference)
       → No current → LED OFF

Current Flow (When PIN21 = HIGH = 3.3V):
      3.3V - 2.0V (LED Vf) = 1.3V available
      I = V / R = 1.3V / 330Ω ≈ 4mA
      → 4mA through LED → LED ON (bright)

4x LED Configuration (All in Parallel):
┌─────────────────────────────────────────────┐
│  PIN21 ──[330Ω]──[LED_TEMP]────┐          │
│  PIN19 ──[330Ω]──[LED_HUM]─────┼─→ GND    │
│  PIN22 ──[330Ω]──[LED_LDR]─────┼─        │
│  PIN23 ──[330Ω]──[LED_GAS]─────┘         │
│                                           │
│ Max total current if all ON:             │
│ 4mA × 4 LEDs = 16mA < 20mA per pin limit │
│              < 40mA total GPIO limit      │
│                                           │
│ ✓ Safe design                             │
└─────────────────────────────────────────────┘
```

---

## 7. Power Distribution Diagram

```
┌──────────────────────────────────────────────────┐
│         POWER DISTRIBUTION TREE                  │
└──────────────────────────────────────────────────┘

    ┌─── USB Power Source (5V, 1-2A) ───┐
    │  │                                 │
    │  ├─ 5V "Hot" (Red)                │
    │  │  │                              │
    │  │  ├─ [Schottky Diode] (optional) │
    │  │  │  ✓ Prevents reverse polarity │
    │  │  │                              │
    │  │  ├─ [100µF Electrolytic Cap]    │
    │  │  │  ✓ Power supply smoothing    │
    │  │  │                              │
    │  │  └─→ 5V Rail (Breadboard red)   │
    │  │       │                          │
    │  │       ├─→ [470µF] (optional)     │
    │  │       │                          │
    │  │       └─→ Distribution to:       │
    │  │           ├─ DHT11 VCC          │
    │  │           ├─ MQ-4 Board VCC     │
    │  │           ├─ LDR divider VCC    │
    │  │           └─ [Pull-up R]        │
    │  │              (4.7k on PIN14)    │
    │  │                                  │
    │  └─ GND "Return" (Black)           │
    │     │                              │
    │     ├─ Star Point Junction (⭐)    │
    │     │  (All grounds meet here)    │
    │     │                              │
    │     └─→ GND Rail (Breadboard black)│
    │         │                          │
    │         └─→ Return path from:      │
    │             ├─ DHT11 GND           │
    │             ├─ MQ-4 Board GND      │
    │             ├─ LDR circuit GND     │
    │             ├─ LED circuits GND    │
    │             └─ ESP32 GND pins      │
    │                                    │
    └────────────────────────────────────┘

Current Budget Per Rail:
┌──────────────────────────────────┐
│ Component      │ Typical │ Peak  │
├────────────────┼─────────┼───────┤
│ ESP32 Core     │ 80mA    │160mA  │
│ WiFi Idle      │ 50mA    │ --    │
│ WiFi TX        │ 100mA   │240mA  │
│ DHT11 Reading  │ 1mA     │2.5mA  │
│ MQ-4 Sensor    │150mA    │250mA  │
│ 4x LEDs (max)  │ 20mA    │ 40mA  │
├────────────────┼─────────┼───────┤
│ TOTAL          ~400mA   ~700mA  │
│ USB 5V Capacity│ 500mA   │ 2A max│
│ Safety margin  │ OK ✓    │ OK ✓  │
└──────────────────────────────────┘

⚠️  Critical: Peak current during WiFi TX
    May spike to 500-700mA briefly
    Ensure USB power supply rated for 1A+ continuous
```

---

## 8. Breadboard Layout - Physical Arrangement

```
┌─────────────────────────────────────────────────────────────────┐
│                    BREADBOARD TOP VIEW                          │
│                   (830 tie-points)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ▲ Row 1: Power Rails                                          │
│  │  [5V Rail] ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇  │                  │
│  │  [GND Rail] ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇  │ ← All connected │
│  │                                                              │
│  │  ◇ ◇ ◇ | ◇ ◇ ◇ | ◇ ◇ ◇ | ◇ ◇ ◇ | ◇ ◇ ◇                  │
│  │  ◇ ◇ ◇ | ◇ ◇ ◇ | ◇ ◇ ◇ | ◇ ◇ ◇ | ◇ ◇ ◇                  │
│  │  ◇ ◇ ◇ | ◇ ◇ ◇ | ◇ ◇ ◇ | ◇ ◇ ◇ | ◇ ◇ ◇                  │
│  │     (5 columns separated by channel)                        │
│  │                                                              │
│  │  Row N: GND Rail ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇             │
│  │  Row N: Positive Rail ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇        │
│  │                                                              │
│  └─────────────────────────────────────────────────────────────┘

Recommended Component Placement:
┌─────────────────────────────────────────────────────────────────┐
│   LEFT SECTION (Sensors)     │  RIGHT SECTION (Output/Control) │
├──────────────────────────────┼─────────────────────────────────┤
│                              │                                 │
│  Rows 1-5:  DHT11 Module     │  Rows 1-5:  LED Resistors      │
│             VCC → 5V Rail    │             (4x 330Ω)          │
│             DATA → PIN14     │                                 │
│             with 4.7k pull-up│                                 │
│                              │                                 │
│  Rows 6-8:  MQ-4 Board       │  Rows 6-8:  LEDs               │
│             Connected to     │             (4x red LED)        │
│             PIN39 analog     │             → GND             │
│             PIN5 digital     │                                 │
│                              │                                 │
│  Rows 9-11: LDR Circuit      │  Rows 9-11: Bypass Caps        │
│             Voltage divider  │             (0.1µF x4)          │
│             10k + LDR        │                                 │
│             → PIN36          │                                 │
│                              │                                 │
│  Rows 12+: Empty/Testing     │  Rows 12+: Empty             │
│                              │                                 │
└──────────────────────────────┴─────────────────────────────────┘

Wiring Check (Complete Path):
1. 5V Power Rail ─→ All components requiring 5V
2. GND Rail ─→ All components requiring ground
3. Signal wires: color code if possible
   - Blue: Signals/Data
   - Red: 5V power
   - Black: Ground
4. Keep analog signal wires away from LED switching lines
5. Bundle related components together
```

---

## 9. Connector & Breadboard Reference

```
Breadboard Structure:
┌─────┬───────────────────────────────┬──────┐
│ GND │ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ │ 5V  │
├─────┼───────────────────────────────┼──────┤
│ +5V │ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ ◇ │ GND │
├─────┴───────────────────────────────┴──────┤
│  a    b  c  d  e  f │ g  h  i  j  k  l    │
│  ◇    ◇  ◇  ◇  ◇  ◇ │ ◇  ◇  ◇  ◇  ◇  ◇   │ Row 1
│  ◇    ◇  ◇  ◇  ◇  ◇ │ ◇  ◇  ◇  ◇  ◇  ◇   │ Row 2
│  ◇    ◇  ◇  ◇  ◇  ◇ │ ◇  ◇  ◇  ◇  ◇  ◇   │ Row 3
│      ...                                   │
│  ◇    ◇  ◇  ◇  ◇  ◇ │ ◇  ◇  ◇  ◇  ◇  ◇   │ Row 30
└──────────────────────────────────────────────┘

Hole Pattern:
- Columns labeled A-F (left), G-L (right)
- Rows numbered 1-30
- Vertical channel in middle separates two sections
- Each hole: 2.54mm spacing (standard 0.1 inch)
- Holes in same row are common (connected)
- Holes in same column across channel are NOT connected

Rows 1-2: Power distribution
- Row 1: 5V, GND
- Row 2: Mirror of row 1
Rows 3-30: Component connections
```

---

## 10. Testing & Verification Checklist

### Power-On Test

```
☐ Visual Inspection
  ☐ No smoke or burning smell
  ☐ All components seated properly
  ☐ No bent pins on ESP32
  ☐ Wires color-coded correctly:
    ☐ Red = 5V
    ☐ Black = GND
    ☐ Other colors = Signals

☐ Voltage Checks (Multimeter)
  ☐ 5V supply at power rail ±0.25V
  ☐ 3.3V output from ESP32
  ☐ GND at 0V reference
  ☐ Voltage between PIN39 and GND: 0.5-3.0V (MQ-4)
  ☐ Voltage between PIN36 and GND: 0.2-3.3V (LDR)

☐ Connectivity Tests
  ☐ DHT11 DATA line responds to scope trigger
  ☐ MQ-4 analog output present
  ☐ LDR output changes with light

☐ LED Tests
  ☐ Power 5V to each LED pin manually
  ☐ Each LED lights up individually
  ☐ Brightness is adequate
```

### Sensor Calibration

```
DHT11 Calibration:
- Compare with reference thermometer
- Note offset if any
- Record humidity near 50% reference point

MQ-4 Calibration:
- Expose to fresh air (baseline = 0% gas)
- Read ADC value: _____
- Adjust formula if needed: gas_percent = (baseline - reading) / baseline * 100

LDR Calibration:
- Place under various light sources
- Record ADC values:
  • Sunlight: _____
  • Office light: _____
  • Dim light: _____
  • Dark room: _____
- Verify formula mapping
```

---

**Schematic Documentation Complete**  
**Last Updated**: 2026-04-05  
**Version**: 1.0
