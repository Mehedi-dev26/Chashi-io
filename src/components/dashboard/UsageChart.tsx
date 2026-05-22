import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = Array.from({ length: 24 }, (_, h) => ({
  hour: `${h.toString().padStart(2, "0")}h`,
  water: Math.round(200 + Math.sin(h / 3) * 180 + Math.random() * 120),
  power: Math.round(3 + Math.sin(h / 3) * 2.5 + Math.random() * 1),
}));

export function UsageChart() {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">24h Resource Usage</h2>
          <p className="text-[10px] text-muted-foreground font-mono">Water (L) · Power (kW)</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Water</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> Power</span>
        </div>
      </div>

      <div className="mt-4 h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.78 0.18 155)" stopOpacity={0.6} />
                <stop offset="95%" stopColor="oklch(0.78 0.18 155)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.82 0.17 75)" stopOpacity={0.5} />
                <stop offset="95%" stopColor="oklch(0.82 0.17 75)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="hour" stroke="oklch(0.55 0.03 170)" tick={{ fontSize: 10 }} interval={3} />
            <YAxis stroke="oklch(0.55 0.03 170)" tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                background: "oklch(0.22 0.03 180)",
                border: "1px solid oklch(0.32 0.035 185)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Area type="monotone" dataKey="water" stroke="oklch(0.78 0.18 155)" strokeWidth={2} fill="url(#g1)" />
            <Area type="monotone" dataKey="power" stroke="oklch(0.82 0.17 75)" strokeWidth={2} fill="url(#g2)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
