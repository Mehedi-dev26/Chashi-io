import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sprout, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "লগ ইন · BMDA স্মার্ট সেচ প্ল্যাটফর্ম" },
      { name: "description", content: "BMDA স্মার্ট ইরিগেশন প্ল্যাটফর্মে অপারেটর প্রবেশদ্বার।" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("স্বাগতম! Panel-এ প্রবেশ করছি…");
        navigate({ to: "/app" });
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/app`, data: { display_name: name || email.split("@")[0] } },
        });
        if (error) throw error;
        toast.success("একাউন্ট তৈরি হয়েছে। প্রবেশ করছি…");
        navigate({ to: "/app" });
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "ত্রুটি ঘটেছে");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/app` });
      if (res.error) toast.error(String(res.error));
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 grid-bg opacity-40" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-3xl rounded-full -z-10" />

      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2.5 mb-6 hover:opacity-80 transition w-fit">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 grid place-items-center shadow-lg">
            <Sprout className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-black text-lg leading-tight">BMDA স্মার্ট সেচ</p>
            <p className="text-[10px] text-muted-foreground">বরেন্দ্র · IoT v২.৬</p>
          </div>
        </Link>

        <div className="glass-card rounded-2xl p-7 sm:p-8">
          <h1 className="text-2xl font-black tracking-tight">
            {mode === "login" ? "অপারেটর প্রবেশদ্বার" : "নতুন একাউন্ট"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login" ? "Main panel-এ প্রবেশ করতে আপনার credentials দিন।" : "Platform-এ যুক্ত হতে নিবন্ধন করুন।"}
          </p>

          <button
            onClick={google} disabled={busy}
            className="mt-6 w-full h-11 rounded-xl border border-border bg-background/70 hover:bg-secondary transition flex items-center justify-center gap-2.5 text-sm font-semibold disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5.04c1.86 0 3.5.64 4.8 1.9l3.57-3.57C18.13 1.19 15.31 0 12 0 7.31 0 3.25 2.69 1.28 6.62l4.16 3.23C6.4 6.94 8.96 5.04 12 5.04z"/><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.28 1.4-1.12 2.59-2.39 3.39l3.66 2.84c2.14-1.98 3.75-4.9 3.75-8.47z"/><path fill="#FBBC05" d="M5.44 14.62c-.25-.74-.39-1.53-.39-2.34 0-.81.14-1.6.39-2.34L1.28 6.71C.47 8.34 0 10.13 0 12.28c0 2.15.47 3.94 1.28 5.57l4.16-3.23z"/><path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.94-2.94l-3.66-2.84c-1.02.69-2.34 1.1-4.28 1.1-3.04 0-5.6-1.9-6.56-4.81l-4.16 3.23C3.25 21.31 7.31 24 12 24z"/></svg>
            Google দিয়ে চালিয়ে যান
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">অথবা</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            {mode === "signup" && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground">নাম</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full h-11 px-3 rounded-xl border border-border bg-background/70 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" placeholder="আপনার নাম" />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">ইমেইল</label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 rounded-xl border border-border bg-background/70 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">পাসওয়ার্ড</label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 rounded-xl border border-border bg-background/70 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" placeholder="••••••••" />
              </div>
            </div>

            <button type="submit" disabled={busy}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-chart-2 text-primary-foreground font-bold text-sm shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>
                {mode === "login" ? "প্রবেশ করুন" : "একাউন্ট তৈরি করুন"} <ArrowRight className="h-4 w-4" />
              </>}
            </button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-5">
            {mode === "login" ? "নতুন ব্যবহারকারী?" : "ইতিমধ্যে একাউন্ট আছে?"}{" "}
            <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-primary font-semibold hover:underline">
              {mode === "login" ? "নিবন্ধন করুন" : "লগ ইন করুন"}
            </button>
          </p>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-6">
          © {new Date().getFullYear()} বরেন্দ্র বহুমুখী উন্নয়ন কর্তৃপক্ষ · IoT v২.৬
        </p>
      </div>
    </div>
  );
}
