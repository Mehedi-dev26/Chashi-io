/**
 * BMDA Smart Irrigation — ESP32 Firmware
 * ---------------------------------------
 * Reads: Soil moisture, LDR, Water level (HC-SR04), DHT22, Rain sensor
 * Controls: 4 relays (3 zone valves + 1 main pump)
 * Talks to: Lovable dashboard via HTTP every 5s
 *
 * Arduino IDE setup:
 *  - Board: "ESP32 Dev Module"
 *  - Libraries: WiFi (built-in), HTTPClient (built-in), ArduinoJson, DHT sensor library
 *
 * Replace WIFI_SSID, WIFI_PASS, and SERVER_HOST below.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ====== EDIT THESE ======
const char* WIFI_SSID  = "YOUR_WIFI_NAME";
const char* WIFI_PASS  = "YOUR_WIFI_PASSWORD";
const char* SERVER_HOST = "https://project--583e7123-43a5-4b02-9812-0f73d31e5ee2-dev.lovable.app";
const char* DEVICE_ID  = "ESP32-NODE-01";
const char* ZONE_ID    = "Z-01";
// ========================

// Pin map
#define PIN_SOIL    34
#define PIN_LDR     35
#define PIN_TRIG    5
#define PIN_ECHO    18
#define PIN_DHT     4
#define PIN_RAIN    19
#define PIN_RELAY_VALVE  25  // Zone-1 solenoid valve
#define PIN_RELAY_PUMP   14  // Main water pump

#define DHT_TYPE DHT22
DHT dht(PIN_DHT, DHT_TYPE);

bool valveOpen = false;
bool motorOn   = false;
unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL = 5000; // 5s

void setupRelays() {
  pinMode(PIN_RELAY_VALVE, OUTPUT);
  pinMode(PIN_RELAY_PUMP,  OUTPUT);
  // Most relay modules are ACTIVE-LOW: HIGH = OFF
  digitalWrite(PIN_RELAY_VALVE, HIGH);
  digitalWrite(PIN_RELAY_PUMP,  HIGH);
}

void setValve(bool on) {
  valveOpen = on;
  digitalWrite(PIN_RELAY_VALVE, on ? LOW : HIGH);
  Serial.printf("[VALVE] %s\n", on ? "OPEN" : "CLOSED");
}

void setMotor(bool on) {
  motorOn = on;
  digitalWrite(PIN_RELAY_PUMP, on ? LOW : HIGH);
  Serial.printf("[MOTOR] %s\n", on ? "ON" : "OFF");
}

float readWaterLevelPct() {
  // HC-SR04: distance → % full (tank height ≈ 30cm)
  digitalWrite(PIN_TRIG, LOW);  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  long dur = pulseIn(PIN_ECHO, HIGH, 30000);
  if (dur == 0) return 0;
  float distCm = dur * 0.0343 / 2.0;
  const float TANK_HEIGHT = 30.0;
  float pct = 100.0 * (TANK_HEIGHT - distCm) / TANK_HEIGHT;
  if (pct < 0) pct = 0; if (pct > 100) pct = 100;
  return pct;
}

float readSoilPct() {
  int raw = analogRead(PIN_SOIL); // 0-4095
  // Capacitive sensor: dry ≈ 3000, wet ≈ 1200 (calibrate yours!)
  float pct = map(raw, 3000, 1200, 0, 100);
  if (pct < 0) pct = 0; if (pct > 100) pct = 100;
  return pct;
}

float readLdrPct() {
  int raw = analogRead(PIN_LDR);
  return (raw * 100.0) / 4095.0;
}

void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("WiFi connecting");
  while (WiFi.status() != WL_CONNECTED) { delay(400); Serial.print("."); }
  Serial.printf("\nConnected. IP=%s\n", WiFi.localIP().toString().c_str());
}

void sendTelemetry() {
  if (WiFi.status() != WL_CONNECTED) return;

  float soil = readSoilPct();
  float ldr  = readLdrPct();
  float wl   = readWaterLevelPct();
  float t    = dht.readTemperature();
  float h    = dht.readHumidity();
  bool  rain = digitalRead(PIN_RAIN) == LOW;

  JsonDocument doc;
  doc["deviceId"]      = DEVICE_ID;
  doc["zoneId"]        = ZONE_ID;
  doc["soilMoisture"]  = soil;
  doc["waterLevel"]    = wl;
  doc["ldr"]           = ldr;
  doc["valveOpen"]     = valveOpen;
  doc["motorOn"]       = motorOn;
  doc["rssi"]          = WiFi.RSSI();
  if (!isnan(t)) doc["temperature"] = t;
  if (!isnan(h)) doc["humidity"]    = h;
  doc["rain"]          = rain;

  String body; serializeJson(doc, body);

  HTTPClient http;
  String url = String(SERVER_HOST) + "/api/public/telemetry";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(body);
  String resp = http.getString();
  http.end();

  Serial.printf("POST %d  soil=%.0f%% ldr=%.0f%% wl=%.0f%% T=%.1f H=%.0f\n",
                code, soil, ldr, wl, t, h);

  // Parse returned commands
  JsonDocument rdoc;
  if (deserializeJson(rdoc, resp) == DeserializationError::Ok) {
    JsonArray cmds = rdoc["commands"].as<JsonArray>();
    for (JsonObject c : cmds) {
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
  setupRelays();
  dht.begin();
  connectWifi();
}

void loop() {
  if (millis() - lastSend >= SEND_INTERVAL) {
    lastSend = millis();
    sendTelemetry();
  }
}
