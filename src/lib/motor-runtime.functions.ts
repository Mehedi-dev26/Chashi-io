import { createServerFn } from "@tanstack/react-start";

/**
 * Returns total motor running seconds in the current calendar month
 * (UTC month boundary) for the given device.
 */
export const getMonthlyRuntime = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => {
    const d = (data ?? {}) as { deviceId?: string };
    return { deviceId: String(d.deviceId ?? "MASTER-01") };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const { data: rows, error } = await supabaseAdmin
      .from("motor_runtime_log")
      .select("delta_sec")
      .eq("device_id", data.deviceId)
      .gte("recorded_at", monthStart);
    if (error) return { totalSec: 0, error: error.message };
    const totalSec = (rows ?? []).reduce((s, r) => s + Number(r.delta_sec || 0), 0);
    return { totalSec };
  });

/**
 * Returns last 24 hours of motor runtime aggregated into hourly buckets
 * (local time of the user). Each bucket carries:
 *   - runSec: total seconds the motor ran in that hour
 *   - waterL: liters delivered, derived from rated flow (L/min)
 *   - powerKwh: energy used, derived from rated voltage × current
 */
export const getHourlyUsage = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => {
    const d = (data ?? {}) as { deviceId?: string; ratedFlowLpm?: number; ratedVoltage?: number; ratedCurrent?: number };
    return {
      deviceId: String(d.deviceId ?? "MASTER-01"),
      ratedFlowLpm: Number(d.ratedFlowLpm ?? 2.0),
      ratedVoltage: Number(d.ratedVoltage ?? 6.0),
      ratedCurrent: Number(d.ratedCurrent ?? 0.20),
    };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sinceMs = Date.now() - 24 * 3600 * 1000;
    const since = new Date(sinceMs).toISOString();
    const { data: rows, error } = await supabaseAdmin
      .from("motor_runtime_log")
      .select("delta_sec, recorded_at")
      .eq("device_id", data.deviceId)
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: true });
    if (error) return { buckets: [], error: error.message };

    // Initialise 24 hourly buckets ending at the current hour.
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

    const wattHourPerSec = (data.ratedVoltage * data.ratedCurrent) / 3600; // kWh = V*A*sec/3.6e6, we want kWh per bucket
    return {
      buckets: buckets.map((b) => ({
        hourTs: b.hourTs,
        runSec: b.runSec,
        waterL: +(b.runSec * (data.ratedFlowLpm / 60)).toFixed(2),
        powerKwh: +((b.runSec * wattHourPerSec) / 1000).toFixed(4),
      })),
    };
  });
