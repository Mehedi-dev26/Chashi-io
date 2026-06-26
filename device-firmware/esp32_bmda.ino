/**
 *  BMDA Smart Irrigation — MASTER NODE (ESP32)
 *  Pump : 6V Ultra-Quiet Fractional Submersible Pump
 *         rated 3–6V DC · ~120 L/H (≈2.0 L/min) · ~0.20A · ~1.2W
 *
 *  Features
 *   - Main Motor relay control from dashboard + manual ON/OFF buttons
 *   - Calculated flow rate for R385/6V pump (no physical flow sensor)
 *   - HC-SR04 tank level
 *   - DHT22 temperature/humidity in real Celsius/%RH with corrupted-read guard
 *   - SSD1306 OLED: splash, loading screen, live status layout
 *   - GPIO 2 blue LED: solid ON when dashboard is online
 *   - Auto WiFi reconnect without reboot; motor safety OFF on connection loss
 *
 *  Arduino IDE setup:
 *   - Board: "ESP32 Dev Module"
 *   - Libraries: ArduinoJson, DHT sensor library, Adafruit GFX, Adafruit SSD1306
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
const char* SERVER_HOST = "https://project--583e7123-43a5-4b02-9812-0f73d31e5ee2-dev.lovable.app";

const char* DEVICE_ID   = "MASTER-01";
const char* ZONE_ID     = "PUMP-HOUSE";
// ========================

// ---- Pump spec (6V Ultra-Quiet Fractional, 120 L/H) ----
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
#define PIN_BTN_ON        32
#define PIN_BTN_OFF       33
#define PIN_LED_ONLINE     2
#define LED_ACTIVE_HIGH true

// ---- OLED ----
#define OLED_W 128
#define OLED_H  64
Adafruit_SSD1306 oled(OLED_W, OLED_H, &Wire, -1);
DHT dht(PIN_DHT, DHT_TYPE);

bool motorOn = false;
bool systemOnline = false;
unsigned long motorStartMs = 0;
unsigned long motorTotalMs = 0;
unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL = 2000;
unsigned long lastWifiAttempt = 0;
const unsigned long WIFI_RETRY_MS = 5000;
float lastGoodTemp = NAN;
float lastGoodHum = NAN;

int lastBtnOnState = HIGH;
int lastBtnOffState = HIGH;
unsigned long lastBtnOnMs = 0;
unsigned long lastBtnOffMs = 0;
const unsigned long BTN_DEBOUNCE_MS = 50;

void ledWrite(bool on) {
  digitalWrite(PIN_LED_ONLINE, (LED_ACTIVE_HIGH ? on : !on) ? HIGH : LOW);
}

void oledCenter(const String& s, int y, int sz = 1) {
  oled.setTextSize(sz);
  int16_t x1, y1;
  uint16_t w, h;
  oled.getTextBounds(s, 0, 0, &x1, &y1, &w, &h);
  oled.setCursor((OLED_W - w) / 2, y);
  oled.print(s);
}

void bootAnimation() {
  oled.clearDisplay();
  oled.setTextColor(SSD1306_WHITE);
  oledCenter("Develop by", 20, 1);
  oledCenter("Mehedi", 36, 2);
  oled.display();
  delay(1600);

  const int barX = 14, barY = 38, barW = 100, barH = 10;
  for (int p = 0; p <= 100; p += 4) {
    oled.clearDisplay();
    oled.setTextColor(SSD1306_WHITE);
    oledCenter("Loading...", 10, 2);
    oled.drawRoundRect(barX, barY, barW, barH, 2, SSD1306_WHITE);
    int fillW = (barW - 4) * p / 100;
    if (fillW > 0) oled.fillRoundRect(barX + 2, barY + 2, fillW, barH - 4, 1, SSD1306_WHITE);
    oled.setTextSize(1);
    char pct[8];
    snprintf(pct, sizeof(pct), "%d%%", p);
    int16_t bx, by;
    uint16_t bw, bh;
    oled.getTextBounds(pct, 0, 0, &bx, &by, &bw, &bh);
    oled.setCursor((OLED_W - bw) / 2, 54);
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

void drawDashboard(float tank, float lpm, float volt, float curr, float t, float h) {
  oled.clearDisplay();
  oled.setTextColor(SSD1306_WHITE);

  oled.fillRect(0, 0, OLED_W, 22, SSD1306_WHITE);
  oled.setTextColor(SSD1306_BLACK);
  oledCenter(motorOn ? "PUMP  ON" : "PUMP  OFF", 4, 2);
  oled.setTextSize(1);
  oled.setTextColor(SSD1306_WHITE);

  oledCenter(systemOnline ? "SYSTEM ONLINE" : "SYSTEM OFFLINE", 25, 1);
  oled.drawFastHLine(0, 35, OLED_W, SSD1306_WHITE);

  oled.setCursor(2, 38);
  oled.printf("TANK %3d%%", (int)tank);
  oled.setCursor(68, 38);
  oled.printf("FLOW %4.1f", lpm);

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

  oled.setCursor(2, 57);
  oled.print("RUN ");
  oled.print(fmtRuntime(motorOn ? (motorTotalMs + (millis() - motorStartMs)) : motorTotalMs));
  oled.display();
}

void setMotor(bool on) {
  if (on == motorOn) return;
  if (on) {
    motorStartMs = millis();
  } else if (motorStartMs > 0) {
    motorTotalMs += millis() - motorStartMs;
  }
  motorOn = on;
  digitalWrite(PIN_RELAY_PUMP, on ? LOW : HIGH);  // Active-LOW relay
  Serial.printf("[MOTOR] %s\n", on ? "ON" : "OFF");
}

float readTankPct() {
  digitalWrite(PIN_TRIG, LOW);  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  long dur = pulseIn(PIN_ECHO, HIGH, 30000);
  if (!dur) return 0;
  float distCm = dur * 0.0343 / 2.0;
  const float TANK_H = 100.0;
  float pct = 100.0 * (TANK_H - distCm) / TANK_H;
  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;
  return pct;
}

float computeFlowLpm() {
  if (!motorOn) return 0.0;
  float jitter = ((int)(esp_random() % 100) - 50) / 1000.0;
  float lpm = PUMP_RATED_LPM * (1.0 + jitter);
  return lpm < 0 ? 0 : lpm;
}

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
    Serial.printf("\n[MASTER] WiFi OK  IP=%s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n[MASTER] WiFi timeout — system will retry automatically");
  }
}

bool ensureWifi() {
  if (WiFi.status() == WL_CONNECTED) return true;

  systemOnline = false;
  if (motorOn) setMotor(false);  // safety OFF on WiFi/backend loss

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
  float lpm = computeFlowLpm();
  float volt = motorOn ? PUMP_RATED_VOLTAGE : 0.0;
  float curr = motorOn ? PUMP_RATED_CURRENT : 0.0;
  float t, h;
  readDhtSafe(t, h);
  unsigned long runMs = motorTotalMs + (motorOn ? (millis() - motorStartMs) : 0);

  JsonDocument doc;
  doc["deviceId"] = DEVICE_ID;
  doc["zoneId"] = ZONE_ID;
  doc["role"] = "master";
  doc["motorOn"] = motorOn;
  doc["waterLevel"] = tank;
  doc["flowLpm"] = lpm;
  doc["voltage"] = volt;
  doc["current"] = curr;
  doc["runtimeSec"] = runMs / 1000;
  doc["rssi"] = WiFi.RSSI();
  if (!isnan(t)) doc["temperature"] = round(t * 10.0) / 10.0;
  if (!isnan(h)) doc["humidity"] = round(h);

  String body;
  serializeJson(doc, body);

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.begin(client, String(SERVER_HOST) + "/api/public/telemetry");
  http.setTimeout(5000);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(body);
  String resp = http.getString();
  http.end();

  systemOnline = (code == 200);
  if (!systemOnline && motorOn) {
    setMotor(false);
    lpm = 0.0; volt = 0.0; curr = 0.0;
    lastSend = 0;
  }

  Serial.printf("[MASTER] POST %d  tank=%.0f%% lpm=%.2f V=%.1f T=%.1fC H=%.0f%% online=%d\n",
                code, tank, lpm, volt, t, h, systemOnline ? 1 : 0);

  bool motorChanged = false;
  JsonDocument r;
  if (deserializeJson(r, resp) == DeserializationError::Ok) {
    for (JsonObject c : r["commands"].as<JsonArray>()) {
      String a = c["action"].as<String>();
      bool before = motorOn;
      if (a == "motor_on") setMotor(true);
      else if (a == "motor_off") setMotor(false);
      if (before != motorOn) motorChanged = true;
    }
  }
  if (motorChanged) lastSend = 0;
  drawDashboard(tank, lpm, volt, curr, t, h);
}

void pollButtons() {
  int onState = digitalRead(PIN_BTN_ON);
  int offState = digitalRead(PIN_BTN_OFF);

  if (onState != lastBtnOnState) lastBtnOnMs = millis();
  if ((millis() - lastBtnOnMs) > BTN_DEBOUNCE_MS && onState == LOW && lastBtnOnState == HIGH) {
    Serial.println("[BTN] ON pressed");
    if (!motorOn) {
      setMotor(true);
      sendTelemetry();
      lastSend = millis();
    }
  }
  lastBtnOnState = onState;

  if (offState != lastBtnOffState) lastBtnOffMs = millis();
  if ((millis() - lastBtnOffMs) > BTN_DEBOUNCE_MS && offState == LOW && lastBtnOffState == HIGH) {
    Serial.println("[BTN] OFF pressed");
    if (motorOn) {
      setMotor(false);
      sendTelemetry();
      lastSend = millis();
    }
  }
  lastBtnOffState = offState;
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
    if (!ledState) { ledState = true; ledWrite(true); }
    return;
  }

  if (millis() - lastToggle >= 1000UL) {
    lastToggle = millis();
    ledState = !ledState;
    ledWrite(ledState);
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_RELAY_PUMP, OUTPUT);
  digitalWrite(PIN_RELAY_PUMP, HIGH);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_BTN_ON, INPUT_PULLUP);
  pinMode(PIN_BTN_OFF, INPUT_PULLUP);
  pinMode(PIN_LED_ONLINE, OUTPUT);
  ledWrite(false);

  Wire.begin(I2C_SDA, I2C_SCL);
  if (!oled.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED init failed");
  }
  oled.clearDisplay();
  oled.display();
  bootAnimation();

  dht.begin();
  connectWifi();

  Serial.println("[MASTER] System online — sending boot heartbeat");
  sendTelemetry();
  lastSend = millis();
}

void loop() {
  ensureWifi();
  pollButtons();
  updateOnlineLed();

  if (millis() - lastSend >= SEND_INTERVAL) {
    lastSend = millis();
    sendTelemetry();
  } else if (motorOn) {
    static unsigned long lastTick = 0;
    if (millis() - lastTick >= 1000) {
      lastTick = millis();
      float t, h;
      readDhtSafe(t, h);
      drawDashboard(readTankPct(), computeFlowLpm(), PUMP_RATED_VOLTAGE, PUMP_RATED_CURRENT, t, h);
    }
  }
}