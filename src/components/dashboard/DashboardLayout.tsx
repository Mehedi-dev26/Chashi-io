import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAuth } from "@/hooks/useAuth";

export function DashboardLayout({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const { isAuthenticated, loading, roles, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const approved = isAdmin || roles.includes("operator");

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate({ to: "/auth" });
  }, [loading, isAuthenticated, navigate]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium">প্ল্যাটফর্ম লোড হচ্ছে…</span>
        </div>
      </div>
    );
  }

  if (!approved) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="max-w-md text-center glass-card rounded-2xl p-8 space-y-4">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 grid place-items-center text-white text-2xl">⛔</div>
          <h1 className="text-xl font-black">প্রবেশাধিকার নেই</h1>
          <p className="text-sm text-muted-foreground">এই একাউন্টটি মেইন প্যানেলে প্রবেশের জন্য অনুমোদিত নয়। অনুগ্রহ করে অনুমোদিত অ্যাডমিন ইমেইল ব্যবহার করুন।</p>
          <button onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}
            className="h-10 px-5 rounded-xl bg-gradient-to-r from-primary to-chart-2 text-primary-foreground font-bold text-sm shadow-lg">
            সাইন আউট
          </button>
        </div>
      </div>
    );
  }


  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col min-w-0 bg-transparent">
          <TopBar />
          <main className="flex-1 px-4 sm:px-6 py-6 space-y-5 animate-fade-in min-w-0">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:gap-4 animate-slide-down">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight break-words text-foreground">
                  {title.includes("·") ? (
                    <>
                      <span>{title.split("·")[0].trim()}</span>
                      <span className="mx-2 text-muted-foreground/40 font-light">·</span>
                      <span className="text-muted-foreground">{title.split("·").slice(1).join("·").trim()}</span>
                    </>
                  ) : (
                    <span>{title}</span>
                  )}
                </h1>
                {subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-2 font-medium break-words">{subtitle}</p>}
              </div>
              {actions && <div className="shrink-0">{actions}</div>}
            </div>
            <div className="space-y-5">{children}</div>
            <footer className="text-center text-[11px] text-muted-foreground py-6">
              BMDA স্মার্ট সেচ · IoT নিয়ন্ত্রণ v২.৬ · বরেন্দ্র বহুমুখী উন্নয়ন কর্তৃপক্ষ
            </footer>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
