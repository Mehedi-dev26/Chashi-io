CREATE TABLE public.gps_pipelines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#0ea5e9',
  points JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gps_pipelines TO authenticated;
GRANT ALL ON public.gps_pipelines TO service_role;

ALTER TABLE public.gps_pipelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own pipelines"
  ON public.gps_pipelines FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_gps_pipelines_updated_at
  BEFORE UPDATE ON public.gps_pipelines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_gps_pipelines_user ON public.gps_pipelines(user_id);