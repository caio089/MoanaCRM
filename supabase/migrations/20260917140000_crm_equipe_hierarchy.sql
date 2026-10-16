-- CRM equipe + FKs tipadas (greenfield Postgres / Supabase)
-- Destino: Construtora Moana (dqmxwaoynkfgopmyxcvo)
-- Runtime via @supabase/supabase-js (sem Prisma/SQLite).

BEGIN;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  CREATE TYPE public.etapa_funil AS ENUM (
    'lead',
    'analise',
    'aprovado',
    'especulativo',
    'realizado',
    'reprovado',
    'visita'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- ---------------------------------------------------------------------------
-- Equipe
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coordenadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text,
  telefone text,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.corretores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text,
  telefone text,
  ativo boolean NOT NULL DEFAULT true,
  coordenador_id uuid REFERENCES public.coordenadores (id) ON DELETE SET NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.correspondentes_bancarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  banco text,
  contato text,
  email text,
  telefone text,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Users (auth local do app; espelho opcional)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Leads (espelho completo + FKs tipadas)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
  id text PRIMARY KEY,
  nome text NOT NULL,
  cpf text,
  telefone text,
  email text,
  cidade text,
  zona text,
  etapa public.etapa_funil NOT NULL,
  -- strings legadas (mantidas 1 release)
  corretor text,
  coordenador text,
  construtora text,
  origem text,
  modalidade text,
  tipo_renda text,
  comprovacao text,
  tipo_imovel text,
  vgv numeric,
  valor_avaliacao numeric,
  valor_fecho numeric,
  chb numeric,
  ccv boolean NOT NULL DEFAULT false,
  faturamento_previsto numeric,
  correspondente text,
  situacao_reprovado text,
  observacao text,
  id_imobilead text UNIQUE,
  criado_em timestamptz NOT NULL,
  atualizado_em timestamptz NOT NULL,
  -- FKs tipadas (nullable)
  coordenador_id uuid REFERENCES public.coordenadores (id) ON DELETE SET NULL,
  corretor_id uuid REFERENCES public.corretores (id) ON DELETE SET NULL,
  correspondente_id uuid REFERENCES public.correspondentes_bancarios (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.historico_etapas (
  id bigserial PRIMARY KEY,
  lead_id text NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  etapa_anterior public.etapa_funil,
  etapa_nova public.etapa_funil NOT NULL,
  data timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id bigserial PRIMARY KEY,
  payload jsonb NOT NULL,
  processado boolean NOT NULL DEFAULT false,
  erro text,
  recebido_em timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_coordenadores_nome ON public.coordenadores (nome);
CREATE INDEX IF NOT EXISTS idx_coordenadores_ativo ON public.coordenadores (ativo);

CREATE INDEX IF NOT EXISTS idx_corretores_nome ON public.corretores (nome);
CREATE INDEX IF NOT EXISTS idx_corretores_ativo ON public.corretores (ativo);
CREATE INDEX IF NOT EXISTS idx_corretores_coordenador_id ON public.corretores (coordenador_id);

CREATE INDEX IF NOT EXISTS idx_correspondentes_nome ON public.correspondentes_bancarios (nome);
CREATE INDEX IF NOT EXISTS idx_correspondentes_ativo ON public.correspondentes_bancarios (ativo);

CREATE INDEX IF NOT EXISTS idx_leads_etapa ON public.leads (etapa);
CREATE INDEX IF NOT EXISTS idx_leads_corretor ON public.leads (corretor);
CREATE INDEX IF NOT EXISTS idx_leads_cidade ON public.leads (cidade);
CREATE INDEX IF NOT EXISTS idx_leads_coordenador_id ON public.leads (coordenador_id);
CREATE INDEX IF NOT EXISTS idx_leads_corretor_id ON public.leads (corretor_id);
CREATE INDEX IF NOT EXISTS idx_leads_correspondente_id ON public.leads (correspondente_id);
CREATE INDEX IF NOT EXISTS idx_leads_criado_em ON public.leads (criado_em);

CREATE INDEX IF NOT EXISTS idx_historico_etapas_lead_id ON public.historico_etapas (lead_id);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_atualizado_em()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_coordenadores_atualizado_em ON public.coordenadores;
CREATE TRIGGER trg_coordenadores_atualizado_em
  BEFORE UPDATE ON public.coordenadores
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

DROP TRIGGER IF EXISTS trg_corretores_atualizado_em ON public.corretores;
CREATE TRIGGER trg_corretores_atualizado_em
  BEFORE UPDATE ON public.corretores
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

DROP TRIGGER IF EXISTS trg_correspondentes_atualizado_em ON public.correspondentes_bancarios;
CREATE TRIGGER trg_correspondentes_atualizado_em
  BEFORE UPDATE ON public.correspondentes_bancarios
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.coordenadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corretores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correspondentes_bancarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Helper: admin via JWT app_metadata only (nunca user_metadata — editável pelo usuário)
CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'role') = 'admin',
    false
  );
$$;

-- Coordenadores
DROP POLICY IF EXISTS "coordenadores_select_authenticated" ON public.coordenadores;
CREATE POLICY "coordenadores_select_authenticated"
  ON public.coordenadores FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "coordenadores_write_admin" ON public.coordenadores;
CREATE POLICY "coordenadores_write_admin"
  ON public.coordenadores FOR ALL TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

-- Corretores
DROP POLICY IF EXISTS "corretores_select_authenticated" ON public.corretores;
CREATE POLICY "corretores_select_authenticated"
  ON public.corretores FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "corretores_write_admin" ON public.corretores;
CREATE POLICY "corretores_write_admin"
  ON public.corretores FOR ALL TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

-- Correspondentes
DROP POLICY IF EXISTS "correspondentes_select_authenticated" ON public.correspondentes_bancarios;
CREATE POLICY "correspondentes_select_authenticated"
  ON public.correspondentes_bancarios FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "correspondentes_write_admin" ON public.correspondentes_bancarios;
CREATE POLICY "correspondentes_write_admin"
  ON public.correspondentes_bancarios FOR ALL TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

-- Leads
DROP POLICY IF EXISTS "leads_select_authenticated" ON public.leads;
CREATE POLICY "leads_select_authenticated"
  ON public.leads FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "leads_write_admin" ON public.leads;
CREATE POLICY "leads_write_admin"
  ON public.leads FOR ALL TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

-- Histórico
DROP POLICY IF EXISTS "historico_select_authenticated" ON public.historico_etapas;
CREATE POLICY "historico_select_authenticated"
  ON public.historico_etapas FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "historico_write_admin" ON public.historico_etapas;
CREATE POLICY "historico_write_admin"
  ON public.historico_etapas FOR ALL TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

-- Webhook logs: sem acesso anon; authenticated só admin
DROP POLICY IF EXISTS "webhook_logs_admin_all" ON public.webhook_logs;
CREATE POLICY "webhook_logs_admin_all"
  ON public.webhook_logs FOR ALL TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

-- Users: sem leitura pública; admin only (service role bypassa RLS)
DROP POLICY IF EXISTS "users_admin_all" ON public.users;
CREATE POLICY "users_admin_all"
  ON public.users FOR ALL TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

COMMIT;
