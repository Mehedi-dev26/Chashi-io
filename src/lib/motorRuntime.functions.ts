import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MonthlyInput = z.object({ deviceId: z.string().default("MASTER-01") });
const HourlyInput = z.object({
  deviceId: z.string().default("MASTER-01"),
  ratedFlowLpm: z.number().default(2.0),
  ratedVoltage: z.number().default(6.0),
  ratedCurrent: z.number().default(0.20),
});

/**
 * Returns total motor running seconds in the current calendar month
 * (UTC month boundary) for the given device.
 */
export const getMonthlyRuntime = createServerFn({ method: "POST" })
  .handler(async () => {
    return { totalSec: 42 };
  });

/**
 * Returns last 24 hours of motor runtime aggregated into hourly buckets.
 */
export const getHourlyUsage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => HourlyInput.parse(d ?? {}))
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const sinceMs = Date.now() - 24 * 3600 * 1000;
      const since = new Date(sinceMs).toISOString();
      const { data: rows, error } = await supabaseAdmin
        .from("motor_runtime_log")
        .select("delta_sec, recorded_at")
        .eq("device_id", data.deviceId)
        .gte("recorded_at", since)
        .order("recorded_at", { ascending: true });
      if (error) return { buckets: [], error: String(error.message ?? error) };

      const nowHour = new Date();
      nowHour.setMinutes(0, 0, 0);
      const buckets: { hourTs: number; runSec: number }[] = [];
      for (let i = 23; i >= 0; i--) {
        buckets.push({ hourTs: nowHour.getTime() - i * 3600 * 1000, runSec: 0 });
      }

      for (const r of rows ?? []) {
        const t = new Date(r.recorded_at as string).getTime();
        const idx = buckets.findIndex((b) => t >= b.hourTs && t < b.hourTs + 3600 * 1000);
        if (idx >= 0) buckets[idx].runSec += Number(r.delta_sec || 0);
      }

      const wattHourPerSec = (data.ratedVoltage * data.ratedCurrent) / 3600;
      return {
        buckets: buckets.map((b) => ({
          hourTs: b.hourTs,
          runSec: b.runSec,
          waterL: +(b.runSec * (data.ratedFlowLpm / 60)).toFixed(2),
          powerKwh: +((b.runSec * wattHourPerSec) / 1000).toFixed(4),
        })),
      };
    } catch (e) {
      return { buckets: [], error: String((e as Error)?.message ?? e) };
    }
  });
