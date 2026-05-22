import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { User, Bell, Shield, Wifi, Database, Globe, Save } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "সেটিংস · BMDA স্মার্ট সেচ" }] }),
  component: SettingsPage,
});

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`h-6 w-11 rounded-full relative transition shrink-0 ${checked ? "bg-primary" : "bg-muted border border-border"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow-sm transition-all ${checked ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

function SettingsPage() {
  const [notif, setNotif] = useState(true);
  const [aiAuto, setAiAuto] = useState(true);
  const [sms, setSms] = useState(false);
  const [dark, setDark] = useState(false);

  const sections = [
    {
      icon: User, title: "প্রোফাইল",
      fields: [
        { label: "নাম", value: "মোঃ রহমান", type: "input" },
        { label: "ইমেইল", value: "rahman@bmda.gov.bd", type: "input" },
        { label: "ভূমিকা", value: "প্রধান অপারেটর", type: "input" },
      ],
    },
    {
      icon: Bell, title: "বিজ্ঞপ্তি",
      toggles: [
        { label: "অ্যাপ বিজ্ঞপ্তি", desc: "জরুরি ইভেন্টের সাথে সাথে জানান", value: notif, set: setNotif },
        { label: "SMS সতর্কতা", desc: "জরুরি বিজ্ঞপ্তি মোবাইলে পাঠান", value: sms, set: setSms },
      ],
    },
    {
      icon: Shield, title: "AI ও স্বয়ংক্রিয়করণ",
      toggles: [
        { label: "AI স্বয়ংক্রিয় মোড", desc: "মাটির আর্দ্রতা অনুযায়ী AI সিদ্ধান্ত নেবে", value: aiAuto, set: setAiAuto },
        { label: "ডার্ক থিম", desc: "রাতের ব্যবহারের জন্য", value: dark, set: setDark },
      ],
    },
  ];

  const integrations = [
    { icon: Wifi, name: "IoT গেটওয়ে", status: "সংযুক্ত", color: "success" },
    { icon: Database, name: "Lovable Cloud", status: "অনলাইন", color: "success" },
    { icon: Globe, name: "BMD আবহাওয়া API", status: "সংযুক্ত", color: "success" },
  ];

  return (
    <DashboardLayout
      title="সেটিংস · কনফিগারেশন"
      subtitle="প্রোফাইল, বিজ্ঞপ্তি, AI ও সিস্টেম পছন্দ নিয়ন্ত্রণ করুন।"
      actions={
        <button className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover-lift glow-primary">
          <Save className="h-3.5 w-3.5" /> সংরক্ষণ
        </button>
      }
    >
      <div className="stagger space-y-5">
        {sections.map((s) => (
          <div key={s.title} className="glass-card rounded-2xl p-5 hover-lift">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-xl bg-primary/15 grid place-items-center">
                <s.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <h2 className="text-base font-bold">{s.title}</h2>
            </div>

            {s.fields && (
              <div className="grid sm:grid-cols-3 gap-3">
                {s.fields.map((f) => (
                  <div key={f.label}>
                    <label className="text-xs text-muted-foreground font-semibold">{f.label}</label>
                    <input
                      defaultValue={f.value}
                      className="mt-1 w-full h-10 px-3 rounded-lg bg-card border border-border text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                    />
                  </div>
                ))}
              </div>
            )}

            {s.toggles && (
              <div className="space-y-3">
                {s.toggles.map((t) => (
                  <div key={t.label} className="flex items-center gap-3 rounded-xl glass-panel p-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{t.label}</p>
                      <p className="text-xs text-muted-foreground">{t.desc}</p>
                    </div>
                    <Toggle checked={t.value} onChange={t.set} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="glass-card rounded-2xl p-5 hover-lift">
          <h2 className="text-base font-bold mb-4">সংযোগ ও ইন্টিগ্রেশন</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {integrations.map((i) => (
              <div key={i.name} className="rounded-xl glass-panel p-4">
                <div className="flex items-center justify-between">
                  <i.icon className="h-5 w-5 text-primary" />
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-semibold">● {i.status}</span>
                </div>
                <p className="font-bold text-sm mt-2">{i.name}</p>
                <button className="mt-2 text-xs text-primary font-semibold hover:underline">কনফিগার করুন →</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
