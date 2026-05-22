import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { useIrrigationData } from "@/hooks/useIrrigationData";
import { Sparkles, Brain, CloudRain, TrendingUp, Send } from "lucide-react";
import { useState } from "react";

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

export const Route = createFileRoute("/ai")({
  head: () => ({ meta: [{ title: "AI পরামর্শ · BMDA স্মার্ট সেচ" }] }),
  component: AIPage,
});

function AIPage() {
  const { zones } = useIrrigationData();
  const [prompt, setPrompt] = useState("");

  const suggestions = [
    "আজকের সেচ সূচি অপ্টিমাইজ করো",
    "পানির ব্যবহার কমানোর উপায় বলো",
    "কোন জোনে সবচেয়ে বেশি মনোযোগ দরকার?",
    "আগামীকালের আবহাওয়া অনুযায়ী পরিকল্পনা দাও",
  ];

  return (
    <DashboardLayout
      title="AI পরামর্শ · কৃষি বুদ্ধিমত্তা"
      subtitle="মাটি, আবহাওয়া ও ফসলের তথ্য বিশ্লেষণ করে AI আপনাকে সঠিক সিদ্ধান্ত নিতে সাহায্য করবে।"
    >
      <div className="stagger space-y-5">
        <div className="grid lg:grid-cols-3 gap-3">
          {[
            { icon: Brain, label: "AI মডেল", value: "GPT-৪ কৃষি", desc: "বাংলাদেশী ফসলের জন্য প্রশিক্ষিত" },
            { icon: TrendingUp, label: "সাশ্রয় (এ সপ্তাহে)", value: `${bn("৩,২০০")} L`, desc: "পানি ও বিদ্যুৎ মিলিয়ে" },
            { icon: CloudRain, label: "আবহাওয়া উৎস", value: "BMD লাইভ", desc: "প্রতি ৩০ মিনিটে আপডেট" },
          ].map((c) => (
            <div key={c.label} className="glass-card rounded-2xl p-5 hover-lift relative overflow-hidden">
              <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-primary/15 blur-2xl" />
              <c.icon className="h-6 w-6 text-primary relative" />
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-3 font-semibold">{c.label}</p>
              <p className="text-xl font-bold mt-1">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-5">
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-40 w-40 bg-primary/15 blur-3xl rounded-full" />
            <div className="flex items-center gap-2 relative">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-chart-2 grid place-items-center glow-primary">
                <Sparkles className="h-4.5 w-4.5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-base font-bold">AI কে জিজ্ঞাসা করুন</h2>
                <p className="text-xs text-muted-foreground">বাংলায় যেকোনো কৃষি প্রশ্ন করুন</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl glass-panel p-4 min-h-[200px] space-y-3">
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-chart-2 grid place-items-center shrink-0">
                  <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <div className="text-sm leading-relaxed">
                  নমস্কার! আমি BMDA স্মার্ট সেচ AI। আজ <strong>জোন Z-০৪</strong> এ মাটির আর্দ্রতা ২২%-এ নেমেছে — অবিলম্বে ৪৫ মিনিট সেচ প্রয়োজন। আবহাওয়া অনুযায়ী আগামী ৪৮ ঘণ্টায় বৃষ্টির সম্ভাবনা নেই, তাই বর্তমান সূচি বজায় রাখুন।
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button key={s} onClick={() => setPrompt(s)} className="text-xs px-3 py-1.5 rounded-full glass-panel hover-lift text-foreground/80">
                  {s}
                </button>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="আপনার প্রশ্ন বাংলায় লিখুন..."
                className="flex-1 h-11 px-4 rounded-xl bg-card border border-border text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
              <button className="h-11 px-4 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-1.5 hover-lift glow-primary">
                <Send className="h-4 w-4" /> পাঠান
              </button>
            </div>
          </div>

          <AIInsights zones={zones} />
        </div>
      </div>
    </DashboardLayout>
  );
}
