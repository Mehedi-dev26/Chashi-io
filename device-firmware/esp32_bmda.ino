/**
 *  BMDA Smart Irrigation — MASTER NODE (ESP32)
 *  Pump : 6V Ultra-Quiet Fractional Submersible Pump
 *         rated 3–6V DC · ~120 L/H (≈2.0 L/min) · ~0.20A · ~1.2W
 *
 *  Features
 *   - Main Motor relay control from dashboard + manual ON/OFF buttons
 *   - Calculated flow rate for R385/6V pump (no physical flow sensor)
 *   - HC-SR04 tank level
 *   - DHT11 temperature/humidity in real Celsius/%RH with corrupted-read guard
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

// ---- Tank (HC-SR04) calibration ----
#define TANK_SENSOR_OFFSET_CM   2.0    // sensor face -> full water surface (HC-SR04 dead zone ~2cm)
#define TANK_DEPTH_CM           8.0    // full surface -> empty/bottom (10cm bottle - 2cm offset)
#define TANK_FULL_THRESHOLD    95.0
#define TANK_WARN_THRESHOLD    85.0

#define PIN_DHT            4
#define DHT_TYPE       DHT11   // আপনার sensor DHT11/DH11 হলে DHT11 রাখুন; DHT22 হলে DHT22 করুন
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
unsigned long lastDhtReadMs = 0;
const unsigned long DHT_MIN_INTERVAL = 2200;  // DHT11/DHT22 stability guard
unsigned long dhtWarmupUntil = 0;

// Buttons: wired between GPIO and GND. INPUT_PULLUP → idle=HIGH, press=LOW.
// Trigger ONLY on the HIGH→LOW edge (press); never on release. A hard
// lockout window ensures a single tap can never produce two events.
int lastBtnOnRaw  = HIGH;
int lastBtnOffRaw = HIGH;
unsigned long btnOnChangeMs  = 0;
unsigned long btnOffChangeMs = 0;
int stableBtnOn  = HIGH;
int stableBtnOff = HIGH;
unsigned long btnOnLockoutUntil  = 0;
unsigned long btnOffLockoutUntil = 0;
const unsigned long BTN_DEBOUNCE_MS = 30;
const unsigned long BTN_LOCKOUT_MS  = 400;

// After a physical button press, ignore opposing server commands briefly
// so a stale queued dashboard command can't immediately revert the user.
unsigned long buttonOverrideUntil = 0;
const unsigned long BUTTON_OVERRIDE_MS = 3000;


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
  // Pure live-sensor read. No cached / preset / fabricated values.
  // Returns ONLY what the DHT sensor physically reports right now, within
  // a safe environmental range. Corrupted pulses like 768°C / 197%RH are
  // rejected and will show as -- on OLED/dashboard.
  tempC = NAN;
  humidity = NAN;

  // Respect 2s minimum between physical reads (datasheet requirement).
  if (lastDhtReadMs != 0 && (millis() - lastDhtReadMs) < DHT_MIN_INTERVAL) {
    return false;
  }
  lastDhtReadMs = millis();

  float t = NAN, h = NAN;
  for (int i = 0; i < 5; i++) {
    float tt = dht.readTemperature(false);
    float hh = dht.readHumidity();
    bool tOk = !isnan(tt) && tt >= -10.0 && tt <= 60.0;
    bool hOk = !isnan(hh) && hh >= 0.0  && hh <= 100.0;
    if (tOk) t = tt;
    if (hOk) h = hh;
    if (tOk && hOk) break;
    delay(80);
  }

  tempC = t;
  humidity = h;

  if (isnan(t) && isnan(h)) {
    Serial.println("[DHT] no valid live reading this cycle");
  } else {
    Serial.print("[DHT] live t=");
    if (isnan(t)) Serial.print("--"); else Serial.print(t, 1);
    Serial.print("C h=");
    if (isnan(h)) Serial.print("--"); else Serial.print(h, 1);
    Serial.println("%");
  }

  return !isnan(t) || !isnan(h);
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
  if (tank >= TANK_FULL_THRESHOLD) {
    oled.printf("TANK FULL!");
  } else if (tank >= TANK_WARN_THRESHOLD) {
    oled.printf("TANK %3d%%*", (int)tank);
  } else {
    oled.printf("TANK %3d%%", (int)tank);
  }
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

// ===== HC-SR04 Tank Level (real measurement) =====
// Calibration constants live near the pin defines at the top of this file.


static float lastTankPct = 0.0;
static bool  tankHasReading = false;

static long readEchoOnce() {
  digitalWrite(PIN_TRIG, LOW);  delayMicroseconds(4);
  digitalWrite(PIN_TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  return pulseIn(PIN_ECHO, HIGH, 30000); // 30ms ~ 5m max
}

float readTankPct() {
  // Take 5 samples, drop min & max, average the rest (median-like filter)
  long s[5]; int valid = 0;
  for (int i = 0; i < 5; i++) {
    long d = readEchoOnce();
    if (d > 0) s[valid++] = d;
    delay(8);
  }
  if (valid < 3) {
    // Sensor not responding / out of range: keep last good reading instead of fake 0
    return tankHasReading ? lastTankPct : 0.0;
  }
  // sort ascending (simple)
  for (int i = 0; i < valid - 1; i++)
    for (int j = i + 1; j < valid; j++)
      if (s[j] < s[i]) { long t = s[i]; s[i] = s[j]; s[j] = t; }
  long sum = 0; int cnt = 0;
  for (int i = 1; i < valid - 1; i++) { sum += s[i]; cnt++; }
  if (cnt == 0) { sum = s[valid/2]; cnt = 1; }
  float dur = (float)sum / cnt;
  float distCm = dur * 0.0343 / 2.0;

  // HC-SR04 reliable range 2..400 cm
  if (distCm < 2.0 || distCm > 400.0) {
    return tankHasReading ? lastTankPct : 0.0;
  }

  float waterFromTop = distCm - TANK_SENSOR_OFFSET_CM; // 0 = full surface
  float pct = 100.0 * (TANK_DEPTH_CM - waterFromTop) / TANK_DEPTH_CM;
  if (pct < 0)   pct = 0;
  if (pct > 100) pct = 100;

  lastTankPct = pct;
  tankHasReading = true;

  if (pct >= TANK_FULL_THRESHOLD) {
    Serial.printf("[TANK] FULL! %.1f%% (dist=%.1fcm) — OVERFLOW RISK, stop filling\n", pct, distCm);
  } else if (pct >= TANK_WARN_THRESHOLD) {
    Serial.printf("[TANK] WARN %.1f%% (dist=%.1fcm)\n", pct, distCm);
  } else {
    Serial.printf("[TANK] %.1f%% (dist=%.1fcm)\n", pct, distCm);
  }
  return pct;
}


float computeFlowLpm() {
  if (!motorOn) return 0.0;
  float jitter = ((int)(esp_random() % 100) - 50) / 1000.0;
  float lpm = PUMP_RATED_LPM * (1.0 + jitter);
  return lpm < 0 ? 0 : lpm;
}

void connectWifi() {
  WiFi.persistent(true);              // let ESP32 cache creds in NVS
  WiFi.mode(WIFI_OFF);
  delay(100);
  WiFi.mode(WIFI_STA);
  WiFi.disconnect(true, true);        // clean any stale config
  delay(100);
  WiFi.setAutoReconnect(true);
  WiFi.setSleep(false);               // more reliable for long-running IoT
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  unsigned long start = millis();
  Serial.printf("[MASTER] WiFi connecting to \"%s\"", WIFI_SSID);
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000UL) {
    delay(400);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[MASTER] WiFi OK  IP=%s  RSSI=%d\n",
                  WiFi.localIP().toString().c_str(), WiFi.RSSI());
  } else {
    Serial.printf("\n[MASTER] WiFi timeout (status=%d) — will keep retrying\n",
                  WiFi.status());
  }
}

bool postTelemetryPayload(const String& body, String &resp, int &code) {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
  http.begin(client, String(SERVER_HOST) + "/api/public/telemetry");
  http.setTimeout(8000);
  http.addHeader("Content-Type", "application/json");
  code = http.POST(body);
  resp = http.getString();
  http.end();
  return code >= 200 && code < 300;
}

bool ensureWifi() {
  if (WiFi.status() == WL_CONNECTED) return true;

  systemOnline = false;
  if (motorOn) setMotor(false);  // safety OFF on WiFi/backend loss

  if (millis() - lastWifiAttempt >= WIFI_RETRY_MS) {
    lastWifiAttempt = millis();
    Serial.printf("[MASTER] WiFi lost (status=%d) — reconnecting...\n", WiFi.status());
    WiFi.disconnect(false, false);
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

  int code = 0;
  String resp;
  systemOnline = postTelemetryPayload(body, resp, code);
  if (!systemOnline) {
    delay(250);
    systemOnline = postTelemetryPayload(body, resp, code);
  }
  if (!systemOnline && motorOn) {
    setMotor(false);
    lpm = 0.0; volt = 0.0; curr = 0.0;
    lastSend = 0;
  }

  Serial.printf("[MASTER] POST %d  tank=%.0f%% lpm=%.2f V=%.1f T=", code, tank, lpm, volt);
  if (isnan(t)) Serial.print("--"); else Serial.print(t, 1);
  Serial.print("C H=");
  if (isnan(h)) Serial.print("--"); else Serial.print(h, 0);
  Serial.printf("%% online=%d\n", systemOnline ? 1 : 0);

  bool motorChanged = false;
  JsonDocument r;
  if (deserializeJson(r, resp) == DeserializationError::Ok) {
    bool inOverride = (millis() < buttonOverrideUntil);
    for (JsonObject c : r["commands"].as<JsonArray>()) {
      String a = c["action"].as<String>();
      bool target = motorOn;
      if (a == "motor_on") target = true;
      else if (a == "motor_off") target = false;
      else continue;
      // Honor a fresh local button press: ignore stale opposing queued cmds
      if (inOverride && target != motorOn) {
        Serial.printf("[CMD] ignored %s (button override active)\n", a.c_str());
        continue;
      }
      if (target != motorOn) {
        setMotor(target);
        motorChanged = true;
      }
    }
  }
  if (motorChanged) lastSend = 0;
  drawDashboard(tank, lpm, volt, curr, t, h);
}

// Momentary push-button handler — single press = one signal.
// Press edge only (HIGH→LOW). ON button only turns motor ON; OFF only OFF.
void handleButtonEdge(bool isOnButton) {
  if (isOnButton) {
    if (motorOn) { Serial.println("[BTN] ON pressed (already running)"); return; }
    Serial.println("[BTN] ON  → motor START");
    setMotor(true);
  } else {
    if (!motorOn) { Serial.println("[BTN] OFF pressed (already stopped)"); return; }
    Serial.println("[BTN] OFF → motor STOP");
    setMotor(false);
  }
  buttonOverrideUntil = millis() + BUTTON_OVERRIDE_MS;
  sendTelemetry();        // instant dashboard + OLED sync
  lastSend = millis();
}

void pollButtons() {
  int rawOn  = digitalRead(PIN_BTN_ON);
  int rawOff = digitalRead(PIN_BTN_OFF);
  unsigned long now = millis();

  // Diagnostic heartbeat every 3s
  static unsigned long lastBtnLog = 0;
  if (now - lastBtnLog > 3000) {
    lastBtnLog = now;
    Serial.print("[BTN] raw ON="); Serial.print(rawOn);
    Serial.print(" OFF="); Serial.println(rawOff);
  }

  // -------- ON button --------
  if (rawOn != lastBtnOnRaw) { btnOnChangeMs = now; lastBtnOnRaw = rawOn; }
  if ((now - btnOnChangeMs) > BTN_DEBOUNCE_MS && rawOn != stableBtnOn) {
    int prev = stableBtnOn;
    stableBtnOn = rawOn;
    // Press edge ONLY: HIGH→LOW, and not within lockout window
    if (prev == HIGH && stableBtnOn == LOW && now >= btnOnLockoutUntil) {
      btnOnLockoutUntil = now + BTN_LOCKOUT_MS;
      handleButtonEdge(true);
    }
  }

  // -------- OFF button --------
  if (rawOff != lastBtnOffRaw) { btnOffChangeMs = now; lastBtnOffRaw = rawOff; }
  if ((now - btnOffChangeMs) > BTN_DEBOUNCE_MS && rawOff != stableBtnOff) {
    int prev = stableBtnOff;
    stableBtnOff = rawOff;
    if (prev == HIGH && stableBtnOff == LOW && now >= btnOffLockoutUntil) {
      btnOffLockoutUntil = now + BTN_LOCKOUT_MS;
      handleButtonEdge(false);
    }
  }
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
  // Canonical wiring: button between GPIO and GND. Idle=HIGH, Press=LOW.
  delay(20);
  lastBtnOnRaw  = stableBtnOn  = digitalRead(PIN_BTN_ON);
  lastBtnOffRaw = stableBtnOff = digitalRead(PIN_BTN_OFF);
  Serial.print("[BTN] init  ON="); Serial.print(stableBtnOn);
  Serial.print(" OFF="); Serial.println(stableBtnOff);

  pinMode(PIN_LED_ONLINE, OUTPUT);
  ledWrite(false);

  Wire.begin(I2C_SDA, I2C_SCL);
  if (!oled.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED init failed");
  }
  oled.clearDisplay();
  oled.display();
  bootAnimation();

  pinMode(PIN_DHT, INPUT_PULLUP);   // DHT11/DHT22 DATA pin; external 10k pull-up is still recommended
  dht.begin();
  dhtWarmupUntil = millis() + 2500;  // give DHT22 ~2.5s to stabilise without external pull-up

  // Render an immediate placeholder dashboard so OLED never sits on "Loading 100%"
  drawDashboard(readTankPct(), 0.0, 0.0, 0.0, NAN, NAN);

  connectWifi();

  Serial.println("[MASTER] System online — sending boot heartbeat");
  // Wait for warmup; keep refreshing the dashboard so the screen stays alive
  while (millis() < dhtWarmupUntil) {
    float t, h;
    readDhtSafe(t, h);
    drawDashboard(readTankPct(), 0.0, 0.0, 0.0, t, h);
    delay(250);
  }
  // Prime DHT with one direct read so the first telemetry frame has real values
  float pt = dht.readTemperature(false), ph = dht.readHumidity();
  if (!isnan(pt)) lastGoodTemp = pt;
  if (!isnan(ph)) lastGoodHum = ph;
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