import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sprout, ArrowRight, Cpu, Droplets, Gauge, Sparkles, ShieldCheck,
  Activity, Satellite, CircuitBoard, ChevronRight, MapPin, Brain, Zap,
  Sun, CloudRain, Leaf, BarChart3, Wifi, Star, CheckCircle2, PlayCircle,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BMDA স্মার্ট সেচ · IoT-চালিত কৃষি জলব্যবস্থাপনা প্ল্যাটফর্ম" },
      { name: "description", content: "বরেন্দ্র বহুমুখী উন্নয়ন কর্তৃপক্ষের জন্য ESP32/ESP8266-ভিত্তিক স্মার্ট সেচ, AI পরামর্শ, NDVI স্যাটেলাইট ও রিয়েল-টাইম সেন্সর নেটওয়ার্ক।" },
      { property: "og:title", content: "BMDA স্মার্ট সেচ · IoT কৃষি প্ল্যাটফর্ম" },
      { property: "og:description", content: "জল সাশ্রয়, ফসলের উৎপাদন বৃদ্ধি ও কৃষকের জন্য বুদ্ধিমান সিদ্ধান্ত — সব এক প্ল্যাটফর্মে।" },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Droplets, title: "জোন-ভিত্তিক সেচ", desc: "৭+ জোনের ভাল্ভ ও পানি প্রবাহ স্মার্টফোন থেকে নিয়ন্ত্রণ।", tint: "from-sky-400 to-cyan-500" },
  { icon: Gauge, title: "মোটর অটোমেশন", desc: "চাপ, ভোল্টেজ, কারেন্ট মনিটরিং সহ স্বয়ংক্রিয় shutoff।", tint: "from-amber-400 to-orange-500" },
  { icon: Brain, title: "AI পরামর্শ", desc: "মাটি, আবহাওয়া ও ফসল অনুযায়ী বুদ্ধিমান সেচ সুপারিশ।", tint: "from-violet-500 to-fuchsia-500" },
  { icon: Satellite, title: "NDVI স্যাটেলাইট", desc: "Sentinel-2 ডেটায় ফসলের স্বাস্থ্য ও জলের প্রয়োজন বিশ্লেষণ।", tint: "from-emerald-400 to-teal-500" },
  { icon: CircuitBoard, title: "Master-Slave Hardware", desc: "ESP32 মাস্টার + একাধিক ESP8266 sub-node দিয়ে স্কেলেবল।", tint: "from-yellow-400 to-amber-500" },
  { icon: ShieldCheck, title: "Role-Based Security", desc: "Admin, Operator, Viewer — প্রত্যেকের জন্য নিরাপদ access।", tint: "from-rose-400 to-pink-600" },
];

const stats = [
  { v: "৩২.৬", u: "হেক্টর কভারেজ", c: "from-emerald-400 to-teal-500" },
  { v: "৪০%", u: "জল সাশ্রয়", c: "from-sky-400 to-blue-500" },
  { v: "২৪/৭", u: "রিয়েল-টাইম মনিটরিং", c: "from-amber-400 to-orange-500" },
  { v: "৭+", u: "সক্রিয় জোন", c: "from-fuchsia-400 to-rose-500" },
];

const steps = [
  { n: "০১", t: "হার্ডওয়্যার ইনস্টল", d: "ESP32 মাস্টার ও ESP8266 sub-node মাঠে স্থাপন।", i: CircuitBoard, c: "bg-amber-100 text-amber-700" },
  { n: "০২", t: "সেন্সর সংযোগ", d: "মাটির আদ্রতা, LDR, flow ও pressure sensor যুক্ত করুন।", i: Wifi, c: "bg-sky-100 text-sky-700" },
  { n: "০৩", t: "AI পরামর্শ গ্রহণ", d: "Dashboard থেকে বাংলায় বুদ্ধিমান সেচ-সিদ্ধান্ত পান।", i: Sparkles, c: "bg-violet-100 text-violet-700" },
];

function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/75 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500 via-amber-400 to-orange-500 grid place-items-center shadow-lg shadow-amber-500/30">
              <Sprout className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight min-w-0">
              <p className="font-black text-sm truncate">BMDA স্মার্ট সেচ</p>
              <p className="text-[10px] text-muted-foreground truncate">বরেন্দ্র · IoT v২.৬</p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition">বৈশিষ্ট্য</a>
            <a href="#how" className="text-muted-foreground hover:text-foreground transition">কীভাবে কাজ করে</a>
            <a href="#tech" className="text-muted-foreground hover:text-foreground transition">প্রযুক্তি</a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition">প্রকল্প</a>
          </nav>
          <Link to="/auth" className="h-10 px-4 sm:px-5 shrink-0 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white text-sm font-bold inline-flex items-center gap-1.5 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:scale-[1.02] transition">
            লগ ইন <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 grid-bg opacity-30 -z-10" />
        <div className="absolute -top-20 left-1/4 w-[420px] h-[420px] bg-amber-300/40 blur-3xl rounded-full -z-10" />
        <div className="absolute top-40 -right-20 w-[420px] h-[420px] bg-emerald-400/30 blur-3xl rounded-full -z-10" />
        <div className="absolute top-80 left-1/2 w-[360px] h-[360px] bg-sky-400/25 blur-3xl rounded-full -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-24 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 h-auto py-1.5 rounded-full bg-gradient-to-r from-amber-100 via-yellow-50 to-emerald-100 border border-amber-300/60 text-xs font-semibold text-amber-900 mb-6 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-amber-500 animate-ping opacity-60" />
              <span className="relative rounded-full h-2 w-2 bg-amber-500" />
            </span>
            বরেন্দ্র অঞ্চলের জন্য পরবর্তী-প্রজন্মের কৃষি প্ল্যাটফর্ম
            <Sun className="h-3.5 w-3.5 text-amber-600" />
          </div>

          <h1 className="font-bangla text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] max-w-5xl mx-auto">
            <span className="text-foreground">বরেন্দ্র স্মার্ট ইরিগেশন</span><br />
            <span className="text-rainbow">IoT-চালিত কৃষি বিপ্লব।</span>
          </h1>
          <p className="mt-5 sm:mt-6 text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
            ESP32/ESP8266-চালিত IoT সেন্সর নেটওয়ার্ক, AI সিদ্ধান্ত-সহায়তা ও স্যাটেলাইট বিশ্লেষণ —
            বরেন্দ্র বহুমুখী উন্নয়ন কর্তৃপক্ষের জন্য নির্মিত পেশাদার স্মার্ট ইরিগেশন প্ল্যাটফর্ম।
          </p>

          <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3 px-4 sm:px-0">
            <Link to="/auth" className="h-12 px-7 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white font-bold text-sm shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:scale-[1.02] transition inline-flex items-center justify-center gap-2">
              Main Panel-এ প্রবেশ করুন <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#features" className="h-12 px-6 rounded-xl border-2 border-emerald-300 bg-white/70 backdrop-blur font-semibold text-sm inline-flex items-center justify-center gap-2 hover:bg-emerald-50 hover:border-emerald-400 transition text-emerald-800">
              <PlayCircle className="h-4 w-4" /> ডেমো দেখুন
            </a>
          </div>

          {/* Trust strip */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {["✅ Government-grade security", "🌱 Eco-friendly", "⚡ Real-time", "🇧🇩 বাংলায় তৈরি"].map((t) => (
              <span key={t} className="font-medium">{t}</span>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            {stats.map((s) => (
              <div key={s.u} className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 text-center bg-gradient-to-br ${s.c} shadow-xl hover:scale-[1.04] hover:-translate-y-1 transition-transform duration-300`}>
                <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-white/25 blur-xl" />
                <div className="absolute -bottom-8 -left-6 h-16 w-16 rounded-full bg-white/15 blur-lg" />
                <p className="relative font-bangla text-3xl sm:text-4xl font-extrabold tabular-nums text-white drop-shadow">{s.v}</p>
                <p className="relative font-bangla text-[11px] sm:text-xs text-white/95 font-semibold mt-1.5 uppercase tracking-wider">{s.u}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-xs uppercase tracking-[0.2em] font-bold mb-3 text-sun">প্ল্যাটফর্মের বৈশিষ্ট্য</p>
          <h2 className="text-3xl sm:text-5xl font-bangla font-extrabold tracking-tight">
            যা যা <span className="text-rainbow">প্রয়োজন</span>, একসাথে।
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            সেচ, মোটর, সেন্সর, AI, স্যাটেলাইট — সমস্ত কিছু একটি বুদ্ধিমান কেন্দ্রীয় প্যানেল থেকে।
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className={`group relative overflow-hidden rounded-2xl p-6 sm:p-7 text-white bg-gradient-to-br ${f.tint} shadow-xl hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300`}
            >
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/20 blur-2xl group-hover:scale-125 transition-transform duration-500" />
              <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-white/25 backdrop-blur grid place-items-center shadow-lg mb-5 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  <f.icon className="h-6 w-6 text-white drop-shadow" />
                </div>
                <h3 className="font-bangla text-xl font-bold tracking-tight text-white">{f.title}</h3>
                <p className="text-sm text-white/90 mt-2 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-16 sm:py-24 bg-gradient-to-b from-amber-50/60 via-yellow-50/40 to-emerald-50/60 border-y border-amber-200/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-xs uppercase tracking-[0.2em] font-bold mb-3 text-sun">৩ ধাপে শুরু</p>
            <h2 className="text-3xl sm:text-5xl font-bangla font-extrabold tracking-tight">
              কীভাবে <span className="text-rainbow">কাজ করে</span>?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-3xl bg-white/90 backdrop-blur border border-amber-200/60 p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition">
                <div className="flex items-center justify-between mb-4">
                  <span className={`h-12 w-12 rounded-2xl grid place-items-center ${s.c}`}>
                    <s.i className="h-6 w-6" />
                  </span>
                  <span className="text-4xl font-black text-amber-300/80 tabular-nums">{s.n}</span>
                </div>
                <h3 className="text-lg font-bold">{s.t}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech section */}
      <section id="tech" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] font-bold mb-3 text-sun">প্রযুক্তি স্ট্যাক</p>
            <h2 className="text-3xl sm:text-5xl font-bangla font-extrabold tracking-tight leading-tight">
              Master–Slave <span className="text-rainbow">IoT আর্কিটেকচার</span>
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              একটি ESP32 মাস্টার নোড পাম্প হাউস পরিচালনা করে — flow, pressure, tank level। মাঠে একাধিক ESP8266 sub-node মাটির আদ্রতা, LDR ও ভাল্ভ নিয়ন্ত্রণ করে। সব কিছু WiFi/HTTP দিয়ে cloud panel-এ লাইভ সংযুক্ত।
            </p>
            <ul className="mt-6 space-y-2.5">
              {[
                { i: Cpu, t: "ESP32 মাস্টার + ESP8266 সাব-নোড", c: "from-amber-400 to-orange-500" },
                { i: Activity, t: "রিয়েল-টাইম telemetry (প্রতি ৫ সেকেন্ডে)", c: "from-sky-400 to-blue-500" },
                { i: MapPin, t: "GPS-ভিত্তিক জোন ম্যাপিং", c: "from-rose-400 to-pink-500" },
                { i: Sparkles, t: "Lovable AI Gateway দিয়ে বাংলা পরামর্শ", c: "from-violet-500 to-fuchsia-500" },
              ].map((x) => (
                <li key={x.t} className="flex items-center gap-3 text-sm font-medium">
                  <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${x.c} grid place-items-center shrink-0 shadow-md`}>
                    <x.i className="h-4 w-4 text-white" />
                  </div>
                  {x.t}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="rounded-3xl p-[2px] bg-gradient-to-br from-amber-400 via-emerald-400 to-sky-500 shadow-2xl shadow-emerald-500/20">
              <div className="rounded-[22px] bg-white/95 backdrop-blur p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-amber-300/40 blur-2xl" />
                <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-emerald-300/40 blur-2xl" />
                <div className="space-y-4 relative">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 grid place-items-center shadow"><Cpu className="h-5 w-5 text-white" /></div>
                      <div className="min-w-0"><p className="font-bold text-sm truncate">ESP32 Master</p><p className="text-[10px] text-muted-foreground truncate">পাম্প হাউস</p></div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md shrink-0">ONLINE</span>
                  </div>
                  <div className="pl-6 border-l-2 border-dashed border-emerald-400/60 space-y-2">
                    {[
                      { n: "Sub-Node ১ · ধান জোন", c: "from-emerald-400 to-teal-500" },
                      { n: "Sub-Node ২ · গম জোন", c: "from-amber-400 to-yellow-500" },
                      { n: "Sub-Node ৩ · সবজি জোন", c: "from-rose-400 to-pink-500" },
                    ].map((n) => (
                      <div key={n.n} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-border/60 shadow-sm">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`h-6 w-6 shrink-0 rounded-md bg-gradient-to-br ${n.c} grid place-items-center`}><Zap className="h-3 w-3 text-white" /></span>
                          <span className="text-xs font-semibold truncate">{n.n}</span>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-bold shrink-0">● LIVE</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial / About */}
      <section id="about" className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl p-[2px] bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 shadow-2xl shadow-orange-500/20">
          <div className="rounded-[22px] bg-gradient-to-br from-white via-amber-50/60 to-emerald-50/40 p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-amber-300/30 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-300/30 blur-3xl rounded-full translate-x-1/2 translate-y-1/2" />
            <div className="relative">
              <div className="inline-flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-xs uppercase tracking-[0.2em] font-bold mb-3 text-sun">প্রকল্প সম্পর্কে</p>
              <h2 className="text-3xl sm:text-5xl font-bangla font-extrabold tracking-tight leading-tight">
                বরেন্দ্র অঞ্চলে <span className="text-rainbow">পানির সুষম ব্যবহার</span>
              </h2>
              <p className="mt-5 text-muted-foreground text-sm sm:text-base leading-relaxed max-w-3xl mx-auto">
                BMDA স্মার্ট সেচ প্ল্যাটফর্ম বরেন্দ্র বহুমুখী উন্নয়ন কর্তৃপক্ষের কৃষি অবকাঠামোকে আধুনিকীকরণের একটি উদ্যোগ।
                এটি IoT, কৃত্রিম বুদ্ধিমত্তা ও স্যাটেলাইট ডেটা একত্রিত করে কৃষকদের জন্য জল সাশ্রয়, ফসলের উৎপাদন বৃদ্ধি ও পরিচালনার ব্যয় কমানোর সমাধান প্রদান করে।
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                {["Water-saving", "AI-driven", "Government-backed", "Made in BD"].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-white/80 border border-amber-300/60 text-xs font-bold text-amber-900 shadow-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {t}
                  </span>
                ))}
              </div>
              <div className="mt-8">
                <Link to="/auth" className="h-12 px-8 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white font-bold text-sm shadow-xl shadow-orange-500/40 hover:shadow-2xl hover:scale-[1.03] transition inline-flex items-center gap-2">
                  এখনই Panel-এ প্রবেশ করুন <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8 text-center text-xs text-muted-foreground px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <span className="inline-flex items-center gap-1.5"><Leaf className="h-3.5 w-3.5 text-emerald-600" /> পরিবেশবান্ধব কৃষি</span>
          <span className="hidden sm:inline">·</span>
          <span>© {new Date().getFullYear()} বরেন্দ্র বহুমুখী উন্নয়ন কর্তৃপক্ষ · BMDA স্মার্ট সেচ প্ল্যাটফর্ম</span>
        </div>
      </footer>
    </div>
  );
}
