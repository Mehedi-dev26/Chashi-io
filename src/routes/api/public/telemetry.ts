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
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // Resolve UI-side zone assignment: if this device has been linked to a field
          // through the Devices page, use that mapping instead of the firmware-baked zoneId.
          let effectiveZoneId = String(body.zoneId);
          const { data: nodeRow } = await supabaseAdmin
            .from("field_nodes")
            .select("zone_id")
            .eq("device_id", String(body.deviceId))
            .maybeSingle();
          if (nodeRow?.zone_id) effectiveZoneId = nodeRow.zone_id;

          const newRuntimeSec = body.runtimeSec != null ? Number(body.runtimeSec) : null;

          // Read previous row to compute runtime delta for the monthly log
          const { data: prev } = await supabaseAdmin
            .from("device_telemetry")
            .select("runtime_sec, motor_on")
            .eq("zone_id", effectiveZoneId)
            .maybeSingle();

          const row = {
            zone_id: effectiveZoneId,
            device_id: String(body.deviceId),
            soil_moisture: body.soilMoisture != null ? Number(body.soilMoisture) : 0,
            water_level: body.waterLevel != null ? Number(body.waterLevel) : 0,
            ldr: body.ldr != null ? Number(body.ldr) : 0,
            temperature: body.temperature != null ? Number(body.temperature) : null,
            humidity: body.humidity != null ? Number(body.humidity) : null,
            valve_open: Boolean(body.valveOpen ?? false),
            motor_on: body.motorOn != null ? Boolean(body.motorOn) : false,
            flow_lpm: body.flowLpm != null ? Number(body.flowLpm) : null,
            voltage: body.voltage != null ? Number(body.voltage) : null,
            current: body.current != null ? Number(body.current) : null,
            runtime_sec: newRuntimeSec,
            rssi: body.rssi != null ? Number(body.rssi) : null,
            tds_ppm: body.tdsPpm != null ? Number(body.tdsPpm) : null,
            updated_at: new Date().toISOString(),
          };

          const { error: upErr } = await supabaseAdmin
            .from("device_telemetry")
            .upsert(row, { onConflict: "zone_id" });
          if (upErr) console.error("[telemetry] upsert", upErr);

          // Append runtime delta (only when motor ran between samples)
          if (newRuntimeSec != null && prev?.runtime_sec != null) {
            const prevRt = Number(prev.runtime_sec);
            let delta = newRuntimeSec - prevRt;
            if (delta < 0) delta = row.motor_on ? newRuntimeSec : 0; // reboot
            if (delta > 600) delta = 0;                              // gap too big
            if (delta > 0) {
              await supabaseAdmin.from("motor_runtime_log").insert({
                device_id: String(body.deviceId),
                delta_sec: Math.round(delta),
              });
            }
          }

          // Pop pending commands for this device
          const { data: pending } = await supabaseAdmin
            .from("device_commands")
            .select("id, action, zone_id")
            .eq("device_id", String(body.deviceId))
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
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin.from("device_telemetry").select("*");
        return Response.json({ devices: data ?? [] }, { headers: CORS });
      },
    },
  },
});
