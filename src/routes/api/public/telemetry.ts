import { createFileRoute } from "@tanstack/react-router";

// ESP32 POSTs sensor data here every 5s.
// Body: { deviceId, zoneId, soilMoisture?, waterLevel?, ldr?, valveOpen?, motorOn?,
//         temperature?, humidity?, flowLpm?, voltage?, current?, runtimeSec?, rssi? }
// Response: { ok: true, commands: [ { id, action, zoneId } ] }
// Storage: Lovable Cloud (Supabase) — persistent, realtime.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

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

export const Route = createFileRoute("/api/public/telemetry")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      POST: async ({ request }) => {
        try {
          const body = await request.json();
          if (!body?.deviceId || !body?.zoneId) {
            return Response.json({ ok: false, error: "deviceId and zoneId required" }, { status: 400, headers: CORS });
          }
          const deviceId = String(body.deviceId).trim();
          const zoneId = String(body.zoneId).trim();
          if (!/^[A-Z0-9_-]{3,40}$/i.test(deviceId) || !/^[A-Z0-9_-]{2,40}$/i.test(zoneId)) {
            return Response.json({ ok: false, error: "invalid deviceId or zoneId" }, { status: 400, headers: CORS });
          }
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // Only registered hardware may write. Sub-nodes must be added in the
          // Devices page first; the single master node is fixed to PUMP-HOUSE.
          if (deviceId === "MASTER-01" && zoneId !== "PUMP-HOUSE") {
            return Response.json({ ok: false, error: "invalid master zone" }, { status: 403, headers: CORS });
          }

          // Resolve UI-side zone assignment: if this device has been linked to a field
          // through the Devices page, use that mapping instead of the firmware-baked zoneId.
          let effectiveZoneId = zoneId;
          const { data: nodeRow } = await supabaseAdmin
            .from("field_nodes")
            .select("zone_id")
            .eq("device_id", deviceId)
            .maybeSingle();
          if (!nodeRow && deviceId !== "MASTER-01") {
            return Response.json({ ok: false, error: "device is not registered" }, { status: 403, headers: CORS });
          }
          if (nodeRow?.zone_id) effectiveZoneId = nodeRow.zone_id;

          // Read previous row to compute wall-clock runtime delta

          const { data: prev } = await supabaseAdmin
            .from("device_telemetry")
            .select("runtime_sec, motor_on, temperature, humidity, updated_at")
            .eq("zone_id", effectiveZoneId)
            .maybeSingle();

          const temperature = cleanTemperature(body.temperature);
          const humidity = cleanHumidity(body.humidity);

          const nowMs = Date.now();
          const motorOnNow = body.motorOn != null ? Boolean(body.motorOn) : false;

          // Wall-clock based runtime delta — survives ESP32 reboots.
          // Counts seconds whenever the motor was ON at the previous sample
          // OR at this sample, capped at 60s per sample so long offline gaps
          // don't inflate the counter.
          let wallDeltaSec = 0;
          if (prev?.updated_at) {
            const elapsed = Math.floor((nowMs - new Date(prev.updated_at).getTime()) / 1000);
            if (elapsed > 0 && elapsed <= 60 && (motorOnNow || prev?.motor_on)) {
              wallDeltaSec = elapsed;
            }
          }

          // Cumulative server-tracked runtime — independent of firmware boot state.
          const prevServerRt = Number(prev?.runtime_sec ?? 0);
          const cumulativeRt = prevServerRt + wallDeltaSec;

          const row = {
            zone_id: effectiveZoneId,
            device_id: deviceId,
            soil_moisture: clampPercent(body.soilMoisture),
            water_level: clampPercent(body.waterLevel),
            ldr: clampPercent(body.ldr),
            temperature,
            humidity,
            valve_open: Boolean(body.valveOpen ?? false),
            motor_on: motorOnNow,
            flow_lpm: clampOptional(body.flowLpm, 0, 20),
            voltage: clampOptional(body.voltage, 0, 30),
            current: clampOptional(body.current, 0, 10),
            runtime_sec: cumulativeRt,
            rssi: clampOptional(body.rssi, -120, 0),
            tds_ppm: clampOptional(body.tdsPpm, 0, 5000),
            updated_at: new Date(nowMs).toISOString(),
          };

          const { error: upErr } = await supabaseAdmin
            .from("device_telemetry")
            .upsert(row, { onConflict: "zone_id" });
          if (upErr) {
            console.error("[telemetry] upsert", upErr);
            return Response.json({ ok: false, error: "telemetry storage failed" }, { status: 500, headers: CORS });
          }

          // Historical archive — every sample kept for charts / ML / audit.
          const { error: histErr } = await supabaseAdmin.from("telemetry_history").insert({
            device_id: deviceId,
            zone_id: effectiveZoneId,
            soil_moisture: row.soil_moisture,
            water_level: row.water_level,
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
          });
          if (histErr) console.error("[telemetry] history insert", histErr);

          // Persist runtime delta for hourly/monthly aggregation.
          if (wallDeltaSec > 0) {
            await supabaseAdmin.from("motor_runtime_log").insert({
              device_id: deviceId,
              delta_sec: wallDeltaSec,
            });
          }


          // Pop pending commands for this device
          const { data: pending } = await supabaseAdmin
            .from("device_commands")
            .select("id, action, zone_id")
            .eq("device_id", deviceId)
            .eq("consumed", false)
            .order("created_at", { ascending: true })
            .limit(20);

          const commands = (pending ?? []).map((c) => ({ id: c.id, action: c.action, zoneId: c.zone_id }));

          if (commands.length) {
            await supabaseAdmin
              .from("device_commands")
              .update({ consumed: true, consumed_at: new Date().toISOString() })
              .in("id", commands.map((c) => c.id));
          }

          return Response.json({ ok: true, commands }, { headers: CORS });
        } catch (e) {
          return Response.json({ ok: false, error: String(e) }, { status: 500, headers: CORS });
        }
      },

      GET: async () => {
        return Response.json({ ok: true, endpoint: "telemetry", writes: "POST" }, { headers: CORS });
      },
    },
  },
});
