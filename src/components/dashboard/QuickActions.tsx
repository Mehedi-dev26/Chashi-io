import { Sprout, Droplets, Workflow, CloudRain, Calendar, Wrench, Bell, FlaskConical } from "lucide-react";

const actions = [
  { label: "জমি", desc: "প্লট দেখুন", icon: Sprout, from: "from-emerald-500", to: "to-green-600", ring: "ring-emerald-500/30" },
  { label: "সেচ চালু", desc: "এক ক্লিকে শুরু", icon: Droplets, from: "from-sky-500", to: "to-cyan-600", ring: "ring-sky-500/30" },
  { label: "পদ্ধতি", desc: "ড্রিপ / স্প্রিংকলার", icon: Workflow, from: "from-violet-500", to: "to-purple-600", ring: "ring-violet-500/30" },
  { label: "আবহাওয়া", desc: "৪৮ ঘণ্টার পূর্বাভাস", icon: CloudRain, from: "from-blue-500", to: "to-indigo-600", ring: "ring-blue-500/30" },
  { label: "সময়সূচি", desc: "স্বয়ংক্রিয় চক্র", icon: Calendar, from: "from-amber-500", to: "to-orange-600", ring: "ring-amber-500/30" },
  { label: "রক্ষণাবেক্ষণ", desc: "যন্ত্রপাতি পরীক্ষা", icon: Wrench, from: "from-slate-500", to: "to-gray-700", ring: "ring-slate-500/30" },
  { label: "সতর্কতা", desc: "সকল বিজ্ঞপ্তি", icon: Bell, from: "from-rose-500", to: "to-red-600", ring: "ring-rose-500/30" },
  { label: "মাটি পরীক্ষা", desc: "pH ও পুষ্টি", icon: FlaskConical, from: "from-teal-500", to: "to-emerald-600", ring: "ring-teal-500/30" },
];

export function QuickActions() {
  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-bold">দ্রুত কার্যাবলী</h2>
          <p className="text-xs text-muted-foreground">প্রায়ই ব্যবহৃত নিয়ন্ত্রণসমূহ</p>
        </div>
        <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded-full">{"৮"}টি শর্টকাট</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {actions.map((a) => (
          <button
            key={a.label}
            className={`group relative overflow-hidden rounded-xl p-3 text-left bg-gradient-to-br ${a.from} ${a.to} text-white shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all ring-1 ${a.ring}`}
          >
            <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-white/15 blur-xl group-hover:bg-white/30 transition" />
            <a.icon className="h-5 w-5 mb-2 drop-shadow" />
            <p className="text-sm font-bold leading-tight">{a.label}</p>
            <p className="text-[10px] opacity-90 mt-0.5">{a.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
