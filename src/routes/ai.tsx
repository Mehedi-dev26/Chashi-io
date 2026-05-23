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
        <div className="grid lg:grid-cols-3 gap-3">
          {[
            { icon: Brain, label: "AI ইঞ্জিন", value: "BMDA কৃষি-GPT", desc: "বাংলাদেশী ফসলের জন্য fine-tuned" },
            { icon: TrendingUp, label: "সাশ্রয় (এ সপ্তাহে)", value: `${bn("৩,২০০")} L`, desc: "পানি ও বিদ্যুৎ মিলিয়ে" },
            { icon: CloudRain, label: "আবহাওয়া উৎস", value: "BMD লাইভ", desc: "প্রতি ৩০ মিনিটে আপডেট" },
          ].map((c) => (
            <div key={c.label} className="glass-card rounded-2xl p-5 hover-lift relative overflow-hidden">
              <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-primary/15 blur-2xl" />
              <c.icon className="h-6 w-6 text-primary relative" />
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-3 font-bold">{c.label}</p>
              <p className="text-xl font-extrabold mt-1">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-5">
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden flex flex-col" style={{ minHeight: 540 }}>
            <div className="absolute top-0 right-0 h-40 w-40 bg-primary/15 blur-3xl rounded-full pointer-events-none" />
            <div className="flex items-center gap-2 relative">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-chart-2 grid place-items-center glow-primary">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-base font-extrabold">AI কে জিজ্ঞাসা করুন</h2>
                <p className="text-xs text-muted-foreground">বাংলায় যেকোনো কৃষি প্রশ্ন · তাৎক্ষণিক উত্তর</p>
              </div>
            </div>

            <div ref={scrollRef} className="mt-4 rounded-xl glass-panel p-4 flex-1 overflow-y-auto space-y-3" style={{ maxHeight: 360 }}>
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`h-7 w-7 rounded-lg grid place-items-center shrink-0 ${m.role === "ai" ? "bg-gradient-to-br from-primary to-chart-2" : "bg-accent"}`}>
                    {m.role === "ai" ? <Sparkles className="h-3.5 w-3.5 text-primary-foreground" /> : <User className="h-3.5 w-3.5 text-accent-foreground" />}
                  </div>
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-line ${m.role === "ai" ? "bg-card border border-border" : "bg-primary text-primary-foreground"}`}>
                    {m.text}
                    <p className={`text-[10px] mt-1 font-mono ${m.role === "ai" ? "text-muted-foreground" : "text-primary-foreground/70"}`}>{m.time}</p>
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex gap-3">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-chart-2 grid place-items-center">
                    <Sparkles className="h-3.5 w-3.5 text-primary-foreground animate-pulse" />
                  </div>
                  <div className="bg-card border border-border rounded-xl px-3 py-2 text-sm">
                    <span className="inline-flex gap-1">
                      <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" />
                      <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                      <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-full glass-panel hover-lift text-foreground/80">
                  {s}
                </button>
              ))}
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
                className="flex-1 h-11 px-4 rounded-xl bg-card border border-border text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
              <button type="submit" disabled={!prompt.trim() || thinking} className="h-11 px-4 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-1.5 hover-lift glow-primary disabled:opacity-50">
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
