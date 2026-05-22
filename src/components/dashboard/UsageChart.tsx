import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

const data = Array.from({ length: 24 }, (_, h) => ({
  hour: `${bn(h.toString().padStart(2, "0"))}টা`,
  water: Math.round(200 + Math.sin(h / 3) * 180 + ((h * 37) % 100)),
  power: Math.round(3 + Math.sin(h / 3) * 2.5 + ((h * 13) % 10) / 10),
}));

export function UsageChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="glass-card rounded-2xl p-5 hover-lift">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-bold">২৪ ঘণ্টার ব্যবহার</h2>
          <p className="text-[11px] text-muted-foreground">পানি (লিটার) · বিদ্যুৎ (কিলোওয়াট)</p>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> পানি</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> বিদ্যুৎ</span>
        </div>
      </div>

      <div className="mt-4 h-[200px]">
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.58 0.17 150)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="oklch(0.58 0.17 150)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.75 0.15 85)" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="oklch(0.75 0.15 85)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" stroke="oklch(0.55 0.04 160)" tick={{ fontSize: 10 }} interval={3} />
              <YAxis stroke="oklch(0.55 0.04 160)" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: "oklch(1 0 0 / 0.95)",
                  border: "1px solid oklch(0.88 0.02 150)",
                  borderRadius: 10,
                  fontSize: 12,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                }}
              />
              <Area type="monotone" dataKey="water" stroke="oklch(0.58 0.17 150)" strokeWidth={2} fill="url(#g1)" />
              <Area type="monotone" dataKey="power" stroke="oklch(0.75 0.15 85)" strokeWidth={2} fill="url(#g2)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
