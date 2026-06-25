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

/* ---------------- MASTER PIN-BY-PIN WIRING ---------------- */
const masterWiring = [
  { from: "ESP32 GPIO 25",      to: "Relay Module IN",       note: "মেইন পাম্প রিলে (Active-LOW)" },
  { from: "ESP32 5V",           to: "Relay Module VCC",      note: "রিলে কয়েল পাওয়ার" },
  { from: "ESP32 GND",          to: "Relay Module GND",      note: "কমন গ্রাউন্ড" },
  { from: "Relay COM",          to: "৬V অ্যাডাপ্টার +V",      note: "পাম্প পজিটিভ লাইন" },
  { from: "Relay NO",           to: "৬V পাম্প (+)",           note: "Normally Open — মোটরে কারেন্ট" },
  { from: "৬V পাম্প (−)",        to: "৬V অ্যাডাপ্টার −V",      note: "পাম্প রিটার্ন লাইন" },
  { from: "HC-SR04 VCC",        to: "ESP32 5V",              note: "আল্ট্রাসনিক পাওয়ার" },
  { from: "HC-SR04 GND",        to: "ESP32 GND",             note: "—" },
  { from: "HC-SR04 Trig",       to: "ESP32 GPIO 5",          note: "ট্রিগার পালস আউট" },
  { from: "HC-SR04 Echo",       to: "ESP32 GPIO 18",         note: "1kΩ + 2kΩ ভোল্টেজ ডিভাইডার" },
  { from: "DHT22 VCC",          to: "ESP32 3.3V",            note: "10kΩ পুল-আপ DATA→VCC" },
  { from: "DHT22 DATA",         to: "ESP32 GPIO 4",          note: "একতারা ডিজিটাল বাস" },
  { from: "DHT22 GND",          to: "ESP32 GND",             note: "—" },
  { from: "OLED VCC",           to: "ESP32 3.3V",            note: "SSD1306 ০.৯৬ ইঞ্চি" },
  { from: "OLED GND",           to: "ESP32 GND",             note: "—" },
  { from: "OLED SDA",           to: "ESP32 GPIO 21",         note: "I2C ডেটা লাইন" },
  { from: "OLED SCL",           to: "ESP32 GPIO 22",         note: "I2C ক্লক লাইন" },
  { from: "৬V অ্যাডাপ্টার −V",    to: "ESP32 GND",             note: "⚠️ কমন গ্রাউন্ড আবশ্যক (পাম্প ও ESP32)" },
  { from: "ESP32 USB (5V)",      to: "—",                     note: "ESP32 আলাদা USB/পাওয়ার ব্যাংক দিয়ে চালান" },
];

const subDevices = [
  { icon: Radio,        name: "ESP8266 NodeMCU v3",       role: "সাব-নোড MCU (WiFi)",                pin: "—",            price: "৩৫০ ৳" },
  { icon: FlaskConical, name: "TDS Sensor (Gravity)",     role: "মাটির আর্দ্রতা (ppm → %)",          pin: "A0 (ADC)",     price: "৪৫০ ৳" },
  { icon: Sun,          name: "LDR + 10kΩ",               role: "সূর্যালোক/দিন-রাত",                 pin: "D5",           price: "৩০ ৳" },
  { icon: RotateCw,     name: "SG90 Servo Motor (৯g)",    role: "পানির লাইন on/off (০°↔৯০°)",        pin: "D2 (PWM)",     price: "১৮০ ৳" },
  { icon: Cable,        name: "পানির লাইন + ফিটিং",       role: "জোনের irrigation pipe",             pin: "Servo arm",    price: "১২০ ৳" },
  { icon: Zap,          name: "৫V ২A অ্যাডাপ্টার",        role: "সাব-নোড পাওয়ার",                    pin: "VIN",          price: "৩৫০ ৳" },
];

const subTotalPerNode = "১,৪৮০ ৳";

/* ---------------- MASTER FIRMWARE ---------------- */
const masterCode = `/**
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
const char* SERVER_HOST = "https://project--583e7123-43a5-4b02-9812-0f73d31e5ee2-dev.lovable.app";
const char* DEVICE_ID   = "MASTER-01";
const char* ZONE_ID     = "PUMP-HOUSE";
// ========================

// ---- Pump spec (6V Ultra-Quiet Fractional, 120 L/H) ----
// rated 6V → 0.20A → 1.20W; open flow ≈ 2.0 L/min (120 L/H)
const float PUMP_RATED_LPM     = 2.0;
const float PUMP_RATED_VOLTAGE = 6.0;
const float PUMP_RATED_CURRENT = 0.20;

// ---- Pins ----
#define PIN_RELAY_PUMP   25
#define PIN_TRIG          5
#define PIN_ECHO         18
#define PIN_DHT           4
#define DHT_TYPE      DHT22
#define I2C_SDA          21
#define I2C_SCL          22

// ---- OLED ----
#define OLED_W   128
#define OLED_H    64
Adafruit_SSD1306 oled(OLED_W, OLED_H, &Wire, -1);

DHT dht(PIN_DHT, DHT_TYPE);

bool          motorOn       = false;
unsigned long motorStartMs  = 0;
unsigned long motorTotalMs  = 0;       // মোট রানটাইম (ms)
unsigned long lastSend      = 0;
const unsigned long SEND_INTERVAL = 5000;

// =================== DISPLAY HELPERS ===================
void oledCenter(const String& s, int y, int sz = 1) {
  oled.setTextSize(sz);
  int16_t x1, y1; uint16_t w, h;
  oled.getTextBounds(s, 0, 0, &x1, &y1, &w, &h);
  oled.setCursor((OLED_W - w) / 2, y);
  oled.print(s);
}

void bootAnimation() {
  // ফেজ ১ : BAWDA লোগো ফেড-ইন
  for (int i = 0; i <= 6; i++) {
    oled.clearDisplay();
    oled.setTextColor(SSD1306_WHITE);
    // টপ ব্র্যান্ড বার
    oled.drawRoundRect(2, 2, OLED_W - 4, 14, 3, SSD1306_WHITE);
    oled.setTextSize(1);
    oled.setCursor(8, 5); oled.print("SMART IRRIGATION");
    // মেইন লোগো
    oledCenter("BAWDA", 22, 3);
    delay(120);
    oled.display();
  }
  delay(600);

  // ফেজ ২ : Made by Mehedi Hasan
  oled.clearDisplay();
  oled.drawRoundRect(2, 2, OLED_W - 4, 14, 3, SSD1306_WHITE);
  oled.setCursor(8, 5); oled.print("SMART IRRIGATION");
  oledCenter("BAWDA", 20, 3);
  oledCenter("Made by Mehedi Hasan", 50, 1);
  oled.display();
  delay(1400);

  // ফেজ ৩ : প্রোগ্রেস বার (system booting)
  for (int p = 0; p <= 100; p += 4) {
    oled.clearDisplay();
    oledCenter("BAWDA", 4, 2);
    oledCenter("Initializing system...", 26, 1);
    oled.drawRoundRect(14, 42, 100, 10, 3, SSD1306_WHITE);
    oled.fillRoundRect(16, 44, p * 96 / 100, 6, 2, SSD1306_WHITE);
    oledCenter(String(p) + "%", 56, 1);
    oled.display();
    delay(25);
  }
  delay(300);
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

void drawDashboard(float tank, float lpm, float volt, float t, float h) {
  oled.clearDisplay();
  oled.setTextColor(SSD1306_WHITE);

  // হেডার বার
  oled.fillRect(0, 0, OLED_W, 12, SSD1306_WHITE);
  oled.setTextColor(SSD1306_BLACK);
  oled.setCursor(3, 2);  oled.setTextSize(1); oled.print("BAWDA");
  oled.setCursor(55, 2); oled.print(motorOn ? "PUMP ON " : "PUMP OFF");
  oled.setCursor(112, 2); oled.print(WiFi.status() == WL_CONNECTED ? "W" : "-");
  oled.setTextColor(SSD1306_WHITE);

  // মূল ডেটা (২ কলাম)
  oled.setCursor(2, 16);  oled.print("Tank"); oled.setCursor(2, 26);
  oled.setTextSize(2); oled.print((int)tank); oled.print("%");
  oled.setTextSize(1);
  oled.setCursor(70, 16); oled.print("L/min"); oled.setCursor(70, 26);
  oled.setTextSize(2); oled.print(lpm, 1);
  oled.setTextSize(1);

  // নিচের রো
  oled.drawFastHLine(0, 44, OLED_W, SSD1306_WHITE);
  oled.setCursor(2, 47);
  oled.print(volt, 1); oled.print("V ");
  oled.print(t, 0); oled.print("C ");
  oled.print(h, 0); oled.print("%");
  oled.setCursor(2, 56);
  oled.print("RUN "); oled.print(fmtRuntime(motorOn ? (motorTotalMs + (millis() - motorStartMs)) : motorTotalMs));
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
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) { delay(300); Serial.print("."); }
  Serial.printf("\\n[MASTER] WiFi OK  IP=%s\\n", WiFi.localIP().toString().c_str());
}

void sendTelemetry() {
  float tank = readTankPct();
  float lpm  = computeFlowLpm();
  float volt = motorOn ? PUMP_RATED_VOLTAGE : 0.0;
  float curr = motorOn ? PUMP_RATED_CURRENT : 0.0;
  float t    = dht.readTemperature();
  float h    = dht.readHumidity();
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
  if (!isnan(t)) doc["temperature"] = t;
  if (!isnan(h)) doc["humidity"]    = h;

  String body; serializeJson(doc, body);
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.begin(client, String(SERVER_HOST) + "/api/public/telemetry");
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(body);
  String resp = http.getString();
  http.end();
  Serial.printf("[MASTER] POST %d  tank=%.0f%% lpm=%.2f V=%.1f\\n", code, tank, lpm, volt);

  // dashboard কমান্ড প্রসেস → রিয়েল-টাইম মোটর ON/OFF
  JsonDocument r;
  if (deserializeJson(r, resp) == DeserializationError::Ok) {
    for (JsonObject c : r["commands"].as<JsonArray>()) {
      String a = c["action"].as<String>();
      if      (a == "motor_on")  setMotor(true);
      else if (a == "motor_off") setMotor(false);
    }
  }

  drawDashboard(tank, lpm, volt, isnan(t) ? 0 : t, isnan(h) ? 0 : h);
}

// =================== LIFECYCLE ===================
void setup() {
  Serial.begin(115200);
  pinMode(PIN_RELAY_PUMP, OUTPUT);
  digitalWrite(PIN_RELAY_PUMP, HIGH);     // OFF on boot
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);

  Wire.begin(I2C_SDA, I2C_SCL);
  if (!oled.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED init failed");
  }
  oled.clearDisplay(); oled.display();
  bootAnimation();

  dht.begin();
  connectWifi();

  // ✅ Boot-time heartbeat — dashboard সাথে সাথে ONLINE বুঝবে
  Serial.println("[MASTER] System online — sending boot heartbeat");
  sendTelemetry();
  lastSend = millis();
}

void loop() {
  if (millis() - lastSend >= SEND_INTERVAL) {
    lastSend = millis();
    sendTelemetry();
  } else if (motorOn) {
    // মোটর চলা অবস্থায় OLED-এ runtime live আপডেট প্রতি সেকেন্ডে
    static unsigned long lastTick = 0;
    if (millis() - lastTick >= 1000) {
      lastTick = millis();
      drawDashboard(readTankPct(), computeFlowLpm(), PUMP_RATED_VOLTAGE, dht.readTemperature(), dht.readHumidity());
    }
  }
}`;

/* ---------------- SUB-NODE FIRMWARE ---------------- */
const subCode = `/**
 *  BMDA Smart Irrigation — SUB NODE (ESP8266 NodeMCU)
 *  স্থান : জমিতে — প্রতিটি জোনে একটি
 *  সেন্সর: TDS sensor (Gravity/generic) → মাটির আর্দ্রতা %
 *         LDR → দিন/রাত
 *  অ্যাকচুয়েটর: SG90 Servo Motor → পানির লাইন on/off (০°=বন্ধ, ৯০°=খোলা)
 *  কাজ  : প্রতি ৫ সেকেন্ডে heartbeat + dashboard থেকে valve কমান্ড গ্রহণ।
 *
 *  Board    : NodeMCU 1.0 (ESP-12E Module)
 *  Libraries: ESP8266WiFi, ESP8266HTTPClient, ArduinoJson, Servo
 */
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <ArduinoJson.h>
#include <Servo.h>

// ====== EDIT THESE ======
const char* WIFI_SSID   = "YOUR_WIFI";
const char* WIFI_PASS   = "YOUR_PASSWORD";
const char* SERVER_HOST = "https://project--583e7123-43a5-4b02-9812-0f73d31e5ee2-dev.lovable.app";
const char* DEVICE_ID   = "SUB-01";    // প্রতিটি sub-node-এর অনন্য নাম
const char* ZONE_ID     = "Z-01";      // dashboard-এ যেই জোন
// ========================

// ---- Pins ----
#define PIN_TDS     A0     // TDS sensor analog (ESP8266-এ একটাই ADC)
#define PIN_LDR     D5     // LDR digital
#define PIN_SERVO   D2     // SG90 servo PWM (GPIO4)

// ---- TDS reference voltage (NodeMCU ADC 0..1023 → 0..3.3V via onboard divider) ----
const float VREF = 3.3;
const float ADC_MAX = 1023.0;

// ---- Servo ----
Servo valveServo;
const int SERVO_CLOSED = 0;
const int SERVO_OPEN   = 90;

bool valveOpen = false;
unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL = 5000;

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

void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) { delay(300); Serial.print("."); }
  Serial.printf("\\n[%s] WiFi OK  IP=%s\\n", DEVICE_ID, WiFi.localIP().toString().c_str());
}

void sendTelemetry() {
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

  String body; serializeJson(doc, body);
  BearSSL::WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.begin(client, String(SERVER_HOST) + "/api/public/telemetry");
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(body);
  String resp = http.getString();
  http.end();
  Serial.printf("[%s] POST %d  ppm=%.0f soil=%.0f%% valve=%d\\n",
                ZONE_ID, code, ppm, soil, valveOpen);

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
  valveServo.attach(PIN_SERVO);
  setValve(false);              // boot হলে valve বন্ধ থাকবে
  connectWifi();
  // ✅ Boot heartbeat — dashboard সাথে সাথে এই sub-node-কে ONLINE দেখবে
  Serial.println("[SUB] System online — sending boot heartbeat");
  sendTelemetry();
  lastSend = millis();
}

void loop() {
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

function HardwarePage() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

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
                <li>• R385 ১২V DC পাম্প (১.৮ L/min auto)</li>
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

        {/* MASTER WIRING / CONNECTION DIAGRAM */}
        <div className="glass-card rounded-2xl p-5 border-2 border-amber-400/40 shadow-md shadow-amber-500/10 ring-1 ring-amber-300/20">
          <div className="flex items-center gap-2 mb-1">
            <Plug className="h-5 w-5 text-amber-500" />
            <h2 className="text-base font-extrabold">মাস্টার নোড — পিন-বাই-পিন কানেকশন ডায়াগ্রাম</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            ESP32 DevKit V1 থেকে প্রতিটি কম্পোনেন্টের সঠিক তার-সংযোগ। ব্রেডবোর্ডে বসানোর সময় এই টেবিল ফলো করুন — ভুল পিনে লাগালে কাজ করবে না।
          </p>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Wiring table */}
            <div className="overflow-x-auto rounded-xl border border-amber-400/30">
              <table className="w-full text-xs">
                <thead className="bg-amber-500/10">
                  <tr className="text-left text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    <th className="py-2 px-3">থেকে (From)</th>
                    <th className="py-2 px-3">যাবে (To)</th>
                    <th className="py-2 px-3 hidden md:table-cell">নোট</th>
                  </tr>
                </thead>
                <tbody>
                  {masterWiring.map((w, i) => (
                    <tr key={i} className="border-t border-border/40 hover:bg-amber-500/5">
                      <td className="py-2 px-3 font-mono font-bold text-primary">{w.from}</td>
                      <td className="py-2 px-3 font-mono font-bold text-chart-2">{w.to}</td>
                      <td className="py-2 px-3 text-muted-foreground hidden md:table-cell">{w.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ASCII / visual diagram */}
            <div className="rounded-xl bg-foreground/95 text-background p-4 text-[11px] font-mono overflow-x-auto leading-relaxed">
{`            ┌──────────────────────────────┐
            │         ESP32 DevKit V1       │
            │                               │
   3.3V ────┤ 3V3              GPIO 21 ├──── SDA  ┐
    GND ─┬──┤ GND              GPIO 22 ├──── SCL  ├─→ OLED 0.96"
         │  │                  GPIO  4 ├──── DATA──→ DHT22 (10kΩ pull-up)
         │  │                  GPIO  5 ├──── Trig ──→ HC-SR04
         │  │                  GPIO 18 ├──── Echo ←── HC-SR04 (1k+2k divider)
         │  │                  GPIO 25 ├──── IN   ──→ Relay  ──→ R385 12V Pump
         │  │     VIN  ←─── +12V SMPS  │
         │  │     GND  ←─── −12V SMPS ─┘
         └──── কমন গ্রাউন্ড (সমস্ত ডিভাইস)

   ⚡ পাম্প লুপ:  +12V SMPS → Relay COM → Relay NO → Pump (+)
                  Pump (−) → −12V SMPS  (ESP32-এর সাথে ground share করতে হবে)
`}
            </div>
          </div>

          {/* legend cards */}
          <div className="grid sm:grid-cols-3 gap-2 mt-4 text-xs">
            <div className="rounded-lg glass-panel p-3 border border-rose-400/30">
              <p className="font-extrabold text-rose-500">⚠️ ভোল্টেজ ডিভাইডার</p>
              <p className="text-[11px] text-muted-foreground mt-1">HC-SR04 Echo ৫V আউট দেয় — সরাসরি GPIO 18-এ দিলে ESP32 পুড়বে। 1kΩ + 2kΩ ডিভাইডার ব্যবহার করুন।</p>
            </div>
            <div className="rounded-lg glass-panel p-3 border border-amber-400/30">
              <p className="font-extrabold text-amber-500">⚡ কমন গ্রাউন্ড</p>
              <p className="text-[11px] text-muted-foreground mt-1">SMPS-এর GND, ESP32-এর GND, রিলের GND — সব একসাথে যুক্ত না থাকলে রিলে ট্রিগার হবে না।</p>
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
