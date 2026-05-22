import { createFileRoute } from "@tanstack/react-router";
import { ingestTelemetry, getAllTelemetry, popCommands } from "@/lib/device-store.server";

// ESP32 POSTs sensor data here every few seconds.
// Body: { deviceId, zoneId, soilMoisture, waterLevel, ldr, valveOpen, temperature?, humidity?, rssi? }
// Response: { ok: true, commands: [ { id, action, zoneId } ] }
// ESP32 should execute returned commands (open/close valve, turn motor on/off).

export const Route = createFileRoute("/api/public/telemetry")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }),

      POST: async ({ request }) => {
        try {
          const body = await request.json();
          if (!body?.deviceId || !body?.zoneId) {
            return Response.json({ ok: false, error: "deviceId and zoneId required" }, { status: 400 });
          }
          ingestTelemetry({
            deviceId: String(body.deviceId),
            zoneId: String(body.zoneId),
            soilMoisture: Number(body.soilMoisture ?? 0),
            waterLevel: Number(body.waterLevel ?? 0),
            ldr: Number(body.ldr ?? 0),
            temperature: body.temperature != null ? Number(body.temperature) : undefined,
            humidity: body.humidity != null ? Number(body.humidity) : undefined,
            valveOpen: Boolean(body.valveOpen),
            motorOn: body.motorOn != null ? Boolean(body.motorOn) : undefined,
            rssi: body.rssi != null ? Number(body.rssi) : undefined,
          });
          const commands = popCommands(String(body.deviceId));
          return Response.json(
            { ok: true, commands },
            { headers: { "Access-Control-Allow-Origin": "*" } },
          );
        } catch (e) {
          return Response.json({ ok: false, error: String(e) }, { status: 500 });
        }
      },

      GET: async () =>
        Response.json(
          { devices: getAllTelemetry() },
          { headers: { "Access-Control-Allow-Origin": "*" } },
        ),
    },
  },
});
