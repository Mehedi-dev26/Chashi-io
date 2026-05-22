import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Map,
  Droplets,
  Gauge,
  Sparkles,
  BarChart3,
  Bell,
  Settings,
  Cpu,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "ড্যাশবোর্ড", url: "/", icon: LayoutDashboard },
  { title: "জমির মানচিত্র", url: "/map", icon: Map },
  { title: "সেচ জোন", url: "/zones", icon: Droplets },
  { title: "মোটর নিয়ন্ত্রণ", url: "/motor", icon: Gauge },
];

const analyticsItems = [
  { title: "AI পরামর্শ", url: "/ai", icon: Sparkles },
  { title: "পরিসংখ্যান", url: "/analytics", icon: BarChart3 },
  { title: "বিজ্ঞপ্তি", url: "/alerts", icon: Bell },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar/80 backdrop-blur">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-chart-2 grid place-items-center shadow-[var(--shadow-glow)] shrink-0">
            <Cpu className="h-4.5 w-4.5 text-primary-foreground" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-sidebar" />
          </div>
          {!collapsed && (
            <div className="leading-tight min-w-0">
              <p className="font-bold text-sm tracking-tight truncate">BMDA স্মার্ট সেচ</p>
              <p className="text-[10px] text-muted-foreground truncate">বরেন্দ্র · IoT v২.৬</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel>প্রধান</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
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
          <SidebarGroupLabel>বিশ্লেষণ ও সতর্কতা</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
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

      <SidebarFooter className="border-t border-sidebar-border bg-sidebar">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="সেটিংস">
              <Settings className="h-4 w-4" />
              <span>সেটিংস</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="লগ আউট">
              <LogOut className="h-4 w-4" />
              <span>লগ আউট</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && (
          <div className="px-2 pb-1 pt-2 text-[10px] text-muted-foreground">
            অপারেটর · মোঃ রহমান
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
