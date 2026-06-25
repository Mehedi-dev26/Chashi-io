
CREATE TABLE public.motor_runtime_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  delta_sec INTEGER NOT NULL CHECK (delta_sec >= 0),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX motor_runtime_log_device_recorded_idx ON public.motor_runtime_log(device_id, recorded_at DESC);
GRANT SELECT ON public.motor_runtime_log TO authenticated;
GRANT ALL ON public.motor_runtime_log TO service_role;
ALTER TABLE public.motor_runtime_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read motor runtime"
  ON public.motor_runtime_log FOR SELECT TO authenticated USING (true);
