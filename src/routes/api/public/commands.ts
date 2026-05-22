import { createFileRoute } from "@tanstack/react-router";
import { queueCommand } from "@/lib/device-store.server";

// Dashboard / mobile app POSTs control commands here.
// Body: { deviceId, action: "valve_open"|"valve_close"|"motor_on"|"motor_off", zoneId? }
// ESP32 will pick it up on next telemetry POST.

export const Route = createFileRoute("/api/public/commands")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }),

      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const valid = ["valve_open", "valve_close", "motor_on", "motor_off"];
          if (!body?.deviceId || !valid.includes(body?.action)) {
            return Response.json({ ok: false, error: "deviceId and valid action required" }, { status: 400 });
          }
          const cmd = queueCommand(String(body.deviceId), {
            action: body.action,
            zoneId: body.zoneId ? String(body.zoneId) : undefined,
          });
          return Response.json({ ok: true, command: cmd }, { headers: { "Access-Control-Allow-Origin": "*" } });
        } catch (e) {
          return Response.json({ ok: false, error: String(e) }, { status: 500 });
        }
      },
    },
  },
});
