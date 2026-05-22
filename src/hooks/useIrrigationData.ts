import { useEffect, useState } from "react";

export type FieldZone = {
  id: string;
  name: string;
  nameBn: string;
  area: number; // acres
  waterLevel: number; // %
  soilMoisture: number; // %
  status: "irrigating" | "idle" | "scheduled" | "alert";
  valveOpen: boolean;
  cropType: string;
  x: number;
  y: number;
};

export type MotorState = {
  id: string;
  name: string;
  isOn: boolean;
  pressure: number; // PSI
  flowRate: number; // L/min
  voltage: number;
  current: number;
  runtime: number; // hours today
  health: number; // %
};

export type ActivityEntry = {
  id: string;
  time: string;
  type: "info" | "success" | "warning" | "alert";
  message: string;
};

const initialZones: FieldZone[] = [
  { id: "Z-01", name: "North Field A", nameBn: "উত্তর জমি A", area: 4.2, waterLevel: 72, soilMoisture: 58, status: "irrigating", valveOpen: true, cropType: "Rice", x: 18, y: 22 },
  { id: "Z-02", name: "North Field B", nameBn: "উত্তর জমি B", area: 3.6, waterLevel: 45, soilMoisture: 38, status: "scheduled", valveOpen: false, cropType: "Wheat", x: 42, y: 18 },
  { id: "Z-03", name: "East Field", nameBn: "পূর্ব জমি", area: 5.1, waterLevel: 88, soilMoisture: 71, status: "idle", valveOpen: false, cropType: "Rice", x: 72, y: 30 },
  { id: "Z-04", name: "Central Plot", nameBn: "কেন্দ্রীয় প্লট", area: 2.8, waterLevel: 30, soilMoisture: 22, status: "alert", valveOpen: false, cropType: "Maize", x: 48, y: 52 },
  { id: "Z-05", name: "South Field A", nameBn: "দক্ষিণ জমি A", area: 4.0, waterLevel: 65, soilMoisture: 54, status: "irrigating", valveOpen: true, cropType: "Rice", x: 24, y: 72 },
  { id: "Z-06", name: "South Field B", nameBn: "দক্ষিণ জমি B", area: 3.3, waterLevel: 51, soilMoisture: 44, status: "idle", valveOpen: false, cropType: "Potato", x: 58, y: 78 },
  { id: "Z-07", name: "West Field", nameBn: "পশ্চিম জমি", area: 6.4, waterLevel: 80, soilMoisture: 66, status: "scheduled", valveOpen: false, cropType: "Sugarcane", x: 82, y: 62 },
];

const initialMotor: MotorState = {
  id: "PUMP-MAIN-01",
  name: "Main Deep Tubewell Pump",
  isOn: true,
  pressure: 42,
  flowRate: 1280,
  voltage: 415,
  current: 18.4,
  runtime: 4.2,
  health: 96,
};

const initialActivity: ActivityEntry[] = [
  { id: "a1", time: "10:42", type: "success", message: "Zone Z-01 valve opened — irrigation started" },
  { id: "a2", time: "10:38", type: "info", message: "AI: Optimal watering window detected (10:30–13:00)" },
  { id: "a3", time: "10:21", type: "warning", message: "Zone Z-04 soil moisture below 25% threshold" },
  { id: "a4", time: "09:55", type: "success", message: "Main pump started — pressure stable at 42 PSI" },
  { id: "a5", time: "09:12", type: "info", message: "Weather sync: no rainfall expected next 48h" },
];

export function useIrrigationData() {
  const [zones, setZones] = useState<FieldZone[]>(initialZones);
  const [motor, setMotor] = useState<MotorState>(initialMotor);
  const [activity, setActivity] = useState<ActivityEntry[]>(initialActivity);

  // Simulate live telemetry
  useEffect(() => {
    const t = setInterval(() => {
      setZones((prev) =>
        prev.map((z) => {
          const delta = z.valveOpen ? Math.random() * 1.2 : -Math.random() * 0.6;
          const wl = Math.max(5, Math.min(100, z.waterLevel + delta));
          const sm = Math.max(5, Math.min(100, z.soilMoisture + delta * 0.7));
          return { ...z, waterLevel: +wl.toFixed(1), soilMoisture: +sm.toFixed(1) };
        })
      );
      setMotor((m) => ({
        ...m,
        pressure: m.isOn ? +(40 + Math.random() * 5).toFixed(1) : 0,
        flowRate: m.isOn ? Math.round(1250 + Math.random() * 80) : 0,
        current: m.isOn ? +(17 + Math.random() * 2).toFixed(1) : 0,
        runtime: m.isOn ? +(m.runtime + 0.0014).toFixed(3) : m.runtime,
      }));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const toggleValve = (id: string) => {
    setZones((prev) =>
      prev.map((z) =>
        z.id === id
          ? {
              ...z,
              valveOpen: !z.valveOpen,
              status: !z.valveOpen ? "irrigating" : "idle",
            }
          : z
      )
    );
    const zone = zones.find((z) => z.id === id);
    if (zone) {
      pushActivity({
        type: !zone.valveOpen ? "success" : "info",
        message: `${zone.id} valve ${!zone.valveOpen ? "opened" : "closed"} via dashboard`,
      });
    }
  };

  const toggleMotor = () => {
    setMotor((m) => ({ ...m, isOn: !m.isOn }));
    pushActivity({
      type: motor.isOn ? "warning" : "success",
      message: `Main pump ${motor.isOn ? "stopped" : "started"} from control panel`,
    });
  };

  const pushActivity = (e: { type: ActivityEntry["type"]; message: string }) => {
    setActivity((prev) =>
      [
        {
          id: Math.random().toString(36).slice(2),
          time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
          ...e,
        },
        ...prev,
      ].slice(0, 12)
    );
  };

  return { zones, motor, activity, toggleValve, toggleMotor };
}
