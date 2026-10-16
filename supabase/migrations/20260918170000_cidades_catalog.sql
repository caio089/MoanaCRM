-- Cadastro de cidades para seleção em leads
CREATE TABLE IF NOT EXISTS public.cidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  uf text NOT NULL DEFAULT 'PI',
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cidades_nome_uf_unique UNIQUE (nome, uf)
);

CREATE INDEX IF NOT EXISTS idx_cidades_nome ON public.cidades (nome);
CREATE INDEX IF NOT EXISTS idx_cidades_ativo ON public.cidades (ativo);

DROP TRIGGER IF EXISTS trg_cidades_atualizado_em ON public.cidades;
CREATE TRIGGER trg_cidades_atualizado_em
  BEFORE UPDATE ON public.cidades
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

ALTER TABLE public.cidades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cidades_select_authenticated" ON public.cidades;
CREATE POLICY "cidades_select_authenticated"
  ON public.cidades FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "cidades_write_admin" ON public.cidades;
CREATE POLICY "cidades_write_admin"
  ON public.cidades FOR ALL TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());
