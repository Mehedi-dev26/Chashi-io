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
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col min-w-0 bg-transparent">
          <TopBar />
          <main className="flex-1 px-4 sm:px-6 py-6 space-y-5 animate-fade-in">
            <div className="flex items-start justify-between gap-4 flex-wrap animate-slide-down">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                  {title.includes("·") ? (
                    <>
                      <span className="text-foreground">{title.split("·")[0].trim()}</span>
                      <span className="mx-2 text-muted-foreground/40 font-light">·</span>
                      <span className="text-gradient">{title.split("·").slice(1).join("·").trim()}</span>
                    </>
                  ) : (
                    <span className="text-gradient">{title}</span>
                  )}
                </h1>
                {subtitle && <p className="text-sm text-muted-foreground mt-2 font-medium">{subtitle}</p>}
              </div>
              {actions}
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
