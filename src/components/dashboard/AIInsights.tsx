import { Sparkles, TrendingUp, CloudRain, AlertTriangle } from "lucide-react";
import type { FieldZone } from "@/hooks/useIrrigationData";

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

export function AIInsights({ zones }: { zones: FieldZone[] }) {
  const lowMoisture = zones.filter((z) => z.soilMoisture < 40);
  const insights = [
    {
      icon: AlertTriangle,
      tone: "destructive",
      title: "জরুরি: জোন Z-০৪ এ এখনই সেচ প্রয়োজন",
      detail: "মাটির আর্দ্রতা ২২%-এ নেমেছে। পরামর্শ: ৩৮ PSI চাপে ৪৫ মিনিট সেচ।",
    },
    {
      icon: CloudRain,
      tone: "chart-2",
      title: "আবহাওয়া পূর্বাভাস সংযুক্ত",
      detail: "আগামী ৪৮ ঘণ্টায় বৃষ্টির সম্ভাবনা নেই। নির্ধারিত সেচ সূচি অব্যাহত রাখুন।",
    },
    {
      icon: TrendingUp,
      tone: "primary",
      title: "এই সপ্তাহে দক্ষতা ১২% বেড়েছে",
      detail: `AI-চালিত সময়সূচি ম্যানুয়াল পদ্ধতির তুলনায় প্রায় ${bn((lowMoisture.length * 320).toLocaleString())} লিটার পানি সাশ্রয় করেছে।`,
    },
  ];

  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 h-32 w-32 bg-primary/15 blur-3xl rounded-full" />
      <div className="flex items-center gap-2 relative">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-chart-2 grid place-items-center">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-sm font-bold">AI পরামর্শ ও সুপারিশ</h2>
          <p className="text-[10px] text-muted-foreground">আপডেট · ৩ মিনিট আগে</p>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {insights.map((i, idx) => (
          <div key={idx} className="rounded-xl border border-border glass-panel p-3 flex gap-3">
            <div
              className="h-8 w-8 rounded-lg grid place-items-center shrink-0"
              style={{ background: `color-mix(in oklab, var(--color-${i.tone}) 18%, transparent)` }}
            >
              <i.icon className="h-4 w-4" style={{ color: `var(--color-${i.tone})` }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug">{i.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{i.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-4 w-full h-10 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/15 transition">
        AI কে জিজ্ঞাসা · আজকের সূচি অপ্টিমাইজ করুন
      </button>
    </div>
  );
}
