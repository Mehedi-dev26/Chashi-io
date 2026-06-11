import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { useIrrigationData } from "@/hooks/useIrrigationData";
import { Sparkles, Brain, CloudRain, TrendingUp, Send, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

export const Route = createFileRoute("/ai")({
  head: () => ({ meta: [{ title: "AI পরামর্শ · BMDA স্মার্ট সেচ" }] }),
  component: AIPage,
});

type Msg = { role: "user" | "ai"; text: string; time: string };

function generateReply(prompt: string, zones: ReturnType<typeof useIrrigationData>["zones"]): string {
  const p = prompt.toLowerCase();
  const dry = zones.filter((z) => z.soilMoisture < 40);
  const wet = zones.filter((z) => z.soilMoisture > 75);
  const active = zones.filter((z) => z.valveOpen);
  const critical = zones.filter((z) => z.soilMoisture < 25);

  if (p.includes("সেচ") || p.includes("পানি") || p.includes("সূচি") || p.includes("optim")) {
    return `📋 আজকের অপ্টিমাইজড সেচ সূচি:\n\n${critical.length > 0
      ? `🔴 জরুরি (এখনই): ${critical.map((z) => z.id).join(", ")} — মাটির আর্দ্রতা ${bn(Math.round(critical[0].soilMoisture))}%-এ নেমেছে।\n`
      : ""}${dry.length > 0 ? `🟡 আগামী ২ ঘণ্টায়: ${dry.map((z) => z.id).join(", ")}\n` : ""}🟢 স্বাভাবিক: বাকি ${bn(zones.length - dry.length)} জোন\n\nপরামর্শ: ভোর ৫টা–সকাল ৯টা সবচেয়ে কার্যকর সময়, বাষ্পীভবন কম।`;
  }
  if (p.includes("কম") || p.includes("সাশ্রয়") || p.includes("save")) {
    return `💧 পানি সাশ্রয়ের ৪টি কৌশল:\n\n১. ড্রিপ সেচ ব্যবহার — ৪০% পর্যন্ত সাশ্রয়\n২. মালচিং — মাটির আর্দ্রতা ধরে রাখে\n৩. সকাল/সন্ধ্যা সেচ — বাষ্পীভবন কমায়\n৪. সয়েল মইশ্চার সেন্সর ভিত্তিক স্বয়ংক্রিয় সেচ\n\nগত সপ্তাহে AI স্বয়ংক্রিয় শিডিউল ${bn("৩,২০০")} লিটার সাশ্রয় করেছে।`;
  }
  if (p.includes("মনোযোগ") || p.includes("জরুরি") || p.includes("attention")) {
    if (critical.length > 0) {
      const z = critical[0];
      return `⚠️ ${z.id} (${z.nameBn}) এ অবিলম্বে মনোযোগ দিন:\n• মাটির আর্দ্রতা: ${bn(Math.round(z.soilMoisture))}% (সীমা ৩০%)\n• ফসল: ${z.cropType}\n• এলাকা: ${bn(z.area)} একর\n• প্রস্তাবিত: ৪৫ মিনিট সেচ, ৩৮ PSI চাপে\n• আনুমানিক পানি: ${bn(Math.round(z.area * 280))} লিটার`;
    }
    return "✅ সব জোন স্বাভাবিক। কোনো জরুরি হস্তক্ষেপ প্রয়োজন নেই।";
  }
  if (p.includes("আবহাওয়া") || p.includes("বৃষ্টি") || p.includes("weather") || p.includes("আগামী")) {
    return `🌤️ আগামী ৪৮ ঘণ্টার পরিকল্পনা:\n\n• বৃষ্টির সম্ভাবনা: ১২% (নগণ্য)\n• গড় তাপমাত্রা: ${bn("৩১")}°C / ${bn("২৪")}°C\n• আর্দ্রতা: ৬৮%\n• বাতাস: পূর্ব ১২ km/h\n\nসুপারিশ: নির্ধারিত সেচ সূচি অব্যাহত রাখুন। বৃষ্টির অপেক্ষা না করে দরকার মতো সেচ দিন।`;
  }
  if (p.includes("সার") || p.includes("fertiliz")) {
    return `🌾 সার প্রয়োগের পরামর্শ:\n\n• ধান (Z-০১, Z-০৩, Z-০৫): ইউরিয়া ২য় কিস্তি — রোপণের ৩০ দিন পর\n• ভুট্টা (Z-০৪): DAP ৫০ kg/একর + পটাশ ২৫ kg\n• আলু (Z-০৬): TSP ৬০ kg/একর, ফুল আসার আগে\n\nপ্রয়োগের পর হালকা সেচ অবশ্যই দিন।`;
  }
  if (p.includes("রোগ") || p.includes("পোকা") || p.includes("disease")) {
    return `🐛 ফসল সুরক্ষা স্ক্যান:\n\n• Z-০২ (গম): কোনো অস্বাভাবিকতা নেই\n• Z-০৪ (ভুট্টা): NDVI কম — পানির ঘাটতি, রোগ নয়\n• সাধারণ পরামর্শ: ধানে BPH পর্যবেক্ষণ করুন (এ সময়ের জন্য সাধারণ)\n\nবিস্তারিত ছবি আপলোড করলে আরও সুনির্দিষ্ট রোগ শনাক্ত করা যাবে।`;
  }
  // default
  return `আমি BMDA স্মার্ট AI। বর্তমান অবস্থা:\n\n• সক্রিয় ভাল্ভ: ${bn(active.length)}/${bn(zones.length)}\n• শুষ্ক জোন: ${bn(dry.length)}\n• অতিরিক্ত আর্দ্র: ${bn(wet.length)}\n• জরুরি অ্যালার্ট: ${bn(critical.length)}\n\nআপনি জিজ্ঞাসা করতে পারেন: সেচ সূচি, পানি সাশ্রয়, আবহাওয়া, সার, রোগ-পোকা — যেকোনো বিষয়ে।`;
}

function AIPage() {
  const { zones } = useIrrigationData();
  const [prompt, setPrompt] = useState("");
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "ai",
      text: "নমস্কার! আমি BMDA স্মার্ট সেচ AI। মাটি, আবহাওয়া, ফসল ও সেচ সংক্রান্ত যেকোনো প্রশ্ন বাংলায় করুন।",
      time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q) return;
    const now = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    setMessages((m) => [...m, { role: "user", text: q, time: now }]);
    setPrompt("");
    setThinking(true);
    setTimeout(() => {
      const reply = generateReply(q, zones);
      setMessages((m) => [...m, { role: "ai", text: reply, time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) }]);
      setThinking(false);
    }, 700);
  };

  const suggestions = [
    "আজকের সেচ সূচি অপ্টিমাইজ করো",
    "পানির ব্যবহার কমানোর উপায় বলো",
    "কোন জোনে সবচেয়ে বেশি মনোযোগ দরকার?",
    "আগামীকালের আবহাওয়া অনুযায়ী পরিকল্পনা দাও",
    "সার প্রয়োগের সঠিক সময় কখন?",
    "ফসলে রোগ-পোকার ঝুঁকি আছে কি?",
  ];

  return (
    <DashboardLayout
      title="AI পরামর্শ · কৃষি বুদ্ধিমত্তা"
      subtitle="রিয়েল-টাইম সেন্সর ডেটা ও আবহাওয়া বিশ্লেষণ করে বাংলায় তাৎক্ষণিক সিদ্ধান্ত-সহায়তা।"
    >
      <div className="stagger space-y-5">
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { icon: Brain,      label: "AI ইঞ্জিন",          value: "BMDA কৃষি-GPT",  desc: "বাংলাদেশী ফসলের জন্য fine-tuned", grad: "from-violet-500 via-fuchsia-500 to-pink-500",   ring: "ring-violet-300/40" },
            { icon: TrendingUp, label: "সাশ্রয় (এ সপ্তাহে)", value: `${bn("৩,২০০")} L`, desc: "পানি ও বিদ্যুৎ মিলিয়ে",          grad: "from-lime-500 via-green-500 to-emerald-500",     ring: "ring-lime-300/40" },
            { icon: CloudRain,  label: "আবহাওয়া উৎস",       value: "BMD লাইভ",        desc: "প্রতি ৩০ মিনিটে আপডেট",            grad: "from-orange-500 via-amber-500 to-yellow-500",   ring: "ring-amber-300/40" },
          ].map((c) => (
            <div
              key={c.label}
              className={`relative overflow-hidden rounded-2xl p-5 text-white bg-gradient-to-br ${c.grad} shadow-lg ring-1 ${c.ring} border-2 border-white/20 hover-lift`}
            >
              <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm grid place-items-center ring-1 ring-white/30">
                <c.icon className="h-5 w-5 drop-shadow" />
              </div>
              <p className="text-[11px] uppercase tracking-wider mt-3 font-bold opacity-95">{c.label}</p>
              <p className="text-xl font-extrabold mt-1 drop-shadow">{c.value}</p>
              <p className="text-xs opacity-90 mt-1">{c.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-5">
          <div className="rounded-2xl p-5 relative overflow-hidden flex flex-col bg-card border-2 border-violet-400/30 shadow-md shadow-violet-500/10 ring-1 ring-violet-300/20" style={{ minHeight: 540 }}>
            <div className="absolute top-0 right-0 h-40 w-40 bg-violet-500/15 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
            <div className="flex items-center gap-2 relative mt-1">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 grid place-items-center shadow-lg ring-1 ring-white/30">
                <Sparkles className="h-5 w-5 text-white drop-shadow" />
              </div>
              <div>
                <h2 className="text-base font-extrabold">AI কে জিজ্ঞাসা করুন</h2>
                <p className="text-xs text-muted-foreground">বাংলায় যেকোনো কৃষি প্রশ্ন · তাৎক্ষণিক উত্তর</p>
              </div>
            </div>

            <div ref={scrollRef} className="mt-4 rounded-xl glass-panel p-4 flex-1 overflow-y-auto space-y-3 border border-violet-200/30" style={{ maxHeight: 360 }}>
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 shadow-md ring-1 ring-white/30 ${m.role === "ai" ? "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500" : "bg-gradient-to-br from-lime-500 via-green-500 to-emerald-500"}`}>
                    {m.role === "ai" ? <Sparkles className="h-4 w-4 text-white drop-shadow" /> : <User className="h-4 w-4 text-white drop-shadow" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line shadow-sm ${m.role === "ai" ? "bg-card border-2 border-violet-200/40" : "bg-gradient-to-br from-lime-500 via-green-500 to-emerald-500 text-white border-2 border-white/20"}`}>
                    {m.text}
                    <p className={`text-[10px] mt-1 font-mono ${m.role === "ai" ? "text-muted-foreground" : "text-white/80"}`}>{m.time}</p>
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 grid place-items-center shadow-md">
                    <Sparkles className="h-4 w-4 text-white animate-pulse" />
                  </div>
                  <div className="bg-card border-2 border-violet-200/40 rounded-2xl px-3.5 py-2.5 text-sm">
                    <span className="inline-flex gap-1">
                      <span className="h-1.5 w-1.5 bg-violet-500 rounded-full animate-bounce" />
                      <span className="h-1.5 w-1.5 bg-fuchsia-500 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                      <span className="h-1.5 w-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((s, i) => {
                const palettes = [
                  "bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500",
                  "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500",
                  "bg-gradient-to-r from-lime-500 via-green-500 to-emerald-500",
                ];
                return (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full text-white shadow-md ring-1 ring-white/30 hover:scale-[1.03] active:scale-[0.98] transition ${palettes[i % 3]}`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(prompt);
              }}
              className="mt-3 flex gap-2"
            >
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="আপনার প্রশ্ন বাংলায় লিখুন..."
                className="flex-1 h-11 px-4 rounded-xl bg-card border-2 border-violet-200/40 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
              />
              <button type="submit" disabled={!prompt.trim() || thinking} className="h-11 px-4 rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white font-bold flex items-center gap-1.5 shadow-lg ring-1 ring-white/30 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed">
                <Send className="h-4 w-4" /> পাঠান
              </button>
            </form>
          </div>

          <AIInsights zones={zones} />
        </div>
      </div>
    </DashboardLayout>
  );
}
