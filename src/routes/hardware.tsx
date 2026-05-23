import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Cpu, Droplets, Sun, Thermometer, Waves, Zap, Cable, CircuitBoard, Wifi, Code2, Wrench, ShieldCheck, Copy, CheckCheck } from "lucide-react";
import { useState } from "react";

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

export const Route = createFileRoute("/hardware")({
  head: () => ({ meta: [{ title: "হার্ডওয়্যার গাইড · BMDA স্মার্ট সেচ" }] }),
  component: HardwarePage,
});

const devices = [
  { icon: Cpu, name: "ESP32 DevKit V1", role: "মূল মাইক্রোকন্ট্রোলার (WiFi+BT)", pin: "—", price: "৫৫০–৭৫০ ৳", note: "ডুয়াল-কোর ২৪০ MHz, ৩৪টি GPIO, বিল্ট-ইন ADC" },
  { icon: Droplets, name: "ক্যাপাসিটিভ সয়েল মইশ্চার", role: "মাটির আর্দ্রতা পরিমাপ", pin: "GPIO 34 (ADC)", price: "১৮০–২৫০ ৳", note: "এনালগ আউটপুট, ৩.৩V; ক্যালিব্রেশন প্রয়োজন (শুষ্ক ≈৩০০০, ভেজা ≈১২০০)" },
  { icon: Sun, name: "LDR (Light Sensor)", role: "সূর্যালোক/দিন-রাত শনাক্তকরণ", pin: "GPIO 35 (ADC) + 10kΩ pull-down", price: "২০–৫০ ৳", note: "ভোর/সন্ধ্যা স্বয়ংক্রিয় সেচ ট্রিগারের জন্য আদর্শ" },
  { icon: Waves, name: "HC-SR04 আল্ট্রাসনিক", role: "জলাধার/ট্যাঙ্কের পানির স্তর", pin: "Trig: GPIO 5, Echo: GPIO 18", price: "১৫০–২০০ ৳", note: "২–৪০০ cm পরিসীমা, ৫V পাওয়ার (Echo-তে ভোল্টেজ ডিভাইডার লাগবে)" },
  { icon: Thermometer, name: "DHT22 / AM2302", role: "তাপমাত্রা ও আপেক্ষিক আর্দ্রতা", pin: "GPIO 4 (Digital, 1-wire)", price: "৩০০–৩৫০ ৳", note: "−৪০°C থেকে ৮০°C; ২ সেকেন্ডে একবার পড়া যায়" },
  { icon: Droplets, name: "রেইন সেন্সর", role: "বৃষ্টি শনাক্তকরণ (সেচ স্থগিত)", pin: "GPIO 19 (Digital)", price: "১০০–১৫০ ৳", note: "ডিজিটাল আউটপুট; বৃষ্টিতে LOW সিগন্যাল" },
  { icon: Waves, name: "ওয়াটার ফ্লো সেন্সর YF-S201", role: "প্রবাহ পরিমাপ (লি/মিনিট)", pin: "GPIO 23 (Interrupt)", price: "৩৫০–৫০০ ৳", note: "১–৩০ L/min, পালস কাউন্ট দিয়ে হিসাব" },
  { icon: Zap, name: "৪-চ্যানেল রিলে মডিউল (৫V)", role: "ভাল্ভ + পাম্প নিয়ন্ত্রণ", pin: "GPIO 25/26/27/14", price: "৩৫০–৪৫০ ৳", note: "অপটো-আইসোলেটেড, ১০A কন্টাক্ট; ACTIVE-LOW" },
  { icon: Cable, name: "১২V সোলিনয়েড ভাল্ভ", role: "জোন-ভিত্তিক পানি বন্ধ/চালু", pin: "রিলে আউটপুট", price: "৪৫০–৬০০ ৳/টি", note: "ব্রাস বডি, ১/২\" থ্রেড, ০.০২–০.৮ MPa চাপ" },
  { icon: Cable, name: "মিনি সাবমার্সিবল পাম্প", role: "ডেমো রিজার্ভয়ার থেকে পানি", pin: "রিলে আউটপুট", price: "১৫০–৩০০ ৳", note: "৩–১২V DC; ফেয়ারে ছোট স্কেল ডেমোর জন্য" },
  { icon: CircuitBoard, name: "OLED ০.৯৬\" SSD1306", role: "লোকাল স্ট্যাটাস ডিসপ্লে", pin: "I2C: SDA-21, SCL-22", price: "৩০০–৩৫০ ৳", note: "১২৮×৬৪ মনোক্রোম; ৩.৩V" },
  { icon: ShieldCheck, name: "TP4056 + ১৮৬৫০ ব্যাটারি", role: "ব্যাকআপ পাওয়ার", pin: "VIN", price: "২৫০–৩৫০ ৳", note: "বিদ্যুৎ চলে গেলে কন্ট্রোলার চালু থাকবে" },
  { icon: Zap, name: "১২V ২A SMPS অ্যাডাপ্টার", role: "রিলে + ভাল্ভ পাওয়ার", pin: "VCC", price: "৪৫০–৫৫০ ৳", note: "ভাল্ভ ও পাম্পের জন্য আলাদা সাপ্লাই; কমন গ্রাউন্ড আবশ্যক" },
];

const wiringRows = [
  ["সয়েল মইশ্চার (AOUT)", "GPIO 34"],
  ["LDR (এক পা)", "GPIO 35 + 10kΩ → GND"],
  ["HC-SR04 Trig", "GPIO 5"],
  ["HC-SR04 Echo", "GPIO 18 (ভোল্টেজ ডিভাইডার সহ)"],
  ["DHT22 Data", "GPIO 4 + 10kΩ pull-up → 3.3V"],
  ["রেইন সেন্সর DOUT", "GPIO 19"],
  ["ফ্লো সেন্সর Signal", "GPIO 23 (Interrupt)"],
  ["রিলে IN1 (Z-01 ভাল্ভ)", "GPIO 25"],
  ["রিলে IN2 (Z-02 ভাল্ভ)", "GPIO 26"],
  ["রিলে IN3 (Z-03 ভাল্ভ)", "GPIO 27"],
  ["রিলে IN4 (মেইন পাম্প)", "GPIO 14"],
  ["OLED SDA / SCL", "GPIO 21 / 22"],
  ["সকল GND", "কমন গ্রাউন্ড (ESP32 + SMPS)"],
];

const fullCode = `/**
 * BMDA Smart Irrigation — ESP32 Firmware (LDR + DHT + Soil + Tank + Relays)
 * Board: ESP32 Dev Module
 * Libraries: WiFi, HTTPClient, ArduinoJson, DHT sensor library
 */
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ====== EDIT THESE ======
const char* WIFI_SSID   = "YOUR_WIFI";
const char* WIFI_PASS   = "YOUR_PASSWORD";
const char* SERVER_HOST = "https://project--583e7123-43a5-4b02-9812-0f73d31e5ee2.lovable.app";
const char* DEVICE_ID   = "ESP32-NODE-01";
const char* ZONE_ID     = "Z-01";
// ========================

#define PIN_SOIL    34
#define PIN_LDR     35
#define PIN_TRIG    5
#define PIN_ECHO    18
#define PIN_DHT     4
#define PIN_RAIN    19
#define PIN_RELAY_VALVE  25   // Zone solenoid
#define PIN_RELAY_PUMP   14   // Main pump

#define DHT_TYPE DHT22
DHT dht(PIN_DHT, DHT_TYPE);

bool valveOpen = false;
bool motorOn   = false;
unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL = 5000;

void setValve(bool on) {
  valveOpen = on;
  digitalWrite(PIN_RELAY_VALVE, on ? LOW : HIGH); // ACTIVE-LOW
}
void setMotor(bool on) {
  motorOn = on;
  digitalWrite(PIN_RELAY_PUMP, on ? LOW : HIGH);
}

float readSoilPct() {
  int raw = analogRead(PIN_SOIL);
  float pct = map(raw, 3000, 1200, 0, 100); // calibrate!
  return constrain(pct, 0, 100);
}
float readLdrPct() {
  return analogRead(PIN_LDR) * 100.0 / 4095.0;
}
float readWaterLevelPct() {
  digitalWrite(PIN_TRIG, LOW);  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  long dur = pulseIn(PIN_ECHO, HIGH, 30000);
  if (dur == 0) return 0;
  float distCm = dur * 0.0343 / 2.0;
  const float TANK_H = 30.0;
  return constrain(100.0 * (TANK_H - distCm) / TANK_H, 0, 100);
}

void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) { delay(300); Serial.print("."); }
  Serial.printf("\\nWiFi OK  IP=%s\\n", WiFi.localIP().toString().c_str());
}

void sendTelemetry() {
  float soil = readSoilPct(), ldr = readLdrPct(), wl = readWaterLevelPct();
  float t = dht.readTemperature(), h = dht.readHumidity();
  bool rain = digitalRead(PIN_RAIN) == LOW;

  JsonDocument doc;
  doc["deviceId"]     = DEVICE_ID;
  doc["zoneId"]       = ZONE_ID;
  doc["soilMoisture"] = soil;
  doc["waterLevel"]   = wl;
  doc["ldr"]          = ldr;
  doc["valveOpen"]    = valveOpen;
  doc["motorOn"]      = motorOn;
  doc["rssi"]         = WiFi.RSSI();
  if (!isnan(t)) doc["temperature"] = t;
  if (!isnan(h)) doc["humidity"]    = h;
  doc["rain"] = rain;

  String body; serializeJson(doc, body);
  HTTPClient http;
  http.begin(String(SERVER_HOST) + "/api/public/telemetry");
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(body);
  String resp = http.getString();
  http.end();
  Serial.printf("POST %d soil=%.0f ldr=%.0f wl=%.0f T=%.1f\\n", code, soil, ldr, wl, t);

  JsonDocument r;
  if (deserializeJson(r, resp) == DeserializationError::Ok) {
    for (JsonObject c : r["commands"].as<JsonArray>()) {
      String a = c["action"].as<String>();
      if      (a == "valve_open")  setValve(true);
      else if (a == "valve_close") setValve(false);
      else if (a == "motor_on")    setMotor(true);
      else if (a == "motor_off")   setMotor(false);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_RAIN, INPUT_PULLUP);
  pinMode(PIN_RELAY_VALVE, OUTPUT);
  pinMode(PIN_RELAY_PUMP, OUTPUT);
  digitalWrite(PIN_RELAY_VALVE, HIGH);
  digitalWrite(PIN_RELAY_PUMP, HIGH);
  dht.begin();
  connectWifi();
}

void loop() {
  if (millis() - lastSend >= SEND_INTERVAL) {
    lastSend = millis();
    sendTelemetry();
  }
}`;

const addDeviceCode = `// নতুন জোনের জন্য আরেকটি ESP32 যুক্ত করতে:
// ১. উপরের পুরো কোড কপি করুন
// ২. শুধু নিচের ৩ লাইন পরিবর্তন করুন:

const char* DEVICE_ID = "ESP32-NODE-02";  // অনন্য নাম
const char* ZONE_ID   = "Z-02";           // জোন আইডি
const char* WIFI_SSID = "YOUR_WIFI";      // একই WiFi হলে অপরিবর্তিত

// ৩. Devices পেজে গিয়ে "নতুন ডিভাইস" বাটনে ক্লিক করে
//    DEVICE_ID ও ZONE_ID একই দিয়ে register করুন।
// ৪. Arduino IDE → Upload → ৫ সেকেন্ডের মধ্যে dashboard-এ লাইভ আসবে।`;

function HardwarePage() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const total = "৫,৫০০ – ৭,৫০০";

  return (
    <DashboardLayout
      title="হার্ডওয়্যার গাইড · সম্পূর্ণ বিল্ড ডকুমেন্টেশন"
      subtitle="ESP32 ভিত্তিক স্মার্ট সেচ সিস্টেম তৈরির জন্য প্রয়োজনীয় সকল সেন্সর, ওয়্যারিং, কোড ও দাম — Hobby Fair-এ লাইভ ডেমোর জন্য সম্পূর্ণ প্রস্তুত।"
    >
      <div className="stagger space-y-5">
        {/* Quick stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: CircuitBoard, label: "মোট কম্পোনেন্ট", value: `${bn(devices.length)}+` },
            { icon: Wifi, label: "যোগাযোগ", value: "WiFi · HTTP" },
            { icon: Wrench, label: "বিল্ড সময়", value: `${bn("৪")}–${bn("৬")} ঘণ্টা` },
            { icon: Zap, label: "মোট খরচ", value: `${bn(total)} ৳` },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-2xl p-5 hover-lift">
              <s.icon className="h-5 w-5 text-primary" />
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-2 font-bold">{s.label}</p>
              <p className="text-lg font-extrabold mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Device list */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CircuitBoard className="h-5 w-5 text-primary" />
            <h2 className="text-base font-extrabold">প্রয়োজনীয় সেন্সর ও যন্ত্রাংশ</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">কম্পোনেন্ট</th>
                  <th className="py-2 pr-3">ভূমিকা</th>
                  <th className="py-2 pr-3 hidden md:table-cell">পিন/সংযোগ</th>
                  <th className="py-2 pr-3">দাম</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d.name} className="border-b border-border/50 hover:bg-card/40">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                          <d.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold">{d.name}</p>
                          <p className="text-[11px] text-muted-foreground">{d.note}</p>
                        </div>
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

        {/* Wiring */}
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Cable className="h-5 w-5 text-primary" />
              <h2 className="text-base font-extrabold">ওয়্যারিং ম্যাপ</h2>
            </div>
            <div className="rounded-xl glass-panel p-3 font-mono text-xs space-y-1.5">
              {wiringRows.map(([from, to]) => (
                <div key={from} className="flex justify-between gap-3 py-1 border-b border-border/40 last:border-0">
                  <span className="text-foreground/80">{from}</span>
                  <span className="text-primary font-bold">→ {to}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
              ⚠️ <strong>সতর্কতা:</strong> HC-SR04-এর Echo পিন ৫V আউটপুট দেয়; ESP32 ৩.৩V। ভোল্টেজ ডিভাইডার (1kΩ + 2kΩ) আবশ্যক, না হলে GPIO ক্ষতিগ্রস্ত হবে।
            </p>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-5 w-5 text-success" />
              <h2 className="text-base font-extrabold">পাওয়ার ও নিরাপত্তা চেকলিস্ট</h2>
            </div>
            <ul className="space-y-2 text-sm">
              {[
                "ESP32 ও SMSP-এর গ্রাউন্ড একসাথে যোগ (কমন GND)",
                "রিলে কয়েলের পাশে ফ্লাইব্যাক ডায়োড (1N4007) ব্যবহার",
                "ভাল্ভ/পাম্পের তার থেকে ESP32 দূরে রাখুন (EMI প্রতিরোধ)",
                "ভেজা স্থানে রিলে বোর্ড সিলিকন কেস-এ রাখুন",
                "প্রথম পরীক্ষা মাল্টিমিটার দিয়ে — সরাসরি ২৩০V সংযোগ নয়",
                "ESP32-এর ৩.৩V সেন্সর ৫V-এ যুক্ত করবেন না",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <CheckCheck className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Full code */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-primary" />
              <h2 className="text-base font-extrabold">সম্পূর্ণ ESP32 ফার্মওয়্যার (Arduino IDE)</h2>
            </div>
            <button
              onClick={() => copy("full", fullCode)}
              className="text-xs px-3 h-9 rounded-lg bg-primary text-primary-foreground font-bold flex items-center gap-1.5 hover-lift"
            >
              {copied === "full" ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === "full" ? "কপি হয়েছে" : "কোড কপি করুন"}
            </button>
          </div>
          <pre className="rounded-xl bg-foreground/95 text-background p-4 text-xs font-mono overflow-x-auto max-h-[500px]">
            <code>{fullCode}</code>
          </pre>
        </div>

        {/* Add new device */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-chart-2" />
              <h2 className="text-base font-extrabold">নতুন ডিভাইস কিভাবে যুক্ত করবেন</h2>
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
              ["১", "হার্ডওয়্যার", "উপরের তালিকা অনুযায়ী সংযোগ"],
              ["২", "Arduino IDE", "ESP32 বোর্ড ম্যানেজার ইনস্টল"],
              ["৩", "৩ লাইন এডিট", "DEVICE_ID, ZONE_ID, WiFi"],
              ["৪", "Upload", "৫ সেকেন্ডে dashboard-এ লাইভ"],
            ].map(([n, t, d]) => (
              <div key={n} className="rounded-lg glass-panel p-3">
                <div className="h-7 w-7 rounded-lg bg-primary text-primary-foreground grid place-items-center font-extrabold text-sm">{n}</div>
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
