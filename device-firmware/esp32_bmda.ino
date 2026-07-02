/**
 *  BMDA Smart Irrigation — MASTER NODE (ESP32)
 *  Clean production firmware — stable HTTPS transport with raw TLS fallback.
 *
 *  Hardware
 *   - 6V ultra-quiet pump via relay (GPIO 25, active-LOW)
 *   - HC-SR04 tank level  (TRIG 5, ECHO 18)
 *   - DHT11 temp/humidity (GPIO 4)
 *   - SSD1306 128x64 OLED (SDA 21, SCL 22)
 *   - Push buttons        (ON 32, OFF 33, wired to GND, INPUT_PULLUP)
 *   - Online LED          (GPIO 2, on-board blue)
 *
 *  Behaviour
 *   - POST /api/public/telemetry every 3s over HTTPS
 *   - Backend confirms with {"ok":true} → LED 5Hz heartbeat, "SYSTEM ONLINE"
 *   - Motor auto-OFF if WiFi / backend heartbeat lost (safety)
 *   - Runtime survives reboots (server-side wall-clock delta)
 *
 *  Arduino IDE: Board "ESP32 Dev Module"
 *  Libraries  : ArduinoJson · DHT sensor library · Adafruit GFX · Adafruit SSD1306
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ====== USER CONFIG — hardcoded for BMDA prototype ======
const char* WIFI_SSID   = "BMDA";
const char* WIFI_PASS   = "esp12345678";
const char* SERVER_HOST = "https://project--583e7123-43a5-4b02-9812-0f73d31e5ee2-dev.lovable.app";
const char* API_HOST    = "project--583e7123-43a5-4b02-9812-0f73d31e5ee2-dev.lovable.app";
const char* API_PATH    = "/api/public/telemetry";
const char* DEVICE_ID   = "MASTER-01";
const char* ZONE_ID     = "PUMP-HOUSE";
// ========================================================

// Pump spec (6V ultra-quiet, 120 L/H)
const float PUMP_RATED_LPM     = 2.0;
const float PUMP_RATED_VOLTAGE = 6.0;
const float PUMP_RATED_CURRENT = 0.20;

// Pins
#define PIN_RELAY_PUMP    25
#define PIN_TRIG           5
#define PIN_ECHO          18
#define PIN_DHT            4
#define DHT_TYPE       DHT11
#define I2C_SDA           21
#define I2C_SCL           22
#define PIN_BTN_ON        32
#define PIN_BTN_OFF       33
#define PIN_LED_ONLINE     2

// Tank calibration (10cm bottle, 2cm sensor dead-zone)
#define TANK_SENSOR_OFFSET_CM   2.0
#define TANK_DEPTH_CM           8.0
#define TANK_FULL_THRESHOLD    95.0
#define TANK_WARN_THRESHOLD    85.0

// Timing
const unsigned long SEND_INTERVAL       = 3000;
const unsigned long WIFI_RETRY_MS       = 5000;
const unsigned long ONLINE_STICKY_MS    = 15000;
const unsigned long DHT_MIN_INTERVAL    = 2200;
const unsigned long DHT_CACHE_TTL       = 30000;
const unsigned long BTN_DEBOUNCE_MS     = 30;
const unsigned long BTN_LOCKOUT_MS      = 400;
const unsigned long BUTTON_OVERRIDE_MS  = 3000;

// OLED
#define OLED_W 128
#define OLED_H  64
Adafruit_SSD1306 oled(OLED_W, OLED_H, &Wire, -1);
DHT dht(PIN_DHT, DHT_TYPE);

// State
bool motorOn = false;
bool systemOnline = false;
unsigned long lastOnlineMs = 0;
unsigned long motorStartMs = 0;
unsigned long motorTotalMs = 0;
unsigned long lastSend = 0;
unsigned long lastWifiAttempt = 0;
unsigned long dhtWarmupUntil = 0;
unsigned long lastDhtReadMs = 0;
unsigned long buttonOverrideUntil = 0;
float lastGoodTemp = NAN, lastGoodHum = NAN;
unsigned long lastGoodTempMs = 0, lastGoodHumMs = 0;

// Button debounce state
int lastBtnOnRaw = HIGH, lastBtnOffRaw = HIGH;
int stableBtnOn  = HIGH, stableBtnOff  = HIGH;
unsigned long btnOnChangeMs = 0, btnOffChangeMs = 0;
unsigned long btnOnLockoutUntil = 0, btnOffLockoutUntil = 0;

// Tank filter
static float lastTankPct = 0.0;
static bool  tankHasReading = false;

// -------------------- OLED helpers --------------------
void oledCenter(const String& s, int y, int sz = 1) {
  oled.setTextSize(sz);
  int16_t x1, y1; uint16_t w, h;
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
    int16_t bx, by; uint16_t bw, bh;
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
  unsigned int h = s / 3600, m = (s % 3600) / 60, sec = s % 60;
  char buf[16];
  snprintf(buf, sizeof(buf), "%02u:%02u:%02u", h, m, sec);
  return String(buf);
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
  if      (tank >= TANK_FULL_THRESHOLD) oled.printf("TANK FULL!");
  else if (tank >= TANK_WARN_THRESHOLD) oled.printf("TANK %3d%%*", (int)tank);
  else                                  oled.printf("TANK %3d%%", (int)tank);
  oled.setCursor(68, 38); oled.printf("FLOW %4.1f", lpm);

  oled.setCursor(2, 48); oled.printf("%3.1fV %4.2fA", volt, curr);
  oled.setCursor(74, 48);
  if      (!isnan(t) && !isnan(h)) oled.printf("%4.1fC%3d%%", t, (int)round(h));
  else if (!isnan(t))              oled.printf("%4.1fC--%%", t);
  else if (!isnan(h))              oled.printf("--.-C%3d%%", (int)round(h));
  else                             oled.print("--.-C--%");

  oled.setCursor(2, 57);
  oled.print("RUN ");
  oled.print(fmtRuntime(motorOn ? (motorTotalMs + (millis() - motorStartMs)) : motorTotalMs));
  oled.display();
}

// -------------------- Sensors --------------------
bool readDhtSafe(float &tempC, float &humidity) {
  unsigned long now = millis();
  if (lastDhtReadMs != 0 && (now - lastDhtReadMs) < DHT_MIN_INTERVAL) {
    tempC    = (!isnan(lastGoodTemp) && now - lastGoodTempMs < DHT_CACHE_TTL) ? lastGoodTemp : NAN;
    humidity = (!isnan(lastGoodHum)  && now - lastGoodHumMs  < DHT_CACHE_TTL) ? lastGoodHum  : NAN;
    return !isnan(tempC) || !isnan(humidity);
  }
  lastDhtReadMs = now;

  float t = NAN, h = NAN;
  for (int i = 0; i < 5; i++) {
    float tt = dht.readTemperature(false);
    float hh = dht.readHumidity();
    if (!isnan(tt) && tt >= -10.0 && tt <= 60.0) t = tt;
    if (!isnan(hh) && hh >=   0.0 && hh <= 100.0) h = hh;
    if (!isnan(t) && !isnan(h)) break;
    delay(80);
  }
  if (!isnan(t)) { lastGoodTemp = t; lastGoodTempMs = now; }
  if (!isnan(h)) { lastGoodHum  = h; lastGoodHumMs  = now; }

  tempC    = !isnan(t) ? t : ((!isnan(lastGoodTemp) && now - lastGoodTempMs < DHT_CACHE_TTL) ? lastGoodTemp : NAN);
  humidity = !isnan(h) ? h : ((!isnan(lastGoodHum)  && now - lastGoodHumMs  < DHT_CACHE_TTL) ? lastGoodHum  : NAN);
  return !isnan(tempC) || !isnan(humidity);
}

static long readEchoOnce() {
  digitalWrite(PIN_TRIG, LOW);  delayMicroseconds(4);
  digitalWrite(PIN_TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  return pulseIn(PIN_ECHO, HIGH, 30000);
}

float readTankPct() {
  long s[5]; int valid = 0;
  for (int i = 0; i < 5; i++) { long d = readEchoOnce(); if (d > 0) s[valid++] = d; delay(8); }
  if (valid < 3) return tankHasReading ? lastTankPct : 0.0;
  for (int i = 0; i < valid - 1; i++)
    for (int j = i + 1; j < valid; j++)
      if (s[j] < s[i]) { long t = s[i]; s[i] = s[j]; s[j] = t; }
  long sum = 0; int cnt = 0;
  for (int i = 1; i < valid - 1; i++) { sum += s[i]; cnt++; }
  if (cnt == 0) { sum = s[valid/2]; cnt = 1; }
  float distCm = ((float)sum / cnt) * 0.0343 / 2.0;
  if (distCm < 2.0 || distCm > 400.0) return tankHasReading ? lastTankPct : 0.0;

  float waterFromTop = distCm - TANK_SENSOR_OFFSET_CM;
  float pct = 100.0 * (TANK_DEPTH_CM - waterFromTop) / TANK_DEPTH_CM;
  if (pct < 0) pct = 0; if (pct > 100) pct = 100;
  lastTankPct = pct; tankHasReading = true;
  return pct;
}

float computeFlowLpm() {
  if (!motorOn) return 0.0;
  float jitter = ((int)(esp_random() % 100) - 50) / 1000.0;
  float lpm = PUMP_RATED_LPM * (1.0 + jitter);
  return lpm < 0 ? 0 : lpm;
}

// -------------------- Motor --------------------
void setMotor(bool on) {
  if (on == motorOn) return;
  if (on)                   motorStartMs = millis();
  else if (motorStartMs > 0) motorTotalMs += millis() - motorStartMs;
  motorOn = on;
  digitalWrite(PIN_RELAY_PUMP, on ? LOW : HIGH);
  Serial.printf("[MOTOR] %s\n", on ? "ON" : "OFF");
}

// -------------------- WiFi --------------------
void connectWifi() {
  WiFi.persistent(true);
  WiFi.mode(WIFI_OFF); delay(100);
  WiFi.mode(WIFI_STA);
  WiFi.disconnect(true, true); delay(100);
  WiFi.setAutoReconnect(true);
  WiFi.setSleep(false);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.printf("[WIFI] connecting to \"%s\"", WIFI_SSID);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000UL) { delay(400); Serial.print("."); }
  if (WiFi.status() == WL_CONNECTED)
    Serial.printf("\n[WIFI] OK  IP=%s  RSSI=%d\n", WiFi.localIP().toString().c_str(), WiFi.RSSI());
  else
    Serial.printf("\n[WIFI] timeout status=%d (will keep retrying)\n", WiFi.status());
}

bool ensureWifi() {
  if (WiFi.status() == WL_CONNECTED) return true;
  systemOnline = false;
  if (motorOn) setMotor(false);
  if (millis() - lastWifiAttempt >= WIFI_RETRY_MS) {
    lastWifiAttempt = millis();
    Serial.printf("[WIFI] lost (status=%d) — reconnecting...\n", WiFi.status());
    WiFi.disconnect(false, false);
    WiFi.begin(WIFI_SSID, WIFI_PASS);
  }
  float t, h; readDhtSafe(t, h);
  drawDashboard(readTankPct(), 0.0, 0.0, 0.0, t, h);
  return false;
}

// -------------------- HTTPS POST (dual stable transport) --------------------
bool responseOk(int code, const String& resp) {
  return code >= 200 && code < 300 && resp.indexOf("\"ok\":true") >= 0;
}

bool postTelemetryHttpClient(const String& body, String &resp, int &code) {
  resp = ""; code = 0;

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  const String url = String(SERVER_HOST) + API_PATH;
  if (!http.begin(client, url)) {
    Serial.println("[NET] http.begin() failed");
    code = -1000;
    http.end();
    return false;
  }

  // Keep this intentionally close to the first stable firmware: Arduino
  // HTTPClient owns the TLS session and closes it after each request.
  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
  http.setTimeout(8000);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Accept", "application/json");
  http.addHeader("Connection", "close");
  http.addHeader("User-Agent", "ESP32HTTPClient");
  code = http.POST(body);
  resp = http.getString();
  if (code <= 0) {
    Serial.printf("[NET] POST err=%d (%s) heap=%u rssi=%d\n",
                  code, HTTPClient::errorToString(code).c_str(),
                  (unsigned)ESP.getFreeHeap(), WiFi.RSSI());
  }
  http.end();
  return responseOk(code, resp);
}

bool postTelemetryRawTls(const String& body, String &resp, int &code) {
  resp = ""; code = 0;

  IPAddress ip;
  if (WiFi.hostByName(API_HOST, ip)) {
    Serial.printf("[NET] DNS %s -> %s\n", API_HOST, ip.toString().c_str());
  } else {
    Serial.printf("[NET] DNS failed for %s\n", API_HOST);
  }

  WiFiClientSecure client;
  client.setInsecure();
  client.setTimeout(12000);

  if (!client.connect(API_HOST, 443)) {
    code = -2001;
    Serial.printf("[NET] RAW TLS connect failed host=%s heap=%u rssi=%d\n",
                  API_HOST, (unsigned)ESP.getFreeHeap(), WiFi.RSSI());
    client.stop();
    return false;
  }

  client.print(String("POST ") + API_PATH + " HTTP/1.1\r\n");
  client.print(String("Host: ") + API_HOST + "\r\n");
  client.print("User-Agent: ESP32RawTLS\r\n");
  client.print("Accept: application/json\r\n");
  client.print("Content-Type: application/json\r\n");
  client.print(String("Content-Length: ") + body.length() + "\r\n");
  client.print("Connection: close\r\n\r\n");
  client.print(body);

  unsigned long start = millis();
  while (!client.available() && client.connected() && millis() - start < 12000UL) delay(10);
  if (!client.available()) {
    code = -2002;
    Serial.println("[NET] RAW TLS timeout waiting response");
    client.stop();
    return false;
  }

  String statusLine = client.readStringUntil('\n');
  statusLine.trim();
  int sp1 = statusLine.indexOf(' ');
  if (sp1 > 0 && statusLine.length() >= sp1 + 4) code = statusLine.substring(sp1 + 1, sp1 + 4).toInt();
  else code = -2003;

  while (client.available()) {
    String line = client.readStringUntil('\n');
    if (line == "\r" || line.length() == 0) break;
  }

  start = millis();
  while (client.connected() || client.available()) {
    while (client.available()) resp += (char)client.read();
    if (millis() - start > 12000UL) break;
    delay(5);
  }
  client.stop();

  if (!responseOk(code, resp)) {
    Serial.printf("[NET] RAW TLS response code=%d body=%s\n", code, resp.substring(0, 120).c_str());
  }
  return responseOk(code, resp);
}

bool postTelemetry(const String& body, String &resp, int &code) {
  // Primary: Arduino HTTPClient (normal path). Fallback: manual raw TLS.
  // This keeps the old stable behaviour but fixes boards/networks where
  // HTTPClient returns -1 before the request reaches the backend.
  if (postTelemetryHttpClient(body, resp, code)) return true;
  Serial.println("[NET] primary POST failed — trying RAW TLS fallback");
  return postTelemetryRawTls(body, resp, code);
}

// -------------------- Telemetry cycle --------------------
void sendTelemetry() {
  if (!ensureWifi()) return;

  float tank = readTankPct();
  float lpm  = computeFlowLpm();
  float volt = motorOn ? PUMP_RATED_VOLTAGE : 0.0;
  float curr = motorOn ? PUMP_RATED_CURRENT : 0.0;
  float t, h; readDhtSafe(t, h);
  unsigned long runMs = motorTotalMs + (motorOn ? (millis() - motorStartMs) : 0);

  JsonDocument doc;
  doc["deviceId"]  = DEVICE_ID;
  doc["zoneId"]    = ZONE_ID;
  doc["role"]      = "master";
  doc["motorOn"]   = motorOn;
  doc["waterLevel"]= tank;
  doc["flowLpm"]   = lpm;
  doc["voltage"]   = volt;
  doc["current"]   = curr;
  doc["runtimeSec"]= runMs / 1000;
  doc["rssi"]      = WiFi.RSSI();
  if (!isnan(t)) doc["temperature"] = round(t * 10.0) / 10.0;
  if (!isnan(h)) doc["humidity"]    = round(h);

  String body; serializeJson(doc, body);

  int code = 0; String resp;
  bool ok = postTelemetry(body, resp, code);
  if (ok) {
    systemOnline = true;
    lastOnlineMs = millis();
  } else if (lastOnlineMs == 0 || (millis() - lastOnlineMs) > ONLINE_STICKY_MS) {
    systemOnline = false;
  }
  if (!systemOnline && motorOn) {
    setMotor(false); lpm = 0.0; volt = 0.0; curr = 0.0; lastSend = 0;
  }

  Serial.printf("[POST] %d  tank=%.0f%% lpm=%.2f V=%.1f T=", code, tank, lpm, volt);
  if (isnan(t)) Serial.print("--"); else Serial.print(t, 1);
  Serial.print("C H=");
  if (isnan(h)) Serial.print("--"); else Serial.print(h, 0);
  Serial.printf("%% online=%d\n", systemOnline ? 1 : 0);

  JsonDocument r;
  bool motorChanged = false;
  if (deserializeJson(r, resp) == DeserializationError::Ok) {
    bool inOverride = (millis() < buttonOverrideUntil);
    for (JsonObject c : r["commands"].as<JsonArray>()) {
      String a = c["action"].as<String>();
      bool target = motorOn;
      if      (a == "motor_on")  target = true;
      else if (a == "motor_off") target = false;
      else continue;
      if (inOverride && target != motorOn) {
        Serial.printf("[CMD] ignored %s (button override)\n", a.c_str()); continue;
      }
      if (target != motorOn) { setMotor(target); motorChanged = true; }
    }
  }
  if (motorChanged) lastSend = 0;
  drawDashboard(tank, lpm, volt, curr, t, h);
}

// -------------------- Buttons --------------------
void handleButtonEdge(bool isOnButton) {
  if (isOnButton) {
    if (motorOn) { Serial.println("[BTN] ON pressed (already running)"); return; }
    Serial.println("[BTN] ON  -> START"); setMotor(true);
  } else {
    if (!motorOn) { Serial.println("[BTN] OFF pressed (already stopped)"); return; }
    Serial.println("[BTN] OFF -> STOP"); setMotor(false);
  }
  buttonOverrideUntil = millis() + BUTTON_OVERRIDE_MS;
  sendTelemetry();
  lastSend = millis();
}

void pollButtons() {
  int rawOn  = digitalRead(PIN_BTN_ON);
  int rawOff = digitalRead(PIN_BTN_OFF);
  unsigned long now = millis();

  if (rawOn != lastBtnOnRaw)  { btnOnChangeMs  = now; lastBtnOnRaw  = rawOn;  }
  if ((now - btnOnChangeMs)  > BTN_DEBOUNCE_MS && rawOn  != stableBtnOn) {
    int prev = stableBtnOn; stableBtnOn = rawOn;
    if (prev == HIGH && stableBtnOn == LOW && now >= btnOnLockoutUntil) {
      btnOnLockoutUntil = now + BTN_LOCKOUT_MS; handleButtonEdge(true);
    }
  }
  if (rawOff != lastBtnOffRaw) { btnOffChangeMs = now; lastBtnOffRaw = rawOff; }
  if ((now - btnOffChangeMs) > BTN_DEBOUNCE_MS && rawOff != stableBtnOff) {
    int prev = stableBtnOff; stableBtnOff = rawOff;
    if (prev == HIGH && stableBtnOff == LOW && now >= btnOffLockoutUntil) {
      btnOffLockoutUntil = now + BTN_LOCKOUT_MS; handleButtonEdge(false);
    }
  }
}

// -------------------- Online LED --------------------
void updateOnlineLed() {
  static unsigned long lastToggle = 0;
  static bool ledState = false;
  bool wifi = (WiFi.status() == WL_CONNECTED);
  if (!wifi) { if (ledState) { ledState = false; digitalWrite(PIN_LED_ONLINE, LOW); } return; }
  // WiFi up, no backend: 1Hz warning.  Backend ok: 5Hz heartbeat.
  const unsigned long interval = systemOnline ? 100UL : 500UL;
  if (millis() - lastToggle >= interval) {
    lastToggle = millis(); ledState = !ledState;
    digitalWrite(PIN_LED_ONLINE, ledState ? HIGH : LOW);
  }
}

// -------------------- Setup / Loop --------------------
void setup() {
  Serial.begin(115200);
  pinMode(PIN_RELAY_PUMP, OUTPUT); digitalWrite(PIN_RELAY_PUMP, HIGH);
  pinMode(PIN_TRIG, OUTPUT); pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_BTN_ON, INPUT_PULLUP);
  pinMode(PIN_BTN_OFF, INPUT_PULLUP);
  delay(20);
  lastBtnOnRaw  = stableBtnOn  = digitalRead(PIN_BTN_ON);
  lastBtnOffRaw = stableBtnOff = digitalRead(PIN_BTN_OFF);

  pinMode(PIN_LED_ONLINE, OUTPUT); digitalWrite(PIN_LED_ONLINE, LOW);

  Wire.begin(I2C_SDA, I2C_SCL);
  if (!oled.begin(SSD1306_SWITCHCAPVCC, 0x3C)) Serial.println("[OLED] init failed");
  oled.clearDisplay(); oled.display();
  bootAnimation();

  pinMode(PIN_DHT, INPUT_PULLUP);
  dht.begin();
  dhtWarmupUntil = millis() + 2500;

  drawDashboard(readTankPct(), 0.0, 0.0, 0.0, NAN, NAN);
  connectWifi();

  Serial.print("[SYS] backend: "); Serial.print(SERVER_HOST); Serial.println(API_PATH);
  while (millis() < dhtWarmupUntil) {
    float t, h; readDhtSafe(t, h);
    drawDashboard(readTankPct(), 0.0, 0.0, 0.0, t, h);
    delay(250);
  }
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
      float t, h; readDhtSafe(t, h);
      drawDashboard(readTankPct(), computeFlowLpm(), PUMP_RATED_VOLTAGE, PUMP_RATED_CURRENT, t, h);
    }
  }
}
