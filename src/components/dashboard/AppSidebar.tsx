import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Map, Droplets, Gauge, Sparkles, BarChart3, Bell,
  Settings, Cpu, LogOut, History, Receipt, Network, Satellite, Brain, MapPin, CircuitBoard,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type NavItem = { title: string; url: string; icon: LucideIcon; tint: string; ring: string };

const mainItems: NavItem[] = [
  { title: "ড্যাশবোর্ড",        url: "/app",      icon: LayoutDashboard, tint: "from-emerald-500 to-teal-500",   ring: "shadow-emerald-500/40" },
  { title: "জমির মানচিত্র",     url: "/map",      icon: Map,             tint: "from-lime-500 to-green-600",     ring: "shadow-lime-500/40" },
  { title: "GPS স্যাটেলাইট",    url: "/gps",      icon: MapPin,          tint: "from-rose-500 to-pink-600",      ring: "shadow-rose-500/40" },
  { title: "সেচ জোন",           url: "/zones",    icon: Droplets,        tint: "from-sky-500 to-cyan-500",       ring: "shadow-sky-500/40" },
  { title: "মোটর নিয়ন্ত্রণ",   url: "/motor",    icon: Gauge,           tint: "from-orange-500 to-red-500",     ring: "shadow-orange-500/40" },
  { title: "ডিভাইস নেটওয়ার্ক", url: "/devices",  icon: Network,         tint: "from-indigo-500 to-blue-600",    ring: "shadow-indigo-500/40" },
  { title: "হার্ডওয়্যার গাইড", url: "/hardware", icon: CircuitBoard,    tint: "from-fuchsia-500 to-purple-600", ring: "shadow-fuchsia-500/40" },
];

const analyticsItems: NavItem[] = [
  { title: "AI পরামর্শ",        url: "/ai",        icon: Sparkles,  tint: "from-amber-400 to-yellow-500",   ring: "shadow-amber-500/40" },
  { title: "ML পূর্বাভাস",      url: "/forecast",  icon: Brain,     tint: "from-violet-500 to-purple-600",  ring: "shadow-violet-500/40" },
  { title: "NDVI স্যাটেলাইট",   url: "/satellite", icon: Satellite, tint: "from-teal-500 to-emerald-600",   ring: "shadow-teal-500/40" },
  { title: "ঐতিহাসিক তথ্য",     url: "/history",   icon: History,   tint: "from-slate-500 to-zinc-600",     ring: "shadow-slate-500/40" },
  { title: "পরিসংখ্যান",        url: "/analytics", icon: BarChart3, tint: "from-blue-500 to-indigo-600",    ring: "shadow-blue-500/40" },
  { title: "বিলিং",             url: "/billing",   icon: Receipt,   tint: "from-green-500 to-emerald-600",  ring: "shadow-green-500/40" },
  { title: "বিজ্ঞপ্তি",         url: "/alerts",    icon: Bell,      tint: "from-red-500 to-rose-600",       ring: "shadow-red-500/40" },
];

function NavRow({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  const Icon = item.icon;
  return (
    <Link to={item.url} className="flex items-center gap-3 w-full">
      <span
        className={[
          "relative grid place-items-center shrink-0 rounded-lg transition-all duration-300",
          "h-8 w-8 bg-gradient-to-br", item.tint,
          active
            ? `shadow-lg ${item.ring} scale-105 ring-2 ring-white/30`
            : "opacity-90 group-hover/menu-item:opacity-100 group-hover/menu-item:scale-105 shadow-md shadow-black/20",
        ].join(" ")}
      >
        <Icon className="h-[18px] w-[18px] text-white drop-shadow" strokeWidth={2.4} />
      </span>
      {!collapsed && (
        <span className={["truncate text-[13.5px] leading-tight", active ? "font-bold" : "font-medium"].join(" ")}>
          {item.title}
        </span>
      )}
    </Link>
  );
}

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

  const itemCls =
    "h-11 px-2.5 rounded-xl text-sidebar-foreground transition-all " +
    "hover:bg-white/8 " +
    "data-[active=true]:bg-white/12 data-[active=true]:backdrop-blur-xl " +
    "data-[active=true]:border data-[active=true]:border-white/20 " +
    "data-[active=true]:text-white " +
    "data-[active=true]:shadow-[0_4px_20px_-4px_rgba(255,255,255,0.15),inset_0_1px_0_rgba(255,255,255,0.2)]";

  const renderItem = (item: NavItem) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title} className={itemCls}>
        <NavRow item={item} active={isActive(item.url)} collapsed={collapsed} />
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  const settingsItem: NavItem = { title: "সেটিংস", url: "/settings", icon: Settings, tint: "from-zinc-500 to-slate-700", ring: "shadow-zinc-500/40" };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-2.5">
          <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 grid place-items-center shadow-lg shadow-emerald-500/40 shrink-0">
            <Cpu className="h-5 w-5 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-sidebar animate-pulse" />
          </div>
          {!collapsed && (
            <div className="leading-tight min-w-0 animate-fade-in">
              <p className="font-bold text-[15px] tracking-tight truncate text-sidebar-foreground">BMDA স্মার্ট সেচ</p>
              <p className="text-[11px] text-sidebar-foreground/70 truncate">বরেন্দ্র · IoT v২.৬</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-2 py-2">
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[11px] uppercase tracking-wider font-bold text-sidebar-foreground/70 px-2 mb-1">প্রধান</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">{mainItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[11px] uppercase tracking-wider font-bold text-sidebar-foreground/70 px-2 mb-1">বিশ্লেষণ ও সতর্কতা</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">{analyticsItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[11px] uppercase tracking-wider font-bold text-sidebar-foreground/70 px-2 mb-1">কনফিগারেশন</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">{renderItem(settingsItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>


      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu className="gap-1">
          {renderItem(settingsItem)}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="লগ আউট"
              className="h-11 px-2.5 rounded-xl text-sidebar-foreground hover:bg-destructive/30 cursor-pointer"
            >
              <span className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-700 shadow-md shadow-red-500/40 shrink-0">
                <LogOut className="h-[18px] w-[18px] text-white" strokeWidth={2.4} />
              </span>
              {!collapsed && <span className="text-[13.5px] font-medium">লগ আউট</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2 pb-1 pt-3 animate-fade-in">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 grid place-items-center text-[11px] font-bold text-white shrink-0 shadow-md shadow-emerald-500/40">
              {initials}
            </div>
            <div className="leading-tight min-w-0">
              <p className="text-[12px] font-bold text-sidebar-foreground truncate">{profile?.display_name || user?.email?.split("@")[0]}</p>
              <p className="text-[10px] text-sidebar-foreground/60 truncate">{roleLabel} · {user?.email}</p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
