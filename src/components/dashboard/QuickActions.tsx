import { Sprout, Droplets, Workflow, CloudRain, Calendar, Wrench, Bell, FlaskConical, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

const actions = [
  { label: "জমি", desc: "প্লট দেখুন", icon: Sprout, to: "/zones", from: "from-emerald-500", toColor: "to-green-600", ring: "ring-emerald-500/30" },
  { label: "সেচ চালু", desc: "এক ক্লিকে শুরু", icon: Droplets, to: "/motor", from: "from-sky-500", toColor: "to-cyan-600", ring: "ring-sky-500/30" },
  { label: "AI সূচি অপটিমাইজ", desc: "AI দিয়ে সেচ পরিকল্পনা", icon: Sparkles, to: "/ai", search: { ask: "optimize" }, from: "from-violet-500", toColor: "to-fuchsia-600", ring: "ring-violet-500/30" },
  { label: "আবহাওয়া", desc: "৪৮ ঘণ্টার পূর্বাভাস", icon: CloudRain, to: "/forecast", from: "from-blue-500", toColor: "to-indigo-600", ring: "ring-blue-500/30" },
  { label: "সময়সূচি", desc: "স্বয়ংক্রিয় চক্র", icon: Calendar, to: "/ai", search: { ask: "optimize" }, from: "from-amber-500", toColor: "to-orange-600", ring: "ring-amber-500/30" },
  { label: "রক্ষণাবেক্ষণ", desc: "যন্ত্রপাতি পরীক্ষা", icon: Wrench, to: "/hardware", from: "from-slate-500", toColor: "to-gray-700", ring: "ring-slate-500/30" },
  { label: "সতর্কতা", desc: "সকল বিজ্ঞপ্তি", icon: Bell, to: "/alerts", from: "from-rose-500", toColor: "to-red-600", ring: "ring-rose-500/30" },
  { label: "মাটি পরীক্ষা", desc: "pH ও পুষ্টি", icon: FlaskConical, to: "/analytics", from: "from-teal-500", toColor: "to-emerald-600", ring: "ring-teal-500/30" },
];

export function QuickActions() {
  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-bold">দ্রুত কার্যাবলী</h2>
          <p className="text-xs text-muted-foreground">প্রায়ই ব্যবহৃত নিয়ন্ত্রণসমূহ · AI-চালিত সূচি অপটিমাইজেশন সহ</p>
        </div>
        <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded-full">{"৮"}টি শর্টকাট</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {actions.map((a) => (
          <Link
            key={a.label}
            to={a.to}
            search={a.search as never}
            className={`group relative overflow-hidden rounded-xl p-3 text-left bg-gradient-to-br ${a.from} ${a.toColor} text-white shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all ring-1 ${a.ring}`}
          >
            <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-white/15 blur-xl group-hover:bg-white/30 transition" />
            <a.icon className="h-5 w-5 mb-2 drop-shadow" />
            <p className="text-sm font-bold leading-tight">{a.label}</p>
            <p className="text-[10px] opacity-90 mt-0.5">{a.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

