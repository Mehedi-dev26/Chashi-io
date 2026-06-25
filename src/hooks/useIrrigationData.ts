import { useSyncExternalStore, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type FieldZone = {
  id: string;
  name: string;
  nameBn: string;
  area: number;
  waterLevel: number;
  soilMoisture: number;
  status: "irrigating" | "idle" | "scheduled" | "alert";
  valveOpen: boolean;
  cropType: string;
  x: number;
  y: number;
  polygon: string;
};

export type MotorState = {
  id: string;
  name: string;
  isOn: boolean;
  online: boolean;          // hardware heartbeat (last telemetry < 15s)
  lastSeen: number | null;  // epoch ms
  pressure: number;
  flowRate: number;         // L/min
  voltage: number;
  current: number;
  runtime: number;          // hours
  health: number;
};

export type ActivityEntry = {
  id: string;
  time: string;
  type: "info" | "success" | "warning" | "alert";
  message: string;
};

type Store = { zones: FieldZone[]; motor: MotorState; activity: ActivityEntry[] };

// ---- 6V mini DC pump spec (120 L/H ultra-quiet fractional) ----
// rated: 6V, ~0.20A, ~1.2W, 120 L/H ≈ 2.0 L/min
export const PUMP_SPEC = {
  device_id: "MASTER-01",
  zone_id: "PUMP-HOUSE",
  ratedVoltage: 6.0,
  ratedCurrent: 0.20,
  ratedFlowLpm: 2.0,
  heartbeatMs: 15000,
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
  { id: "a1", time: "—", type: "info", message: "সিস্টেম প্রস্তুত · হার্ডওয়্যার heartbeat-এর অপেক্ষায়" },
];

let state: Store = {
  zones: initialZones,
  motor: {
    id: PUMP_SPEC.device_id,
    name: "৬V Ultra-Quiet Fractional Pump (১২০ L/H)",
    isOn: false,
    online: false,
    lastSeen: null,
    pressure: 0,
    flowRate: 0,
    voltage: 0,
    current: 0,
    runtime: 0,
    health: 96,
  },
  activity: initialActivity,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const setState = (next: Store) => { state = next; emit(); };

const pushActivity = (e: { type: ActivityEntry["type"]; message: string }) => {
  const entry: ActivityEntry = {
    id: Math.random().toString(36).slice(2),
    time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    ...e,
  };
  setState({ ...state, activity: [entry, ...state.activity].slice(0, 20) });
};

// ---- apply incoming master-node telemetry to motor state ----
type TelemetryRow = {
  zone_id: string;
  motor_on: boolean | null;
  voltage: number | null;
  current: number | null;
  flow_lpm: number | null;
  runtime_sec: number | null;
  updated_at: string;
};

const applyMasterTelemetry = (row: TelemetryRow) => {
  if (row.zone_id !== PUMP_SPEC.zone_id) return;
  const ts = new Date(row.updated_at).getTime();
  const wasOnline = state.motor.online;
  const wasOn = state.motor.isOn;
  const motor: MotorState = {
    ...state.motor,
    isOn: !!row.motor_on,
    online: true,
    lastSeen: ts,
    voltage: row.voltage ?? (row.motor_on ? PUMP_SPEC.ratedVoltage : 0),
    current: row.current ?? (row.motor_on ? PUMP_SPEC.ratedCurrent : 0),
    flowRate: row.flow_lpm ?? (row.motor_on ? PUMP_SPEC.ratedFlowLpm : 0),
    runtime: row.runtime_sec ? +(row.runtime_sec / 3600).toFixed(3) : state.motor.runtime,
    pressure: row.motor_on ? +(2.5 + (row.flow_lpm ?? PUMP_SPEC.ratedFlowLpm) * 0.4).toFixed(1) : 0,
  };
  setState({ ...state, motor });
  if (!wasOnline) pushActivity({ type: "success", message: "✓ হার্ডওয়্যার অনলাইন · মাস্টার নোড সংযুক্ত" });
  if (wasOn !== motor.isOn) pushActivity({ type: motor.isOn ? "success" : "info", message: `পাম্প ${motor.isOn ? "চালু" : "বন্ধ"} হলো (হার্ডওয়্যার নিশ্চিতকরণ)` });
};

// ---- watchdog: mark offline if no heartbeat ----
if (typeof window !== "undefined") {
  const g = window as unknown as { __bmda_watchdog?: number; __bmda_sub?: boolean };
  if (!g.__bmda_watchdog) {
    g.__bmda_watchdog = window.setInterval(() => {
      if (state.motor.lastSeen && Date.now() - state.motor.lastSeen > PUMP_SPEC.heartbeatMs) {
        if (state.motor.online) {
          pushActivity({ type: "warning", message: "⚠ মাস্টার নোডের সাথে যোগাযোগ বিচ্ছিন্ন (offline)" });
          setState({ ...state, motor: { ...state.motor, online: false, isOn: false, voltage: 0, current: 0, flowRate: 0, pressure: 0 } });
        }
      }
      // light zone simulation for visual continuity
      const zones = state.zones.map((z) => {
        const delta = z.valveOpen ? Math.random() * 0.8 : -Math.random() * 0.4;
        return { ...z, waterLevel: +Math.max(5, Math.min(100, z.waterLevel + delta)).toFixed(1), soilMoisture: +Math.max(5, Math.min(100, z.soilMoisture + delta * 0.7)).toFixed(1) };
      });
      setState({ ...state, zones });
    }, 3000);
  }
}

// ---- valve simulation (until per-zone hardware is wired) ----
const toggleValve = (id: string) => {
  const zone = state.zones.find((z) => z.id === id);
  if (!zone) return;
  const newOpen = !zone.valveOpen;
  const zones = state.zones.map((z) =>
    z.id === id ? { ...z, valveOpen: newOpen, status: newOpen ? "irrigating" as const : "idle" as const } : z
  );
  setState({ ...state, zones });
  pushActivity({ type: newOpen ? "success" : "info", message: `${zone.id} valve ${newOpen ? "খোলা" : "বন্ধ"} হলো` });
};

// ---- motor toggle → only when hardware online; sends real command ----
const toggleMotor = async () => {
  if (!state.motor.online) {
    toast.error("পাম্প অফলাইন — হার্ডওয়্যার সংযোগ ছাড়া চালু করা যাবে না");
    return;
  }
  const target = !state.motor.isOn;
  const action = target ? "motor_on" : "motor_off";
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase.from("device_commands").insert({
    device_id: PUMP_SPEC.device_id,
    action,
    issued_by: u.user?.id ?? null,
  });
  if (error) { toast.error("কমান্ড পাঠানো ব্যর্থ: " + error.message); return; }
  toast.success(`কমান্ড পাঠানো হয়েছে · পাম্প ${target ? "চালু" : "বন্ধ"} হচ্ছে…`);
  pushActivity({ type: "info", message: `কমান্ড queued: পাম্প ${target ? "ON" : "OFF"} (হার্ডওয়্যার নিশ্চিত করার অপেক্ষায়)` });
};

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const getSnapshot = () => state;

// ---- bootstrap realtime once ----
let bootstrapped = false;
function useBootstrap() {
  useEffect(() => {
    if (bootstrapped) return;
    bootstrapped = true;
    // initial fetch
    supabase.from("device_telemetry").select("*").eq("zone_id", PUMP_SPEC.zone_id).maybeSingle()
      .then(({ data }) => { if (data) applyMasterTelemetry(data as TelemetryRow); });

    const ch = supabase
      .channel("device_telemetry_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "device_telemetry" },
        (payload) => {
          const row = (payload.new ?? payload.old) as TelemetryRow | undefined;
          if (row) applyMasterTelemetry(row);
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); bootstrapped = false; };
  }, []);
}

export function useIrrigationData() {
  useBootstrap();
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { ...snap, toggleValve, toggleMotor };
}
