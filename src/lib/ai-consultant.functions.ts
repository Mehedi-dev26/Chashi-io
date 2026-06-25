import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const Input = z.object({ question: z.string().min(1).max(2000) });

export const askConsultant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");
    const { supabase, userId } = context;

    // Pull live context from the user's database in parallel
    const [fieldsR, telemR, nodesR, cmdsR, chatR] = await Promise.all([
      supabase.from("fields").select("zone_id,name_bn,area_acres,crop_type").eq("user_id", userId),
      supabase.from("device_telemetry").select("*"),
      supabase.from("field_nodes").select("device_id,zone_id,label").eq("user_id", userId),
      supabase.from("device_commands").select("action,zone_id,created_at,consumed").order("created_at",{ascending:false}).limit(8),
      supabase.from("ai_chats").select("role,content").eq("user_id", userId).order("created_at",{ascending:false}).limit(10),
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
      ? fields.map((f) => {
          const t = tMap.get(f.zone_id);
          const online = t && now - new Date(t.updated_at).getTime() < 15000;
          return `- ${f.zone_id} (${f.name_bn}, ${f.crop_type}, ${f.area_acres} একর): মাটি=${t?.soil_moisture ?? "?"}%, TDS=${t?.tds_ppm ?? "?"}ppm, ভাল্ভ=${t?.valve_open ? "খোলা":"বন্ধ"}, status=${online?"online":"offline"}`;
        }).join("\n")
      : "(কোনো জমি যোগ করা হয়নি)";

    const systemContext = `তুমি BMDA স্মার্ট সেচ AI পরামর্শক। সর্বদা সংক্ষিপ্ত, বাংলায়, কৃষকের ভাষায় উত্তর দাও। নিচের real-time তথ্যের উপর ভিত্তি করে উত্তর দাও:

পাম্প (MASTER-01): ${masterOnline ? "✓ অনলাইন" : "⚠ অফলাইন"}, voltage=${master?.voltage ?? 0}V, current=${master?.current ?? 0}A, flow=${master?.flow_lpm ?? 0}L/min, runtime=${((master?.runtime_sec ?? 0)/3600).toFixed(2)}h, motor=${master?.motor_on?"ON":"OFF"}

মোট জমি: ${fields.length}টি (${fields.reduce((s,f)=>s+Number(f.area_acres),0).toFixed(1)} একর)
সাব-নোড: ${nodes.length}টি registered

জমির বিস্তারিত:
${zoneSummary}

সাম্প্রতিক কমান্ড: ${commands.map(c=>`${c.action}/${c.zone_id ?? "-"}`).join(", ") || "নেই"}

আবহাওয়া: গ্রীষ্ম, গড় তাপ ৩২°C, ৪৮ ঘণ্টায় বৃষ্টি নেই (BMD অনুমান)।

নিয়ম: সংখ্যা বাংলা সংখ্যা হিসেবে দিও না (English digits OK)। উত্তর সর্বোচ্চ ৪-৬ লাইন। যেখানে প্রাসঙ্গিক, নির্দিষ্ট zone_id ও কত মিনিট সেচ দিতে হবে বলো।`;

    const gateway = createLovableAiGatewayProvider(key);
    const messages = [
      { role: "system" as const, content: systemContext },
      ...history.map((h) => ({ role: h.role as "user"|"assistant", content: h.content })),
      { role: "user" as const, content: data.question },
    ];

    let reply: string;
    try {
      const { text } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        messages,
      });
      reply = text;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("429")) throw new Error("RATE_LIMIT");
      if (msg.includes("402")) throw new Error("CREDITS_EXHAUSTED");
      throw e;
    }

    // Persist Q&A
    await supabase.from("ai_chats").insert([
      { user_id: userId, role: "user", content: data.question },
      { user_id: userId, role: "assistant", content: reply },
    ]);

    return { reply };
  });
