import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Map, Droplets, Gauge, Sparkles, BarChart3, Bell,
  Settings, Cpu, LogOut, History, Receipt, Network, Satellite, Brain, MapPin, CircuitBoard,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const mainItems = [
  { title: "ড্যাশবোর্ড", url: "/app", icon: LayoutDashboard },
  { title: "জমির মানচিত্র", url: "/map", icon: Map },
  { title: "GPS স্যাটেলাইট", url: "/gps", icon: MapPin },
  { title: "সেচ জোন", url: "/zones", icon: Droplets },
  { title: "মোটর নিয়ন্ত্রণ", url: "/motor", icon: Gauge },
  { title: "ডিভাইস নেটওয়ার্ক", url: "/devices", icon: Network },
  { title: "হার্ডওয়্যার গাইড", url: "/hardware", icon: CircuitBoard },
];

const analyticsItems = [
  { title: "AI পরামর্শ", url: "/ai", icon: Sparkles },
  { title: "ML পূর্বাভাস", url: "/forecast", icon: Brain },
  { title: "NDVI স্যাটেলাইট", url: "/satellite", icon: Satellite },
  { title: "ঐতিহাসিক তথ্য", url: "/history", icon: History },
  { title: "পরিসংখ্যান", url: "/analytics", icon: BarChart3 },
  { title: "বিলিং", url: "/billing", icon: Receipt },
  { title: "বিজ্ঞপ্তি", url: "/alerts", icon: Bell },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (path: string) => currentPath === path;
  const { profile, user, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const initials = (profile?.display_name || user?.email || "অ").slice(0, 2).toUpperCase();
  const roleLabel = roles.includes("admin") ? "অ্যাডমিন" : roles.includes("operator") ? "অপারেটর" : "ভিউয়ার";

  const handleLogout = async () => {
    await signOut();
    toast.success("সফলভাবে লগ আউট হয়েছেন");
    navigate({ to: "/" });
  };

  // Frosted-glass active state (no solid colour fill)
  const itemCls =
    "text-sidebar-foreground transition-all relative overflow-hidden " +
    "hover:bg-white/8 hover:text-sidebar-foreground " +
    "data-[active=true]:bg-white/12 data-[active=true]:backdrop-blur-xl " +
    "data-[active=true]:border data-[active=true]:border-white/25 " +
    "data-[active=true]:text-white data-[active=true]:font-semibold " +
    "data-[active=true]:shadow-[0_4px_20px_-4px_rgba(255,255,255,0.15),inset_0_1px_0_rgba(255,255,255,0.2)]";


  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-sidebar-primary to-chart-2 grid place-items-center shadow-lg shrink-0">
            <Cpu className="h-4.5 w-4.5 text-sidebar-primary-foreground" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-sidebar animate-pulse" />
          </div>
          {!collapsed && (
            <div className="leading-tight min-w-0 animate-fade-in">
              <p className="font-bold text-sm tracking-tight truncate text-sidebar-foreground">BMDA স্মার্ট সেচ</p>
              <p className="text-[10px] text-sidebar-foreground/70 truncate">বরেন্দ্র · IoT v২.৬</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/60">প্রধান</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className={itemCls}
                  >
                    <Link to={item.url} className="flex items-center gap-2.5">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/60">বিশ্লেষণ ও সতর্কতা</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className={itemCls}
                  >
                    <Link to={item.url} className="flex items-center gap-2.5">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/settings")}
              tooltip="সেটিংস"
              className={itemCls}
            >
              <Link to="/settings" className="flex items-center gap-2.5">
                <Settings className="h-4 w-4" />
                <span>সেটিংস</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="লগ আউট"
              className="text-sidebar-foreground hover:bg-destructive/30 hover:text-sidebar-foreground cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>লগ আউট</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 pb-1 pt-2.5 animate-fade-in">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sidebar-primary to-chart-2 grid place-items-center text-[10px] font-bold text-sidebar-primary-foreground shrink-0">
              {initials}
            </div>
            <div className="leading-tight min-w-0">
              <p className="text-[11px] font-bold text-sidebar-foreground truncate">{profile?.display_name || user?.email?.split("@")[0]}</p>
              <p className="text-[9px] text-sidebar-foreground/60 truncate">{roleLabel} · {user?.email}</p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
