const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, X-Client-Info",
  "Content-Type": "application/json",
};

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: { ...CORS, ...(init.headers ?? {}) },
  });

const cleanNumber = (value: unknown) => {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const cleanTemperature = (value: unknown) => {
  const n = cleanNumber(value);
  if (n == null || n < -10 || n > 60) return null;
  return Number(n.toFixed(1));
};

const cleanHumidity = (value: unknown) => {
  const n = cleanNumber(value);
  if (n == null || n < 0 || n > 100) return null;
  return Number(n.toFixed(0));
};

const clampPercent = (value: unknown) => {
  const n = cleanNumber(value);
  if (n == null) return 0;
  return Math.max(0, Math.min(100, Number(n.toFixed(1))));
};

const clampOptional = (value: unknown, min: number, max: number) => {
  const n = cleanNumber(value);
  if (n == null || n < min || n > max) return null;
  return Number(n.toFixed(2));
};

const restHeaders = () => {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) throw new Error("service key missing");
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
};

const restUrl = (path: string) => {
  const base = Deno.env.get("SUPABASE_URL");
  if (!base) throw new Error("backend URL missing");
  return `${base}/rest/v1/${path}`;
};

async function rest<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  const res = await fetch(restUrl(path), {
    ...init,
    headers: { ...restHeaders(), ...(init.headers ?? {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} failed: ${res.status} ${text}`);
  return text ? JSON.parse(text) as T : null;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  if (request.method === "GET") {
    return json({ ok: true, endpoint: "hardware-telemetry", writes: "POST" });
  }

  if (request.method !== "POST") {
    return json({ ok: false, error: "method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    if (!body?.deviceId || !body?.zoneId) {
      return json({ ok: false, error: "deviceId and zoneId required" }, { status: 400 });
    }

    const deviceId = String(body.deviceId).trim();
    const zoneId = String(body.zoneId).trim();
    if (!/^[A-Z0-9_-]{3,40}$/i.test(deviceId) || !/^[A-Z0-9_-]{2,40}$/i.test(zoneId)) {
      return json({ ok: false, error: "invalid deviceId or zoneId" }, { status: 400 });
    }

    if (deviceId === "MASTER-01" && zoneId !== "PUMP-HOUSE") {
      return json({ ok: false, error: "invalid master zone" }, { status: 403 });
    }

    let effectiveZoneId = zoneId;
    const nodeRows = await rest<Array<{ zone_id: string | null }>>(
      `field_nodes?select=zone_id&device_id=eq.${encodeURIComponent(deviceId)}&limit=1`,
    );

    if ((!nodeRows || nodeRows.length === 0) && deviceId !== "MASTER-01") {
      return json({ ok: false, error: "device is not registered" }, { status: 403 });
    }
    if (nodeRows?.[0]?.zone_id) effectiveZoneId = nodeRows[0].zone_id;

    const prevRows = await rest<Array<{ runtime_sec: number | null; motor_on: boolean | null; updated_at: string | null; soil_moisture: number | null; water_level: number | null; valve_open: boolean | null; soil_connected: boolean | null }>>(
      `device_telemetry?select=runtime_sec,motor_on,updated_at,soil_moisture,water_level,valve_open,soil_connected&zone_id=eq.${encodeURIComponent(effectiveZoneId)}&limit=1`,
    );
    const prev = prevRows?.[0];
    const nowMs = Date.now();
    const motorOnNow = body.motorOn != null ? Boolean(body.motorOn) : false;

    let wallDeltaSec = 0;
    if (prev?.updated_at) {
      const elapsed = Math.floor((nowMs - new Date(prev.updated_at).getTime()) / 1000);
      if (elapsed > 0 && elapsed <= 60 && (motorOnNow || prev.motor_on)) wallDeltaSec = elapsed;
    }

    // 🌱 Soil-sensor disconnect handling — depletion rates:
    //   soil: 1.0 %/sec  (valve open ⇒ 0.2 %/sec — irrigation offsets loss)
    //   water: 0.5 %/sec (valve open ⇒ 0.1 %/sec)
    // On reconnect, the firmware EMA needs a few samples to settle; if the raw
    // reading is BELOW the decayed baseline we keep the decayed value so the
    // dashboard never jumps back to 0. Once the real reading exceeds the
    // decayed value, we switch to the real reading immediately.
    const soilConnectedIncoming = body.soilConnected == null ? true : Boolean(body.soilConnected);
    const rawSoil = cleanNumber(body.soilMoisture);
    const rawWater = cleanNumber(body.waterLevel);
    const soilConnected = soilConnectedIncoming && rawSoil != null;

    const gapSec = prev?.updated_at
      ? Math.max(0, Math.floor((nowMs - new Date(prev.updated_at).getTime()) / 1000))
      : 0;
    const soilRate = prev?.valve_open ? 0.2 : 1.0;    // %/sec
    const waterRate = prev?.valve_open ? 0.1 : 0.5;   // %/sec
    const prevSoil = Number(prev?.soil_moisture ?? 0);
    const prevWater = Number(prev?.water_level ?? 0);
    const decayedSoil = clampPercent(Math.max(0, prevSoil - gapSec * soilRate));
    const decayedWater = clampPercent(Math.max(0, prevWater - gapSec * waterRate));

    let soilMoisture: number;
    let waterLevel: number;
    if (soilConnected) {
      const justReconnected = prev?.soil_connected === false;
      const incomingSoil = clampPercent(rawSoil);
      const incomingWater = clampPercent(rawWater ?? rawSoil);
      // On reconnect: never drop below the decayed baseline while EMA settles.
      soilMoisture = justReconnected ? Math.max(incomingSoil, decayedSoil) : incomingSoil;
      waterLevel = justReconnected ? Math.max(incomingWater, decayedWater) : incomingWater;
    } else {
      soilMoisture = decayedSoil;
      waterLevel = decayedWater;
    }

    const row = {
      zone_id: effectiveZoneId,
      device_id: deviceId,
      soil_moisture: soilMoisture,
      water_level: waterLevel,
      soil_connected: soilConnected,
      ldr: clampPercent(body.ldr),
      temperature: cleanTemperature(body.temperature),
      humidity: cleanHumidity(body.humidity),
      valve_open: Boolean(body.valveOpen ?? false),
      motor_on: motorOnNow,
      flow_lpm: clampOptional(body.flowLpm, 0, 20),
      voltage: clampOptional(body.voltage, 0, 30),
      current: clampOptional(body.current, 0, 10),
      runtime_sec: Number(prev?.runtime_sec ?? 0) + wallDeltaSec,
      rssi: clampOptional(body.rssi, -120, 0),
      tds_ppm: clampOptional(body.tdsPpm, 0, 5000),
      updated_at: new Date(nowMs).toISOString(),
    };

    await rest("device_telemetry?on_conflict=zone_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(row),
    });

    await rest("telemetry_history", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        device_id: deviceId,
        zone_id: effectiveZoneId,
        soil_moisture: row.soil_moisture,
        water_level: row.water_level,
        soil_connected: row.soil_connected,
        ldr: row.ldr,
        temperature: row.temperature,
        humidity: row.humidity,
        valve_open: row.valve_open,
        motor_on: row.motor_on,
        flow_lpm: row.flow_lpm,
        voltage: row.voltage,
        current: row.current,
        rssi: row.rssi,
        tds_ppm: row.tds_ppm,
      }),
    }).catch((error) => console.error("[telemetry] history", error.message));

    if (wallDeltaSec > 0) {
      await rest("motor_runtime_log", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ device_id: deviceId, delta_sec: wallDeltaSec }),
      }).catch((error) => console.error("[telemetry] runtime", error.message));
    }

    const pending = await rest<Array<{ id: string; action: string; zone_id: string | null }>>(
      `device_commands?select=id,action,zone_id&device_id=eq.${encodeURIComponent(deviceId)}&consumed=eq.false&order=created_at.asc&limit=20`,
    );
    const commands = (pending ?? []).map((c) => ({ id: c.id, action: c.action, zoneId: c.zone_id }));

    if (commands.length) {
      const ids = commands.map((c) => c.id).join(",");
      await rest(`device_commands?id=in.(${ids})`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ consumed: true, consumed_at: new Date().toISOString() }),
      });
    }

    return json({ ok: true, commands });
  } catch (error) {
    console.error("[telemetry]", error);
    return json({ ok: false, error: "telemetry storage failed" }, { status: 500 });
  }
});