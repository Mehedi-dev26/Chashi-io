import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MonthlyInput = z.object({ deviceId: z.string().default("MASTER-01") });
const HourlyInput = z.object({
  deviceId: z.string().default("MASTER-01"),
  ratedFlowLpm: z.number().default(2.0),
  ratedVoltage: z.number().default(6.0),
  ratedCurrent: z.number().default(0.20),
});

type RuntimeRow = { delta_sec: number | null; recorded_at?: string | null };

const PAGE_SIZE = 1000;

const sumPagedRuntime = async (
  supabaseAdmin: Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"],
  deviceId: string,
  sinceIso: string,
) => {
  let totalSec = 0;
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data: page, error } = await supabaseAdmin
      .from("motor_runtime_log")
      .select("delta_sec")
      .eq("device_id", deviceId)
      .gte("recorded_at", sinceIso)
      .order("recorded_at", { ascending: true })
      .range(from, to);

    if (error) throw error;
    const rows = (page ?? []) as RuntimeRow[];
    totalSec += rows.reduce((sum, row) => sum + Number(row.delta_sec || 0), 0);
    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return totalSec;
};

const fetchPagedRuntimeRows = async (
  supabaseAdmin: Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"],
  deviceId: string,
  sinceIso: string,
) => {
  const allRows: RuntimeRow[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data: page, error } = await supabaseAdmin
      .from("motor_runtime_log")
      .select("delta_sec, recorded_at")
      .eq("device_id", deviceId)
      .gte("recorded_at", sinceIso)
      .order("recorded_at", { ascending: true })
      .range(from, to);

    if (error) throw error;
    const rows = (page ?? []) as RuntimeRow[];
    allRows.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allRows;
};

export const getMonthlyRuntime = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => MonthlyInput.parse(d ?? {}))
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const now = new Date();
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
      const totalSec = await sumPagedRuntime(supabaseAdmin, data.deviceId, monthStart);
      return { totalSec };
    } catch (e) {
      return { totalSec: 0, error: String((e as Error)?.message ?? e) };
    }
  });

export const getHourlyUsage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => HourlyInput.parse(d ?? {}))
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const sinceMs = Date.now() - 24 * 3600 * 1000;
      const since = new Date(sinceMs).toISOString();
      const rows = await fetchPagedRuntimeRows(supabaseAdmin, data.deviceId, since);

      const nowHour = new Date();
      nowHour.setMinutes(0, 0, 0);
      const buckets: { hourTs: number; runSec: number }[] = [];
      for (let i = 23; i >= 0; i--) {
        buckets.push({ hourTs: nowHour.getTime() - i * 3600 * 1000, runSec: 0 });
      }

      for (const r of rows) {
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
