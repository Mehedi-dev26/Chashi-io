DROP POLICY IF EXISTS "commands authenticated read" ON public.device_commands;
DROP POLICY IF EXISTS "telemetry public read" ON public.device_telemetry;
DROP POLICY IF EXISTS "Anyone authenticated can read motor runtime" ON public.motor_runtime_log;

CREATE POLICY "Users read own device commands"
ON public.device_commands
FOR SELECT
TO authenticated
USING (
  auth.uid() = issued_by
  OR EXISTS (
    SELECT 1
    FROM public.field_nodes fn
    WHERE fn.device_id = device_commands.device_id
      AND fn.user_id = auth.uid()
  )
  OR (
    device_commands.device_id = 'MASTER-01'
    AND EXISTS (
      SELECT 1
      FROM public.fields f
      WHERE f.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users read own device telemetry"
ON public.device_telemetry
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.field_nodes fn
    WHERE fn.device_id = device_telemetry.device_id
      AND fn.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.fields f
    WHERE f.zone_id = device_telemetry.zone_id
      AND f.user_id = auth.uid()
  )
  OR (
    device_telemetry.device_id = 'MASTER-01'
    AND EXISTS (
      SELECT 1
      FROM public.fields f
      WHERE f.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users read own motor runtime"
ON public.motor_runtime_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.field_nodes fn
    WHERE fn.device_id = motor_runtime_log.device_id
      AND fn.user_id = auth.uid()
  )
  OR (
    motor_runtime_log.device_id = 'MASTER-01'
    AND EXISTS (
      SELECT 1
      FROM public.fields f
      WHERE f.user_id = auth.uid()
    )
  )
);