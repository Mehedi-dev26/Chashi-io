import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import type { Database } from "@/integrations/supabase/types";

const Input = z.object({ question: z.string().min(1).max(2000) });

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
}

function friendlyGatewayError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[ai-consultant] gateway error:", message);

  if (message.includes("429")) return { status: 429, error: "RATE_LIMIT" };
  if (message.includes("402")) return { status: 402, error: "CREDITS_EXHAUSTED" };
  return { status: 500, error: "AI_GATEWAY" };
}

export const Route = createFileRoute("/api/ai-consultant")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization") ?? "";
        if (!authHeader.startsWith("Bearer ")) {
          return json({ error: "AUTH_REQUIRED" }, { status: 401 });
        }

        const token = authHeader.replace("Bearer ", "").trim();
        if (!token) return json({ error: "AUTH_REQUIRED" }, { status: 401 });

        let input: z.infer<typeof Input>;
        try {
          input = Input.parse(await request.json());
        } catch {
          return json({ error: "INVALID_QUESTION" }, { status: 400 });
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
        const aiKey = process.env.LOVABLE_API_KEY;

        if (!supabaseUrl || !supabaseKey) {
          return json({ error: "DATABASE_CONFIG_MISSING" }, { status: 500 });
        }
        if (!aiKey) return json({ error: "AI_CONFIG_MISSING" }, { status: 500 });

        const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });

        const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
        const userId = claimsData?.claims?.sub;
        if (claimsError || !userId) return json({ error: "AUTH_REQUIRED" }, { status: 401 });

        const [fieldsR, telemR, nodesR, cmdsR, chatR] = await Promise.all([
          supabase.from("fields").select("zone_id,name_bn,area_acres,crop_type").eq("user_id", userId),
          supabase.from("device_telemetry").select("*"),
          supabase.from("field_nodes").select("device_id,zone_id,label").eq("user_id", userId),
          supabase
            .from("device_commands")
            .select("action,zone_id,created_at,consumed")
            .order("created_at", { ascending: false })
            .limit(8),
          supabase
            .from("ai_chats")
            .select("role,content")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

        const fields = fieldsR.data ?? [];
        const telemetry = telemR.data ?? [];
        const nodes = nodesR.data ?? [];
        const commands = cmdsR.data ?? [];
        const history = (chatR.data ?? []).reverse();

        const now = Date.now();
        const tMap = new Map(telemetry.map((t) => [t.zone_id, t]));
        const master = tMap.get("PUMP-HOUSE");
        const masterOnline = master && now - new Date(master.updated_at).getTime() < 15000;

        const zoneSummary = fields.length
          ? fields
              .map((field) => {
                const telemetryRow = tMap.get(field.zone_id);
                const online = telemetryRow && now - new Date(telemetryRow.updated_at).getTime() < 15000;
                return `- ${field.zone_id} (${field.name_bn}, ${field.crop_type}, ${field.area_acres} একর): SM=${telemetryRow?.soil_moisture ?? "?"}%, ভাল্ভ=${telemetryRow?.valve_open ? "খোলা" : "বন্ধ"}, status=${online ? "online" : "offline"}`;
              })
              .join("\n")
          : "(কোনো জমি যোগ করা হয়নি)";

        const systemContext = `তুমি BMDA স্মার্ট সেচ AI পরামর্শক। সর্বদা আসসালামু আলাইকুম দিয়ে অভিবাদন করবে, সংক্ষিপ্ত বাংলায় কৃষকের ভাষায় উত্তর দেবে, এবং নিচের live database তথ্যের উপর ভিত্তি করে উত্তর দেবে।

পাম্প (MASTER-01): ${masterOnline ? "✓ অনলাইন" : "⚠ অফলাইন"}, voltage=${master?.voltage ?? 0}V, current=${master?.current ?? 0}A, flow=${master?.flow_lpm ?? 0}L/min, runtime=${((master?.runtime_sec ?? 0) / 3600).toFixed(2)}h, motor=${master?.motor_on ? "ON" : "OFF"}

মোট জমি: ${fields.length}টি (${fields.reduce((sum, field) => sum + Number(field.area_acres), 0).toFixed(1)} একর)
সাব-নোড: ${nodes.length}টি registered

জমির বিস্তারিত:
${zoneSummary}

সাম্প্রতিক কমান্ড: ${commands.map((command) => `${command.action}/${command.zone_id ?? "-"}`).join(", ") || "নেই"}
আবহাওয়া: গ্রীষ্ম, গড় তাপ ৩২°C, ৪৮ ঘণ্টায় বৃষ্টি নেই (BMD অনুমান)।

সূচি optimization চাইলে zone_id অনুযায়ী priority, শুরু করার সময়, কত মিনিট সেচ, এবং কারণ দেবে। উত্তর সর্বোচ্চ ৪-৬ লাইন। সংখ্যা English digits-এ দেবে।`;

        const gateway = createLovableAiGatewayProvider(aiKey);
        let reply: string;

        try {
          const { text } = await generateText({
            model: gateway("google/gemini-3-flash-preview"),
            messages: [
              { role: "system", content: systemContext },
              ...history.map((message) => ({
                role: message.role as "user" | "assistant",
                content: message.content,
              })),
              { role: "user", content: input.question },
            ],
          });
          reply = text?.trim() || "দুঃখিত, উত্তর তৈরি করা যায়নি।";
        } catch (error) {
          const mapped = friendlyGatewayError(error);
          return json({ error: mapped.error }, { status: mapped.status });
        }

        const { error: insertError } = await supabase.from("ai_chats").insert([
          { user_id: userId, role: "user", content: input.question },
          { user_id: userId, role: "assistant", content: reply },
        ]);
        if (insertError) console.error("[ai-consultant] persist error:", insertError.message);

        return json({ reply });
      },
    },
  },
});