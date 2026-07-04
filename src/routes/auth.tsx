import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sprout, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";


export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "লগ ইন · Chashi.io প্ল্যাটফর্ম" },
      { name: "description", content: "Chashi.io প্ল্যাটফর্মে অপারেটর প্রবেশদ্বার।" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("স্বাগতম! মেইন প্যানেলে প্রবেশ করছি…");
      navigate({ to: "/app" });
    } catch (err: unknown) {
      toast.error((err as Error).message || "ভুল credentials — প্রবেশ অনুমোদিত নয়");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 grid-bg opacity-40" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-3xl rounded-full -z-10" />

      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2.5 mb-6 hover:opacity-80 transition w-fit">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 via-lime-400 to-amber-400 grid place-items-center shadow-lg shadow-amber-500/30">
            <Sprout className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-2xl leading-tight tracking-tight"><span className="brand-chashi">Chashi</span><span className="brand-chashi-dot">.</span><span className="brand-chashi">io</span></p>
            <p className="text-[10px] text-muted-foreground">স্মার্ট সেচ ব্যবস্থাপনা</p>
          </div>
        </Link>

        <div className="glass-card rounded-2xl p-7 sm:p-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-[10px] font-bold text-amber-900 mb-3">
            <Lock className="h-3 w-3" /> RESTRICTED · শুধু অনুমোদিত অ্যাডমিন
          </div>
          <h1 className="text-2xl font-black tracking-tight">মেইন প্যানেল Access</h1>
          <p className="text-sm text-muted-foreground mt-1">
            প্রবেশের জন্য অনুমোদিত ইমেইল ও পাসওয়ার্ড প্রদান করুন। অননুমোদিত একাউন্টে প্রবেশাধিকার নেই।
          </p>

          <form onSubmit={submit} className="space-y-3.5 mt-6">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">অনুমোদিত ইমেইল</label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
                  className="w-full h-11 pl-10 pr-3 rounded-xl border border-border bg-background/70 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" placeholder="admin@example.com" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">পাসওয়ার্ড</label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
                  className="w-full h-11 pl-10 pr-3 rounded-xl border border-border bg-background/70 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" placeholder="••••••••" />
              </div>
            </div>

            <button type="submit" disabled={busy}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-chart-2 text-primary-foreground font-bold text-sm shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>মেইন প্যানেলে প্রবেশ <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="text-[11px] text-center text-muted-foreground mt-5">
            নতুন একাউন্ট নিবন্ধন বন্ধ আছে। প্রবেশাধিকার পেতে সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন।
          </p>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-6">
          © {new Date().getFullYear()} বরেন্দ্র বহুমুখী উন্নয়ন কর্তৃপক্ষ · IoT v২.৬
        </p>
      </div>
    </div>
  );
}

