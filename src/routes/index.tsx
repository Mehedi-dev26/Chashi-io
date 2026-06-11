import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sprout, ArrowRight, Cpu, Droplets, Gauge, Sparkles, ShieldCheck,
  Activity, Satellite, CircuitBoard, ChevronRight, MapPin, Brain, Zap,
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
  { icon: Droplets, title: "জোন-ভিত্তিক সেচ", desc: "৭+ জোনের ভাল্ভ ও পানি প্রবাহ স্মার্টফোন থেকে নিয়ন্ত্রণ।" },
  { icon: Gauge, title: "মোটর অটোমেশন", desc: "চাপ, ভোল্টেজ, কারেন্ট মনিটরিং সহ স্বয়ংক্রিয় shutoff।" },
  { icon: Brain, title: "AI পরামর্শ", desc: "মাটি, আবহাওয়া ও ফসল অনুযায়ী বুদ্ধিমান সেচ সুপারিশ।" },
  { icon: Satellite, title: "NDVI স্যাটেলাইট", desc: "Sentinel-2 ডেটায় ফসলের স্বাস্থ্য ও জলের প্রয়োজন বিশ্লেষণ।" },
  { icon: CircuitBoard, title: "Master-Slave Hardware", desc: "ESP32 মাস্টার + একাধিক ESP8266 sub-node দিয়ে স্কেলেবল।" },
  { icon: ShieldCheck, title: "Role-Based Security", desc: "Admin, Operator, Viewer — প্রত্যেকের জন্য নিরাপদ access।" },
];

const stats = [
  { v: "৩২.৬", u: "হেক্টর কভারেজ" },
  { v: "৪০%", u: "জল সাশ্রয়" },
  { v: "২৪/৭", u: "রিয়েল-টাইম মনিটরিং" },
  { v: "৭+", u: "সক্রিয় জোন" },
];

function Landing() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-chart-2 grid place-items-center shadow-lg">
              <Sprout className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <p className="font-black text-sm">BMDA স্মার্ট সেচ</p>
              <p className="text-[10px] text-muted-foreground">বরেন্দ্র · IoT v২.৬</p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition">বৈশিষ্ট্য</a>
            <a href="#tech" className="text-muted-foreground hover:text-foreground transition">প্রযুক্তি</a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition">প্রকল্প</a>
          </nav>
          <Link to="/auth" className="h-10 px-5 rounded-xl bg-gradient-to-r from-primary to-chart-2 text-primary-foreground text-sm font-bold inline-flex items-center gap-1.5 shadow-lg hover:shadow-xl transition">
            লগ ইন <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30 -z-10" />
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/20 blur-3xl rounded-full -z-10" />
        <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-chart-2/20 blur-3xl rounded-full -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 h-8 rounded-full bg-primary/10 border border-primary/30 text-xs font-semibold text-primary mb-6">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-60" />
              <span className="relative rounded-full h-2 w-2 bg-primary" />
            </span>
            বরেন্দ্র অঞ্চলের জন্য পরবর্তী-প্রজন্মের কৃষি প্ল্যাটফর্ম
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.05] max-w-5xl mx-auto">
            <span className="text-foreground">বুদ্ধিমান সেচ,</span><br />
            <span className="text-gradient">সমৃদ্ধ কৃষক।</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            ESP32/ESP8266-চালিত IoT সেন্সর নেটওয়ার্ক, AI সিদ্ধান্ত-সহায়তা ও স্যাটেলাইট বিশ্লেষণ —
            বরেন্দ্র বহুমুখী উন্নয়ন কর্তৃপক্ষের জন্য নির্মিত পেশাদার স্মার্ট ইরিগেশন প্ল্যাটফর্ম।
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth" className="h-12 px-7 rounded-xl bg-gradient-to-r from-primary to-chart-2 text-primary-foreground font-bold text-sm shadow-xl hover:shadow-2xl transition inline-flex items-center gap-2">
              Main Panel-এ প্রবেশ করুন <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#features" className="h-12 px-6 rounded-xl border border-border bg-background/60 backdrop-blur font-semibold text-sm inline-flex items-center gap-2 hover:bg-secondary transition">
              আরও জানুন <ChevronRight className="h-4 w-4" />
            </a>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {stats.map((s) => (
              <div key={s.u} className="glass-panel rounded-2xl p-4">
                <p className="text-3xl sm:text-4xl font-black text-gradient tabular-nums">{s.v}</p>
                <p className="text-[11px] text-muted-foreground font-medium mt-1">{s.u}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold mb-3">প্ল্যাটফর্মের বৈশিষ্ট্য</p>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            যা যা <span className="text-gradient">প্রয়োজন</span>, একসাথে।
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            সেচ, মোটর, সেন্সর, AI, স্যাটেলাইট — সমস্ত কিছু একটি বুদ্ধিমান কেন্দ্রীয় প্যানেল থেকে।
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="glass-card rounded-2xl p-6 hover-lift group">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-chart-2 grid place-items-center shadow-lg mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-bold tracking-tight">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech section */}
      <section id="tech" className="py-20 sm:py-24 bg-gradient-to-b from-transparent via-secondary/30 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold mb-3">প্রযুক্তি স্ট্যাক</p>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Master–Slave <span className="text-gradient">IoT আর্কিটেকচার</span>
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              একটি ESP32 মাস্টার নোড পাম্প হাউস পরিচালনা করে — flow, pressure, tank level। মাঠে একাধিক ESP8266 sub-node মাটির আদ্রতা, LDR ও ভাল্ভ নিয়ন্ত্রণ করে। সব কিছু WiFi/HTTP দিয়ে cloud panel-এ লাইভ সংযুক্ত।
            </p>
            <ul className="mt-6 space-y-2.5">
              {[
                { i: Cpu, t: "ESP32 মাস্টার + ESP8266 সাব-নোড" },
                { i: Activity, t: "রিয়েল-টাইম telemetry (প্রতি ৫ সেকেন্ডে)" },
                { i: MapPin, t: "GPS-ভিত্তিক জোন ম্যাপিং" },
                { i: Sparkles, t: "Lovable AI Gateway দিয়ে বাংলা পরামর্শ" },
              ].map((x) => (
                <li key={x.t} className="flex items-center gap-3 text-sm font-medium">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/30 grid place-items-center shrink-0">
                    <x.i className="h-4 w-4 text-primary" />
                  </div>
                  {x.t}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="glass-card rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/20 blur-2xl" />
              <div className="space-y-4 relative">
                <div className="flex items-center justify-between p-3 rounded-xl bg-background/60 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 grid place-items-center"><Cpu className="h-5 w-5 text-primary-foreground" /></div>
                    <div><p className="font-bold text-sm">ESP32 Master</p><p className="text-[10px] text-muted-foreground">পাম্প হাউস</p></div>
                  </div>
                  <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-1 rounded-md">ONLINE</span>
                </div>
                <div className="pl-6 border-l-2 border-dashed border-primary/30 space-y-2">
                  {["Sub-Node ১ · ধান জোন", "Sub-Node ২ · গম জোন", "Sub-Node ৩ · সবজি জোন"].map((n) => (
                    <div key={n} className="flex items-center justify-between p-2.5 rounded-lg bg-background/40 border border-border/50">
                      <div className="flex items-center gap-2.5"><Zap className="h-3.5 w-3.5 text-chart-2" /><span className="text-xs font-semibold">{n}</span></div>
                      <span className="text-[10px] text-success font-bold">●</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold mb-3">প্রকল্প সম্পর্কে</p>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
          বরেন্দ্র অঞ্চলে <span className="text-gradient">পানির সুষম ব্যবহার</span>
        </h2>
        <p className="mt-5 text-muted-foreground text-sm sm:text-base leading-relaxed max-w-3xl mx-auto">
          BMDA স্মার্ট সেচ প্ল্যাটফর্ম বরেন্দ্র বহুমুখী উন্নয়ন কর্তৃপক্ষের কৃষি অবকাঠামোকে আধুনিকীকরণের একটি উদ্যোগ।
          এটি IoT, কৃত্রিম বুদ্ধিমত্তা ও স্যাটেলাইট ডেটা একত্রিত করে কৃষকদের জন্য জল সাশ্রয়, ফসলের উৎপাদন বৃদ্ধি ও পরিচালনার ব্যয় কমানোর সমাধান প্রদান করে।
        </p>
        <div className="mt-8">
          <Link to="/auth" className="h-12 px-7 rounded-xl bg-gradient-to-r from-primary to-chart-2 text-primary-foreground font-bold text-sm shadow-xl hover:shadow-2xl transition inline-flex items-center gap-2">
            এখনই Panel-এ প্রবেশ করুন <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} বরেন্দ্র বহুমুখী উন্নয়ন কর্তৃপক্ষ · BMDA স্মার্ট সেচ প্ল্যাটফর্ম
      </footer>
    </div>
  );
}
