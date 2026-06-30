import { createFileRoute } from "@tanstack/react-router";

// Command writes are intentionally handled from the signed-in dashboard only.
// ESP32/ESP8266 devices receive pending commands from the telemetry response.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/public/commands")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      POST: async ({ request }) => {
        await request.text().catch(() => "");
        return Response.json(
          { ok: false, error: "Public command writes are disabled. Use the authenticated dashboard; devices read commands from /api/public/telemetry." },
          { status: 403, headers: CORS },
        );
      },
    },
  },
});
