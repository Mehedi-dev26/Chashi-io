
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TYPE public.gps_asset_kind AS ENUM ('field', 'valve', 'motor');

CREATE TABLE public.gps_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.gps_asset_kind NOT NULL,
  label text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gps_assets TO authenticated;
GRANT ALL ON public.gps_assets TO service_role;

ALTER TABLE public.gps_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own gps assets"
  ON public.gps_assets FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX gps_assets_user_idx ON public.gps_assets(user_id);

CREATE TRIGGER gps_assets_updated
  BEFORE UPDATE ON public.gps_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
