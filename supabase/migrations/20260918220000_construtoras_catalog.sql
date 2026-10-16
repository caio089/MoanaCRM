-- Cadastro de construtoras (admin)
CREATE TABLE IF NOT EXISTS public.construtoras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cidade text,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT construtoras_nome_unique UNIQUE (nome)
);

CREATE INDEX IF NOT EXISTS idx_construtoras_nome ON public.construtoras (nome);
CREATE INDEX IF NOT EXISTS idx_construtoras_ativo ON public.construtoras (ativo);

DROP TRIGGER IF EXISTS trg_construtoras_atualizado_em ON public.construtoras;
CREATE TRIGGER trg_construtoras_atualizado_em
  BEFORE UPDATE ON public.construtoras
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

ALTER TABLE public.construtoras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "construtoras_select_authenticated" ON public.construtoras;
CREATE POLICY "construtoras_select_authenticated"
  ON public.construtoras FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "construtoras_write_admin" ON public.construtoras;
CREATE POLICY "construtoras_write_admin"
  ON public.construtoras FOR ALL TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());
