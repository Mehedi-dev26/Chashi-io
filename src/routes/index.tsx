import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sprout, ArrowRight, Droplets, Gauge, Sparkles, ShieldCheck,
  Satellite, CircuitBoard, Brain, Wifi,
  CheckCircle2, PlayCircle, Award, TrendingUp, Leaf,
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

function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Nav />
      <Hero />
      <BentoFeatures />
      <Architecture />
      <Workflow />
      <CTA />
      <Footer />
    </div>
  );
}

/* ------------------------------- NAV ------------------------------- */
function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-emerald-gold shadow-gold">
            <Sprout className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate font-display text-base text-foreground sm:text-lg">BMDA স্মার্ট সেচ</div>
            <div className="hidden text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:block">Barind Smart Irrigation</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">বৈশিষ্ট্য</a>
          <a href="#architecture" className="transition-colors hover:text-foreground">আর্কিটেকচার</a>
          <a href="#how" className="transition-colors hover:text-foreground">কীভাবে কাজ করে</a>
        </nav>
        <Link
          to="/auth"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant transition-transform hover:scale-[1.03]"
        >
          লগ ইন <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}

/* ------------------------------- HERO ------------------------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero text-white">
      <div className="absolute inset-0 grid-bg-gold opacity-40" />
      <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-emerald-rich/30 blur-3xl animate-float" />
      <div className="absolute -right-24 bottom-0 h-[28rem] w-[28rem] rounded-full bg-gold/25 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 sm:pt-20 lg:pt-28">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.22em] text-gold-soft backdrop-blur">
            <Award className="h-3.5 w-3.5" /> বরেন্দ্র · IoT v২.৬
          </span>

          <h1 className="mt-7 font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            বুদ্ধিমান সেচে
            <br />
            <span className="text-gradient-gold italic">সমৃদ্ধ কৃষক।</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
            ESP32 ও ESP8266-চালিত IoT সেন্সর নেটওয়ার্ক, AI সিদ্ধান্ত-সহায়তা ও স্যাটেলাইট বিশ্লেষণ —
            বরেন্দ্র বহুমুখী উন্নয়ন কর্তৃপক্ষের জন্য নির্মিত পেশাদার স্মার্ট ইরিগেশন প্ল্যাটফর্ম।
          </p>

          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              to="/auth"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-gold px-7 py-3.5 text-sm font-semibold text-emerald-deep shadow-gold transition-transform hover:scale-[1.04]"
            >
              Main Panel-এ প্রবেশ করুন
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/10"
            >
              <PlayCircle className="h-4 w-4" /> ডেমো দেখুন
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/60">
            <Badge>Government-grade Security</Badge>
            <Badge>Eco-friendly</Badge>
            <Badge>Real-time</Badge>
            <Badge>বাংলায় তৈরি 🇧🇩</Badge>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {[
            { v: "৩২.৬", u: "হেক্টর কভারেজ" },
            { v: "৪০%", u: "জল সাশ্রয়" },
            { v: "২৪/৭", u: "মনিটরিং" },
            { v: "৭+", u: "সক্রিয় জোন" },
          ].map((s) => (
            <div key={s.u} className="glass-dark rounded-2xl px-4 py-5 text-center">
              <div className="font-display text-3xl text-gold-soft sm:text-4xl">{s.v}</div>
              <div className="mt-1 text-[11px] uppercase tracking-wider text-white/65">{s.u}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <CheckCircle2 className="h-3.5 w-3.5 text-gold" /> {children}
    </span>
  );
}

/* ---------------------------- BENTO FEATURES ---------------------------- */
function BentoFeatures() {
  return (
    <section id="features" className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <SectionHeader
        eyebrow="প্ল্যাটফর্মের বৈশিষ্ট্য"
        title={<>যা যা প্রয়োজন, <span className="text-gradient-prestige italic">একসাথে।</span></>}
        subtitle="সেচ, মোটর, সেন্সর, AI, স্যাটেলাইট — সমস্ত কিছু একটি বুদ্ধিমান কেন্দ্রীয় প্যানেল থেকে।"
      />

      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6 lg:auto-rows-[12rem]">
        {/* Big: AI advisor */}
        <article className="group relative overflow-hidden rounded-3xl bg-gradient-emerald-gold p-7 text-white shadow-deep hover-lift sm:col-span-2 lg:col-span-3 lg:row-span-2">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gold/30 blur-3xl" />
          <div className="relative flex h-full flex-col justify-between gap-6">
            <div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <Brain className="h-6 w-6 text-gold-soft" />
              </div>
              <h3 className="mt-5 font-display text-3xl leading-tight sm:text-4xl">AI পরামর্শ ইঞ্জিন</h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/80">
                মাটি, আবহাওয়া, NDVI ও ফসলের জাত অনুযায়ী বাংলায় বুদ্ধিমান সেচ সুপারিশ —
                Lovable AI Gateway দ্বারা চালিত।
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/70">
              <span className="rounded-full bg-white/10 px-3 py-1">Gemini 2.5</span>
              <span className="rounded-full bg-white/10 px-3 py-1">বাংলা NLG</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Sentinel-2</span>
            </div>
          </div>
        </article>

        {/* Zone irrigation */}
        <BentoCard
          icon={<Droplets className="h-5 w-5" />}
          title="জোন-ভিত্তিক সেচ"
          desc="৭+ জোনের ভাল্ভ ও পানি প্রবাহ স্মার্টফোন থেকে নিয়ন্ত্রণ।"
          tone="emerald"
          className="lg:col-span-3"
        />

        {/* Motor automation */}
        <BentoCard
          icon={<Gauge className="h-5 w-5" />}
          title="মোটর অটোমেশন"
          desc="চাপ, ভোল্টেজ ও কারেন্ট মনিটরিং সহ স্বয়ংক্রিয় shutoff।"
          tone="gold"
          className="lg:col-span-2"
        />

        {/* NDVI */}
        <BentoCard
          icon={<Satellite className="h-5 w-5" />}
          title="NDVI স্যাটেলাইট"
          desc="Sentinel-2 ডেটায় ফসলের স্বাস্থ্য বিশ্লেষণ।"
          tone="cream"
          className="lg:col-span-1"
        />

        {/* Master-Slave */}
        <BentoCard
          icon={<CircuitBoard className="h-5 w-5" />}
          title="Master-Slave Hardware"
          desc="ESP32 মাস্টার + একাধিক ESP8266 sub-node — সম্পূর্ণ স্কেলেবল IoT mesh।"
          tone="dark"
          className="sm:col-span-2 lg:col-span-4"
        />

        {/* Security */}
        <BentoCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Role-Based Security"
          desc="Admin · Operator · Viewer — RLS সুরক্ষিত।"
          tone="gold"
          className="lg:col-span-2"
        />
      </div>
    </section>
  );
}

type Tone = "emerald" | "gold" | "cream" | "dark";
function BentoCard({
  icon, title, desc, tone, className = "",
}: {
  icon: React.ReactNode; title: string; desc: string; tone: Tone; className?: string;
}) {
  const toneCx: Record<Tone, string> = {
    emerald: "bg-white border border-border/60 text-foreground",
    gold: "bg-gradient-card-gold border border-gold/30 text-foreground",
    cream: "bg-secondary border border-border/60 text-foreground",
    dark: "bg-emerald-deep text-white border border-emerald-rich/40",
  };
  const iconCx: Record<Tone, string> = {
    emerald: "bg-primary/10 text-primary",
    gold: "bg-emerald-deep text-gold-soft",
    cream: "bg-primary/10 text-primary",
    dark: "bg-gold/20 text-gold-soft",
  };
  return (
    <article className={`group relative overflow-hidden rounded-3xl p-6 shadow-elegant hover-lift ${toneCx[tone]} ${className}`}>
      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${iconCx[tone]}`}>{icon}</div>
      <h3 className="mt-4 font-display text-xl leading-tight sm:text-2xl">{title}</h3>
      <p className={`mt-2 text-sm leading-relaxed ${tone === "dark" ? "text-white/75" : "text-muted-foreground"}`}>{desc}</p>
    </article>
  );
}

/* ---------------------------- ARCHITECTURE ---------------------------- */
function Architecture() {
  return (
    <section id="architecture" className="relative overflow-hidden bg-emerald-deep text-white">
      <div className="absolute inset-0 grid-bg-gold opacity-30" />
      <div className="absolute -right-20 top-20 h-80 w-80 rounded-full bg-gold/20 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-soft">প্রযুক্তি স্ট্যাক</span>
            <h2 className="mt-3 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
              Master–Slave <span className="text-gradient-gold italic">IoT</span><br />আর্কিটেকচার
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/75">
              একটি ESP32 মাস্টার নোড পাম্প হাউস পরিচালনা করে — flow, pressure, tank level।
              মাঠে একাধিক ESP8266 sub-node মাটির আদ্রতা, LDR ও ভাল্ভ নিয়ন্ত্রণ করে।
              সব কিছু WiFi/HTTP দিয়ে cloud panel-এ লাইভ সংযুক্ত।
            </p>
            <ul className="mt-7 space-y-3 text-sm text-white/80">
              {[
                { i: CircuitBoard, t: "ESP32 মাস্টার + ESP8266 সাব-নোড" },
                { i: TrendingUp, t: "রিয়েল-টাইম telemetry (প্রতি ৫ সেকেন্ডে)" },
                { i: Globe2, t: "GPS-ভিত্তিক জোন ম্যাপিং" },
                { i: Sparkles, t: "Lovable AI Gateway দিয়ে বাংলা পরামর্শ" },
              ].map(({ i: Icon, t }) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gold/15 text-gold-soft">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Visual diagram */}
          <div className="relative">
            <div className="glass-dark rounded-3xl p-6 shadow-deep">
              {/* Master */}
              <div className="mx-auto w-fit rounded-2xl bg-gradient-gold px-6 py-5 text-center text-emerald-deep shadow-gold animate-glow-pulse">
                <CircuitBoard className="mx-auto h-7 w-7" />
                <div className="mt-2 font-display text-lg">ESP32 Master</div>
                <div className="text-[11px] font-medium uppercase tracking-wider opacity-80">পাম্প হাউস</div>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-deep/90 px-2.5 py-0.5 text-[10px] text-gold-soft">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-soft" /> ONLINE
                </div>
              </div>

              {/* Connection lines */}
              <svg className="my-2 h-12 w-full" viewBox="0 0 300 50" preserveAspectRatio="none">
                <path d="M150 0 L60 50 M150 0 L150 50 M150 0 L240 50" className="flow-line" stroke="oklch(0.76 0.14 86)" strokeWidth="1.5" fill="none" />
              </svg>

              <div className="grid grid-cols-3 gap-2">
                {["ধান জোন", "গম জোন", "সবজি জোন"].map((zone, i) => (
                  <div key={zone} className="rounded-xl border border-gold/20 bg-white/5 p-3 text-center">
                    <Wifi className="mx-auto h-4 w-4 text-gold-soft" />
                    <div className="mt-1.5 text-[11px] font-semibold text-white">Sub-Node {["১", "২", "৩"][i]}</div>
                    <div className="text-[10px] text-white/60">{zone}</div>
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[9px] text-gold-soft">
                      <span className="h-1 w-1 animate-pulse rounded-full bg-gold-soft" /> LIVE
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- WORKFLOW ---------------------------- */
function Workflow() {
  const steps = [
    { n: "০১", t: "হার্ডওয়্যার ইনস্টল", d: "ESP32 মাস্টার ও ESP8266 sub-node মাঠে স্থাপন করুন।", i: CircuitBoard },
    { n: "০২", t: "সেন্সর সংযোগ", d: "মাটির আদ্রতা, LDR, flow ও pressure sensor যুক্ত করুন।", i: Wifi },
    { n: "০৩", t: "AI পরামর্শ গ্রহণ", d: "Dashboard থেকে বাংলায় বুদ্ধিমান সেচ-সিদ্ধান্ত পান।", i: Sparkles },
  ];
  return (
    <section id="how" className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <SectionHeader
        eyebrow="৩ ধাপে শুরু"
        title={<>কীভাবে <span className="text-gradient-prestige italic">কাজ করে?</span></>}
        subtitle="ইনস্টল থেকে ইনসাইট — মাত্র তিনটি ধাপে আপনার মাঠ স্মার্ট হয়ে উঠবে।"
      />
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {steps.map(({ n, t, d, i: Icon }, idx) => (
          <article key={n} className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-7 shadow-elegant hover-lift">
            <div className="absolute -right-4 -top-4 font-display text-[7rem] leading-none text-primary/[0.06] select-none">{n}</div>
            <div className="relative">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-emerald-gold text-white shadow-gold">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Step {n}</div>
              <h3 className="mt-1 font-display text-2xl text-foreground">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
              {idx < 2 && (
                <div className="absolute right-2 top-7 hidden text-primary/30 md:block">
                  <ArrowRight className="h-5 w-5" />
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------- CTA ---------------------------- */
function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-emerald-gold p-10 text-white shadow-deep sm:p-14">
        <div className="absolute inset-0 grid-bg-gold opacity-30" />
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-gold/30 blur-3xl" />
        <div className="absolute -left-16 -bottom-20 h-72 w-72 rounded-full bg-emerald-rich/40 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-soft">প্রকল্প সম্পর্কে</span>
            <h2 className="mt-3 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
              বরেন্দ্র অঞ্চলে পানির <span className="text-gradient-gold italic">সুষম ব্যবহার</span>
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80">
              BMDA স্মার্ট সেচ প্ল্যাটফর্ম বরেন্দ্র বহুমুখী উন্নয়ন কর্তৃপক্ষের কৃষি অবকাঠামোকে
              আধুনিকীকরণের একটি উদ্যোগ। IoT, কৃত্রিম বুদ্ধিমত্তা ও স্যাটেলাইট ডেটা একত্রিত করে
              কৃষকদের জন্য জল সাশ্রয়, ফসলের উৎপাদন বৃদ্ধি ও পরিচালনার ব্যয় কমানোর সমাধান।
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/75">
              <Badge>Water-saving</Badge>
              <Badge>AI-driven</Badge>
              <Badge>Government-backed</Badge>
              <Badge>Made in BD</Badge>
            </div>
          </div>
          <Link
            to="/auth"
            className="group inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-gradient-gold px-7 py-4 text-sm font-semibold text-emerald-deep shadow-gold transition-transform hover:scale-[1.04] lg:self-center"
          >
            এখনই Panel-এ প্রবেশ করুন
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- FOOTER ---------------------------- */
function Footer() {
  return (
    <footer className="border-t border-border/60 bg-secondary/50">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-7 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Leaf className="h-3.5 w-3.5 text-primary" />
          পরিবেশবান্ধব কৃষি · © ২০২৬ বরেন্দ্র বহুমুখী উন্নয়ন কর্তৃপক্ষ
        </div>
        <div className="text-xs text-muted-foreground">BMDA স্মার্ট সেচ প্ল্যাটফর্ম</div>
      </div>
    </footer>
  );
}

/* ---------------------------- HELPERS ---------------------------- */
function SectionHeader({
  eyebrow, title, subtitle,
}: { eyebrow: string; title: React.ReactNode; subtitle: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{eyebrow}</span>
      <h2 className="mt-3 font-display text-4xl tracking-tight text-foreground sm:text-5xl">{title}</h2>
      <p className="mt-4 text-base text-muted-foreground">{subtitle}</p>
    </div>
  );
}
