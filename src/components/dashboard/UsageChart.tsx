import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useServerFn } from "@tanstack/react-start";
import { getHourlyUsage } from "@/lib/motorRuntime.functions";
import { PUMP_SPEC } from "@/hooks/useIrrigationData";
import { Activity, RefreshCw } from "lucide-react";

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

type Bucket = { hourTs: number; runSec: number; waterL: number; powerKwh: number };
type Row = { hour: string; water: number; power: number; runSec: number; runMin: number };

const emptyData: Row[] = Array.from({ length: 24 }, (_, i) => {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() - (23 - i));
  return { hour: `${bn(d.getHours().toString().padStart(2, "0"))}টা`, water: 0, power: 0, runSec: 0, runMin: 0 };
});

export function UsageChart() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<Row[]>(emptyData);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fetchHourly = useServerFn(getHourlyUsage);

  useEffect(() => {
    setMounted(true);
    let active = true;
    const load = async () => {
      try {
        setIsRefreshing(true);
        const r = await fetchHourly({
          data: {
            deviceId: PUMP_SPEC.device_id,
            ratedFlowLpm: PUMP_SPEC.ratedFlowLpm,
            ratedVoltage: PUMP_SPEC.ratedVoltage,
            ratedCurrent: PUMP_SPEC.ratedCurrent,
          },
        });
        if (!active) return;
        const rows: Row[] = (r?.buckets ?? []).map((b: Bucket) => {
          const d = new Date(b.hourTs);
          return {
            hour: `${bn(d.getHours().toString().padStart(2, "0"))}টা`,
            water: +b.waterL.toFixed(2),
            // Watt-hours read more intuitively for a 6V demo pump than kWh
            power: +(b.powerKwh * 1000).toFixed(2),
            runSec: b.runSec,
          };
        });
        if (rows.length) {
          setData(rows);
          setLastUpdated(new Date());
        }
      } catch { /* ignore */ }
      finally {
        if (active) setIsRefreshing(false);
      }
    };
    load();
    const t = window.setInterval(load, 5000);
    return () => { active = false; window.clearInterval(t); };
  }, [fetchHourly]);

  const totalWater = data.reduce((s, r) => s + r.water, 0);
  const totalPower = data.reduce((s, r) => s + r.power, 0);
  const totalSec = data.reduce((s, r) => s + r.runSec, 0);
  const hasData = totalSec > 0;
  const yMax = useMemo(() => Math.max(1, ...data.map((r) => Math.max(r.water, r.power))), [data]);
  const lastUpdatedText = lastUpdated
    ? lastUpdated.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "লোড হচ্ছে";

  return (
    <div className="glass-card rounded-2xl p-5 hover-lift">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/20">
              <Activity className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold">২৪ ঘণ্টার ব্যবহার</h2>
          </div>
          <p className="text-[11px] text-muted-foreground">
            পানি (লিটার) · বিদ্যুৎ (ওয়াট-ঘণ্টা) · মোট রানটাইম {bn(Math.round(totalSec / 60))} মি
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] flex-wrap justify-end">
          <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary"><span className="h-2 w-2 rounded-full bg-primary" /> পানি {bn(totalWater.toFixed(1))} L</span>
          <span className="flex items-center gap-1.5 rounded-full bg-accent/20 px-2.5 py-1 font-semibold text-accent-foreground"><span className="h-2 w-2 rounded-full bg-accent" /> বিদ্যুৎ {bn(totalPower.toFixed(1))} Wh</span>
          <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} /> {lastUpdatedText}
          </span>
        </div>
      </div>

      <div className="mt-4 h-[200px] relative">
        {!hasData && mounted && (
          <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground pointer-events-none z-10">
            এখনো কোনো রানটাইম ডেটা নেই — মোটর চালু করলে এখানে রিয়েল গ্রাফ দেখাবে
          </div>
        )}
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
              <CartesianGrid stroke="oklch(0.88 0.025 105 / 0.55)" strokeDasharray="4 6" vertical={false} />
              <XAxis dataKey="hour" stroke="oklch(0.55 0.04 160)" tick={{ fontSize: 10 }} interval={3} />
              <YAxis stroke="oklch(0.55 0.04 160)" tick={{ fontSize: 10 }} domain={[0, yMax]} allowDecimals />
              <Tooltip
                contentStyle={{
                  background: "oklch(1 0 0 / 0.95)",
                  border: "1px solid oklch(0.88 0.02 150)",
                  borderRadius: 10,
                  fontSize: 12,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                }}
                formatter={(value: number, name: string) => {
                  if (name === "water") return [`${bn(Number(value).toFixed(2))} L`, "পানি"];
                  if (name === "power") return [`${bn(Number(value).toFixed(2))} Wh`, "বিদ্যুৎ"];
                  return [value, name];
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
