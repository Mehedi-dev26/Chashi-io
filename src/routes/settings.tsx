import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { User, Bell, Shield, Wifi, Database, Globe, Save, Loader2, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "সেটিংস · Chashi.io" }] }),
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
  const { user, profile, roles, signOut } = useAuth();
  const [notif, setNotif] = useState(true);
  const [aiAuto, setAiAuto] = useState(true);
  const [sms, setSms] = useState(false);
  const [dark, setDark] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
    setAvatarUrl(profile?.avatar_url ?? "");
  }, [profile]);

  const roleText = roles.includes("admin") ? "প্রশাসক (Admin)"
    : roles.includes("operator") ? "অপারেটর (Operator)"
    : "দর্শক (Viewer)";

  const saveProfile = async () => {
    if (!user) { toast.error("আগে লগইন করুন"); return; }
    if (!displayName.trim()) { toast.error("নাম প্রয়োজন"); return; }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: displayName.trim(),
      avatar_url: avatarUrl.trim() || null,
    }).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("প্রোফাইল সংরক্ষণ হয়েছে");
  };

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
        <button
          onClick={saveProfile}
          disabled={saving}
          className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover-lift glow-primary disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {saving ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ"}
        </button>
      }
    >
      <div className="stagger space-y-5">
        {/* Profile — real data + save */}
        <div className="glass-card rounded-2xl p-5 hover-lift">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary/15 grid place-items-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-base font-bold">প্রোফাইল</h2>
            <span className="ml-auto text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded">{user ? "সংযুক্ত" : "লগইন প্রয়োজন"}</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground font-semibold">নাম (Display name)</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="আপনার নাম"
                className="mt-1 w-full h-10 px-3 rounded-lg bg-card border border-border text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
              <p className="text-[10px] text-muted-foreground mt-1">হেডার বার ও নেভিগেশনে এটি দেখানো হবে</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold">ইমেইল</label>
              <input
                readOnly
                value={user?.email ?? ""}
                className="mt-1 w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none text-muted-foreground cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold">অবতার URL (ঐচ্ছিক)</label>
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full h-10 px-3 rounded-lg bg-card border border-border text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold">ভূমিকা (Role)</label>
              <input
                readOnly
                value={roleText}
                className="mt-1 w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none text-muted-foreground cursor-not-allowed"
              />
              <p className="text-[10px] text-muted-foreground mt-1">ভূমিকা পরিবর্তন করতে প্রশাসকের সাথে যোগাযোগ করুন</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="h-9 px-4 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold flex items-center gap-1.5 shadow shadow-emerald-500/30 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              প্রোফাইল সংরক্ষণ
            </button>
            {user && (
              <button
                onClick={() => signOut()}
                className="h-9 px-3 rounded-lg bg-rose-500/10 text-rose-600 border border-rose-500/25 text-xs font-semibold flex items-center gap-1.5 hover:bg-rose-500/20"
              >
                <LogOut className="h-3.5 w-3.5" /> লগআউট
              </button>
            )}
          </div>
        </div>

        {/* Notification prefs */}
        <div className="glass-card rounded-2xl p-5 hover-lift">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary/15 grid place-items-center">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-base font-bold">বিজ্ঞপ্তি</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "অ্যাপ বিজ্ঞপ্তি", desc: "জরুরি ইভেন্টের সাথে সাথে জানান", value: notif, set: setNotif },
              { label: "SMS সতর্কতা", desc: "জরুরি বিজ্ঞপ্তি মোবাইলে পাঠান", value: sms, set: setSms },
            ].map((t) => (
              <div key={t.label} className="flex items-center gap-3 rounded-xl glass-panel p-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </div>
                <Toggle checked={t.value} onChange={t.set} />
              </div>
            ))}
          </div>
        </div>

        {/* AI prefs */}
        <div className="glass-card rounded-2xl p-5 hover-lift">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary/15 grid place-items-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-base font-bold">AI ও স্বয়ংক্রিয়করণ</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "AI স্বয়ংক্রিয় মোড", desc: "মাটির আর্দ্রতা অনুযায়ী AI সিদ্ধান্ত নেবে", value: aiAuto, set: setAiAuto },
              { label: "ডার্ক থিম", desc: "রাতের ব্যবহারের জন্য", value: dark, set: setDark },
            ].map((t) => (
              <div key={t.label} className="flex items-center gap-3 rounded-xl glass-panel p-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </div>
                <Toggle checked={t.value} onChange={t.set} />
              </div>
            ))}
          </div>
        </div>

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
