-- Módulo 2: CRM de Aluguel (schema only, sem dados pessoais).
-- Tipo de operação, campos condicionais, bairros e catálogo próprio vs parceira.

-- ---------------------------------------------------------------------------
-- Construtoras: origem do catálogo (parceira × produto próprio)
-- ---------------------------------------------------------------------------
ALTER TABLE public.construtoras
  ADD COLUMN IF NOT EXISTS origem_catalogo text NOT NULL DEFAULT 'parceira';

ALTER TABLE public.construtoras
  DROP CONSTRAINT IF EXISTS construtoras_origem_catalogo_check;

ALTER TABLE public.construtoras
  ADD CONSTRAINT construtoras_origem_catalogo_check
  CHECK (origem_catalogo IN ('parceira', 'proprio'));

CREATE INDEX IF NOT EXISTS idx_construtoras_origem_catalogo
  ON public.construtoras (origem_catalogo);

-- ---------------------------------------------------------------------------
-- Bairros vinculados a cidade
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bairros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cidade_id uuid NOT NULL REFERENCES public.cidades (id) ON DELETE CASCADE,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bairros_cidade_nome_unique UNIQUE (cidade_id, nome)
);

CREATE INDEX IF NOT EXISTS idx_bairros_cidade_id ON public.bairros (cidade_id);
CREATE INDEX IF NOT EXISTS idx_bairros_ativo ON public.bairros (ativo);

DROP TRIGGER IF EXISTS trg_bairros_atualizado_em ON public.bairros;
CREATE TRIGGER trg_bairros_atualizado_em
  BEFORE UPDATE ON public.bairros
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

ALTER TABLE public.bairros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bairros_select_authenticated" ON public.bairros;
CREATE POLICY "bairros_select_authenticated"
  ON public.bairros FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "bairros_write_admin" ON public.bairros;
CREATE POLICY "bairros_write_admin"
  ON public.bairros FOR ALL TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bairros TO authenticated;

-- ---------------------------------------------------------------------------
-- Leads: operação, contrato, VGA e vínculo de bairro
-- ---------------------------------------------------------------------------
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS tipo_operacao text NOT NULL DEFAULT 'venda';

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_tipo_operacao_check;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_tipo_operacao_check
  CHECK (tipo_operacao IN ('venda', 'aluguel'));

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS tipo_contrato text;

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_tipo_contrato_check;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_tipo_contrato_check
  CHECK (tipo_contrato IS NULL OR tipo_contrato IN ('locacao', 'compra_venda', 'permuta'));

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS valor_locacao_mensal numeric;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS titularidade text;

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_titularidade_check;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_titularidade_check
  CHECK (titularidade IS NULL OR titularidade IN ('construtora', 'proprio'));

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS prazo_contrato_meses integer NOT NULL DEFAULT 12;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS bairro_id uuid REFERENCES public.bairros (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_tipo_operacao ON public.leads (tipo_operacao);
CREATE INDEX IF NOT EXISTS idx_leads_bairro_id ON public.leads (bairro_id);

COMMENT ON COLUMN public.leads.tipo_operacao IS 'venda = funil de financiamento; aluguel = funil de locação';
COMMENT ON COLUMN public.leads.valor_locacao_mensal IS 'Aluguel mensal. VGA = valor_locacao_mensal * prazo_contrato_meses';
