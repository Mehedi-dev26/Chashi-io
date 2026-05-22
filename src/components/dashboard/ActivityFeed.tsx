import { CheckCircle2, Info, AlertCircle, AlertTriangle } from "lucide-react";
import type { ActivityEntry } from "@/hooks/useIrrigationData";

const iconMap = {
  success: { Icon: CheckCircle2, color: "text-success" },
  info: { Icon: Info, color: "text-chart-2" },
  warning: { Icon: AlertTriangle, color: "text-accent" },
  alert: { Icon: AlertCircle, color: "text-destructive" },
};

export function ActivityFeed({ activity }: { activity: ActivityEntry[] }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold">Activity Log</h2>
        <span className="text-[10px] text-muted-foreground font-mono">Real-time</span>
      </div>
      <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
        {activity.map((a) => {
          const { Icon, color } = iconMap[a.type];
          return (
            <div key={a.id} className="flex gap-2.5 text-sm">
              <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${color}`} />
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-snug">{a.message}</p>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{a.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
