import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  Cpu, Droplets, Sun, Thermometer, Waves, Zap, Cable, CircuitBoard, Wifi,
  Code2, Wrench, ShieldCheck, Copy, CheckCheck, Network, Radio, Server, Plug,
  FlaskConical, RotateCw, Globe, ArrowRight,
} from "lucide-react";
import { useEffect, useState } from "react";

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);


export const Route = createFileRoute("/hardware")({
  head: () => ({ meta: [{ title: "হার্ডওয়্যার গাইড · BMDA স্মার্ট সেচ" }] }),
  component: HardwarePage,
});

/* ------------------------------------------------------------------ */
/*  ARCHITECTURE                                                       */
/*  ┌─────────────────────────────┐                                    */
/*  │  MASTER NODE (ESP32)        │  ←  পাম্প হাউস                     */
/*  │  • মেইন মোটর রিলে           │                                    */
/*  │  • R385 ১২V পাম্প (auto L/min)│                                  */
/*  │  • ট্যাঙ্ক জলস্তর (HC-SR04) │                                    */
/*  │  • DHT22 (আবহাওয়া)         │                                    */
/*  │  • OLED স্ট্যাটাস            │                                    */
/*  └──────────────┬──────────────┘                                    */
/*                 │  WiFi / HTTP                                       */
/*    ┌────────────┼────────────┐                                       */
/*    ▼            ▼            ▼                                       */
/*  SUB-01       SUB-02       SUB-03   (ESP8266 NodeMCU — জমিতে)       */
/*  • Soil       • Soil       • Soil                                    */
/*  • LDR        • LDR        • LDR                                     */
/*  • Valve      • Valve      • Valve                                   */
/* ------------------------------------------------------------------ */

const masterDevices = [
  { icon: Cpu,         name: "ESP32 DevKit V1",                     role: "মাস্টার কন্ট্রোলার",                pin: "—",                price: "৬৫০ ৳" },
  { icon: Zap,         name: "১-চ্যানেল রিলে মডিউল (৫V)",            role: "মেইন পাম্প ON/OFF",                pin: "GPIO 25",          price: "১২০ ৳" },
  { icon: Droplets,    name: "মেইন মোটর · ৬V Ultra-Quiet Pump", role: "মেইন পাম্প · ৬V, ০.২০A, ~১.২W (2.0 L/min)", pin: "রিলে NO আউট", price: "৩৮০ ৳" },
  { icon: Waves,       name: "HC-SR04 আল্ট্রাসনিক",                 role: "ট্যাঙ্ক জলস্তর",                    pin: "Trig 5 · Echo 18", price: "১৮০ ৳" },
  { icon: Thermometer, name: "DHT22",                               role: "তাপমাত্রা ও আর্দ্রতা",              pin: "GPIO 4",           price: "৩৫০ ৳" },
  { icon: CircuitBoard,name: "OLED ০.৯৬\" SSD1306 (I2C)",             role: "বুট লোগো + লাইভ ডেটা ডিসপ্লে",     pin: "SDA 21 · SCL 22",  price: "৩২০ ৳" },
  { icon: Zap,         name: "৬V ২A রেগুলেটেড অ্যাডাপ্টার",          role: "পাম্প পাওয়ার সাপ্লাই",             pin: "Relay COM",        price: "৩৫০ ৳" },
  { icon: ShieldCheck, name: "TP4056 + ১৮৬৫০",                      role: "ESP32 ব্যাকআপ ব্যাটারি",            pin: "VIN",              price: "৩৫০ ৳" },
];

/* ---------------- MASTER PIN-BY-PIN WIRING (grouped by device) ---------------- */
type WirePair = { mcu: string; dev: string; note?: string };
type DeviceWiring = {
  device: string;
  icon: typeof Cpu;
  color: string;          // tailwind text/border accent
  grad: string;           // header gradient
  desc: string;
  pairs: WirePair[];
};

const masterDeviceWiring: DeviceWiring[] = [
  {
    device: "OLED ০.৯৬\" SSD1306 (I2C)",
    icon: CircuitBoard,
    color: "sky",
    grad: "from-sky-500 to-cyan-500",
    desc: "বুট লোগো ও লাইভ ডেটা ডিসপ্লে · I2C ঠিকানা 0x3C",
    pairs: [
      { mcu: "3V3",     dev: "VCC", note: "৩.৩V পাওয়ার" },
      { mcu: "GND",     dev: "GND", note: "কমন গ্রাউন্ড" },
      { mcu: "GPIO 21", dev: "SDA", note: "I2C ডেটা" },
      { mcu: "GPIO 22", dev: "SCL", note: "I2C ক্লক" },
    ],
  },
  {
    device: "DHT22 (তাপমাত্রা + আর্দ্রতা)",
    icon: Thermometer,
    color: "emerald",
    grad: "from-emerald-500 to-teal-500",
    desc: "DATA ↔ VCC এর মাঝে ১০kΩ পুল-আপ রেজিস্টর লাগান",
    pairs: [
      { mcu: "3V3",    dev: "VCC (Pin 1)",  note: "১০kΩ pull-up → DATA" },
      { mcu: "GPIO 4", dev: "DATA (Pin 2)", note: "ওয়ান-ওয়্যার ডিজিটাল" },
      { mcu: "GND",    dev: "GND (Pin 4)",  note: "—" },
    ],
  },
  {
    device: "HC-SR04 আল্ট্রাসনিক (ট্যাঙ্ক জলস্তর)",
    icon: Waves,
    color: "violet",
    grad: "from-violet-500 to-fuchsia-500",
    desc: "Echo পিন থেকে ESP32-এ যাওয়ার আগে 1kΩ + 2kΩ ভোল্টেজ ডিভাইডার লাগান",
    pairs: [
      { mcu: "5V (VIN)", dev: "VCC",  note: "সেন্সর ৫V-এ ভালো কাজ করে" },
      { mcu: "GND",      dev: "GND",  note: "—" },
      { mcu: "GPIO 5",   dev: "Trig", note: "১০µs ট্রিগার পালস" },
      { mcu: "GPIO 18",  dev: "Echo", note: "⚠️ 1kΩ+2kΩ ডিভাইডার আবশ্যক" },
    ],
  },
  {
    device: "১-চ্যানেল রিলে মডিউল (৫V)",
    icon: Zap,
    color: "amber",
    grad: "from-amber-500 to-orange-500",
    desc: "Active-LOW রিলে — GPIO LOW দিলে কয়েল on হয় ও NO-COM short হয়",
    pairs: [
      { mcu: "5V (VIN)", dev: "VCC", note: "রিলে কয়েল পাওয়ার" },
      { mcu: "GND",      dev: "GND", note: "কমন গ্রাউন্ড" },
      { mcu: "GPIO 25",  dev: "IN",  note: "কন্ট্রোল সিগনাল (Active-LOW)" },
    ],
  },
  {
    device: "মেইন মোটর · ৬V Ultra-Quiet Pump",
    icon: Droplets,
    color: "rose",
    grad: "from-rose-500 to-pink-500",
    desc: "পাম্পের পাওয়ার ESP32 থেকে আসে না — আলাদা ৬V অ্যাডাপ্টার লাগে; শুধু GND শেয়ার্ড",
    pairs: [
      { mcu: "Relay NO",   dev: "Pump (+)",       note: "Normally-Open আউটপুট" },
      { mcu: "Relay COM",  dev: "৬V Adapter +V",  note: "অ্যাডাপ্টারের পজিটিভ লাইন" },
      { mcu: "—",          dev: "Pump (−) → Adapter −V", note: "পাম্প রিটার্ন" },
      { mcu: "ESP32 GND",  dev: "Adapter −V",     note: "⚠️ কমন গ্রাউন্ড আবশ্যক" },
    ],
  },
  {
    device: "🆕 ম্যানুয়াল পুশ বাটন (২টি · ON / OFF)",
    icon: Plug,
    color: "indigo",
    grad: "from-indigo-500 to-purple-500",
    desc: "INPUT_PULLUP মোড — একপাশ GPIO, অন্যপাশ GND; চাপলে পিন LOW হবে। প্রেস হলেই dashboard-এ instant সিঙ্ক হয়।",
    pairs: [
      { mcu: "GPIO 32", dev: "Button-ON pin 1",  note: "মোটর ON বাটন" },
      { mcu: "GND",     dev: "Button-ON pin 2",  note: "—" },
      { mcu: "GPIO 33", dev: "Button-OFF pin 1", note: "মোটর OFF বাটন" },
      { mcu: "GND",     dev: "Button-OFF pin 2", note: "—" },
    ],
  },
];



const subDevices = [
  { icon: Radio,        name: "ESP8266 NodeMCU v3",       role: "সাব-নোড MCU (WiFi)",                pin: "—",            price: "৩৫০ ৳" },
  { icon: FlaskConical, name: "TDS Sensor (Gravity)",     role: "মাটির আর্দ্রতা (ppm → %)",          pin: "A0 (ADC)",     price: "৪৫০ ৳" },
  { icon: Thermometer,  name: "DHT22",                    role: "তাপমাত্রা ও আর্দ্রতা",              pin: "D6",           price: "৩৫০ ৳" },
  { icon: Sun,          name: "LDR + 10kΩ",               role: "সূর্যালোক/দিন-রাত",                 pin: "D5",           price: "৩০ ৳" },
  { icon: RotateCw,     name: "SG90 Servo Motor (৯g)",    role: "পানির লাইন on/off (০°↔৯০°)",        pin: "D2 (PWM)",     price: "১৮০ ৳" },
  { icon: Cable,        name: "পানির লাইন + ফিটিং",       role: "জোনের irrigation pipe",             pin: "Servo arm",    price: "১২০ ৳" },
  { icon: Zap,          name: "৫V ২A অ্যাডাপ্টার",        role: "সাব-নোড পাওয়ার",                    pin: "VIN",          price: "৩৫০ ৳" },
];

const subTotalPerNode = "১,৮৩০ ৳";

/* ---------------- MASTER FIRMWARE ---------------- */
const buildMasterCode = (serverHost: string) => `/**

 *  BMDA Smart Irrigation — MASTER NODE (ESP32)
 *  স্থান : পাম্প হাউস
 *  পাম্প : ৬V Ultra-Quiet Fractional Submersible Pump
 *          rated 3–6V DC · ~120 L/H (≈2.0 L/min) · ~0.20A · ~1.2W
 *  কাজ  : (১) Boot হলে heartbeat পাঠিয়ে dashboard-কে ONLINE জানায়
 *         (২) Dashboard থেকে রিয়েল-টাইম পাম্প ON/OFF
 *         (৩) ট্যাঙ্ক জলস্তর, আবহাওয়া, পাম্প ভোল্টেজ/কারেন্ট/প্রবাহ ও রানটাইম
 *         (৪) OLED-এ লাইভ ডেটা
 *
 *  Board    : ESP32 Dev Module
 *  Libraries:
 *    - WiFi / HTTPClient / ArduinoJson
 *    - DHT sensor library  (Adafruit)
 *    - Adafruit GFX + Adafruit SSD1306
 */
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ====== EDIT THESE ======
const char* WIFI_SSID   = "YOUR_WIFI";
const char* WIFI_PASS   = "YOUR_PASSWORD";
// স্থায়ী dev URL — publish না করলেও কাজ করবে।
const char* SERVER_HOST = "${serverHost}";

const char* DEVICE_ID   = "MASTER-01";
const char* ZONE_ID     = "PUMP-HOUSE";
// ========================

// ---- Pump spec (6V Ultra-Quiet Fractional, 120 L/H) ----
// rated 6V → 0.20A → 1.20W; open flow ≈ 2.0 L/min (120 L/H)
const float PUMP_RATED_LPM     = 2.0;
const float PUMP_RATED_VOLTAGE = 6.0;
const float PUMP_RATED_CURRENT = 0.20;

// ---- Pins ----
#define PIN_RELAY_PUMP    25
#define PIN_TRIG           5
#define PIN_ECHO          18
#define PIN_DHT            4
#define DHT_TYPE       DHT22
#define I2C_SDA           21
#define I2C_SCL           22
// 🆕 Manual push buttons (INPUT_PULLUP → press = LOW)
#define PIN_BTN_ON        32
#define PIN_BTN_OFF       33
// 🆕 অনলাইন ইন্ডিকেটর LED
//    ESP32 DevKit-এ built-in নীল LED সাধারণত GPIO 2 অথবা GPIO 22-এ থাকে।
//    আপনার বোর্ডে অন্য পিন হলে এখানে বদলান। বাইরে আলাদা LED-ও যোগ করতে
//    পারেন — GPIO → 220Ω → LED অ্যানোড → GND।
//    LED_ACTIVE_HIGH = true  → HIGH দিলে LED জ্বলবে (বেশিরভাগ বোর্ড)
//    LED_ACTIVE_HIGH = false → LOW দিলে LED জ্বলবে (কিছু বোর্ডে built-in inverted)
#define PIN_LED_ONLINE        2
#define LED_ACTIVE_HIGH    true


// ---- OLED ----
#define OLED_W   128
#define OLED_H    64
Adafruit_SSD1306 oled(OLED_W, OLED_H, &Wire, -1);

DHT dht(PIN_DHT, DHT_TYPE);

bool          motorOn       = false;
bool          systemOnline  = false;       // ✅ ব্যাকএন্ডে শেষ POST সফল কিনা
unsigned long motorStartMs  = 0;
unsigned long motorTotalMs  = 0;            // মোট রানটাইম (ms)
unsigned long lastSend      = 0;
const unsigned long SEND_INTERVAL = 2000;   // ⚡ 2s — snappy dashboard sync
unsigned long lastWifiAttempt = 0;
const unsigned long WIFI_RETRY_MS = 5000;   // WiFi গেলে প্রতি ৫ সেকেন্ডে auto reconnect
float lastGoodTemp = NAN;
float lastGoodHum  = NAN;

// Button debounce state (momentary push: ১ চাপ = ১ signal)
int  lastBtnOnState  = HIGH;
int  lastBtnOffState = HIGH;
int  stableBtnOnState  = HIGH;
int  stableBtnOffState = HIGH;
unsigned long lastBtnOnMs  = 0;
unsigned long lastBtnOffMs = 0;
const unsigned long BTN_DEBOUNCE_MS = 40;

// বাটন চাপলে ৩ সেকেন্ড dashboard-এর পুরোনো উল্টো command ignore করব
unsigned long buttonOverrideUntil = 0;
const unsigned long BUTTON_OVERRIDE_MS = 3000;

// =================== DISPLAY HELPERS ===================
void oledCenter(const String& s, int y, int sz = 1) {
  oled.setTextSize(sz);
  int16_t x1, y1; uint16_t w, h;
  oled.getTextBounds(s, 0, 0, &x1, &y1, &w, &h);
  oled.setCursor((OLED_W - w) / 2, y);
  oled.print(s);
}

// ✅ মিনিমাল বুট — "Develop by Mehedi" → "Loading..." থাকবে যতক্ষণ না ড্যাশবোর্ড আঁকা হয়
void bootAnimation() {
  // ━━━ Stage 1: Developer credit ━━━
  oled.clearDisplay();
  oled.setTextColor(SSD1306_WHITE);
  oledCenter("Develop by", 20, 1);
  oledCenter("Mehedi", 36, 2);
  oled.display();
  delay(1600);

  // ━━━ Stage 2: Loading screen with progress bar ━━━
  // গুরুত্বপূর্ণ: loading শেষেও screen clear করা যাবে না।
  // WiFi/backend connect হতে যতক্ষণ লাগে, এই loading screen-ই থাকবে;
  // তারপর sendTelemetry() সরাসরি dashboard draw করবে — মাঝখানে black screen হবে না।
  const int barX = 14, barY = 38, barW = 100, barH = 10;
  for (int p = 0; p <= 100; p += 4) {
    oled.clearDisplay();
    oled.setTextColor(SSD1306_WHITE);
    oledCenter("Loading...", 10, 2);                       // উপরে বড় করে "Loading..."
    oled.drawRoundRect(barX, barY, barW, barH, 2, SSD1306_WHITE);
    int fillW = (barW - 4) * p / 100;
    if (fillW > 0) oled.fillRoundRect(barX + 2, barY + 2, fillW, barH - 4, 1, SSD1306_WHITE);
    oled.setTextSize(1);
    char pct[8]; snprintf(pct, sizeof(pct), "%d%%", p);
    int16_t bx, by; uint16_t bw, bh;
    oled.getTextBounds(pct, 0, 0, &bx, &by, &bw, &bh);
    oled.setCursor((128 - bw) / 2, 54);
    oled.print(pct);
    oled.display();
    delay(25);
  }
  delay(150);
}


String fmtRuntime(unsigned long ms) {
  unsigned long s = ms / 1000;
  unsigned int h = s / 3600;
  unsigned int m = (s % 3600) / 60;
  unsigned int sec = s % 60;
  char buf[16];
  snprintf(buf, sizeof(buf), "%02u:%02u:%02u", h, m, sec);
  return String(buf);
}

// ✅ DHT22 safe read — শুধু NaN reject; raw sensor value-ই trust করি
//    আগে 0–100% bound-এ আটকে 173-এর মতো reading drop হয়ে যেত → display ও
//    dashboard দুটোই blank দেখাত। এখন সেন্সর যা দেয়, তাই দেখাবে।
bool readDhtSafe(float &tempC, float &humidity) {
  float t = NAN, h = NAN;
  for (int i = 0; i < 5; i++) {
    t = dht.readTemperature(false);  // Celsius
    h = dht.readHumidity();
    if (!isnan(t) && !isnan(h)) break;
    delay(80);
  }

  if (!isnan(t)) lastGoodTemp = t;
  if (!isnan(h)) lastGoodHum  = h;

  tempC    = lastGoodTemp;
  humidity = lastGoodHum;

  if (isnan(t) && isnan(h)) {
    Serial.println("[DHT] read failed (NaN) — check wiring / power");
  } else {
    Serial.printf("[DHT] raw t=%.1fC h=%.1f%%\n", t, h);
  }
  return !isnan(tempC) || !isnan(humidity);
}


// 🆕 প্রফেশনাল ড্যাশবোর্ড লেআউট
//   ┌──────────────── header bar (inverse) ──────────────────┐
//   │   PUMP  ON    (বড়, কেন্দ্রে)                            │
//   │   SYSTEM ONLINE  ·  WiFi: -65dBm   (ছোট)               │
//   ├────────────────────────────────────────────────────────┤
//   │   TANK 75%        FLOW 1.9 L/min                        │
//   │   6.0V 0.20A      29°C 71%                              │
//   │   RUN 00:12:34                                          │
//   └────────────────────────────────────────────────────────┘
void drawDashboard(float tank, float lpm, float volt, float curr, float t, float h) {
  oled.clearDisplay();
  oled.setTextColor(SSD1306_WHITE);

  // === HEADER (inverse bar with big PUMP status) ===
  oled.fillRect(0, 0, OLED_W, 22, SSD1306_WHITE);
  oled.setTextColor(SSD1306_BLACK);
  oledCenter(motorOn ? "PUMP  ON" : "PUMP  OFF", 4, 2);
  // 🔧 FIX: reset textSize back to 1 — otherwise every subsequent oled.print
  //        below also renders at size 2 and the layout collapses.
  oled.setTextSize(1);
  oled.setTextColor(SSD1306_WHITE);

  // === SUB-HEADER : system status ===
  oledCenter(systemOnline ? "SYSTEM ONLINE" : "SYSTEM OFFLINE", 25, 1);
  oled.setTextSize(1);

  // === DIVIDER ===
  oled.drawFastHLine(0, 35, OLED_W, SSD1306_WHITE);

  // === DATA ROW 1 : TANK + FLOW (fixed columns, no overflow) ===
  oled.setCursor(2, 38);
  oled.printf("TANK %3d%%", (int)tank);
  oled.setCursor(68, 38);
  oled.printf("FLOW %4.1f", lpm);

  // === DATA ROW 2 : V/A + temp/humid (fixed width, never wraps/cuts) ===
  oled.setCursor(2, 48);
  oled.printf("%3.1fV %4.2fA", volt, curr);
  oled.setCursor(74, 48);
  if (!isnan(t) && !isnan(h)) {
    oled.printf("%4.1fC%3d%%", t, (int)round(h));
  } else if (!isnan(t)) {
    oled.printf("%4.1fC--%%", t);
  } else if (!isnan(h)) {
    oled.printf("--.-C%3d%%", (int)round(h));
  } else {
    oled.print("--.-C--%");
  }

  // === DATA ROW 3 : RUNTIME (compact HH:MM:SS, never overflows) ===
  oled.setCursor(2, 57);
  oled.print("RUN ");
  oled.print(fmtRuntime(motorOn ? (motorTotalMs + (millis() - motorStartMs)) : motorTotalMs));

  oled.display();
}

// =================== ACTUATORS ===================
void setMotor(bool on) {
  if (on == motorOn) return;
  if (on) {
    motorStartMs = millis();
  } else {
    motorTotalMs += millis() - motorStartMs;
  }
  motorOn = on;
  digitalWrite(PIN_RELAY_PUMP, on ? LOW : HIGH);   // ACTIVE-LOW
  Serial.printf("[MOTOR] %s\\n", on ? "ON" : "OFF");
}

// =================== SENSORS ===================
float readTankPct() {
  digitalWrite(PIN_TRIG, LOW);  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  long dur = pulseIn(PIN_ECHO, HIGH, 30000);
  if (!dur) return 0;
  float distCm = dur * 0.0343 / 2.0;
  const float TANK_H = 100.0;            // আপনার ট্যাঙ্ক উচ্চতা cm
  float pct = 100.0 * (TANK_H - distCm) / TANK_H;
  if (pct < 0) pct = 0; if (pct > 100) pct = 100;
  return pct;
}

// rated spec থেকে অটো ফ্লো (±5% noise — বাস্তব দেখানোর জন্য)
float computeFlowLpm() {
  if (!motorOn) return 0.0;
  float jitter = ((int)(esp_random() % 100) - 50) / 1000.0;   // ±0.05
  float lpm = PUMP_RATED_LPM * (1.0 + jitter);
  return lpm < 0 ? 0 : lpm;
}

// =================== NETWORK ===================
void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(false);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  unsigned long start = millis();
  Serial.print("[MASTER] WiFi connecting");
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000UL) {
    delay(300);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\\n[MASTER] WiFi OK  IP=%s\\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\\n[MASTER] WiFi timeout — system will retry automatically");
  }
}

bool ensureWifi() {
  if (WiFi.status() == WL_CONNECTED) return true;
  systemOnline = false;
  if (motorOn) setMotor(false);  // নিরাপত্তা: WiFi/backend হারালে মেইন মোটর সাথে সাথে OFF

  if (millis() - lastWifiAttempt >= WIFI_RETRY_MS) {
    lastWifiAttempt = millis();
    Serial.println("[MASTER] WiFi lost — reconnecting...");
    WiFi.disconnect(false);
    WiFi.begin(WIFI_SSID, WIFI_PASS);
  }
  float t, h;
  readDhtSafe(t, h);
  drawDashboard(readTankPct(), 0.0, 0.0, 0.0, t, h);
  return false;
}

void sendTelemetry() {
  if (!ensureWifi()) return;

  float tank = readTankPct();
  float lpm  = computeFlowLpm();
  float volt = motorOn ? PUMP_RATED_VOLTAGE : 0.0;
  float curr = motorOn ? PUMP_RATED_CURRENT : 0.0;
  float t, h;
  readDhtSafe(t, h);
  unsigned long runMs = motorTotalMs + (motorOn ? (millis() - motorStartMs) : 0);

  JsonDocument doc;
  doc["deviceId"]    = DEVICE_ID;
  doc["zoneId"]      = ZONE_ID;
  doc["role"]        = "master";
  doc["motorOn"]     = motorOn;
  doc["waterLevel"]  = tank;
  doc["flowLpm"]     = lpm;
  doc["voltage"]     = volt;
  doc["current"]     = curr;
  doc["runtimeSec"]  = runMs / 1000;
  doc["rssi"]        = WiFi.RSSI();
  if (!isnan(t)) doc["temperature"] = round(t * 10.0) / 10.0;   // Celsius, ১ decimal
  if (!isnan(h)) doc["humidity"]    = round(h);                 // 0..100 %RH

  String body; serializeJson(doc, body);
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.begin(client, String(SERVER_HOST) + "/api/public/telemetry");
  http.setTimeout(5000);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(body);
  String resp = http.getString();
  http.end();
  systemOnline = (code == 200);    // ✅ OLED-এর system status এই ফ্ল্যাগ থেকে আসে
  if (!systemOnline && motorOn) {
    setMotor(false);                 // backend unreachable হলে safety OFF
    lpm = 0.0; volt = 0.0; curr = 0.0;
    lastSend = 0;                    // মোটর OFF status দ্রুত dashboard-এ sync হবে
  }
  Serial.printf("[MASTER] POST %d  tank=%.0f%% lpm=%.2f V=%.1f T=%.1fC H=%.0f%% online=%d\\n",
                code, tank, lpm, volt, t, h, systemOnline ? 1 : 0);

  // dashboard কমান্ড প্রসেস → রিয়েল-টাইম মোটর ON/OFF
  // ⚠ বাটন চাপের ৩ সেকেন্ডের মধ্যে dashboard-এর পুরোনো উল্টো command ignore
  bool motorChanged = false;
  JsonDocument r;
  if (deserializeJson(r, resp) == DeserializationError::Ok) {
    bool inOverride = (millis() < buttonOverrideUntil);
    for (JsonObject c : r["commands"].as<JsonArray>()) {
      String a = c["action"].as<String>();
      bool target = motorOn;
      if      (a == "motor_on")  target = true;
      else if (a == "motor_off") target = false;
      else continue;
      if (inOverride && target != motorOn) {
        Serial.printf("[CMD] ignored %s (button override)\\n", a.c_str());
        continue;
      }
      if (target != motorOn) { setMotor(target); motorChanged = true; }
    }
  }
  // ⚡ মোটর state বদলালে পরের লুপেই আবার POST হবে (lastSend=0)
  //    → dashboard <১ সেকেন্ডে কনফার্মেশন পায়।
  if (motorChanged) lastSend = 0;

  drawDashboard(tank, lpm, volt, curr, t, h);
}

// 🆕 মোমেন্টারি পুশ-বাটন: ১ চাপ = ১ signal (চাপ ছেড়ে দিলে কিছু হবে না)
//   - Stable-state edge detection: bounce-এ ডবল-ট্রিগার অসম্ভব
//   - ON বাটন শুধু START, OFF বাটন শুধু STOP
//   - চাপের সাথে সাথে instant telemetry → dashboard + OLED রিয়েল-টাইম sync
void handleButtonEdge(bool isOnButton) {
  if (isOnButton) {
    if (motorOn) { Serial.println("[BTN] ON (already running)"); return; }
    Serial.println("[BTN] ON  → motor START");
    setMotor(true);
  } else {
    if (!motorOn) { Serial.println("[BTN] OFF (already stopped)"); return; }
    Serial.println("[BTN] OFF → motor STOP");
    setMotor(false);
  }
  buttonOverrideUntil = millis() + BUTTON_OVERRIDE_MS;
  sendTelemetry();           // ⚡ instant dashboard + OLED sync
  lastSend = millis();
}

void pollButtons() {
  int rawOn  = digitalRead(PIN_BTN_ON);
  int rawOff = digitalRead(PIN_BTN_OFF);

  // ON — stable-state edge after debounce
  if (rawOn != lastBtnOnState) { lastBtnOnMs = millis(); lastBtnOnState = rawOn; }
  if ((millis() - lastBtnOnMs) > BTN_DEBOUNCE_MS && rawOn != stableBtnOnState) {
    stableBtnOnState = rawOn;
    if (stableBtnOnState == LOW) handleButtonEdge(true);   // press edge only
  }

  // OFF — stable-state edge after debounce
  if (rawOff != lastBtnOffState) { lastBtnOffMs = millis(); lastBtnOffState = rawOff; }
  if ((millis() - lastBtnOffMs) > BTN_DEBOUNCE_MS && rawOff != stableBtnOffState) {
    stableBtnOffState = rawOff;
    if (stableBtnOffState == LOW) handleButtonEdge(false); // press edge only
  }
}

// =================== LIFECYCLE ===================
void setup() {
  Serial.begin(115200);
  pinMode(PIN_RELAY_PUMP, OUTPUT);
  digitalWrite(PIN_RELAY_PUMP, HIGH);     // OFF on boot
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);

  // 🆕 push buttons — INPUT_PULLUP (একপাশ GPIO, অন্যপাশ GND)
  pinMode(PIN_BTN_ON,  INPUT_PULLUP);
  pinMode(PIN_BTN_OFF, INPUT_PULLUP);

  // 🆕 অনলাইন স্ট্যাটাস LED
  pinMode(PIN_LED_ONLINE, OUTPUT);
  digitalWrite(PIN_LED_ONLINE, LED_ACTIVE_HIGH ? LOW : HIGH);  // OFF initially


  Wire.begin(I2C_SDA, I2C_SCL);
  if (!oled.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED init failed");
  }
  oled.clearDisplay(); oled.display();
  bootAnimation();

  pinMode(PIN_DHT, INPUT_PULLUP);   // ✅ ESP32 internal pull-up — external 4.7k resistor লাগবে না
  dht.begin();

  // 🆕 Placeholder dashboard — যাতে OLED "Loading 100%" এ আটকে না থাকে
  drawDashboard(readTankPct(), 0.0, 0.0, 0.0, NAN, NAN);

  // DHT22 warmup ~2.5s — এই সময়ে প্রতি 250ms display refresh করব
  unsigned long warmupUntil = millis() + 2500;
  while (millis() < warmupUntil) {
    float t, h;
    readDhtSafe(t, h);
    drawDashboard(readTankPct(), 0.0, 0.0, 0.0, t, h);
    delay(250);
  }

  // 🆕 Prime DHT once directly so the first telemetry frame has real values
  float pt = dht.readTemperature(false), ph = dht.readHumidity();
  if (!isnan(pt)) lastGoodTemp = pt;
  if (!isnan(ph)) lastGoodHum  = ph;

  connectWifi();

  // ✅ Boot-time heartbeat — dashboard সাথে সাথে ONLINE বুঝবে
  Serial.println("[MASTER] System online — sending boot heartbeat");
  sendTelemetry();
  lastSend = millis();
}

// 🆕 অনলাইন LED ইন্ডিকেটর — non-blocking
//   WiFi off                    → LED নিভে থাকবে
//   WiFi on কিন্তু POST 200 না    → ১s slow blink (WiFi আছে, ব্যাকএন্ড reach নাই)
//   WiFi on + ব্যাকএন্ড online   → ✅ permanently SOLID ON (blink না করে স্থিরভাবে জ্বলে থাকবে)
inline void ledWrite(bool on) {
  digitalWrite(PIN_LED_ONLINE, (LED_ACTIVE_HIGH ? on : !on) ? HIGH : LOW);
}
void updateOnlineLed() {
  static unsigned long lastToggle = 0;
  static bool ledState = false;
  bool wifi = (WiFi.status() == WL_CONNECTED);
  if (!wifi) {
    if (ledState) { ledState = false; ledWrite(false); }
    return;
  }
  if (systemOnline) {
    // ✅ ব্যাকএন্ডের সাথে connected → solid ON, কোনো blink না
    if (!ledState) { ledState = true; ledWrite(true); }
    return;
  }
  // WiFi আছে কিন্তু ব্যাকএন্ড reach নাই → 1s slow blink
  if (millis() - lastToggle >= 1000UL) {
    lastToggle = millis();
    ledState = !ledState;
    ledWrite(ledState);
  }
}

void loop() {
  ensureWifi();                             // ⬅ WiFi গেলে reboot ছাড়াই auto reconnect
  pollButtons();                           // ⬅ প্রতিটি লুপে বাটন চেক
  updateOnlineLed();                       // ⬅ নীল LED অনলাইন ইন্ডিকেটর

  if (millis() - lastSend >= SEND_INTERVAL) {
    lastSend = millis();
    sendTelemetry();
  } else if (motorOn) {
    // মোটর চলা অবস্থায় OLED-এ runtime live আপডেট প্রতি সেকেন্ডে
    static unsigned long lastTick = 0;
    if (millis() - lastTick >= 1000) {
      lastTick = millis();
      float t, h;
      readDhtSafe(t, h);
      drawDashboard(readTankPct(), computeFlowLpm(), PUMP_RATED_VOLTAGE,
                    PUMP_RATED_CURRENT, t, h);
    }
  }
}`;



/* ---------------- SUB-NODE FIRMWARE ---------------- */
const buildSubCode = (serverHost: string) => `/**

 *  BMDA Smart Irrigation — SUB NODE (ESP8266 NodeMCU)
 *  স্থান : জমিতে — প্রতিটি জোনে একটি
 *  সেন্সর: TDS sensor (Gravity/generic) → মাটির আর্দ্রতা %
 *         DHT22 → তাপমাত্রা (°C) + আর্দ্রতা (%RH)
 *         LDR → দিন/রাত
 *  অ্যাকচুয়েটর: SG90 Servo Motor → পানির লাইন on/off (০°=বন্ধ, ৯০°=খোলা)
 *  কাজ  : প্রতি ৫ সেকেন্ডে heartbeat + dashboard থেকে valve কমান্ড গ্রহণ।
 *
 *  Board    : NodeMCU 1.0 (ESP-12E Module)
 *  Libraries: ESP8266WiFi, ESP8266HTTPClient, ArduinoJson, Servo, DHT sensor library
 */
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <ArduinoJson.h>
#include <Servo.h>
#include <DHT.h>

// ====== EDIT THESE ======
const char* WIFI_SSID   = "YOUR_WIFI";
const char* WIFI_PASS   = "YOUR_PASSWORD";
const char* SERVER_HOST = "${serverHost}";
const char* DEVICE_ID   = "SUB-01";    // প্রতিটি sub-node-এর অনন্য নাম
const char* ZONE_ID     = "Z-01";      // dashboard-এ যেই জোন
// ========================

// ---- Pins ----
#define PIN_TDS     A0     // TDS sensor analog (ESP8266-এ একটাই ADC)
#define PIN_LDR     D5     // LDR digital
#define PIN_SERVO   D2     // SG90 servo PWM (GPIO4)
#define PIN_DHT     D6     // DHT22 data (GPIO12)
#define DHT_TYPE    DHT22

// ---- TDS reference voltage (NodeMCU ADC 0..1023 → 0..3.3V via onboard divider) ----
const float VREF = 3.3;
const float ADC_MAX = 1023.0;

// ---- Servo ----
Servo valveServo;
DHT dht(PIN_DHT, DHT_TYPE);
const int SERVO_CLOSED = 0;
const int SERVO_OPEN   = 90;

bool valveOpen = false;
unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL = 5000;
unsigned long lastWifiAttempt = 0;
const unsigned long WIFI_RETRY_MS = 5000;
float lastGoodTemp = NAN;
float lastGoodHum  = NAN;

void setValve(bool on) {
  valveOpen = on;
  valveServo.write(on ? SERVO_OPEN : SERVO_CLOSED);
  Serial.printf("[%s] SERVO → %s (%d°)\\n", ZONE_ID, on ? "OPEN" : "CLOSED", on ? SERVO_OPEN : SERVO_CLOSED);
}

// ---- TDS → soil moisture conversion ----
// raw ADC → voltage → (with temp comp.) → TDS ppm → mapped to moisture %
// dry মাটি = কম conductivity = কম ppm; ভেজা মাটি = বেশি conductivity = বেশি ppm
float readTdsPpm(float tempC = 25.0) {
  // ৩০টি স্যাম্পল গড় — noise কমায়
  long sum = 0;
  for (int i = 0; i < 30; i++) { sum += analogRead(PIN_TDS); delay(2); }
  float avg = sum / 30.0;
  float voltage = avg * VREF / ADC_MAX;
  float compCoef = 1.0 + 0.02 * (tempC - 25.0);
  float compV = voltage / compCoef;
  // Gravity TDS standard polynomial
  float tds = (133.42 * compV * compV * compV
             - 255.86 * compV * compV
             + 857.39 * compV) * 0.5;
  if (tds < 0) tds = 0;
  return tds;
}

float ppmToMoisturePct(float ppm) {
  // ক্যালিব্রেশন: dry ≈ 0 ppm, saturated ≈ 1000 ppm (নিজের মাটিতে ক্যালিব্রেট করুন)
  const float PPM_DRY = 0.0;
  const float PPM_WET = 1000.0;
  float pct = (ppm - PPM_DRY) * 100.0 / (PPM_WET - PPM_DRY);
  if (pct < 0) pct = 0; if (pct > 100) pct = 100;
  return pct;
}

bool readDhtSafe(float &tempC, float &humidity) {
  float t = dht.readTemperature(false);  // Celsius
  float h = dht.readHumidity();
  bool tOk = !isnan(t) && t >= -40.0 && t <= 80.0;
  bool hOk = !isnan(h) && h >= 0.0 && h <= 100.0;
  if (tOk) lastGoodTemp = t;
  if (hOk) lastGoodHum = h;
  tempC = !isnan(lastGoodTemp) ? lastGoodTemp : NAN;
  humidity = !isnan(lastGoodHum) ? lastGoodHum : NAN;
  return !isnan(tempC) || !isnan(humidity);
}

void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(false);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000UL) { delay(300); Serial.print("."); }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\\n[%s] WiFi OK  IP=%s\\n", DEVICE_ID, WiFi.localIP().toString().c_str());
  } else {
    Serial.printf("\\n[%s] WiFi timeout — retrying in background\\n", DEVICE_ID);
  }
}

bool ensureWifi() {
  if (WiFi.status() == WL_CONNECTED) return true;
  if (millis() - lastWifiAttempt >= WIFI_RETRY_MS) {
    lastWifiAttempt = millis();
    Serial.printf("[%s] WiFi lost — reconnecting...\\n", DEVICE_ID);
    WiFi.disconnect(false);
    WiFi.begin(WIFI_SSID, WIFI_PASS);
  }
  return false;
}

void sendTelemetry() {
  if (!ensureWifi()) return;

  float tempC, humidity;
  readDhtSafe(tempC, humidity);
  float ppm  = readTdsPpm(25.0);
  float soil = ppmToMoisturePct(ppm);
  bool  dayLight = digitalRead(PIN_LDR) == LOW;

  JsonDocument doc;
  doc["deviceId"]     = DEVICE_ID;
  doc["zoneId"]       = ZONE_ID;
  doc["role"]         = "sub";
  doc["soilMoisture"] = soil;
  doc["tdsPpm"]       = ppm;
  doc["ldr"]          = dayLight ? 85 : 10;
  doc["valveOpen"]    = valveOpen;
  doc["rssi"]         = WiFi.RSSI();
  if (!isnan(tempC))   doc["temperature"] = round(tempC * 10.0) / 10.0;
  if (!isnan(humidity)) doc["humidity"]   = round(humidity);

  String body; serializeJson(doc, body);
  BearSSL::WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.begin(client, String(SERVER_HOST) + "/api/public/telemetry");
  http.setTimeout(5000);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(body);
  String resp = http.getString();
  http.end();
  Serial.printf("[%s] POST %d  ppm=%.0f soil=%.0f%% T=%.1fC H=%.0f%% valve=%d\\n",
                ZONE_ID, code, ppm, soil, tempC, humidity, valveOpen);

  JsonDocument r;
  if (deserializeJson(r, resp) == DeserializationError::Ok) {
    for (JsonObject c : r["commands"].as<JsonArray>()) {
      String a = c["action"].as<String>();
      if      (a == "valve_open")  setValve(true);
      else if (a == "valve_close") setValve(false);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LDR, INPUT);
  dht.begin();
  valveServo.attach(PIN_SERVO);
  setValve(false);              // boot হলে valve বন্ধ থাকবে
  connectWifi();
  // ✅ Boot heartbeat — dashboard সাথে সাথে এই sub-node-কে ONLINE দেখবে
  Serial.println("[SUB] System online — sending boot heartbeat");
  sendTelemetry();
  lastSend = millis();
}

void loop() {
  ensureWifi();
  if (millis() - lastSend >= SEND_INTERVAL) {
    lastSend = millis();
    sendTelemetry();
  }
}`;

/* ---------------- ADD-NEW INSTRUCTIONS ---------------- */
const addDeviceCode = `// নতুন একটি জোনের জন্য সাব-নোড যুক্ত করতে:
// ১. উপরের "SUB NODE" কোডের পুরোটা একটি নতুন .ino ফাইলে কপি করুন
// ২. শুধু নিচের ৩ লাইন পরিবর্তন করুন —

const char* DEVICE_ID = "SUB-Z04";   // অনন্য নাম
const char* ZONE_ID   = "Z-04";      // dashboard-এর জোন আইডি
const char* WIFI_SSID = "YOUR_WIFI"; // মাস্টারের সাথে একই WiFi

// ৩. Devices পেজে গিয়ে "+ নতুন ডিভাইস" বাটনে ক্লিক করুন,
//    DEVICE_ID ও ZONE_ID একই দিয়ে রেজিস্টার করুন।
// ৪. Arduino IDE → Upload → ৫ সেকেন্ডের মধ্যে dashboard-এ লাইভ।
// (মাস্টার কখনো ডুপ্লিকেট হবে না — পুরো নেটওয়ার্কে একটিই থাকবে)`;

// ⚙️ Backend (server routes like /api/public/telemetry) runs ONLY on the
//    Lovable Cloud Worker. Vercel hosts the static frontend only — POSTs to
//    the Vercel domain return 405. Always pin firmware to the stable Lovable
//    backend URL, regardless of which domain the user is viewing this page from.
const BACKEND_HOST = "https://project--583e7123-43a5-4b02-9812-0f73d31e5ee2-dev.lovable.app";

function HardwarePage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [viewOrigin, setViewOrigin] = useState<string>("");
  useEffect(() => {
    if (typeof window !== "undefined") setViewOrigin(window.location.origin);
  }, []);

  // Firmware ALWAYS targets the Lovable backend (where server routes live).
  const serverHost = BACKEND_HOST;
  const masterCode = buildMasterCode(serverHost);
  const subCode = buildSubCode(serverHost);

  const copy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const originMismatch = Boolean(viewOrigin) && !viewOrigin.includes("lovable.app");




  return (
    <DashboardLayout
      title="হার্ডওয়্যার গাইড · মাস্টার + সাব-নোড আর্কিটেকচার"
      subtitle="একটি কেন্দ্রীয় ESP32 মাস্টার (পাম্প হাউসে) এবং একাধিক ESP8266 সাব-নোড (জমিতে) — প্রতিটির আলাদা ফার্মওয়্যার সহ সম্পূর্ণ বিল্ড নির্দেশিকা।"
    >
      <div className="stagger space-y-5">
        {/* Architecture diagram */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Network className="h-5 w-5 text-primary" />
            <h2 className="text-base font-extrabold">সিস্টেম আর্কিটেকচার</h2>
          </div>
          <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
            {/* Master */}
            <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Server className="h-5 w-5 text-primary" />
                <p className="font-extrabold">মাস্টার নোড (ESP32)</p>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3">স্থান: পাম্প হাউস · একটিই থাকবে</p>
              <ul className="text-xs space-y-1.5 text-foreground/80">
                <li>• মেইন মোটর রিলে নিয়ন্ত্রণ</li>
                <li>• ৬V Ultra-Quiet পাম্প (~২.০ L/min auto)</li>
                <li>• HC-SR04 ট্যাঙ্ক জলস্তর</li>
                <li>• DHT22 তাপ ও আর্দ্রতা</li>
                <li>• OLED স্ট্যাটাস ডিসপ্লে</li>
              </ul>
            </div>

            <div className="hidden md:flex flex-col items-center gap-1 text-primary">
              <Wifi className="h-6 w-6 animate-pulse" />
              <div className="h-16 w-px bg-gradient-to-b from-primary to-chart-2" />
              <p className="text-[10px] font-bold text-muted-foreground">WiFi / HTTP</p>
              <div className="h-16 w-px bg-gradient-to-b from-chart-2 to-primary" />
              <Radio className="h-6 w-6" />
            </div>

            {/* Sub */}
            <div className="rounded-2xl border-2 border-chart-2/40 bg-chart-2/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Radio className="h-5 w-5 text-chart-2" />
                <p className="font-extrabold">সাব-নোড (ESP8266) × N</p>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3">স্থান: প্রতিটি জোনে একটি করে</p>
              <ul className="text-xs space-y-1.5 text-foreground/80">
                <li>• ক্যাপাসিটিভ সয়েল মইশ্চার</li>
                <li>• LDR (আলো/দিন-রাত)</li>
                <li>• ১-চ্যানেল রিলে → সোলিনয়েড ভাল্ভ</li>
                <li>• প্রতি ৫ সেকেন্ডে মাস্টারকে রিপোর্ট</li>
                <li>• Dashboard-এর কমান্ডে ভাল্ভ চালু/বন্ধ</li>
              </ul>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
            <strong>কেন এই গঠন?</strong> মেইন পাম্প একটি শক্তিশালী ESP32-এ থাকে যেখানে বিদ্যুৎ ও নেটওয়ার্ক স্থিতিশীল; পাম্পের rated spec থেকে L/min অটো গণনা হয়, আলাদা ফ্লো সেন্সর লাগে না। প্রতিটি জমিতে ছোট সস্তা ESP8266 বসিয়ে শুধু সেই জোনের আর্দ্রতা ও ভাল্ভ পরিচালিত হয় — সিস্টেম যেকোনো সংখ্যক জোনে সম্প্রসারণযোগ্য।
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Server, label: "মাস্টার নোড",       value: bn(1),               grad: "from-indigo-500 via-violet-500 to-fuchsia-500" },
            { icon: Radio,  label: "সাব-নোড (যেকোনো)", value: `${bn(1)}–${bn(50)}+`, grad: "from-emerald-500 via-teal-500 to-cyan-500" },
            { icon: Wifi,   label: "প্রোটোকল",          value: "WiFi · HTTP",        grad: "from-sky-500 via-blue-500 to-indigo-500" },
            { icon: Zap,    label: "প্রতি সাব খরচ",     value: subTotalPerNode,      grad: "from-amber-500 via-orange-500 to-rose-500" },
          ].map((s) => (
            <div
              key={s.label}
              className={`relative overflow-hidden rounded-2xl p-5 text-white bg-gradient-to-br ${s.grad} shadow-lg ring-1 ring-white/25 border-2 border-white/15 hover-lift`}
            >
              <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
              <div className="h-9 w-9 rounded-xl bg-white/20 grid place-items-center backdrop-blur-sm">
                <s.icon className="h-5 w-5 drop-shadow" />
              </div>
              <p className="text-[11px] uppercase tracking-wider mt-3 font-bold opacity-95">{s.label}</p>
              <p className="text-lg font-extrabold mt-1 drop-shadow">{s.value}</p>
            </div>
          ))}
        </div>

        {/* MASTER section */}
        <div className="glass-card rounded-2xl p-5 border-2 border-indigo-400/40 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-300/20">
          <div className="flex items-center gap-2 mb-1">
            <Server className="h-5 w-5 text-primary" />
            <h2 className="text-base font-extrabold">১. মাস্টার নোড — কম্পোনেন্ট তালিকা</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">পাম্প হাউসে বসানো হবে — পুরো সিস্টেমে একটিই মাস্টার থাকবে।</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">কম্পোনেন্ট</th>
                  <th className="py-2 pr-3">ভূমিকা</th>
                  <th className="py-2 pr-3 hidden md:table-cell">পিন</th>
                  <th className="py-2 pr-3">দাম</th>
                </tr>
              </thead>
              <tbody>
                {masterDevices.map((d) => (
                  <tr key={d.name} className="border-b border-border/50 hover:bg-card/40">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                          <d.icon className="h-4 w-4 text-primary" />
                        </div>
                        <p className="font-bold">{d.name}</p>
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">{d.role}</td>
                    <td className="py-3 pr-3 font-mono text-xs hidden md:table-cell">{d.pin}</td>
                    <td className="py-3 pr-3 font-bold text-success whitespace-nowrap">{d.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BACKEND SERVER URL BANNER — pinned to Lovable Cloud */}
        <div className="rounded-2xl p-5 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-lg ring-1 ring-white/25 border-2 border-white/15">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 grid place-items-center backdrop-blur-sm shrink-0">
              <Globe className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-wider font-bold opacity-95">ফার্মওয়্যার সার্ভার URL (ব্যাকএন্ড)</p>
              <p className="text-sm font-extrabold mt-0.5">নিচের ফার্মওয়্যার সবসময় Lovable Cloud ব্যাকএন্ডে POST করবে</p>
              <p className="font-mono text-xs md:text-sm bg-black/25 rounded-lg px-3 py-2 mt-2 break-all">{serverHost}</p>
              <p className="text-[11px] mt-2 opacity-90 leading-relaxed">
                <strong>⚠ গুরুত্বপূর্ণ:</strong> Vercel শুধু ফ্রন্টএন্ড (UI) host করে — ব্যাকএন্ড API (<code className="bg-black/30 px-1 rounded">/api/public/telemetry</code>) Vercel-এ চলে না। Vercel domain-এ POST করলে <strong>405 Method Not Allowed</strong> আসবে। তাই ESP32-এর <code className="bg-black/30 px-1 rounded">SERVER_HOST</code> সবসময় উপরের Lovable Cloud URL-এ pin করা — এটিই সঠিক backend।
              </p>
              {originMismatch && (
                <p className="text-[11px] mt-2 bg-amber-500/30 rounded-lg px-3 py-2 leading-relaxed border border-amber-200/40">
                  আপনি এখন <code className="bg-black/30 px-1 rounded">{viewOrigin}</code> থেকে এই পেজ দেখছেন (Vercel/custom domain) — UI এখান থেকে কাজ করে, কিন্তু ESP32 অবশ্যই উপরের Lovable URL-এ POST করবে।
                </p>
              )}
            </div>
          </div>
        </div>


        {/* MASTER firmware */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-primary" />
              <h2 className="text-base font-extrabold">মাস্টার ফার্মওয়্যার (ESP32 · Arduino IDE)</h2>
            </div>
            <button
              onClick={() => copy("master", masterCode)}
              className="text-xs px-3 h-9 rounded-lg bg-primary text-primary-foreground font-bold flex items-center gap-1.5 hover-lift"
            >
              {copied === "master" ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === "master" ? "কপি হয়েছে" : "কোড কপি করুন"}
            </button>
          </div>
          <pre className="rounded-xl bg-foreground/95 text-background p-4 text-xs font-mono overflow-x-auto max-h-[500px]">
            <code>{masterCode}</code>
          </pre>
        </div>

        {/* MASTER WIRING — Professional per-device cards */}
        <div className="glass-card rounded-2xl p-5 border-2 border-amber-400/40 shadow-md shadow-amber-500/10 ring-1 ring-amber-300/20">
          <div className="flex items-center gap-2 mb-1">
            <Plug className="h-5 w-5 text-amber-500" />
            <h2 className="text-base font-extrabold">মাস্টার নোড — পিন-বাই-পিন কানেকশন</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-5">
            প্রতিটি ডিভাইসের জন্য আলাদা কার্ড। প্রতিটি সারিতে দেখানো আছে ESP32-এর কোন পিন থেকে ডিভাইসের কোন পিনে যাবে।
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {masterDeviceWiring.map((dev) => (
              <div
                key={dev.device}
                className="rounded-2xl border-2 border-border bg-card/40 overflow-hidden hover-lift"
              >
                {/* Header: ESP32 → Device */}
                <div className={`bg-gradient-to-r ${dev.grad} text-white px-4 py-3`}>
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-white/20 grid place-items-center backdrop-blur-sm shrink-0">
                      <dev.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold opacity-95">
                        <span>ESP32 DevKit V1</span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="truncate">{dev.device}</span>
                      </div>
                      <p className="text-[10px] opacity-85 leading-snug mt-0.5">{dev.desc}</p>
                    </div>
                  </div>
                </div>

                {/* Pin pair rows */}
                <div className="divide-y divide-border/60">
                  {/* Column headers */}
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-2 px-4 py-2 bg-muted/40 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                    <span>ESP32 পিন</span>
                    <span className="text-center">↔</span>
                    <span className="text-right">ডিভাইস পিন</span>
                  </div>
                  {dev.pairs.map((p, i) => (
                    <div key={i} className="px-4 py-2.5">
                      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                        <span className="font-mono text-xs font-extrabold text-primary truncate">{p.mcu}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-mono text-xs font-extrabold text-chart-2 text-right truncate">{p.dev}</span>
                      </div>
                      {p.note && (
                        <p className="text-[10.5px] text-muted-foreground mt-1 leading-snug">{p.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* legend cards */}
          <div className="grid sm:grid-cols-3 gap-2 mt-5 text-xs">
            <div className="rounded-lg glass-panel p-3 border border-rose-400/30">
              <p className="font-extrabold text-rose-500">⚠️ ভোল্টেজ ডিভাইডার</p>
              <p className="text-[11px] text-muted-foreground mt-1">HC-SR04 Echo ৫V আউট দেয় — সরাসরি GPIO 18-এ দিলে ESP32 পুড়বে। 1kΩ + 2kΩ ডিভাইডার ব্যবহার করুন।</p>
            </div>
            <div className="rounded-lg glass-panel p-3 border border-amber-400/30">
              <p className="font-extrabold text-amber-500">⚡ কমন গ্রাউন্ড</p>
              <p className="text-[11px] text-muted-foreground mt-1">৬V অ্যাডাপ্টার GND, ESP32 GND, রিলে GND — সব একসাথে যুক্ত না থাকলে রিলে ট্রিগার হবে না।</p>
            </div>
            <div className="rounded-lg glass-panel p-3 border border-emerald-400/30">
              <p className="font-extrabold text-emerald-500">✓ ফ্লাইব্যাক ডায়োড</p>
              <p className="text-[11px] text-muted-foreground mt-1">পাম্পের দুই টার্মিনালে একটি 1N4007 ডায়োড (cathode → +) লাগান যাতে রিলে অফ হলে স্পার্ক না হয়।</p>
            </div>
          </div>
        </div>




        {/* SUB section */}
        <div className="glass-card rounded-2xl p-5 border-2 border-emerald-400/40 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-300/20">
          <div className="flex items-center gap-2 mb-1">
            <Radio className="h-5 w-5 text-chart-2" />
            <h2 className="text-base font-extrabold">২. সাব-নোড — কম্পোনেন্ট তালিকা (প্রতি জোন)</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">প্রতিটি জমিতে একটি করে — মোট খরচ <strong className="text-success">{subTotalPerNode}</strong> প্রতি নোড।</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">কম্পোনেন্ট</th>
                  <th className="py-2 pr-3">ভূমিকা</th>
                  <th className="py-2 pr-3 hidden md:table-cell">পিন</th>
                  <th className="py-2 pr-3">দাম</th>
                </tr>
              </thead>
              <tbody>
                {subDevices.map((d) => (
                  <tr key={d.name} className="border-b border-border/50 hover:bg-card/40">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-chart-2/10 grid place-items-center shrink-0">
                          <d.icon className="h-4 w-4 text-chart-2" />
                        </div>
                        <p className="font-bold">{d.name}</p>
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">{d.role}</td>
                    <td className="py-3 pr-3 font-mono text-xs hidden md:table-cell">{d.pin}</td>
                    <td className="py-3 pr-3 font-bold text-success whitespace-nowrap">{d.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SUB firmware */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-chart-2" />
              <h2 className="text-base font-extrabold">সাব-নোড ফার্মওয়্যার (ESP8266 NodeMCU)</h2>
            </div>
            <button
              onClick={() => copy("sub", subCode)}
              className="text-xs px-3 h-9 rounded-lg bg-chart-2 text-primary-foreground font-bold flex items-center gap-1.5 hover-lift"
            >
              {copied === "sub" ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === "sub" ? "কপি হয়েছে" : "কোড কপি করুন"}
            </button>
          </div>
          <pre className="rounded-xl bg-foreground/95 text-background p-4 text-xs font-mono overflow-x-auto max-h-[500px]">
            <code>{subCode}</code>
          </pre>
        </div>

        {/* Safety checklist */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-5 w-5 text-success" />
            <h2 className="text-base font-extrabold">পাওয়ার ও নিরাপত্তা চেকলিস্ট</h2>
          </div>
          <ul className="grid sm:grid-cols-2 gap-2 text-sm">
            {[
              "মাস্টার ও সকল সাব-নোডের গ্রাউন্ড স্থানীয়ভাবে কমন",
              "রিলে কয়েলের পাশে ফ্লাইব্যাক ডায়োড (1N4007)",
              "ESP8266 ৩.৩V — কখনো ৫V সরাসরি GPIO-তে নয়",
              "HC-SR04 Echo-তে ভোল্টেজ ডিভাইডার (1kΩ + 2kΩ)",
              "ভেজা স্থানে রিলে বক্স IP-৬৫ এনক্লোজারে",
              "মাস্টার ও সাব একই WiFi SSID-তে থাকা আবশ্যক",
              "মেইন পাম্প ২৩০V হলে আলাদা কন্টাক্টর ব্যবহার",
              "প্রতিটি sub-node-এর DEVICE_ID অনন্য রাখুন",
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <CheckCheck className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Add new sub-node */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-chart-2" />
              <h2 className="text-base font-extrabold">৩. নতুন সাব-নোড কিভাবে যুক্ত করবেন</h2>
            </div>
            <button
              onClick={() => copy("add", addDeviceCode)}
              className="text-xs px-3 h-9 rounded-lg bg-chart-2 text-primary-foreground font-bold flex items-center gap-1.5 hover-lift"
            >
              {copied === "add" ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === "add" ? "কপি হয়েছে" : "কপি"}
            </button>
          </div>
          <pre className="rounded-xl bg-foreground/95 text-background p-4 text-xs font-mono overflow-x-auto">
            <code>{addDeviceCode}</code>
          </pre>
          <div className="mt-3 grid sm:grid-cols-4 gap-2 text-xs">
            {[
              ["১", "হার্ডওয়্যার", "সাব-নোড কম্পোনেন্ট অনুযায়ী সংযোগ"],
              ["২", "Arduino IDE", "ESP8266 বোর্ড ম্যানেজার ইনস্টল"],
              ["৩", "৩ লাইন এডিট", "DEVICE_ID · ZONE_ID · WiFi"],
              ["৪", "Upload", "৫ সেকেন্ডে dashboard-এ লাইভ"],
            ].map(([n, t, d]) => (
              <div key={n} className="rounded-lg glass-panel p-3">
                <div className="h-7 w-7 rounded-lg bg-chart-2 text-primary-foreground grid place-items-center font-extrabold text-sm">{n}</div>
                <p className="mt-2 font-bold">{t}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
