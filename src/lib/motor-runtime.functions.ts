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
