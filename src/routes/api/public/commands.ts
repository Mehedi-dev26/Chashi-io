import { createFileRoute } from "@tanstack/react-router";

// Public endpoint for queueing device commands (anonymous-issued; e.g. from kiosks).
// Authenticated users should prefer inserting into device_commands via the supabase client
// so RLS records `issued_by`. Body: { deviceId, action, zoneId? }

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const VALID = ["valve_open", "valve_close", "motor_on", "motor_off"] as const;

export const Route = createFileRoute("/api/public/commands")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      POST: async ({ request }) => {
        try {
          const body = await request.json();
          if (!body?.deviceId || !VALID.includes(body?.action)) {
            return Response.json({ ok: false, error: "deviceId and valid action required" }, { status: 400, headers: CORS });
          }
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin
            .from("device_commands")
            .insert({
              device_id: String(body.deviceId),
              zone_id: body.zoneId ? String(body.zoneId) : null,
              action: body.action,
            })
            .select("id, action, zone_id")
            .single();
          if (error) throw error;
          return Response.json({ ok: true, command: data }, { headers: CORS });
        } catch (e) {
          return Response.json({ ok: false, error: String(e) }, { status: 500, headers: CORS });
        }
      },
    },
  },
});
