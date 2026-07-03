import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sprout, ArrowRight, Cpu, Droplets, Gauge, Sparkles, ShieldCheck,
  Activity, Satellite, CircuitBoard, ChevronRight, MapPin, Brain, Zap,
  Sun, CloudRain, Leaf, BarChart3, Wifi, Star, CheckCircle2, PlayCircle,
  Rocket, Radio, Smartphone, Lightbulb, Clock, CircleCheck,
} from "lucide-react";
import heroBg from "@/assets/hero-barind-morning.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chashi.io · স্মার্ট সেচ ব্যবস্থাপনা" },
      { name: "description", content: "Chashi.io — বরেন্দ্র অঞ্চলের জন্য IoT-চালিত স্মার্ট সেচ ব্যবস্থাপনা প্ল্যাটফর্ম।" },
      { property: "og:title", content: "Chashi.io · স্মার্ট সেচ ব্যবস্থাপনা" },
      { property: "og:description", content: "জল সাশ্রয়, ফসলের উৎপাদন বৃদ্ধি ও কৃষকের জন্য বুদ্ধিমান সিদ্ধান্ত — সব এক প্ল্যাটফর্মে।" },
    ],
  }),
  component: Landing,
});

const benefits = [
  { icon: Droplets, title: "৪০% জল সাশ্রয়", desc: "মাটির আর্দ্রতা ও আবহাওয়া দেখে শুধু প্রয়োজনের সময়ই সেচ — অপচয় বন্ধ, ভূগর্ভস্থ পানি রক্ষা।", tint: "from-sky-400 to-cyan-500" },
  { icon: Sprout, title: "ফসলের উৎপাদন বৃদ্ধি", desc: "সঠিক সময়ে সঠিক পরিমাণ পানি — ধান, গম ও সবজির ফলন ১৫–২৫% পর্যন্ত বেশি।", tint: "from-emerald-400 to-green-600" },
  { icon: Zap, title: "বিদ্যুৎ ও জ্বালানি সাশ্রয়", desc: "স্বয়ংক্রিয় মোটর shutoff ও শিডিউলিংয়ের ফলে বিদ্যুৎ বিল ৩০%+ কমে যায়।", tint: "from-amber-400 to-orange-500" },
  { icon: Brain, title: "বুদ্ধিমান সিদ্ধান্ত", desc: "AI বাংলায় বলে দেয় কখন, কোন জোনে কতটুকু সেচ দরকার — অভিজ্ঞতার উপর নির্ভরতা কমে।", tint: "from-violet-500 to-fuchsia-500" },
  { icon: Activity, title: "শ্রম ও সময় সাশ্রয়", desc: "মাঠে না গিয়ে মোবাইল থেকেই ভাল্ভ, পাম্প ও সেচ নিয়ন্ত্রণ — দৈনিক ২–৩ ঘণ্টা বাঁচে।", tint: "from-rose-400 to-pink-600" },
  { icon: Leaf, title: "টেকসই ও পরিবেশ-বান্ধব", desc: "কম পানি, কম বিদ্যুৎ, কম কার্বন — জলবায়ু পরিবর্তনের যুগে দায়িত্বশীল কৃষি।", tint: "from-lime-400 to-emerald-500" },
  { icon: BarChart3, title: "ডেটা-ভিত্তিক পরিকল্পনা", desc: "প্রতিটি জোনের সেচ, ফলন ও খরচের ইতিহাস — ভবিষ্যতের পরিকল্পনা আরও নির্ভুল।", tint: "from-indigo-400 to-blue-600" },
  { icon: ShieldCheck, title: "খরা ও ফসল-ক্ষতি প্রতিরোধ", desc: "রিয়েল-টাইম alert ও পূর্বাভাসে আগেই সতর্ক — খরা, অতিবৃষ্টি বা যন্ত্র-বিকলে ফসল বাঁচে।", tint: "from-yellow-400 to-amber-600" },
  { icon: CheckCircle2, title: "কৃষকের আর্থিক লাভ", desc: "কম খরচ + বেশি ফলন = হেক্টর প্রতি ২৫,০০০+ টাকা অতিরিক্ত আয়ের সম্ভাবনা।", tint: "from-teal-400 to-cyan-600" },
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
              <p className="text-sm truncate"><span className="brand-chashi">Chashi</span><span className="brand-chashi-dot">.</span><span className="brand-chashi">io</span></p>
              <p className="text-[10px] text-muted-foreground truncate">স্মার্ট সেচ ব্যবস্থাপনা</p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition">বৈশিষ্ট্য</a>
            <a href="#how" className="text-muted-foreground hover:text-foreground transition">কীভাবে কাজ করে</a>
            <a href="#tech" className="text-muted-foreground hover:text-foreground transition">প্রযুক্তি</a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition">প্রকল্প</a>
          </nav>
          <Link to="/auth" className="h-10 px-4 sm:px-5 shrink-0 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white text-sm font-bold inline-flex items-center gap-1.5 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:scale-[1.02] transition">
            মেইন প্যানেল Access <ArrowRight className="h-3.5 w-3.5" />
          </Link>

        </div>
      </header>

      {/* Hero — Barind morning landscape (image only behind title + buttons) */}
      <section className="relative overflow-hidden isolate">
        {/* Background image — crystal clear, minimal darkening */}
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        {/* Very light overlay — just enough for text contrast at top/bottom */}
        <div className="absolute inset-x-0 top-0 h-40 -z-10 bg-gradient-to-b from-black/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-52 -z-10 bg-gradient-to-t from-black/35 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 sm:pt-24 pb-16 sm:pb-24 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-xs font-semibold text-white mb-6 shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-amber-300 animate-ping opacity-70" />
              <span className="relative rounded-full h-2 w-2 bg-amber-300" />
            </span>
            বরেন্দ্র অঞ্চলের জন্য পরবর্তী-প্রজন্মের কৃষি প্ল্যাটফর্ম
            <Sun className="h-3.5 w-3.5 text-amber-300" />
          </div>

          <h1 className="font-bangla text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] max-w-5xl mx-auto drop-shadow-[0_4px_18px_rgba(0,0,0,0.65)]">
            <span className="brand-chashi">Chashi</span><span className="brand-chashi-dot">.</span><span className="brand-chashi">io</span><br />
            <span className="text-white">স্মার্ট সেচ </span><span className="text-sun">ব্যবস্থাপনা।</span>
          </h1>
          <p className="mt-5 sm:mt-6 text-sm sm:text-lg text-white max-w-2xl mx-auto leading-relaxed px-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] font-medium">
            ESP32/ESP8266-চালিত IoT সেন্সর নেটওয়ার্ক, AI সিদ্ধান্ত-সহায়তা ও স্যাটেলাইট বিশ্লেষণ —
            বরেন্দ্র বহুমুখী উন্নয়ন কর্তৃপক্ষের জন্য নির্মিত পেশাদার স্মার্ট ইরিগেশন প্ল্যাটফর্ম।
          </p>

          <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3 px-4 sm:px-0">
            <Link to="/auth" className="h-12 px-7 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white font-bold text-sm shadow-xl shadow-orange-900/40 hover:shadow-2xl hover:scale-[1.02] transition inline-flex items-center justify-center gap-2">
              Main Panel-এ প্রবেশ করুন <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#features" className="h-12 px-6 rounded-xl border-2 border-white/60 bg-white/15 backdrop-blur-md font-semibold text-sm inline-flex items-center justify-center gap-2 hover:bg-white/25 hover:border-white/80 transition text-white">
              <PlayCircle className="h-4 w-4" /> ডেমো দেখুন
            </a>
          </div>

          {/* Trust strip */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white">
            {["✅ Government-grade security", "🌱 Eco-friendly", "⚡ Real-time", "🇧🇩 বাংলায় তৈরি"].map((t) => (
              <span key={t} className="font-semibold drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats — separate clean section (no background image) */}
      <section className="relative bg-background py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((s) => (
            <div key={s.u} className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 text-center bg-gradient-to-br ${s.c} shadow-xl ring-1 ring-white/25 hover:scale-[1.04] hover:-translate-y-1 transition-transform duration-300`}>
              <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-white/25 blur-xl" />
              <div className="absolute -bottom-8 -left-6 h-16 w-16 rounded-full bg-white/15 blur-lg" />
              <p className="relative font-bangla text-3xl sm:text-4xl font-extrabold tabular-nums text-white drop-shadow">{s.v}</p>
              <p className="relative font-bangla text-[11px] sm:text-xs text-white/95 font-semibold mt-1.5 uppercase tracking-wider">{s.u}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits — why this system matters */}
      <section id="features" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-xs uppercase tracking-[0.2em] font-bold mb-3 text-sun">এই সিস্টেমের উপকারিতা</p>
          <h2 className="text-3xl sm:text-5xl font-bangla font-extrabold tracking-tight">
            আমাদের এই সিস্টেম ব্যবহারে <span className="text-rainbow">কী কী উপকারিতা</span>?
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            শুধু প্রযুক্তি নয় — জল, বিদ্যুৎ, সময় ও অর্থের সাশ্রয় সহ ফলন বৃদ্ধি ও টেকসই কৃষি।
            চাষি.io ব্যবহারে যা যা লাভ:
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {benefits.map((f) => (
            <div
              key={f.title}
              className={`group relative overflow-hidden rounded-2xl p-4 sm:p-7 text-white bg-gradient-to-br ${f.tint} shadow-xl hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300`}
            >
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/20 blur-2xl group-hover:scale-125 transition-transform duration-500" />
              <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-white/25 backdrop-blur grid place-items-center shadow-lg mb-5 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  <f.icon className="h-6 w-6 text-white drop-shadow" />
                </div>
                <h3 className="font-bangla text-xl font-bold tracking-tight text-white">{f.title}</h3>
                <p className="text-sm text-white/95 mt-2 leading-relaxed">{f.desc}</p>
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
              এই IoT প্রকল্পের <span className="text-rainbow">আর্কিটেকচার</span>
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              একটি ESP32 মাস্টার নোড পাম্প হাউস পরিচালনা করে — flow, pressure, tank level। মাঠে একাধিক ESP8266 sub-node মাটির আদ্রতা, LDR ও ভাল্ভ নিয়ন্ত্রণ করে। সব কিছু WiFi/HTTP দিয়ে cloud panel-এ লাইভ সংযুক্ত।
            </p>
            <ul className="mt-6 space-y-2.5">
              {[
                { i: Cpu, t: "ESP32 মাস্টার + ESP8266 সাব-নোড", c: "from-amber-400 to-orange-500" },
                { i: Activity, t: "রিয়েল-টাইম telemetry (প্রতি ৫ সেকেন্ডে)", c: "from-sky-400 to-blue-500" },
                { i: MapPin, t: "GPS-ভিত্তিক জোন ম্যাপিং", c: "from-rose-400 to-pink-500" },
                { i: Sparkles, t: "Artificial Intelligence Gateway দিয়ে বাংলা পরামর্শ", c: "from-violet-500 to-fuchsia-500" },
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

      {/* Future Plans / Roadmap */}
      <section id="roadmap" className="py-16 sm:py-24 bg-gradient-to-b from-emerald-50/40 via-white to-amber-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-xs uppercase tracking-[0.2em] font-bold mb-3 text-sun">রোডম্যাপ</p>
            <h2 className="text-3xl sm:text-5xl font-bangla font-extrabold tracking-tight">
              আমাদের <span className="text-rainbow">ভবিষ্যৎ পরিকল্পনা</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-3xl mx-auto text-sm sm:text-base">
              BMDA (বরেন্দ্র বহুমুখী উন্নয়ন কর্তৃপক্ষ)-এর চলমান সেচ প্রকল্পগুলোকে আরও স্মার্ট, আধুনিক ও ডেটা-চালিত করা —
              LoRa দীর্ঘ-দূরত্ব যোগাযোগ, AI ভিত্তিক পানি বরাদ্দ এবং কৃষকের হাতে বাংলা মোবাইল অ্যাপ।
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {[
              { icon: Radio, title: "LoRa/LoRaWAN নেটওয়ার্ক", desc: "দূরবর্তী মাঠে low-power দীর্ঘ-দূরত্ব সংযোগ — WiFi ছাড়াই সেন্সর ডেটা।", badge: "চলমান", tint: "from-emerald-500 to-teal-600", badgeCls: "bg-amber-100 text-amber-700" },
              { icon: Satellite, title: "BMDA সেচ প্রকল্প আধুনিকীকরণ", desc: "চলমান deep tube-well ও পাম্প হাউসগুলোকে IoT-চালিত স্মার্ট সিস্টেমে রূপান্তর।", badge: "চলমান", tint: "from-sky-500 to-blue-600", badgeCls: "bg-amber-100 text-amber-700" },
              { icon: Brain, title: "AI পানি বরাদ্দ ইঞ্জিন", desc: "ফসল, আবহাওয়া ও মাটির অবস্থা বিশ্লেষণ করে স্বয়ংক্রিয় সেচ সময়সূচি।", badge: "চলমান", tint: "from-violet-500 to-purple-600", badgeCls: "bg-amber-100 text-amber-700" },
              { icon: Smartphone, title: "কৃষকের বাংলা মোবাইল অ্যাপ", desc: "SMS + অ্যাপ notification, ভয়েস কমান্ড ও সহজ বাংলা ড্যাশবোর্ড।", badge: "পরিকল্পিত", tint: "from-cyan-500 to-sky-600", badgeCls: "bg-sky-100 text-sky-700" },
              { icon: Leaf, title: "ড্রোন ও স্যাটেলাইট NDVI", desc: "ফসলের স্বাস্থ্য পর্যবেক্ষণ ও সমস্যা এলাকা চিহ্নিতকরণ।", badge: "পরিকল্পিত", tint: "from-lime-500 to-emerald-600", badgeCls: "bg-sky-100 text-sky-700" },
              { icon: ShieldCheck, title: "ব্লকচেইন পানি ব্যবহার লগ", desc: "স্বচ্ছ ও জবাবদিহিমূলক অপরিবর্তনীয় বিতরণ রেকর্ড।", badge: "গবেষণা", tint: "from-amber-500 to-orange-600", badgeCls: "bg-sky-100 text-sky-700" },
            ].map((it) => (
              <div key={it.title} className="group relative overflow-hidden rounded-2xl p-4 sm:p-6 bg-white border border-border/60 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className={`absolute -top-10 -right-10 h-28 w-28 rounded-full bg-gradient-to-br ${it.tint} opacity-15 blur-2xl group-hover:opacity-30 transition-opacity`} />
                <div className="relative">
                  <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br ${it.tint} grid place-items-center shadow-md mb-3 sm:mb-4`}>
                    <it.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-bangla text-sm sm:text-lg font-bold tracking-tight leading-snug">{it.title}</h3>
                  </div>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mb-2 ${it.badgeCls}`}>{it.badge}</span>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{it.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 sm:mt-14 rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xl relative overflow-hidden">
            <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-amber-400/30 blur-3xl" />
            <div className="relative flex items-start gap-4 flex-wrap">
              <div className="h-12 w-12 shrink-0 rounded-2xl bg-white/20 backdrop-blur grid place-items-center">
                <Rocket className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bangla text-xl sm:text-2xl font-bold mb-2">দীর্ঘমেয়াদী লক্ষ্য</h3>
                <p className="text-sm sm:text-base text-white/90 leading-relaxed">
                  বাংলাদেশের বরেন্দ্র অঞ্চলের প্রতিটি BMDA deep tube-well ও সেচ প্রকল্পকে একটি ইউনিফায়েড IoT + AI প্ল্যাটফর্মে যুক্ত করে
                  কৃষকদের জন্য জল সাশ্রয়, উৎপাদন বৃদ্ধি ও টেকসই কৃষি নিশ্চিত করা।
                </p>
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
                বরেন্দ্র অঞ্চলে <span className="text-rainbow">কৃষি পানির সুষম ব্যবহার</span>
              </h2>
              <p className="mt-5 text-muted-foreground text-sm sm:text-base leading-relaxed max-w-3xl mx-auto">
                Chashi.io প্ল্যাটফর্ম বরেন্দ্র বহুমুখী উন্নয়ন কর্তৃপক্ষের কৃষি অবকাঠামোকে আধুনিকীকরণের একটি উদ্যোগ।
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
          <span>© {new Date().getFullYear()} বরেন্দ্র বহুমুখী উন্নয়ন কর্তৃপক্ষ · Chashi.io প্ল্যাটফর্ম</span>
        </div>
      </footer>
    </div>
  );
}
