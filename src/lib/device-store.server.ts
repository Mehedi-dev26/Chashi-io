// In-memory device telemetry + command queue for ESP32 demo.
// For Hobby Fair / live demo only. For production, move to Lovable Cloud (Supabase).

export type DeviceTelemetry = {
  deviceId: string;
  zoneId: string;
  soilMoisture: number;   // %
  waterLevel: number;     // % (tank/field)
  ldr: number;            // 0-100 (light)
  temperature?: number;   // °C
  humidity?: number;      // %
  valveOpen: boolean;
  motorOn?: boolean;
  flowLpm?: number;       // litres/min (computed from pump spec)
  voltage?: number;       // V (motor rated when ON)
  current?: number;       // A
  runtimeSec?: number;    // cumulative motor runtime
  rssi?: number;
  updatedAt: number;
};

type Command = {
  id: string;
  zoneId?: string;
  action: "valve_open" | "valve_close" | "motor_on" | "motor_off";
  issuedAt: number;
};

const telemetry = new Map<string, DeviceTelemetry>(); // key: zoneId
const commands = new Map<string, Command[]>();         // key: deviceId
let lastCommandId = 0;

export function ingestTelemetry(t: Omit<DeviceTelemetry, "updatedAt">) {
  telemetry.set(t.zoneId, { ...t, updatedAt: Date.now() });
}

export function getAllTelemetry(): DeviceTelemetry[] {
  return Array.from(telemetry.values());
}

export function getTelemetry(zoneId: string): DeviceTelemetry | undefined {
  return telemetry.get(zoneId);
}

export function queueCommand(deviceId: string, c: Omit<Command, "id" | "issuedAt">): Command {
  const cmd: Command = { ...c, id: String(++lastCommandId), issuedAt: Date.now() };
  const list = commands.get(deviceId) ?? [];
  list.push(cmd);
  commands.set(deviceId, list);
  return cmd;
}

export function popCommands(deviceId: string): Command[] {
  const list = commands.get(deviceId) ?? [];
  commands.set(deviceId, []);
  return list;
}
