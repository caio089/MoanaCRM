-- Defaults de timestamp em leads + trigger + is_app_admin robusto
ALTER TABLE public.leads
  ALTER COLUMN criado_em SET DEFAULT now(),
  ALTER COLUMN atualizado_em SET DEFAULT now();

DROP TRIGGER IF EXISTS trg_leads_atualizado_em ON public.leads;
CREATE TRIGGER trg_leads_atualizado_em
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'role') = 'admin',
    false
  );
$$;
