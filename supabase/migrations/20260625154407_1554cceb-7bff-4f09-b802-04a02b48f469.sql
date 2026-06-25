
ALTER TABLE public.device_telemetry ADD COLUMN IF NOT EXISTS tds_ppm numeric;

CREATE TABLE public.field_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_id text NOT NULL UNIQUE,
  zone_id text NOT NULL,
  label text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.field_nodes TO authenticated;
GRANT ALL ON public.field_nodes TO service_role;
ALTER TABLE public.field_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own field nodes" ON public.field_nodes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger
  LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER field_nodes_updated_at BEFORE UPDATE ON public.field_nodes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
