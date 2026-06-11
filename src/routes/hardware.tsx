import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  Cpu, Droplets, Sun, Thermometer, Waves, Zap, Cable, CircuitBoard, Wifi,
  Code2, Wrench, ShieldCheck, Copy, CheckCheck, Network, Radio, Server,
} from "lucide-react";
import { useState } from "react";

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
/*  │  • ফ্লো সেন্সর (লি/মিনিট)   │                                    */
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
  { icon: Cpu,         name: "ESP32 DevKit V1",          role: "মাস্টার কন্ট্রোলার",                pin: "—",                price: "৬৫০ ৳" },
  { icon: Zap,         name: "২-চ্যানেল রিলে (১০A)",     role: "মেইন পাম্প + ব্যাকআপ",              pin: "GPIO 25 / 26",     price: "২৫০ ৳" },
  { icon: Waves,       name: "YF-S201 ফ্লো সেন্সর",      role: "উত্তোলিত পানি পরিমাপ",              pin: "GPIO 23 (INT)",    price: "৪৫০ ৳" },
  { icon: Waves,       name: "HC-SR04 আল্ট্রাসনিক",      role: "ট্যাঙ্ক/রিজার্ভয়ার জলস্তর",        pin: "Trig 5 · Echo 18", price: "১৮০ ৳" },
  { icon: Thermometer, name: "DHT22",                    role: "তাপমাত্রা ও আর্দ্রতা",              pin: "GPIO 4",           price: "৩৫০ ৳" },
  { icon: CircuitBoard,name: "OLED ০.৯৬\" SSD1306",       role: "লোকাল স্ট্যাটাস ডিসপ্লে",          pin: "I2C 21/22",        price: "৩২০ ৳" },
  { icon: Zap,         name: "১২V ৫A SMPS",              role: "মেইন পাওয়ার সাপ্লাই",              pin: "VIN",              price: "৬৫০ ৳" },
  { icon: ShieldCheck, name: "TP4056 + ১৮৬৫০",           role: "ব্যাকআপ ব্যাটারি",                  pin: "VBAT",             price: "৩৫০ ৳" },
];

const subDevices = [
  { icon: Radio,    name: "ESP8266 NodeMCU v3",         role: "সাব-নোড MCU (WiFi)",               pin: "—",                price: "৩৫০ ৳" },
  { icon: Droplets, name: "ক্যাপাসিটিভ সয়েল মইশ্চার",  role: "মাটির আর্দ্রতা",                    pin: "A0 (ADC)",         price: "২০০ ৳" },
  { icon: Sun,      name: "LDR + 10kΩ",                role: "সূর্যালোক/দিন-রাত",                 pin: "D5 (Digital)",     price: "৩০ ৳" },
  { icon: Zap,      name: "১-চ্যানেল রিলে (৫V)",        role: "জোনের সোলিনয়েড ভাল্ভ",             pin: "D1",               price: "১২০ ৳" },
  { icon: Cable,    name: "১২V সোলিনয়েড ভাল্ভ ১/২\"",    role: "জোন পানি নিয়ন্ত্রণ",                pin: "রিলে আউট",         price: "৪৮০ ৳" },
  { icon: Zap,      name: "৫V ২A অ্যাডাপ্টার",          role: "সাব-নোড পাওয়ার",                   pin: "VIN",              price: "৩৫০ ৳" },
];

const subTotalPerNode = "১,৫৩০ ৳";

/* ---------------- MASTER FIRMWARE ---------------- */
const masterCode = `/**
 *  BMDA Smart Irrigation — MASTER NODE (ESP32)
 *  স্থান : পাম্প হাউস
 *  কাজ  : মেইন মোটর চালু/বন্ধ, ফ্লো পরিমাপ, ট্যাঙ্কের জলস্তর,
 *         আবহাওয়া এবং সমস্ত sub-node থেকে আসা সিদ্ধান্ত সমন্বয়।
 *
 *  Board    : ESP32 Dev Module
 *  Libraries: WiFi, HTTPClient, ArduinoJson, DHT, Adafruit_SSD1306
 */
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ====== EDIT THESE ======
const char* WIFI_SSID   = "YOUR_WIFI";
const char* WIFI_PASS   = "YOUR_PASSWORD";
const char* SERVER_HOST = "https://project--583e7123-43a5-4b02-9812-0f73d31e5ee2.lovable.app";
const char* DEVICE_ID   = "MASTER-01";   // মাস্টার আইডি (অনন্য)
const char* ZONE_ID     = "PUMP-HOUSE";
// ========================

#define PIN_RELAY_PUMP   25     // মেইন পাম্প
#define PIN_RELAY_BACKUP 26     // ব্যাকআপ ভাল্ভ/ড্রেইন
#define PIN_FLOW         23     // YF-S201 (Interrupt)
#define PIN_TRIG          5
#define PIN_ECHO         18
#define PIN_DHT           4
#define DHT_TYPE      DHT22

DHT dht(PIN_DHT, DHT_TYPE);

volatile unsigned long flowPulses = 0;
bool motorOn = false;
unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL = 5000;

void IRAM_ATTR flowISR() { flowPulses++; }

void setMotor(bool on) {
  motorOn = on;
  digitalWrite(PIN_RELAY_PUMP, on ? LOW : HIGH);   // ACTIVE-LOW
  Serial.printf("[MOTOR] %s\\n", on ? "ON" : "OFF");
}

float readTankPct() {
  digitalWrite(PIN_TRIG, LOW);  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  long dur = pulseIn(PIN_ECHO, HIGH, 30000);
  if (!dur) return 0;
  float distCm = dur * 0.0343 / 2.0;
  const float TANK_H = 100.0;                       // আপনার ট্যাঙ্ক উচ্চতা cm
  float pct = 100.0 * (TANK_H - distCm) / TANK_H;
  if (pct < 0) pct = 0; if (pct > 100) pct = 100;
  return pct;
}

void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) { delay(300); Serial.print("."); }
  Serial.printf("\\n[MASTER] WiFi OK  IP=%s\\n", WiFi.localIP().toString().c_str());
}

void sendTelemetry() {
  // ফ্লো হিসাব : ৪৫০ পালস ≈ ১ লিটার (YF-S201)
  noInterrupts();
  unsigned long pulses = flowPulses; flowPulses = 0;
  interrupts();
  float litersThisCycle = pulses / 450.0;
  float lpm = litersThisCycle * (60000.0 / SEND_INTERVAL);

  float tank = readTankPct();
  float t = dht.readTemperature();
  float h = dht.readHumidity();

  JsonDocument doc;
  doc["deviceId"]    = DEVICE_ID;
  doc["zoneId"]      = ZONE_ID;
  doc["role"]        = "master";
  doc["motorOn"]     = motorOn;
  doc["waterLevel"]  = tank;
  doc["flowLpm"]     = lpm;
  doc["litersTotal"] = litersThisCycle;
  doc["rssi"]        = WiFi.RSSI();
  if (!isnan(t)) doc["temperature"] = t;
  if (!isnan(h)) doc["humidity"]    = h;

  String body; serializeJson(doc, body);
  HTTPClient http;
  http.begin(String(SERVER_HOST) + "/api/public/telemetry");
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(body);
  String resp = http.getString();
  http.end();
  Serial.printf("[MASTER] POST %d  tank=%.0f%% lpm=%.2f\\n", code, tank, lpm);

  JsonDocument r;
  if (deserializeJson(r, resp) == DeserializationError::Ok) {
    for (JsonObject c : r["commands"].as<JsonArray>()) {
      String a = c["action"].as<String>();
      if      (a == "motor_on")  setMotor(true);
      else if (a == "motor_off") setMotor(false);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_RELAY_PUMP,   OUTPUT);
  pinMode(PIN_RELAY_BACKUP, OUTPUT);
  digitalWrite(PIN_RELAY_PUMP,   HIGH);
  digitalWrite(PIN_RELAY_BACKUP, HIGH);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_FLOW, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_FLOW), flowISR, RISING);
  dht.begin();
  connectWifi();
}

void loop() {
  if (millis() - lastSend >= SEND_INTERVAL) {
    lastSend = millis();
    sendTelemetry();
  }
}`;

/* ---------------- SUB-NODE FIRMWARE ---------------- */
const subCode = `/**
 *  BMDA Smart Irrigation — SUB NODE (ESP8266 NodeMCU)
 *  স্থান : জমিতে — প্রতিটি জোনে একটি
 *  কাজ  : মাটির আর্দ্রতা ও আলো পড়া, জোন ভাল্ভ খোলা/বন্ধ করা,
 *         মাস্টারের সিদ্ধান্ত অনুযায়ী মোটর চালু করার অনুরোধ পাঠানো।
 *
 *  Board    : NodeMCU 1.0 (ESP-12E Module)
 *  Libraries: ESP8266WiFi, ESP8266HTTPClient, ArduinoJson
 */
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>

// ====== EDIT THESE ======
const char* WIFI_SSID   = "YOUR_WIFI";
const char* WIFI_PASS   = "YOUR_PASSWORD";
const char* SERVER_HOST = "https://project--583e7123-43a5-4b02-9812-0f73d31e5ee2.lovable.app";
const char* DEVICE_ID   = "SUB-Z01";   // প্রতিটি sub-node-এর অনন্য নাম
const char* ZONE_ID     = "Z-01";      // dashboard-এ যেই জোন
// ========================

#define PIN_SOIL    A0     // ক্যাপাসিটিভ সয়েল
#define PIN_LDR     D5     // LDR digital
#define PIN_VALVE   D1     // জোন রিলে

bool valveOpen = false;
unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL = 5000;

void setValve(bool on) {
  valveOpen = on;
  digitalWrite(PIN_VALVE, on ? LOW : HIGH);   // ACTIVE-LOW
  Serial.printf("[%s] VALVE %s\\n", ZONE_ID, on ? "OPEN" : "CLOSED");
}

float readSoilPct() {
  int raw = analogRead(PIN_SOIL);             // 0..1023
  // dry≈800, wet≈300 — নিজের সেন্সর ক্যালিব্রেট করুন
  float pct = (800 - raw) * 100.0 / (800 - 300);
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
  float soil = readSoilPct();
  bool  dayLight = digitalRead(PIN_LDR) == LOW;   // LOW = আলো আছে

  JsonDocument doc;
  doc["deviceId"]     = DEVICE_ID;
  doc["zoneId"]       = ZONE_ID;
  doc["role"]         = "sub";
  doc["soilMoisture"] = soil;
  doc["ldr"]          = dayLight ? 85 : 10;
  doc["valveOpen"]    = valveOpen;
  doc["rssi"]         = WiFi.RSSI();

  String body; serializeJson(doc, body);
  WiFiClient client;
  HTTPClient http;
  http.begin(client, String(SERVER_HOST) + "/api/public/telemetry");
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(body);
  String resp = http.getString();
  http.end();
  Serial.printf("[%s] POST %d  soil=%.0f%% day=%d\\n", ZONE_ID, code, soil, dayLight);

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
  pinMode(PIN_VALVE, OUTPUT);
  digitalWrite(PIN_VALVE, HIGH);
  pinMode(PIN_LDR, INPUT);
  connectWifi();
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
                <li>• YF-S201 ফ্লো সেন্সর (লি/মিনিট)</li>
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
            <strong>কেন এই গঠন?</strong> মেইন পাম্প ও ফ্লো সেন্সর একটি শক্তিশালী ESP32-এ থাকে যেখানে বিদ্যুৎ ও নেটওয়ার্ক স্থিতিশীল। প্রতিটি জমিতে ছোট সস্তা ESP8266 বসিয়ে শুধু সেই জোনের আর্দ্রতা ও ভাল্ভ পরিচালিত হয় — ফলে সিস্টেম সহজে যেকোনো সংখ্যক জোনে সম্প্রসারণযোগ্য।
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
