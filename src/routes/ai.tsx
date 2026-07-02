import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { useIrrigationData } from "@/hooks/useIrrigationData";
import { Sparkles, Brain, CloudRain, TrendingUp, Send, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askConsultant } from "@/lib/ai-consultant.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

export const Route = createFileRoute("/ai")({
  head: () => ({ meta: [{ title: "AI পরামর্শ · BMDA স্মার্ট সেচ" }] }),
  component: AIPage,
});

type Msg = { role: "user" | "ai"; text: string; time: string };

function AIPage() {
  const { zones } = useIrrigationData();
  const ask = useServerFn(askConsultant);
  const [prompt, setPrompt] = useState("");
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "ai",
      text: "আসসালামু আলাইকুম! আমি BMDA স্মার্ট সেচ AI। আমার কাছে আপনার সকল জমি, পাম্প, সেন্সর, ভাল্ভ ও রিয়েল-টাইম টেলিমেট্রি ডেটাবেজে সরাসরি access আছে। বাংলায় যেকোনো প্রশ্ন করুন।",
      time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("ai_chats")
        .select("role,content,created_at")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: true })
        .limit(50);
      if (data && data.length) {
        setMessages(
          data.map((m) => ({
            role: m.role === "assistant" ? "ai" : "user",
            text: m.content,
            time: new Date(m.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
          })),
        );
      }
    })();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || thinking) return;
    const now = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    setMessages((m) => [...m, { role: "user", text: q, time: now }]);
    setPrompt("");
    setThinking(true);
    try {
      const { reply } = await ask({ data: { question: q } });
      setMessages((m) => [...m, { role: "ai", text: reply, time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("RATE_LIMIT")) toast.error("খুব দ্রুত প্রশ্ন · কিছুক্ষণ পর আবার চেষ্টা করুন");
      else if (msg.includes("CREDITS_EXHAUSTED")) toast.error("AI ক্রেডিট শেষ — workspace billing-এ যোগ করুন");
      else toast.error("AI ত্রুটি: " + msg.slice(0, 80));
      setMessages((m) => [...m, { role: "ai", text: "⚠ উত্তর তৈরি করা যায়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন।", time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) }]);
    } finally {
      setThinking(false);
    }
  };

  const suggestions = [
    "আজকের সেচ সূচি অপ্টিমাইজ করো",
    "কোন জোনে সবচেয়ে বেশি মনোযোগ দরকার?",
    "পাম্পের বর্তমান অবস্থা কী?",
    "আগামীকালের আবহাওয়া অনুযায়ী পরিকল্পনা",
    "SM (মাটির আর্দ্রতা) অনুযায়ী মাটির অবস্থা বিশ্লেষণ করো",
    "পানি সাশ্রয়ের উপায় বলো",
  ];

  return (
    <DashboardLayout
      title="AI পরামর্শ · কৃষি বুদ্ধিমত্তা"
      subtitle="রিয়েল-টাইম ডাটাবেজ-চালিত · সকল জমি, পাম্প ও সেন্সর তথ্যে AI-র সরাসরি access আছে।"
    >
      <div className="stagger space-y-5">
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { icon: Brain,      label: "AI ইঞ্জিন",          value: "Gemini 3 Flash",  desc: "ডাটাবেজ-সংযুক্ত · রিয়েল-টাইম context", grad: "from-violet-500 via-fuchsia-500 to-pink-500", ring: "ring-violet-300/40" },
            { icon: TrendingUp, label: "জোন বিশ্লেষণ",       value: `${bn(zones.length)}টি জমি`, desc: "সরাসরি database থেকে",                  grad: "from-lime-500 via-green-500 to-emerald-500",   ring: "ring-lime-300/40" },
            { icon: CloudRain,  label: "আবহাওয়া উৎস",       value: "BMD লাইভ",        desc: "প্রতি ৩০ মিনিটে আপডেট",                  grad: "from-orange-500 via-amber-500 to-yellow-500", ring: "ring-amber-300/40" },
          ].map((c) => (
            <div key={c.label} className={`relative overflow-hidden rounded-2xl p-5 text-white bg-gradient-to-br ${c.grad} shadow-lg ring-1 ${c.ring} border-2 border-white/20 hover-lift`}>
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
                <p className="text-xs text-muted-foreground">রিয়েল-টাইম ডেটা · বাংলায় উত্তর · কথোপকথন সংরক্ষিত</p>
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
                  <button key={s} onClick={() => send(s)} disabled={thinking} className={`text-xs font-bold px-3 py-1.5 rounded-full text-white shadow-md ring-1 ring-white/30 hover:scale-[1.03] active:scale-[0.98] transition disabled:opacity-50 ${palettes[i % 3]}`}>
                    {s}
                  </button>
                );
              })}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); send(prompt); }} className="mt-3 flex gap-2">
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
