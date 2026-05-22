import { useSyncExternalStore } from "react";

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
  // polygon points (percent coordinates) for the realistic field map
  polygon: string;
};

export type MotorState = {
  id: string;
  name: string;
  isOn: boolean;
  pressure: number;
  flowRate: number;
  voltage: number;
  current: number;
  runtime: number;
  health: number;
};

export type ActivityEntry = {
  id: string;
  time: string;
  type: "info" | "success" | "warning" | "alert";
  message: string;
};

type Store = {
  zones: FieldZone[];
  motor: MotorState;
  activity: ActivityEntry[];
};

const initialZones: FieldZone[] = [
  { id: "Z-01", name: "North Field A", nameBn: "উত্তর জমি A", area: 4.2, waterLevel: 72, soilMoisture: 58, status: "irrigating", valveOpen: true, cropType: "Rice", x: 22, y: 22, polygon: "6,6 38,4 40,32 8,34" },
  { id: "Z-02", name: "North Field B", nameBn: "উত্তর জমি B", area: 3.6, waterLevel: 45, soilMoisture: 38, status: "scheduled", valveOpen: false, cropType: "Wheat", x: 56, y: 18, polygon: "42,4 76,6 74,30 42,32" },
  { id: "Z-03", name: "East Field", nameBn: "পূর্ব জমি", area: 5.1, waterLevel: 88, soilMoisture: 71, status: "idle", valveOpen: false, cropType: "Rice", x: 84, y: 26, polygon: "78,6 96,8 96,42 76,40" },
  { id: "Z-04", name: "Central Plot", nameBn: "কেন্দ্রীয় প্লট", area: 2.8, waterLevel: 30, soilMoisture: 22, status: "alert", valveOpen: false, cropType: "Maize", x: 50, y: 52, polygon: "38,42 62,42 62,62 38,62" },
  { id: "Z-05", name: "South Field A", nameBn: "দক্ষিণ জমি A", area: 4.0, waterLevel: 65, soilMoisture: 54, status: "irrigating", valveOpen: true, cropType: "Rice", x: 22, y: 78, polygon: "6,66 36,68 34,94 6,92" },
  { id: "Z-06", name: "South Field B", nameBn: "দক্ষিণ জমি B", area: 3.3, waterLevel: 51, soilMoisture: 44, status: "idle", valveOpen: false, cropType: "Potato", x: 52, y: 80, polygon: "40,68 66,68 66,94 40,94" },
  { id: "Z-07", name: "West Field", nameBn: "পশ্চিম জমি", area: 6.4, waterLevel: 80, soilMoisture: 66, status: "scheduled", valveOpen: false, cropType: "Sugarcane", x: 84, y: 76, polygon: "70,46 96,48 96,94 70,94" },
];

const initialActivity: ActivityEntry[] = [
  { id: "a1", time: "10:42", type: "success", message: "Zone Z-01 valve opened — irrigation started" },
  { id: "a2", time: "10:38", type: "info", message: "AI: Optimal watering window detected (10:30–13:00)" },
  { id: "a3", time: "10:21", type: "warning", message: "Zone Z-04 soil moisture below 25% threshold" },
  { id: "a4", time: "09:55", type: "success", message: "Main pump started — pressure stable at 42 PSI" },
  { id: "a5", time: "09:12", type: "info", message: "Weather sync: no rainfall expected next 48h" },
];

let state: Store = {
  zones: initialZones,
  motor: {
    id: "PUMP-MAIN-01",
    name: "Main Deep Tubewell Pump",
    isOn: true,
    pressure: 42,
    flowRate: 1280,
    voltage: 415,
    current: 18.4,
    runtime: 4.2,
    health: 96,
  },
  activity: initialActivity,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const setState = (next: Store) => {
  state = next;
  emit();
};

// Singleton telemetry tick — runs once for the whole app
if (typeof window !== "undefined") {
  const g = window as unknown as { __bmda_tick?: number };
  if (!g.__bmda_tick) {
    g.__bmda_tick = window.setInterval(() => {
      const zones = state.zones.map((z) => {
        const delta = z.valveOpen ? Math.random() * 1.2 : -Math.random() * 0.6;
        const wl = Math.max(5, Math.min(100, z.waterLevel + delta));
        const sm = Math.max(5, Math.min(100, z.soilMoisture + delta * 0.7));
        return { ...z, waterLevel: +wl.toFixed(1), soilMoisture: +sm.toFixed(1) };
      });
      const m = state.motor;
      const motor = {
        ...m,
        pressure: m.isOn ? +(40 + Math.random() * 5).toFixed(1) : 0,
        flowRate: m.isOn ? Math.round(1250 + Math.random() * 80) : 0,
        current: m.isOn ? +(17 + Math.random() * 2).toFixed(1) : 0,
        runtime: m.isOn ? +(m.runtime + 0.0014).toFixed(3) : m.runtime,
      };
      setState({ ...state, zones, motor });
    }, 2500);
  }
}

const pushActivity = (e: { type: ActivityEntry["type"]; message: string }) => {
  const entry: ActivityEntry = {
    id: Math.random().toString(36).slice(2),
    time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    ...e,
  };
  setState({ ...state, activity: [entry, ...state.activity].slice(0, 14) });
};

const toggleValve = (id: string) => {
  const zone = state.zones.find((z) => z.id === id);
  if (!zone) return;
  const newOpen = !zone.valveOpen;
  const zones = state.zones.map((z) =>
    z.id === id ? { ...z, valveOpen: newOpen, status: newOpen ? "irrigating" as const : "idle" as const } : z
  );
  setState({ ...state, zones });
  pushActivity({
    type: newOpen ? "success" : "info",
    message: `${zone.id} valve ${newOpen ? "opened" : "closed"} via dashboard`,
  });
};

const toggleMotor = () => {
  const newOn = !state.motor.isOn;
  setState({ ...state, motor: { ...state.motor, isOn: newOn } });
  pushActivity({
    type: newOn ? "success" : "warning",
    message: `Main pump ${newOn ? "started" : "stopped"} from control panel`,
  });
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => state;

export function useIrrigationData() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { ...snap, toggleValve, toggleMotor };
}
