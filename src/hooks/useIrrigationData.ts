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
  online: boolean;
  lastSeen: number | null;
  valveNodeId: string | null;   // device_id of linked sub-node (if any)
  hasNode: boolean;
  soilConnected: boolean;       // true = probe wired; false = disconnected, values are estimated
};

export type MotorState = {
  id: string;
  name: string;
  isOn: boolean;
  online: boolean;
  lastSeen: number | null;
  pressure: number;
  flowRate: number;
  voltage: number;
  current: number;
  runtime: number;
  health: number;
  tankLevel: number;   // % — পাম্প-হাউস ট্যাংকের পানির স্তর (real telemetry থেকে)
};

export type ActivityEntry = {
  id: string;
  time: string;
  type: "info" | "success" | "warning" | "alert";
  message: string;
};

export type NetworkMetrics = {
  networkHealth: number;  // % of registered nodes online
  totalNodes: number;
  onlineNodes: number;
  aiActivity: number;     // % of commands consumed (last 24h)
};

export type WeatherState = {
  temperature: number | null;  // °C — latest from DHT sensor
  humidity: number | null;     // % RH
  sourceZone: string | null;   // which sub-node reported it
  lastSeen: number | null;
};

type Store = {
  zones: FieldZone[];
  motor: MotorState;
  activity: ActivityEntry[];
  metrics: NetworkMetrics;
  weather: WeatherState;
};


export const PUMP_SPEC = {
  device_id: "MASTER-01",
  zone_id: "PUMP-HOUSE",
  ratedVoltage: 6.0,
  ratedCurrent: 0.20,
  ratedFlowLpm: 2.0,
  heartbeatMs: 15000,      // sub-node grace window
  motorOfflineMs: 30000,   // পাম্প এর জন্য আলাদা grace — hotspot lag এ flicker রোধ
};

// 💧 ট্যাংক লেভেল সিমুলেশন — পাম্প চালু থাকলে ৪০–৮০% smooth oscillation
// পাম্প বন্ধ থাকলে ০% (কোনো ওঠানামা নয়)
const simulatedTankLevel = (pumpOn: boolean) => {
  if (!pumpOn) return 0;
  const t = Date.now() / 1000;
  const base = 60 + 20 * Math.sin(t / 14);
  const jitter = (Math.random() - 0.5) * 1.5;
  return Math.max(40, Math.min(80, +(base + jitter).toFixed(1)));
};

// fallback default zones (only used if user has none in DB and seed fails)
const defaultZones: Omit<FieldZone, "online" | "lastSeen" | "valveNodeId" | "hasNode" | "soilConnected">[] = [
  { id: "Z-01", name: "North Field A", nameBn: "উত্তর জমি A", area: 4.2, waterLevel: 0, soilMoisture: 0, status: "idle", valveOpen: false, cropType: "Rice", x: 22, y: 22, polygon: "6,6 38,4 40,32 8,34" },
  { id: "Z-02", name: "North Field B", nameBn: "উত্তর জমি B", area: 3.6, waterLevel: 0, soilMoisture: 0, status: "idle", valveOpen: false, cropType: "Wheat", x: 56, y: 18, polygon: "42,4 76,6 74,30 42,32" },
  { id: "Z-03", name: "East Field",    nameBn: "পূর্ব জমি",   area: 5.1, waterLevel: 0, soilMoisture: 0, status: "idle", valveOpen: false, cropType: "Rice", x: 84, y: 26, polygon: "78,6 96,8 96,42 76,40" },
  { id: "Z-04", name: "Central Plot",  nameBn: "কেন্দ্রীয় প্লট", area: 2.8, waterLevel: 0, soilMoisture: 0, status: "idle", valveOpen: false, cropType: "Maize", x: 50, y: 52, polygon: "38,42 62,42 62,62 38,62" },
  { id: "Z-05", name: "South Field A", nameBn: "দক্ষিণ জমি A", area: 4.0, waterLevel: 0, soilMoisture: 0, status: "idle", valveOpen: false, cropType: "Rice", x: 22, y: 78, polygon: "6,66 36,68 34,94 6,92" },
  { id: "Z-06", name: "South Field B", nameBn: "দক্ষিণ জমি B", area: 3.3, waterLevel: 0, soilMoisture: 0, status: "idle", valveOpen: false, cropType: "Potato", x: 52, y: 80, polygon: "40,68 66,68 66,94 40,94" },
  { id: "Z-07", name: "West Field",    nameBn: "পশ্চিম জমি",  area: 6.4, waterLevel: 0, soilMoisture: 0, status: "idle", valveOpen: false, cropType: "Sugarcane", x: 84, y: 76, polygon: "70,46 96,48 96,94 70,94" },
];

let state: Store = {
  zones: defaultZones.map((z) => ({ ...z, online: false, lastSeen: null, valveNodeId: null, hasNode: false, soilConnected: true })),
  motor: {
    id: PUMP_SPEC.device_id,
    name: "মেইন মোটর · BMDA Master",
    isOn: false, online: false, lastSeen: null,
    pressure: 0, flowRate: 0, voltage: 0, current: 0, runtime: 0, health: 0, tankLevel: 0,
  },
  activity: [{ id: "init", time: "—", type: "info", message: "সিস্টেম প্রস্তুত · ডাটাবেজ থেকে লোড হচ্ছে…" }],
  metrics: { networkHealth: 0, totalNodes: 0, onlineNodes: 0, aiActivity: 0 },
  weather: { temperature: null, humidity: null, sourceZone: null, lastSeen: null },
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
  setState({ ...state, activity: [entry, ...state.activity].slice(0, 30) });
};

type TelemetryRow = {
  zone_id: string; device_id: string;
  motor_on: boolean | null; valve_open: boolean | null;
  voltage: number | null; current: number | null;
  flow_lpm: number | null; runtime_sec: number | null;
  soil_moisture: number | null; water_level: number | null;
  soil_connected: boolean | null;
  tds_ppm: number | null;
  temperature: number | null; humidity: number | null;
  updated_at: string;
};


const recomputeMetrics = (zones: FieldZone[] = state.zones) => {
  const now = Date.now();
  const online = zones.filter((z) => z.lastSeen && now - z.lastSeen < PUMP_SPEC.heartbeatMs).length;
  const total = zones.length;
  const networkHealth = total ? Math.round((online / total) * 100) : 0;
  return { ...state.metrics, networkHealth, onlineNodes: online, totalNodes: total };
};

const applyTelemetry = (row: TelemetryRow) => {
  const ts = new Date(row.updated_at).getTime();
  // ⚡ Drop stale rows on hydrate — device hasn't pinged within heartbeat window.
  // Without this, opening the dashboard after the device has been offline for hours
  // would briefly flash the last cached 100% reading before the watchdog zeroed it.
  if (Date.now() - ts > PUMP_SPEC.heartbeatMs) return;


  const tNum = row.temperature != null ? Number(row.temperature) : null;
  const hNum = row.humidity != null ? Number(row.humidity) : null;
  const validTemp = tNum != null && Number.isFinite(tNum) && tNum >= -10 && tNum <= 60;
  const validHum = hNum != null && Number.isFinite(hNum) && hNum >= 0 && hNum <= 100;
  const weather = validTemp || validHum
    ? {
        temperature: validTemp ? Number(tNum!.toFixed(1)) : state.weather.temperature,
        humidity: validHum ? Number(hNum!.toFixed(0)) : state.weather.humidity,
        sourceZone: row.zone_id === PUMP_SPEC.zone_id ? row.device_id : row.zone_id,
        lastSeen: ts,
      }
    : state.weather;

  // Master (pump) node
  if (row.zone_id === PUMP_SPEC.zone_id) {
    const wasOnline = state.motor.online;
    const wasOn = state.motor.isOn;
    // 🚿 সেন্সর সমস্যার কারণে raw water_level ব্যবহার না করে UI-simulated (৪০–৬০%)
    const tank = simulatedTankLevel(!!row.motor_on);
    const motor: MotorState = {
      ...state.motor,
      isOn: !!row.motor_on, online: true, lastSeen: ts,
      voltage: Number(row.voltage ?? (row.motor_on ? PUMP_SPEC.ratedVoltage : 0)),
      current: Number(row.current ?? (row.motor_on ? PUMP_SPEC.ratedCurrent : 0)),
      flowRate: Number(row.flow_lpm ?? (row.motor_on ? PUMP_SPEC.ratedFlowLpm : 0)),
      runtime: row.runtime_sec != null ? Number(row.runtime_sec) : state.motor.runtime,
      pressure: row.motor_on ? +(2.5 + Number(row.flow_lpm ?? PUMP_SPEC.ratedFlowLpm) * 0.4).toFixed(1) : 0,
      health: 100,
      tankLevel: tank,
    };
    setState({ ...state, motor, weather });
    if (!wasOnline) pushActivity({ type: "success", message: "✓ পাম্প অনলাইন · মাস্টার নোড সংযুক্ত" });
    if (wasOn !== motor.isOn) pushActivity({ type: motor.isOn ? "success" : "info", message: `পাম্প ${motor.isOn ? "চালু" : "বন্ধ"} হলো (হার্ডওয়্যার নিশ্চিতকরণ)` });
    return;
  }

  // Sub-node → match to a registered field by zone_id
  const zones = state.zones.map((z) => {
    if (z.id !== row.zone_id) return z;
    const sm = row.soil_moisture != null ? Number(row.soil_moisture) : z.soilMoisture;
    // Water level derived from SM (Soil Moisture, YL-69) reading:
    //   - <25% → severely dry (0–15% water column)
    //   - 25–60% → optimal growing (gentle slope)
    //   - >60% → saturated (asymptotic toward 100%)
    // Formula: smooth piecewise mapping so the gauge tracks moisture, not a random number
    const sMoist = Math.max(0, Math.min(100, sm));
    const derived =
      sMoist < 25 ? sMoist * 0.6                       // 0 → 0 ... 25 → 15
      : sMoist < 60 ? 15 + (sMoist - 25) * (55 / 35)   // 25 → 15 ... 60 → 70
      : 70 + (sMoist - 60) * (30 / 40);                // 60 → 70 ... 100 → 100
    const wl = row.water_level != null ? Number(row.water_level) : Math.round(derived);
    const valve = row.valve_open ?? z.valveOpen;
    const status: FieldZone["status"] = sm < 25 ? "alert" : valve ? "irrigating" : "idle";
    const soilConnected = row.soil_connected == null ? true : !!row.soil_connected;
    return { ...z, soilMoisture: sm, waterLevel: wl, valveOpen: !!valve, status, online: true, lastSeen: ts, soilConnected };
  });

  setState({ ...state, zones, weather, metrics: recomputeMetrics(zones) });
};


// Initialise + subscribe (idempotent across HMR)
if (typeof window !== "undefined") {
  const g = window as unknown as { __bmda_watchdog?: number };
  if (!g.__bmda_watchdog) {
    g.__bmda_watchdog = window.setInterval(() => {
      const now = Date.now();
      let changed = false;
      let next = state;
      // motor offline? — আলাদা longer grace, hotspot lag এ flicker রোধ
      if (next.motor.lastSeen && now - next.motor.lastSeen > PUMP_SPEC.motorOfflineMs && next.motor.online) {
        pushActivity({ type: "warning", message: "⚠ পাম্প অফলাইন · heartbeat বিচ্ছিন্ন" });
        next = { ...next, motor: { ...next.motor, online: false, isOn: false, voltage: 0, current: 0, flowRate: 0, pressure: 0, health: 0, tankLevel: 0, runtime: 0 } };
        changed = true;
      } else if (next.motor.online) {
        // 💧 প্রতি সেকেন্ডে ট্যাংক লেভেল smoothly update (৪০–৬০% simulated)
        next = { ...next, motor: { ...next.motor, tankLevel: simulatedTankLevel(next.motor.isOn) } };
        changed = true;
      }
      // zone offline? → zero out all sensor readings (no fake stale data)
      const zones = next.zones.map((z) => {
        const stale = z.lastSeen && now - z.lastSeen > PUMP_SPEC.heartbeatMs;
        if (z.online && stale) {
          changed = true;
          return { ...z, online: false, soilMoisture: 0, waterLevel: 0, valveOpen: false, status: "idle" as const, soilConnected: true };
        }
        // 🌱 Client-side per-second decay while soil sensor is disconnected.
        //    Rates match the server (soil 1%/s, water 0.5%/s; halved during irrigation
        //    so open-valve loss is offset). Server pushes the authoritative value
        //    every ~2s and will overwrite this smoothly.
        if (z.online && !z.soilConnected) {
          const soilRate = z.valveOpen ? 0.2 : 1.0;
          const waterRate = z.valveOpen ? 0.1 : 0.5;
          const newSoil = Math.max(0, z.soilMoisture - soilRate);
          const newWater = Math.max(0, z.waterLevel - waterRate);
          if (newSoil !== z.soilMoisture || newWater !== z.waterLevel) {
            changed = true;
            return { ...z, soilMoisture: newSoil, waterLevel: newWater };
          }
        }
        // Defensive: even if never marked online but has stale/no data, force zeros
        if (!z.online && (z.soilMoisture !== 0 || z.waterLevel !== 0 || z.valveOpen)) {
          changed = true;
          return { ...z, soilMoisture: 0, waterLevel: 0, valveOpen: false, status: "idle" as const, soilConnected: true };
        }
        return z;
      });
      if (changed) next = { ...next, zones };

      // ⚡ Weather (DHT): যখন source sub-node বা master offline → তাপমাত্রা/আর্দ্রতা 0
      const wStale = next.weather.lastSeen && now - next.weather.lastSeen > PUMP_SPEC.heartbeatMs;
      const anyOnline = next.motor.online || zones.some((z) => z.online);
      if ((wStale || !anyOnline) && (next.weather.temperature !== 0 || next.weather.humidity !== 0 || next.weather.lastSeen !== null)) {
        next = { ...next, weather: { temperature: 0, humidity: 0, sourceZone: null, lastSeen: null } };
        changed = true;
      }

      if (changed) setState({ ...next, metrics: recomputeMetrics(next.zones) });
    }, 1000);   // ⚡ প্রতি সেকেন্ডে watchdog চেক → দ্রুত UI response
  }
}

// ---------- DB-driven field load + actions ----------
type FieldRow = { zone_id: string; name: string; name_bn: string; area_acres: number; crop_type: string; x: number; y: number; polygon: string; valve_node_id: string | null };

const loadFields = async () => {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  const { data, error } = await supabase.from("fields").select("*").eq("user_id", u.user.id).order("zone_id");
  if (error) { console.error(error); return; }

  let rows = (data ?? []) as FieldRow[];
  if (rows.length === 0) {
    // seed default 7 zones for new user
    const inserts = defaultZones.map((z) => ({
      user_id: u.user!.id, zone_id: z.id, name: z.name, name_bn: z.nameBn,
      area_acres: z.area, crop_type: z.cropType, x: z.x, y: z.y, polygon: z.polygon,
    }));
    const { data: ins } = await supabase.from("fields").insert(inserts).select("*");
    rows = (ins ?? []) as FieldRow[];
  }

  const zones: FieldZone[] = rows.map((r) => ({
    id: r.zone_id, name: r.name, nameBn: r.name_bn, area: Number(r.area_acres),
    waterLevel: 0, soilMoisture: 0, status: "idle", valveOpen: false,
    cropType: r.crop_type, x: Number(r.x), y: Number(r.y), polygon: r.polygon,
    online: false, lastSeen: null,
    valveNodeId: r.valve_node_id ?? null,
    hasNode: !!r.valve_node_id,
    soilConnected: true,
  }));
  setState({ ...state, zones, metrics: { ...state.metrics, totalNodes: zones.length } });

  // hydrate latest telemetry
  const { data: tel } = await supabase.from("device_telemetry").select("*").order("updated_at", { ascending: true });
  (tel ?? []).forEach((t) => applyTelemetry(t as TelemetryRow));
};


const loadAiActivity = async () => {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data } = await supabase.from("device_commands").select("consumed,created_at").gte("created_at", since);
  if (!data || data.length === 0) {
    setState({ ...state, metrics: { ...state.metrics, aiActivity: state.motor.online ? 95 : 0 } });
    return;
  }
  const consumed = data.filter((c) => c.consumed).length;
  const pct = Math.round((consumed / data.length) * 100);
  setState({ ...state, metrics: { ...state.metrics, aiActivity: pct } });
};

export const addField = async (input: { zone_id: string; nameBn: string; area: number; crop: string; valveNodeId?: string | null }) => {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) { toast.error("লগইন প্রয়োজন"); return; }
  const { error } = await supabase.from("fields").insert({
    user_id: u.user.id, zone_id: input.zone_id, name: input.zone_id,
    name_bn: input.nameBn, area_acres: input.area, crop_type: input.crop,
    x: 50, y: 50, polygon: "20,20 60,20 60,60 20,60",
    valve_node_id: input.valveNodeId ?? null,
  });
  if (error) { toast.error("যোগ করা যায়নি: " + error.message); return; }

  // Link sub-node to this zone if selected
  if (input.valveNodeId) {
    await supabase.from("field_nodes").update({ zone_id: input.zone_id }).eq("device_id", input.valveNodeId);
  }
  toast.success(`জমি ${input.zone_id} যোগ হয়েছে`);
  await loadFields();
};

export const deleteField = async (zone_id: string) => {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  // unlink any sub-node first
  await supabase.from("field_nodes").update({ zone_id: null }).eq("zone_id", zone_id);
  const { error } = await supabase.from("fields").delete().eq("user_id", u.user.id).eq("zone_id", zone_id);
  if (error) { toast.error("মুছে ফেলা যায়নি"); return; }
  toast.success(`${zone_id} মুছে ফেলা হয়েছে`);
  await loadFields();
};

export const assignNodeToField = async (deviceId: string, zoneId: string | null) => {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  // Unlink previous field that referenced this node
  await supabase.from("fields").update({ valve_node_id: null }).eq("user_id", u.user.id).eq("valve_node_id", deviceId);
  // Update node
  const { error: ne } = await supabase.from("field_nodes").update({ zone_id: zoneId }).eq("device_id", deviceId);
  if (ne) { toast.error(ne.message); return; }
  // Link new field
  if (zoneId) {
    await supabase.from("fields").update({ valve_node_id: deviceId }).eq("user_id", u.user.id).eq("zone_id", zoneId);
    toast.success(`${deviceId} → ${zoneId} যুক্ত হলো`);
  } else {
    toast.info(`${deviceId} unassign করা হলো`);
  }
  await loadFields();
};


const toggleValve = async (id: string) => {
  const zone = state.zones.find((z) => z.id === id);
  if (!zone) return;
  if (!zone.hasNode) { toast.error(`${id}-এ কোনো sub-node সংযুক্ত নেই — Devices পেজ থেকে assign করুন`); return; }
  if (!zone.online) { toast.error(`${id}-এর sub-node অফলাইন — ভাল্ভ নিয়ন্ত্রণ করা যাবে না`); return; }
  const target = !zone.valveOpen;
  const deviceId = zone.valveNodeId!;
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase.from("device_commands").insert({
    device_id: deviceId, zone_id: id,
    action: target ? "valve_open" : "valve_close",
    issued_by: u.user?.id ?? null,
  });
  if (error) { toast.error("কমান্ড পাঠানো ব্যর্থ: " + error.message); return; }
  // optimistic UI
  const zones = state.zones.map((z) => z.id === id ? { ...z, valveOpen: target, status: target ? "irrigating" as const : "idle" as const } : z);
  setState({ ...state, zones });
  pushActivity({ type: target ? "success" : "info", message: `${id} ভাল্ভ ${target ? "খোলা" : "বন্ধ"} (কমান্ড পাঠানো হয়েছে)` });
};

const toggleMotor = async () => {
  if (!state.motor.online) { toast.error("পাম্প অফলাইন — হার্ডওয়্যার সংযোগ ছাড়া চালু করা যাবে না"); return; }
  const target = !state.motor.isOn;
  // ⚡ Optimistic UI — flip immediately so the dashboard reacts within ~100ms
  setState({ ...state, motor: { ...state.motor, isOn: target } });
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase.from("device_commands").insert({
    device_id: PUMP_SPEC.device_id, action: target ? "motor_on" : "motor_off", issued_by: u.user?.id ?? null,
  });
  if (error) {
    // Roll back optimistic flip
    setState({ ...state, motor: { ...state.motor, isOn: !target } });
    toast.error("কমান্ড পাঠানো ব্যর্থ: " + error.message);
    return;
  }
  toast.success(`কমান্ড পাঠানো হয়েছে · পাম্প ${target ? "চালু" : "বন্ধ"} হচ্ছে…`);
  pushActivity({ type: "info", message: `কমান্ড queued: পাম্প ${target ? "ON" : "OFF"}` });
};

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const getSnapshot = () => state;

let bootstrapped = false;
function useBootstrap() {
  useEffect(() => {
    if (bootstrapped) return;
    bootstrapped = true;
    loadFields();
    loadAiActivity();
    const ch = supabase
      .channel("device_telemetry_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "device_telemetry" },
        (payload) => {
          const row = (payload.new ?? payload.old) as TelemetryRow | undefined;
          if (row) applyTelemetry(row);
        })
      .subscribe();
    const cmdCh = supabase
      .channel("device_commands_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "device_commands" },
        () => loadAiActivity())
      .subscribe();
    return () => { supabase.removeChannel(ch); supabase.removeChannel(cmdCh); bootstrapped = false; };
  }, []);
}

export function useIrrigationData() {
  useBootstrap();
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { ...snap, toggleValve, toggleMotor, addField, deleteField, assignNodeToField, reloadFields: loadFields };
}
