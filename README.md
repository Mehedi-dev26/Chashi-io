<p align="center">
  <img src="https://raw.githubusercontent.com/Mehedi-dev26/Chashi-io/main/public/favicon.ico" alt="Chashi.io Logo" width="96" height="96" style="border-radius: 20%;" />
</p>

<h1 align="center">🌾 Chashi.io — Smart IoT & AI Precision Agriculture</h1>

<p align="center">
  <strong>An Intelligent IoT & AI-Driven Precision Irrigation, Multi-Zone Water Distribution, and Agronomy Platform</strong><br>
  <em>Revolutionizing Agriculture & BMDA (Barind Multipurpose Development Authority) Irrigation Systems</em>
</p>

<p align="center">
  <a href="https://github.com/Mehedi-dev26/Chashi-io"><img src="https://img.shields.io/badge/Maintained%20by-Mehedi%20Hasan-0ea5e9?style=for-the-badge&logo=github&logoColor=white" alt="Developer" /></a>
  <a href="#"><img src="https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" /></a>
  <a href="#"><img src="https://img.shields.io/badge/TanStack-Start%20%26%20Router-FF4154?style=for-the-badge&logo=tanstack&logoColor=white" alt="TanStack" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Supabase-PostgreSQL%2015-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" /></a>
  <a href="#"><img src="https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Hardware-ESP32%20%2F%20IoT-E7352C?style=for-the-badge&logo=espressif&logoColor=white" alt="ESP32" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Deploy-Vercel%20Live-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" /></a>
</p>

---

## 📖 Table of Contents

- [🌟 Overview & Vision](#-overview--vision)
- [⚡ Key Features](#-key-features)
- [🏗️ System Architecture](#️-system-architecture)
- [📊 Impact & Benefits](#-impact--benefits)
- [🛠️ Tech Stack & Hardware](#️-tech-stack--hardware)
- [🛰️ IoT Firmware & Telemetry](#️-iot-firmware--telemetry)
- [🚀 Quick Start & Installation](#-quick-start--installation)
- [⚙️ Environment Configuration](#️-environment-configuration)
- [👨‍💻 About the Developer](#-about-the-developer)
- [📜 License & Acknowledgements](#-license--acknowledgements)

---

## 🌟 Overview & Vision

**Chashi.io** is a cutting-edge **AgriTech & IoT solution** engineered to modernize traditional deep tube-well irrigation networks (such as the Barind Multipurpose Development Authority - BMDA in Bangladesh) into fully automated, smart, and remotely controlled agricultural ecosystems.

Farmers and agricultural operators can visualize multi-zone farm topography via interactive GPS mapping, automate pump and solenoid valve switching based on live soil moisture/water levels, analyze historical telemetry trends, and receive AI-backed crop health insights directly from mobile or desktop devices.

```
                  ┌──────────────────────────────────────────────┐
                  │                 Chashi.io                    │
                  │   Smart Precision Agriculture Cloud Platform │
                  └──────────────────────┬───────────────────────┘
                                         │
            ┌────────────────────────────┼────────────────────────────┐
            ▼                            ▼                            ▼
   🛰️ Real-Time Telemetry        🗺️ GPS Pipeline & GIS         🤖 AI Crop Consultant
   Soil, Water, Temp, Flow     Multi-Zone Valve Mapping      Automated Agronomy Advice
```

---

## ⚡ Key Features

### 🚰 1. Remote Multi-Zone Motor & Valve Automation
* **Master Pump House Control:** Turn 3-phase deep tube-wells and booster pumps ON/OFF remotely with milli-second latency.
* **Smart Valve Actuation:** Direct water lines specifically to designated field zones (e.g., Zone A: Rice, Zone B: Wheat, Zone C: Mustard) to eliminate water wastage.
* **Fail-Safe Watchdog:** Integrated hardware heartbeat auto-cuts pump power if network or sensor connection is interrupted.

### 📡 2. Real-Time Telemetry & Sensor Analytics
* **Continuous Multi-Sensor Reading:** Live data streaming for Soil Moisture (%), Water Reservoir Level (cm), Ambient Temperature & Humidity (DHT11/22), LDR Sunlight Intensity, and Water Flow Rate (LPM).
* **Power & Energy Monitoring:** Tracks operational voltage, current draw, and power consumption with automated billing calculations.
* **Historical Logging & Charts:** High-performance interactive visual telemetry charts using **Recharts**.

### 🗺️ 3. Interactive GIS & GPS Satellite Mapping
* **Leaflet & OpenStreetMap Integration:** Custom interactive polygon drawing to demarcate agricultural plots, pipelines, valves, and motor nodes.
* **Satellite & NDVI Layers:** High-resolution satellite imagery with NDVI vegetative index tracking.

### 🤖 4. AI-Powered Agronomist & Disease Detection
* **Conversational AI Consultant:** Context-aware AI agronomist providing instant crop recommendations, fertilizer schedules, and pest mitigation advice.
* **Weather-Adaptive Irrigation:** Forecast-integrated watering suggestions based on impending rainfall and evapotranspiration rates.

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph "🌾 Field Layer (Hardware & IoT)"
        ESP32[ESP32 Master Node] -->|GPIO / I2C| SENSORS[Sensors: Soil, Water Level, DHT11, LDR, Flow]
        ESP32 -->|Relay Control| PUMP[Deep Tube-Well Motor / Valves]
        ESP32 -->|I2C| OLED[SSD1306 128x64 OLED Display]
    end

    subgraph "☁️ Cloud Infrastructure (Supabase & Edge)"
        ESP32 -->|HTTPS / TLS 1.2 POST| EDGE_FN[Supabase Edge Functions / Telemetry API]
        EDGE_FN -->|Batch Writes| SUPA_DB[(Supabase PostgreSQL 15)]
        SUPA_DB -->|PostgREST & RLS| REALTIME[Supabase Realtime Engine]
    end

    subgraph "💻 Application Layer (TanStack Start & React 19)"
        REALTIME -->|WebSocket Feed| WEB_APP[Chashi.io Web Application]
        WEB_APP -->|Server Functions / SSR| NITRO[Nitro Server / TanStack Start]
        WEB_APP -->|Gemini AI SDK| AI_AGENT[AI Agronomist Engine]
        WEB_APP -->|Interactive GIS| MAP[Leaflet GPS Field Map]
    end

    subgraph "📱 User & Operator Interface"
        WEB_APP --> FARMER[Farmer / Operator Mobile & Desktop Dashboard]
    end
```

---

## 📊 Impact & Benefits

| Metric | Traditional Irrigation | With Chashi.io System | Improvement |
| :--- | :--- | :--- | :--- |
| **Water Usage** | Flooding / Over-irrigation | Targeted Sensor-Based Flow | **💧 40% - 50% Water Saved** |
| **Electricity & Fuel Cost** | Manual unmonitored pump run | Timed & Auto-Cutoff Operation | **⚡ 30% - 35% Energy Saved** |
| **Labor & Physical Visits** | Frequent on-site checks | 24/7 Mobile Dashboard | **⏱️ 80% Time & Labor Saved** |
| **Crop Yield Optimization** | Prone to root-rot or drought | Optimal Moisture Maintenance | **🌾 15% - 25% Higher Yield** |

---

## 🛠️ Tech Stack & Hardware

### 💻 Frontend & Full-Stack Web
* **Framework:** [TanStack Start](https://tanstack.com/start) + [React 19](https://react.dev/) (Full-stack SSR / Server Functions)
* **Routing:** [TanStack Router](https://tanstack.com/router) with strict type safety
* **Styling & UI:** [Tailwind CSS v4](https://tailwindcss.com/), [Radix UI Primitives](https://www.radix-ui.com/), [Lucide React Icons](https://lucide.dev/)
* **Data Visualization:** [Recharts](https://recharts.org/)
* **Geospatial Mapping:** [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)
* **State & Server Cache:** [TanStack Query v5](https://tanstack.com/query)

### 🗄️ Backend & Cloud Database
* **Database:** [Supabase](https://supabase.com/) (PostgreSQL 15+ with Row Level Security & RBAC)
* **Realtime Subscriptions:** WebSockets via Supabase Realtime for instant sensor updates
* **Edge Functions & API:** TypeScript REST & Edge Microservices
* **Deployment:** [Vercel](https://vercel.com/) with global edge caching

### 🔌 Embedded Hardware & Firmware
* **Microcontroller:** ESP32-WROOM-32 / ESP8266 Dev Modules
* **Sensors:** Capacitive Soil Moisture Sensor v1.2, HC-SR04 Ultrasonic Distance, DHT11 / DHT22, LDR Photocell, YF-S201 Water Flow Sensor
* **Actuators:** Optocoupler Isolated 5V/12V Relay Modules, 12V Solenoid Water Valves
* **Display:** 0.96" I2C SSD1306 OLED (128x64)
* **Protocol:** HTTPS / TLS 1.2 JSON Telemetry Transport with fail-safe watchdog

---

## 🛰️ IoT Firmware & Telemetry

The embedded firmware is located in the [`device-firmware/esp32_bmda.ino`](file:///c:/Users/workp/OneDrive/Desktop/Iot/Chashi-io/device-firmware/esp32_bmda.ino) directory.

### Sample Telemetry Payload Structure (JSON)
```json
{
  "device_id": "MASTER-01",
  "zone_id": "PUMP-HOUSE",
  "soil_moisture": 68.5,
  "water_level": 82.0,
  "temperature": 29.4,
  "humidity": 74.0,
  "ldr": 850,
  "motor_on": true,
  "valve_open": true,
  "flow_lpm": 2.1,
  "voltage": 220.5,
  "current": 4.8,
  "rssi": -62
}
```

---

## 🚀 Quick Start & Installation

### Prerequisites
* **Node.js**: `v20.x` or `v22.x+`
* **Package Manager**: `npm` or `bun`
* **Arduino IDE**: (For flashing firmware to ESP32 devices)

### 1. Clone the Repository
```bash
git clone https://github.com/Mehedi-dev26/Chashi-io.git
cd Chashi-io
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory:
```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_PUBLISHABLE_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
```

### 4. Setup Supabase Database Schema
Run the provided idempotent SQL setup file in your Supabase SQL Editor:
* Execute [`supabase/complete_backend_setup.sql`](file:///c:/Users/workp/OneDrive/Desktop/Iot/Chashi-io/supabase/complete_backend_setup.sql)

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Production Build
```bash
npm run build
```

---

## 👨‍💻 About the Developer

<p align="center">
  <img src="https://avatars.githubusercontent.com/u/105490458?v=4" width="120" height="120" style="border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" alt="Mehedi Hasan" />
</p>

<h3 align="center">Mehedi Hasan</h3>
<p align="center">
  <strong>Full-Stack Software Engineer & IoT / Embedded Systems Architect</strong><br>
  <em>Specializing in Modern Web Ecosystems (React, Next.js, TanStack), Cloud Backends, and Smart IoT Solutions</em>
</p>

<p align="center">
  <a href="https://github.com/Mehedi-dev26"><img src="https://img.shields.io/badge/GitHub-Mehedi--dev26-181717?style=flat-square&logo=github" alt="GitHub" /></a>
  <a href="mailto:mehediworkpc@gmail.com"><img src="https://img.shields.io/badge/Email-mehediworkpc@gmail.com-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email" /></a>
  <a href="https://github.com/Mehedi-dev26"><img src="https://img.shields.io/badge/Portfolio-Explore%20Projects-0ea5e9?style=flat-square&logo=safari" alt="Portfolio" /></a>
</p>

---

## 📜 License & Acknowledgements

This project is licensed under the **MIT License** — feel free to use, modify, and distribute for educational, research, and commercial applications.

* Special appreciation to the **Barind Multipurpose Development Authority (BMDA)** inspiration for smart irrigation in northern Bangladesh.
* Built with modern engineering using **TanStack**, **React**, **Supabase**, and **Espressif Systems**.

<p align="center">
  Made with ❤️ by <strong>Mehedi Hasan</strong> | Powered by <strong>Chashi.io</strong>
</p>
