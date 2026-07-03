import { Rocket, Satellite, Brain, Smartphone, ShieldCheck, Leaf, CircleCheck, Clock, Lightbulb } from "lucide-react";

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

type Phase = "done" | "active" | "planned";

const items: Array<{
  title: string;
  desc: string;
  phase: Phase;
  q: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}> = [
  {
    title: "IoT সেন্সর সংযোগ (LoRaWAN)",
    desc: "প্রতি জমিতে মাটি-আর্দ্রতা, EC ও তাপমাত্রা সেন্সর বসিয়ে রিয়েল-টাইম ডেটা সংগ্রহ।",
    phase: "active",
    q: "চলমান · ২য় প্রান্তিক ২০২৬",
    icon: Satellite,
    accent: "from-emerald-500 to-green-600",
  },
  {
    title: "AI ভিত্তিক পানি বরাদ্দ ইঞ্জিন",
    desc: "ফসলের ধরন, আবহাওয়া ও মাটির অবস্থা বিশ্লেষণ করে স্বয়ংক্রিয় সেচ সময়সূচি তৈরি।",
    phase: "active",
    q: "চলমান · ৩য় প্রান্তিক ২০২৬",
    icon: Brain,
    accent: "from-violet-500 to-purple-600",
  },
  {
    title: "কৃষকের মোবাইল অ্যাপ (Bangla)",
    desc: "SMS + অ্যাপ নোটিফিকেশন, ভয়েস কমান্ড ও স্থানীয় ভাষায় সহজ ড্যাশবোর্ড।",
    phase: "planned",
    q: "পরিকল্পিত · ৪র্থ প্রান্তিক ২০২৬",
    icon: Smartphone,
    accent: "from-sky-500 to-cyan-600",
  },
  {
    title: "ড্রোন ও স্যাটেলাইট NDVI মানচিত্র",
    desc: "ফসলের স্বাস্থ্য পর্যবেক্ষণ ও সমস্যা এলাকা চিহ্নিতকরণে ভিজ্যুয়াল ম্যাপ যুক্ত করা।",
    phase: "planned",
    q: "পরিকল্পিত · ১ম প্রান্তিক ২০২৭",
    icon: Leaf,
    accent: "from-lime-500 to-emerald-600",
  },
  {
    title: "ব্লকচেইন ভিত্তিক পানি ব্যবহার লগ",
    desc: "জবাবদিহিতা ও স্বচ্ছ বিতরণের জন্য অপরিবর্তনীয় রেকর্ড সংরক্ষণ।",
    phase: "planned",
    q: "গবেষণা · ২য় প্রান্তিক ২০২৭",
    icon: ShieldCheck,
    accent: "from-amber-500 to-orange-600",
  },
  {
    title: "ড্যাশবোর্ড MVP — সম্পূর্ণ",
    desc: "৭টি জোন, মোটর নিয়ন্ত্রণ, AI পরামর্শ ও পরিসংখ্যান সহ লাইভ ইন্টারফেস।",
    phase: "done",
    q: "সম্পন্ন · ১ম প্রান্তিক ২০২৬",
    icon: CircleCheck,
    accent: "from-teal-500 to-emerald-600",
  },
];

const phaseBadge: Record<Phase, { bn: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
  done: { bn: "সম্পন্ন", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30", icon: CircleCheck },
  active: { bn: "চলমান", cls: "bg-amber-500/15 text-amber-700 border-amber-500/30", icon: Clock },
  planned: { bn: "পরিকল্পিত", cls: "bg-sky-500/15 text-sky-700 border-sky-500/30", icon: Lightbulb },
};

export function Roadmap() {
  const done = items.filter((i) => i.phase === "done").length;
  const progress = Math.round((done / items.length) * 100);

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" /> ভবিষ্যৎ পরিকল্পনা ও রোডম্যাপ
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Chashi.io ব্যবস্থাকে এগিয়ে নিতে পরবর্তী উন্নয়ন ধাপসমূহ
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">অগ্রগতি</p>
          <p className="text-lg font-bold text-primary">{bn(progress)}%</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((it) => {
          const PB = phaseBadge[it.phase];
          return (
            <div
              key={it.title}
              className="rounded-xl glass-panel p-3.5 hover-lift relative overflow-hidden"
            >
              <div className={`absolute -top-8 -right-8 h-20 w-20 rounded-full bg-gradient-to-br ${it.accent} opacity-15 blur-xl`} />
              <div className="flex items-start gap-2.5 relative">
                <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${it.accent} text-white grid place-items-center shadow shrink-0`}>
                  <it.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold leading-tight truncate">{it.title}</h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{it.desc}</p>
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold border ${PB.cls} inline-flex items-center gap-1`}>
                      <PB.icon className="h-2.5 w-2.5" /> {PB.bn}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-mono">{it.q}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
