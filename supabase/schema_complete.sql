-- MoanaCRM — schema completo (tabelas, RLS, RPCs, catálogos). Sem dados de pessoas.
-- Cole no SQL Editor do projeto https://dqmxwaoynkfgopmyxcvo.supabase.co
-- Idempotente na maior parte (IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS).
-- Se o run anterior falhou no meio COM transação aberta, nada foi gravado: rode de novo inteiro.
-- Se o run anterior falhou no meio SEM transação, rode de novo: CREATE TABLE IF NOT EXISTS cobre o começo.


-- ============================================================
-- FILE: 20260917140000_crm_equipe_hierarchy.sql
-- ============================================================
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


-- ============================================================
-- FILE: 20260917150000_webhook_rpcs.sql
-- ============================================================
-- RPCs de webhook/ingest (schema only). SECURITY DEFINER com search_path fixo.
-- Execute revogado de PUBLIC; anon/authenticated só nas funções usadas pelo webhook.

CREATE OR REPLACE FUNCTION public.ingest_webhook_log(p_payload jsonb, p_erro text DEFAULT NULL)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id bigint;
BEGIN
  INSERT INTO public.webhook_logs (payload, processado, erro)
  VALUES (p_payload, p_erro IS NULL, p_erro)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_correspondente_nome(p_nome text)
RETURNS TABLE(id uuid, nome text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.nome
  FROM public.correspondentes_bancarios c
  WHERE c.ativo = true
    AND lower(trim(c.nome)) = lower(trim(p_nome))
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_equipe_por_nome(p_corretor text, p_coordenador text)
RETURNS TABLE(corretor_id uuid, coordenador_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT cr.id FROM public.corretores cr WHERE cr.ativo AND lower(trim(cr.nome)) = lower(trim(p_corretor)) LIMIT 1),
    (SELECT co.id FROM public.coordenadores co WHERE co.ativo AND lower(trim(co.nome)) = lower(trim(p_coordenador)) LIMIT 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_lead_from_webhook(p_lead jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lead_id text := p_lead->>'id';
BEGIN
  IF lead_id IS NULL OR length(trim(lead_id)) = 0 THEN
    RAISE EXCEPTION 'Lead sem id';
  END IF;

  INSERT INTO public.leads (
    id, nome, cpf, telefone, email, cidade, zona, etapa,
    corretor, coordenador, construtora, origem, modalidade, tipo_renda, comprovacao, tipo_imovel,
    vgv, valor_avaliacao, valor_fecho, chb, ccv, faturamento_previsto, correspondente,
    situacao_reprovado, observacao, id_imobilead, criado_em, atualizado_em,
    coordenador_id, corretor_id, correspondente_id
  ) VALUES (
    lead_id,
    coalesce(p_lead->>'nome', 'Lead sem nome'),
    p_lead->>'cpf',
    p_lead->>'telefone',
    p_lead->>'email',
    p_lead->>'cidade',
    p_lead->>'zona',
    (p_lead->>'etapa')::public.etapa_funil,
    p_lead->>'corretor',
    p_lead->>'coordenador',
    p_lead->>'construtora',
    p_lead->>'origem',
    p_lead->>'modalidade',
    p_lead->>'tipo_renda',
    p_lead->>'comprovacao',
    p_lead->>'tipo_imovel',
    NULLIF(p_lead->>'vgv','')::numeric,
    NULLIF(p_lead->>'valor_avaliacao','')::numeric,
    NULLIF(p_lead->>'valor_fecho','')::numeric,
    NULLIF(p_lead->>'chb','')::numeric,
    COALESCE((p_lead->>'ccv')::boolean, false),
    NULLIF(p_lead->>'faturamento_previsto','')::numeric,
    p_lead->>'correspondente',
    p_lead->>'situacao_reprovado',
    p_lead->>'observacao',
    p_lead->>'id_imobilead',
    COALESCE((p_lead->>'criado_em')::timestamptz, now()),
    COALESCE((p_lead->>'atualizado_em')::timestamptz, now()),
    NULLIF(p_lead->>'coordenador_id','')::uuid,
    NULLIF(p_lead->>'corretor_id','')::uuid,
    NULLIF(p_lead->>'correspondente_id','')::uuid
  )
  ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    etapa = EXCLUDED.etapa,
    atualizado_em = EXCLUDED.atualizado_em,
    corretor = EXCLUDED.corretor,
    coordenador = EXCLUDED.coordenador,
    correspondente = EXCLUDED.correspondente,
    coordenador_id = COALESCE(EXCLUDED.coordenador_id, public.leads.coordenador_id),
    corretor_id = COALESCE(EXCLUDED.corretor_id, public.leads.corretor_id),
    correspondente_id = COALESCE(EXCLUDED.correspondente_id, public.leads.correspondente_id);

  RETURN lead_id;
END;
$$;

REVOKE ALL ON FUNCTION public.ingest_webhook_log(jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_correspondente_nome(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_equipe_por_nome(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_lead_from_webhook(jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.ingest_webhook_log(jsonb, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_correspondente_nome(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_equipe_por_nome(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_lead_from_webhook(jsonb) TO anon, authenticated;


-- ============================================================
-- FILE: 20260918170000_cidades_catalog.sql
-- ============================================================
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


-- ============================================================
-- FILE: 20260918190000_corretor_self_signup.sql
-- ============================================================
-- Cadastro automático de corretor ao criar usuário no Auth
-- (já aplicado no projeto remoto; mantido no repo para rastreio)

ALTER TABLE public.corretores
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_corretores_user_id ON public.corretores(user_id);

CREATE OR REPLACE FUNCTION public.handle_new_corretor_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_nome text;
BEGIN
  v_role := coalesce(
    NEW.raw_app_meta_data->>'role',
    NEW.raw_user_meta_data->>'role',
    'user'
  );

  IF lower(v_role) = 'admin' THEN
    RETURN NEW;
  END IF;

  v_nome := nullif(trim(coalesce(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'nome',
    split_part(NEW.email, '@', 1)
  )), '');

  IF v_nome IS NULL THEN
    v_nome := split_part(NEW.email, '@', 1);
  END IF;

  INSERT INTO public.corretores (nome, email, user_id, ativo)
  VALUES (v_nome, NEW.email, NEW.id, true)
  ON CONFLICT (user_id) DO UPDATE
    SET nome = EXCLUDED.nome,
        email = EXCLUDED.email,
        ativo = true,
        atualizado_em = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_corretor ON auth.users;
CREATE TRIGGER on_auth_user_created_corretor
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_corretor_user();

DROP POLICY IF EXISTS "corretores_insert_own" ON public.corretores;
CREATE POLICY "corretores_insert_own"
  ON public.corretores FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_app_admin());

DROP POLICY IF EXISTS "corretores_update_own" ON public.corretores;
CREATE POLICY "corretores_update_own"
  ON public.corretores FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_app_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_app_admin());


-- ============================================================
-- FILE: 20260918200000_leads_timestamps_admin_fix.sql
-- ============================================================
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


-- ============================================================
-- FILE: 20260918210000_leads_produto_bairro.sql
-- ============================================================
-- Campos de visita: produto (empreendimento) e bairro
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS produto text,
  ADD COLUMN IF NOT EXISTS bairro text;

CREATE INDEX IF NOT EXISTS idx_leads_produto ON public.leads (produto);
CREATE INDEX IF NOT EXISTS idx_leads_bairro ON public.leads (bairro);


-- ============================================================
-- FILE: 20260918220000_construtoras_catalog.sql
-- ============================================================
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


-- ============================================================
-- FILE: 20260918230000_admin_set_equipe_ativo.sql
-- ============================================================
-- Admin: ativar/desativar corretores e coordenadores
CREATE OR REPLACE FUNCTION public.admin_set_equipe_ativo(
  p_tipo text,
  p_id uuid,
  p_ativo boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_app_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem ativar ou desativar a equipe';
  END IF;

  IF p_tipo = 'corretor' THEN
    UPDATE public.corretores
    SET ativo = p_ativo, atualizado_em = now()
    WHERE id = p_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Corretor não encontrado';
    END IF;
  ELSIF p_tipo = 'coordenador' THEN
    UPDATE public.coordenadores
    SET ativo = p_ativo, atualizado_em = now()
    WHERE id = p_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Coordenador não encontrado';
    END IF;
  ELSE
    RAISE EXCEPTION 'Tipo inválido: use corretor ou coordenador';
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_equipe_ativo(text, uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_equipe_ativo(text, uuid, boolean) TO authenticated;


-- ============================================================
-- FILE: 20260924220000_roles_scope_team_seed.sql
-- ============================================================
-- Papéis comerciais + escopo coordenador/corretor (sem seed de pessoas)
-- Destino: Construtora Moana (MoanaCRM)

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Vínculo Auth ↔ coordenador
-- ---------------------------------------------------------------------------
ALTER TABLE public.coordenadores
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_coordenadores_user_id ON public.coordenadores(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_coordenadores_email_lower
  ON public.coordenadores (lower(email))
  WHERE email IS NOT NULL AND length(trim(email)) > 0;

CREATE UNIQUE INDEX IF NOT EXISTS uq_corretores_email_lower
  ON public.corretores (lower(email))
  WHERE email IS NOT NULL AND length(trim(email)) > 0;

-- ---------------------------------------------------------------------------
-- 2) Helpers de papel / escopo (JWT app_metadata.role)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.app_role()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT lower(coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() ->> 'role',
    'corretor'
  ));
$$;

CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT public.app_role() IN ('admin');
$$;

CREATE OR REPLACE FUNCTION public.is_app_coordenador()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT public.app_role() IN ('coordenador', 'supervisor');
$$;

CREATE OR REPLACE FUNCTION public.is_app_corretor()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT public.app_role() IN ('corretor', 'user', 'consultor')
    OR public.app_role() NOT IN ('admin', 'coordenador', 'supervisor');
$$;

CREATE OR REPLACE FUNCTION public.current_coordenador_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id
  FROM public.coordenadores c
  WHERE c.user_id = auth.uid()
     OR (c.email IS NOT NULL AND lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  ORDER BY CASE WHEN c.user_id = auth.uid() THEN 0 ELSE 1 END
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_corretor_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id
  FROM public.corretores c
  WHERE c.user_id = auth.uid()
     OR (c.email IS NOT NULL AND lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  ORDER BY CASE WHEN c.user_id = auth.uid() THEN 0 ELSE 1 END
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.can_see_lead(p_lead public.leads)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_app_admin()
    OR (
      public.is_app_coordenador()
      AND public.current_coordenador_id() IS NOT NULL
      AND (
        p_lead.coordenador_id = public.current_coordenador_id()
        OR p_lead.corretor_id IN (
          SELECT cr.id FROM public.corretores cr
          WHERE cr.coordenador_id = public.current_coordenador_id()
        )
        OR (
          p_lead.coordenador IS NOT NULL
          AND lower(trim(p_lead.coordenador)) = (
            SELECT lower(trim(c.nome)) FROM public.coordenadores c
            WHERE c.id = public.current_coordenador_id()
          )
        )
        OR (
          p_lead.corretor IS NOT NULL
          AND lower(trim(p_lead.corretor)) IN (
            SELECT lower(trim(cr.nome)) FROM public.corretores cr
            WHERE cr.coordenador_id = public.current_coordenador_id()
          )
        )
      )
    )
    OR (
      public.current_corretor_id() IS NOT NULL
      AND (
        p_lead.corretor_id = public.current_corretor_id()
        OR (
          p_lead.corretor IS NOT NULL
          AND lower(trim(p_lead.corretor)) = (
            SELECT lower(trim(cr.nome)) FROM public.corretores cr
            WHERE cr.id = public.current_corretor_id()
          )
        )
      )
    );
$$;

REVOKE ALL ON FUNCTION public.app_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_app_coordenador() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_app_corretor() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_coordenador_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_corretor_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_see_lead(public.leads) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.app_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_app_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_app_coordenador() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_app_corretor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_coordenador_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_corretor_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_see_lead(public.leads) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3) Signup: admin skip; coordenador → coordenadores; demais → corretores
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_corretor_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_nome text;
BEGIN
  v_role := lower(coalesce(
    NEW.raw_app_meta_data->>'role',
    NEW.raw_user_meta_data->>'role',
    'corretor'
  ));

  IF v_role IN ('admin') THEN
    RETURN NEW;
  END IF;

  v_nome := nullif(trim(coalesce(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'nome',
    split_part(NEW.email, '@', 1)
  )), '');

  IF v_nome IS NULL THEN
    v_nome := split_part(NEW.email, '@', 1);
  END IF;

  IF v_role IN ('coordenador', 'supervisor') THEN
    -- Vincula cadastro existente por e-mail ou cria linha
    UPDATE public.coordenadores
       SET user_id = NEW.id,
           nome = COALESCE(NULLIF(trim(nome), ''), v_nome),
           email = COALESCE(email, NEW.email),
           ativo = true,
           atualizado_em = now()
     WHERE user_id = NEW.id
        OR (email IS NOT NULL AND lower(email) = lower(NEW.email));

    IF NOT FOUND THEN
      INSERT INTO public.coordenadores (nome, email, user_id, ativo)
      VALUES (v_nome, NEW.email, NEW.id, true);
    END IF;

    RETURN NEW;
  END IF;

  -- corretor (padrão)
  UPDATE public.corretores
     SET user_id = NEW.id,
         nome = COALESCE(NULLIF(trim(nome), ''), v_nome),
         email = COALESCE(email, NEW.email),
         ativo = true,
         atualizado_em = now()
   WHERE user_id = NEW.id
      OR (email IS NOT NULL AND lower(email) = lower(NEW.email));

  IF NOT FOUND THEN
    INSERT INTO public.corretores (nome, email, user_id, ativo)
    VALUES (v_nome, NEW.email, NEW.id, true)
    ON CONFLICT (user_id) DO UPDATE
      SET nome = EXCLUDED.nome,
          email = EXCLUDED.email,
          ativo = true,
          atualizado_em = now();
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4) RLS escopado
-- ---------------------------------------------------------------------------

-- Coordenadores
DROP POLICY IF EXISTS "coordenadores_select_authenticated" ON public.coordenadores;
CREATE POLICY "coordenadores_select_authenticated"
  ON public.coordenadores FOR SELECT TO authenticated
  USING (
    public.is_app_admin()
    OR user_id = auth.uid()
    OR id = public.current_coordenador_id()
    OR id IN (
      SELECT cr.coordenador_id
      FROM public.corretores cr
      WHERE cr.id = public.current_corretor_id()
        AND cr.coordenador_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "coordenadores_write_admin" ON public.coordenadores;
CREATE POLICY "coordenadores_write_admin"
  ON public.coordenadores FOR ALL TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

-- Corretores
DROP POLICY IF EXISTS "corretores_select_authenticated" ON public.corretores;
CREATE POLICY "corretores_select_authenticated"
  ON public.corretores FOR SELECT TO authenticated
  USING (
    public.is_app_admin()
    OR user_id = auth.uid()
    OR id = public.current_corretor_id()
    OR (
      public.is_app_coordenador()
      AND coordenador_id = public.current_coordenador_id()
    )
  );

DROP POLICY IF EXISTS "corretores_write_admin" ON public.corretores;
CREATE POLICY "corretores_write_admin"
  ON public.corretores FOR ALL TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

-- Leads
DROP POLICY IF EXISTS "leads_select_authenticated" ON public.leads;
CREATE POLICY "leads_select_authenticated"
  ON public.leads FOR SELECT TO authenticated
  USING (public.can_see_lead(leads));

DROP POLICY IF EXISTS "leads_write_admin" ON public.leads;
CREATE POLICY "leads_write_admin"
  ON public.leads FOR ALL TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

DROP POLICY IF EXISTS "leads_update_scoped" ON public.leads;
CREATE POLICY "leads_update_scoped"
  ON public.leads FOR UPDATE TO authenticated
  USING (public.can_see_lead(leads) AND NOT public.is_app_admin())
  WITH CHECK (public.can_see_lead(leads));

DROP POLICY IF EXISTS "leads_insert_scoped" ON public.leads;
CREATE POLICY "leads_insert_scoped"
  ON public.leads FOR INSERT TO authenticated
  WITH CHECK (
    public.is_app_admin()
    OR (
      public.is_app_coordenador()
      AND (
        coordenador_id = public.current_coordenador_id()
        OR coordenador_id IS NULL
      )
    )
    OR (
      public.current_corretor_id() IS NOT NULL
      AND (
        corretor_id = public.current_corretor_id()
        OR corretor_id IS NULL
      )
    )
  );

-- Histórico: leitura alinhada ao lead; escrita admin ou quem vê o lead
DROP POLICY IF EXISTS "historico_select_authenticated" ON public.historico_etapas;
CREATE POLICY "historico_select_authenticated"
  ON public.historico_etapas FOR SELECT TO authenticated
  USING (
    public.is_app_admin()
    OR EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = historico_etapas.lead_id
        AND public.can_see_lead(l)
    )
  );

DROP POLICY IF EXISTS "historico_write_admin" ON public.historico_etapas;
CREATE POLICY "historico_write_admin"
  ON public.historico_etapas FOR ALL TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

DROP POLICY IF EXISTS "historico_insert_scoped" ON public.historico_etapas;
CREATE POLICY "historico_insert_scoped"
  ON public.historico_etapas FOR INSERT TO authenticated
  WITH CHECK (
    public.is_app_admin()
    OR EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_id
        AND public.can_see_lead(l)
    )
  );

-- Correspondentes / catálogos: leitura autenticada; escrita admin (mantém)
-- (policies existentes de write_admin)

-- Sem seed de pessoas. Vínculo Auth ↔ equipe quando e-mails coincidirem (cadastros futuros).
UPDATE public.coordenadores c
SET user_id = u.id, atualizado_em = now()
FROM auth.users u
WHERE c.email IS NOT NULL
  AND lower(c.email) = lower(u.email)
  AND (c.user_id IS DISTINCT FROM u.id);

UPDATE public.corretores c
SET user_id = u.id, atualizado_em = now()
FROM auth.users u
WHERE c.email IS NOT NULL
  AND lower(c.email) = lower(u.email)
  AND (c.user_id IS DISTINCT FROM u.id);

COMMIT;


-- ============================================================
-- FILE: 20260924233000_leads_pool_admin_distribuir.sql
-- ============================================================
-- Pool de leads sem corretor: só admin vê; RPC para distribuir a corretores.

CREATE OR REPLACE FUNCTION public.can_see_lead(p_lead public.leads)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_app_admin()
    OR (
      -- Lead ainda no pool (não distribuído): somente admin
      NOT (
        p_lead.corretor_id IS NULL
        AND (p_lead.corretor IS NULL OR length(trim(p_lead.corretor)) = 0)
      )
      AND (
        (
          public.is_app_coordenador()
          AND public.current_coordenador_id() IS NOT NULL
          AND (
            p_lead.coordenador_id = public.current_coordenador_id()
            OR p_lead.corretor_id IN (
              SELECT cr.id FROM public.corretores cr
              WHERE cr.coordenador_id = public.current_coordenador_id()
            )
            OR (
              p_lead.coordenador IS NOT NULL
              AND lower(trim(p_lead.coordenador)) = (
                SELECT lower(trim(c.nome)) FROM public.coordenadores c
                WHERE c.id = public.current_coordenador_id()
              )
            )
            OR (
              p_lead.corretor IS NOT NULL
              AND lower(trim(p_lead.corretor)) IN (
                SELECT lower(trim(cr.nome)) FROM public.corretores cr
                WHERE cr.coordenador_id = public.current_coordenador_id()
              )
            )
          )
        )
        OR (
          public.current_corretor_id() IS NOT NULL
          AND (
            p_lead.corretor_id = public.current_corretor_id()
            OR (
              p_lead.corretor IS NOT NULL
              AND lower(trim(p_lead.corretor)) = (
                SELECT lower(trim(cr.nome)) FROM public.corretores cr
                WHERE cr.id = public.current_corretor_id()
              )
            )
          )
        )
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.admin_distribuir_lead(
  p_lead_id text,
  p_corretor_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_corr public.corretores%ROWTYPE;
  v_coord_nome text;
BEGIN
  IF NOT public.is_app_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem distribuir leads';
  END IF;

  SELECT * INTO v_corr FROM public.corretores WHERE id = p_corretor_id AND ativo = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Corretor não encontrado ou inativo';
  END IF;

  IF v_corr.coordenador_id IS NOT NULL THEN
    SELECT nome INTO v_coord_nome FROM public.coordenadores WHERE id = v_corr.coordenador_id;
  END IF;

  UPDATE public.leads
  SET corretor_id = v_corr.id,
      corretor = v_corr.nome,
      coordenador_id = v_corr.coordenador_id,
      coordenador = v_coord_nome,
      atualizado_em = now()
  WHERE id = p_lead_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead não encontrado';
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_distribuir_lead(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_distribuir_lead(text, uuid) TO authenticated;


-- ============================================================
-- FILE: 20260925123000_purge_demo_catalogs_real_cidades.sql
-- ============================================================
-- Remove catálogos inventados (demo CE + Banco Inter) e semeia cidades reais dos leads.

DELETE FROM public.cidades;

DELETE FROM public.correspondentes_bancarios
WHERE lower(btrim(nome)) = 'banco inter';

INSERT INTO public.cidades (nome, uf, ativo) VALUES
  ('Teresina', 'PI', true),
  ('Altos', 'PI', true),
  ('Demerval Lobão', 'PI', true),
  ('Timon', 'MA', true)
ON CONFLICT (nome, uf) DO UPDATE SET
  ativo = true,
  atualizado_em = now();

ALTER TABLE public.cidades ALTER COLUMN uf SET DEFAULT 'PI';


-- ============================================================
-- FILE: 20260925124000_team_select_for_lead_forms.sql
-- ============================================================
-- Leitura de equipe para selects de lead (antes o corretor só via a si mesmo e o form quebrava)
DROP POLICY IF EXISTS "corretores_select_authenticated" ON public.corretores;
CREATE POLICY "corretores_select_authenticated"
  ON public.corretores FOR SELECT TO authenticated
  USING (ativo = true OR public.is_app_admin() OR user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "coordenadores_select_authenticated" ON public.coordenadores;
CREATE POLICY "coordenadores_select_authenticated"
  ON public.coordenadores FOR SELECT TO authenticated
  USING (ativo = true OR public.is_app_admin() OR user_id = (SELECT auth.uid()));


-- ============================================================
-- FILE: 20260925125000_leads_delete_scoped.sql
-- ============================================================
-- Quem enxerga o lead pode excluí-lo (admin já cobre via leads_write_admin ALL)
DROP POLICY IF EXISTS "leads_delete_scoped" ON public.leads;
CREATE POLICY "leads_delete_scoped"
  ON public.leads FOR DELETE TO authenticated
  USING (public.can_see_lead(leads));


-- ============================================================
-- FILE: 20260925130835_seed_construtoras_planilha.sql
-- ============================================================
-- Construtoras extraídas de "PRECOS CONSTRUTORAS.xlsx".
-- A planilha repete RBC e Ramy; o seed consolida nomes únicos.
-- Sem TEMP TABLE: o SQL Editor do Supabase autocommita cada statement,
-- então CREATE TEMP ... ON COMMIT DROP apagava a tabela antes do INSERT.

DO $$
BEGIN
  CREATE TEMP TABLE seed_construtoras_planilha (
    nome text PRIMARY KEY,
    cidade text NOT NULL
  );

  INSERT INTO seed_construtoras_planilha (nome, cidade) VALUES
    ('Construtora Moana', 'Teresina'),
    ('Moreira e Sousa', 'Teresina, Demerval Lobão, Altos'),
    ('Coesa', 'Teresina'),
    ('Ágape', 'Teresina'),
    ('MRV', 'Teresina'),
    ('Canopus', 'Timon, Teresina'),
    ('Logus', 'Teresina'),
    ('Rivello', 'Teresina'),
    ('Semog', 'Timon, Teresina'),
    ('Lima e Santos', 'Teresina, Altos'),
    ('Valdomiro', 'Teresina'),
    ('Domus', 'Teresina'),
    ('RBC', 'Timon'),
    ('Macedo Fortes', 'Teresina'),
    ('Voitto', 'Teresina, Demerval Lobão'),
    ('Home', 'Teresina, Demerval Lobão, Altos'),
    ('Hack Engenharia', 'Teresina, Demerval Lobão, Altos'),
    ('PG', 'Teresina'),
    ('Construville', 'Altos'),
    ('Innovar', 'Altos'),
    ('Lavezzi', 'Teresina'),
    ('JD Construções', 'Teresina'),
    ('Engenhatec', 'Teresina'),
    ('Betacon', 'Teresina'),
    ('Montana', 'Altos, Demerval Lobão'),
    ('AR Construtora', 'Altos, Demerval Lobão'),
    ('Ypê', 'Altos, Teresina'),
    ('Virtude', 'Teresina'),
    ('Consteng', 'Altos, Demerval Lobão'),
    ('KF', 'Timon'),
    ('Rocha', 'Timon'),
    ('M3', 'Timon'),
    ('RS', 'Timon'),
    ('Ramy', 'Timon');

  -- Reativa e atualiza cadastros existentes (acentos/caixa ignorados).
  UPDATE public.construtoras AS c
  SET cidade = s.cidade,
      ativo = true,
      atualizado_em = now()
  FROM seed_construtoras_planilha AS s
  WHERE translate(lower(regexp_replace(btrim(c.nome), '\s+', ' ', 'g')),
                  'áàâãäéèêëíìîïóòôõöúùûüç',
                  'aaaaaeeeeiiiiooooouuuuc') =
        translate(lower(regexp_replace(btrim(s.nome), '\s+', ' ', 'g')),
                  'áàâãäéèêëíìîïóòôõöúùûüç',
                  'aaaaaeeeeiiiiooooouuuuc');

  -- Insere apenas os nomes ainda ausentes (idempotente).
  INSERT INTO public.construtoras (nome, cidade, ativo)
  SELECT s.nome, s.cidade, true
  FROM seed_construtoras_planilha AS s
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.construtoras AS c
    WHERE translate(lower(regexp_replace(btrim(c.nome), '\s+', ' ', 'g')),
                    'áàâãäéèêëíìîïóòôõöúùûüç',
                    'aaaaaeeeeiiiiooooouuuuc') =
          translate(lower(regexp_replace(btrim(s.nome), '\s+', ' ', 'g')),
                    'áàâãäéèêëíìîïóòôõöúùûüç',
                    'aaaaaeeeeiiiiooooouuuuc')
  )
  ON CONFLICT (nome) DO UPDATE SET
    cidade = EXCLUDED.cidade,
    ativo = true,
    atualizado_em = now();
END
$$;


-- ============================================================
-- FILE: 20260925131426_isolate_coordinator_teams.sql
-- ============================================================
-- Isola os cadastros de equipe por coordenador.
-- Administradores continuam vendo todas as equipes.
-- Coordenadores veem somente o proprio cadastro e seus corretores.
-- Corretores veem somente o proprio cadastro e seu coordenador.

BEGIN;

DROP POLICY IF EXISTS "coordenadores_select_authenticated" ON public.coordenadores;
CREATE POLICY "coordenadores_select_authenticated"
  ON public.coordenadores
  FOR SELECT
  TO authenticated
  USING (
    (SELECT public.is_app_admin())
    OR user_id = (SELECT auth.uid())
    OR id = (SELECT public.current_coordenador_id())
    OR id IN (
      SELECT cr.coordenador_id
      FROM public.corretores AS cr
      WHERE cr.id = (SELECT public.current_corretor_id())
        AND cr.coordenador_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "corretores_select_authenticated" ON public.corretores;
CREATE POLICY "corretores_select_authenticated"
  ON public.corretores
  FOR SELECT
  TO authenticated
  USING (
    (SELECT public.is_app_admin())
    OR user_id = (SELECT auth.uid())
    OR id = (SELECT public.current_corretor_id())
    OR (
      (SELECT public.is_app_coordenador())
      AND coordenador_id = (SELECT public.current_coordenador_id())
    )
  );

COMMIT;


-- ============================================================
-- FILE: 20260925132326_coordinator_own_team_scope.sql
-- ============================================================
-- Garante que cada coordenador veja toda a propria equipe e nenhuma outra.
-- O vinculo seguro Auth -> coordenadores passa a ser a fonte de autorizacao;
-- app_metadata.role continua sincronizado para a interface e demais recursos.

BEGIN;

-- Vincula contas existentes ao cadastro de coordenadores pelo e-mail confirmado.
UPDATE public.coordenadores AS c
SET user_id = u.id,
    atualizado_em = now()
FROM auth.users AS u
WHERE c.ativo = true
  AND c.email IS NOT NULL
  AND lower(c.email) = lower(u.email)
  AND c.user_id IS DISTINCT FROM u.id;

-- Mantem o papel seguro em app_metadata. Administradores nunca sao rebaixados.
UPDATE auth.users AS u
SET raw_app_meta_data =
      coalesce(u.raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('role', 'coordenador'),
    updated_at = now()
FROM public.coordenadores AS c
WHERE c.ativo = true
  AND (
    c.user_id = u.id
    OR (c.email IS NOT NULL AND lower(c.email) = lower(u.email))
  )
  AND coalesce(u.raw_app_meta_data ->> 'role', '') <> 'admin';

-- O escopo considera somente cadastros ativos e sempre identifica o chamador.
CREATE OR REPLACE FUNCTION public.current_coordenador_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT c.id
  FROM public.coordenadores AS c
  WHERE c.ativo = true
    AND (
      c.user_id = (SELECT auth.uid())
      OR (
        c.email IS NOT NULL
        AND lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
    )
  ORDER BY CASE WHEN c.user_id = (SELECT auth.uid()) THEN 0 ELSE 1 END
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_corretor_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT c.id
  FROM public.corretores AS c
  WHERE c.ativo = true
    AND (
      c.user_id = (SELECT auth.uid())
      OR (
        c.email IS NOT NULL
        AND lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
    )
  ORDER BY CASE WHEN c.user_id = (SELECT auth.uid()) THEN 0 ELSE 1 END
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_coordenador_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_corretor_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_coordenador_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_corretor_id() TO authenticated;

-- Administrador ve todos os coordenadores. Coordenador ve a si mesmo.
-- Corretor ve somente o coordenador ao qual esta vinculado.
DROP POLICY IF EXISTS "coordenadores_select_authenticated" ON public.coordenadores;
CREATE POLICY "coordenadores_select_authenticated"
  ON public.coordenadores
  FOR SELECT
  TO authenticated
  USING (
    (SELECT public.is_app_admin())
    OR user_id = (SELECT auth.uid())
    OR id = (SELECT public.current_coordenador_id())
    OR id IN (
      SELECT cr.coordenador_id
      FROM public.corretores AS cr
      WHERE cr.id = (SELECT public.current_corretor_id())
        AND cr.coordenador_id IS NOT NULL
    )
  );

-- Administrador: todos. Coordenador: apenas seus membros. Corretor: apenas ele.
DROP POLICY IF EXISTS "corretores_select_authenticated" ON public.corretores;
CREATE POLICY "corretores_select_authenticated"
  ON public.corretores
  FOR SELECT
  TO authenticated
  USING (
    (SELECT public.is_app_admin())
    OR user_id = (SELECT auth.uid())
    OR id = (SELECT public.current_corretor_id())
    OR (
      (SELECT public.current_coordenador_id()) IS NOT NULL
      AND coordenador_id = (SELECT public.current_coordenador_id())
    )
  );

-- Mantem o mesmo escopo nos leads, inclusive para contas cujo JWT ainda nao
-- foi atualizado depois da promocao para coordenador.
CREATE OR REPLACE FUNCTION public.can_see_lead(p_lead public.leads)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    public.is_app_admin()
    OR (
      -- Lead ainda no pool (nao distribuido): somente administrador.
      NOT (
        p_lead.corretor_id IS NULL
        AND (p_lead.corretor IS NULL OR length(trim(p_lead.corretor)) = 0)
      )
      AND (
        (
          public.current_coordenador_id() IS NOT NULL
          AND (
            p_lead.coordenador_id = public.current_coordenador_id()
            OR p_lead.corretor_id IN (
              SELECT cr.id
              FROM public.corretores AS cr
              WHERE cr.coordenador_id = public.current_coordenador_id()
            )
            OR (
              p_lead.coordenador IS NOT NULL
              AND lower(trim(p_lead.coordenador)) = (
                SELECT lower(trim(c.nome))
                FROM public.coordenadores AS c
                WHERE c.id = public.current_coordenador_id()
              )
            )
            OR (
              p_lead.corretor IS NOT NULL
              AND lower(trim(p_lead.corretor)) IN (
                SELECT lower(trim(cr.nome))
                FROM public.corretores AS cr
                WHERE cr.coordenador_id = public.current_coordenador_id()
              )
            )
          )
        )
        OR (
          public.current_corretor_id() IS NOT NULL
          AND (
            p_lead.corretor_id = public.current_corretor_id()
            OR (
              p_lead.corretor IS NOT NULL
              AND lower(trim(p_lead.corretor)) = (
                SELECT lower(trim(cr.nome))
                FROM public.corretores AS cr
                WHERE cr.id = public.current_corretor_id()
              )
            )
          )
        )
      )
    );
$$;

REVOKE ALL ON FUNCTION public.can_see_lead(public.leads) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_see_lead(public.leads) TO authenticated;

DROP POLICY IF EXISTS "leads_insert_scoped" ON public.leads;
CREATE POLICY "leads_insert_scoped"
  ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.is_app_admin())
    OR (
      (SELECT public.current_coordenador_id()) IS NOT NULL
      AND (
        coordenador_id = (SELECT public.current_coordenador_id())
        OR coordenador_id IS NULL
      )
    )
    OR (
      (SELECT public.current_corretor_id()) IS NOT NULL
      AND (
        corretor_id = (SELECT public.current_corretor_id())
        OR corretor_id IS NULL
      )
    )
  );

COMMIT;


-- ============================================================
-- FILE: 20261007150000_import_banco_dashboard.sql
-- ============================================================
-- Importação da planilha "Banco de Dados - Dashboard" (várias abas → 1 lead por pessoa).
-- Normalização, consolidação e deduplicação ficam no banco (funções + índices + view).

-- ─── Normalização ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.digits_only(p text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT nullif(regexp_replace(coalesce(p, ''), '\D', '', 'g'), '');
$$;

-- CPF válido só com 11 dígitos
CREATE OR REPLACE FUNCTION public.cpf_key(p text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT CASE WHEN length(public.digits_only(p)) = 11 THEN public.digits_only(p) END;
$$;

-- Telefone sem DDI 55; descarta números curtos demais para identificar alguém
CREATE OR REPLACE FUNCTION public.phone_key(p text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT CASE WHEN length(d) >= 10 THEN d END
  FROM (
    SELECT CASE
      WHEN length(public.digits_only(p)) >= 12 AND left(public.digits_only(p), 2) = '55'
        THEN substr(public.digits_only(p), 3)
      ELSE public.digits_only(p)
    END AS d
  ) s;
$$;

-- Nome em minúsculas, sem acento e com espaços simples (para apelidos de corretor)
CREATE OR REPLACE FUNCTION public.norm_text(p text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT nullif(lower(regexp_replace(trim(translate(coalesce(p, ''),
    'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç',
    'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc')), '\s+', ' ', 'g')), '');
$$;

-- Ordem do funil para escolher a etapa mais avançada quando a pessoa aparece em várias abas
CREATE OR REPLACE FUNCTION public.etapa_rank(p public.etapa_funil)
RETURNS int LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT CASE p
    WHEN 'realizado' THEN 7
    WHEN 'especulativo' THEN 6
    WHEN 'aprovado' THEN 5
    WHEN 'reprovado' THEN 4
    WHEN 'visita' THEN 3
    WHEN 'analise' THEN 2
    ELSE 1
  END;
$$;

-- ─── Índices de deduplicação / pool ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_leads_cpf_key ON public.leads (public.cpf_key(cpf)) WHERE public.cpf_key(cpf) IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_phone_key ON public.leads (public.phone_key(telefone)) WHERE public.phone_key(telefone) IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_pool ON public.leads (atualizado_em DESC) WHERE corretor_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_atualizado_em ON public.leads (atualizado_em DESC);

-- Nome do consultor como estava na planilha (ajuda a redistribuir quem caiu na central)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS corretor_origem text;

-- ─── Apelidos de corretor (planilhas usam "VALQUIRIA", "Valquiria", ...) ───
CREATE TABLE IF NOT EXISTS public.corretor_aliases (
  alias_norm text PRIMARY KEY,
  corretor_id uuid REFERENCES public.corretores(id) ON DELETE CASCADE,
  coordenador_id uuid REFERENCES public.coordenadores(id) ON DELETE CASCADE,
  nome_exibicao text NOT NULL,
  CHECK (alias_norm = public.norm_text(alias_norm))
);
ALTER TABLE public.corretor_aliases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS corretor_aliases_admin ON public.corretor_aliases;
CREATE POLICY corretor_aliases_admin ON public.corretor_aliases
  FOR ALL TO authenticated USING (public.is_app_admin()) WITH CHECK (public.is_app_admin());

-- ─── Staging (linhas brutas de cada aba) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads_import_staging (
  id bigserial PRIMARY KEY,
  lote text NOT NULL,
  aba text NOT NULL,
  linha int NOT NULL,
  etapa public.etapa_funil NOT NULL,
  data_entrada date,
  nome text NOT NULL,
  cpf text,
  telefone text,
  email text,
  cidade text,
  zona text,
  origem text,
  corretor_raw text,
  construtora text,
  modalidade text,
  tipo_renda text,
  comprovacao text,
  tipo_imovel text,
  correspondente text,
  observacao text,
  vgv numeric,
  valor_avaliacao numeric,
  valor_fecho numeric,
  ccv boolean,
  UNIQUE (lote, aba, linha)
);
ALTER TABLE public.leads_import_staging ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS leads_import_staging_admin ON public.leads_import_staging;
CREATE POLICY leads_import_staging_admin ON public.leads_import_staging
  FOR ALL TO authenticated USING (public.is_app_admin()) WITH CHECK (public.is_app_admin());

-- ─── View: 1 linha por pessoa, etapa mais avançada, campos preenchidos de qualquer aba ───
CREATE OR REPLACE VIEW public.v_import_leads_consolidado
WITH (security_invoker = true) AS
WITH keyed AS (
  SELECT s.*,
    coalesce(
      'cpf:' || public.cpf_key(s.cpf),
      'tel:' || public.phone_key(s.telefone),
      'nome:' || public.norm_text(s.nome)
    ) AS pessoa_key,
    public.etapa_rank(s.etapa) AS rank
  FROM public.leads_import_staging s
),
grouped AS (
  SELECT
    lote,
    pessoa_key,
    (array_agg(etapa ORDER BY rank DESC, data_entrada DESC NULLS LAST))[1] AS etapa,
    (array_agg(nome ORDER BY rank DESC, data_entrada DESC NULLS LAST))[1] AS nome,
    min(data_entrada) AS data_entrada,
    (array_agg(public.cpf_key(cpf)) FILTER (WHERE public.cpf_key(cpf) IS NOT NULL))[1] AS cpf,
    (array_agg(telefone ORDER BY data_entrada DESC NULLS LAST) FILTER (WHERE public.phone_key(telefone) IS NOT NULL))[1] AS telefone,
    (array_agg(email) FILTER (WHERE email IS NOT NULL))[1] AS email,
    (array_agg(cidade ORDER BY rank DESC) FILTER (WHERE cidade IS NOT NULL))[1] AS cidade,
    (array_agg(zona ORDER BY rank DESC) FILTER (WHERE zona IS NOT NULL))[1] AS zona,
    (array_agg(origem ORDER BY data_entrada NULLS LAST) FILTER (WHERE origem IS NOT NULL))[1] AS origem,
    (array_agg(corretor_raw ORDER BY data_entrada DESC NULLS LAST, rank DESC) FILTER (WHERE corretor_raw IS NOT NULL))[1] AS corretor_raw,
    (array_agg(construtora ORDER BY rank DESC) FILTER (WHERE construtora IS NOT NULL))[1] AS construtora,
    (array_agg(modalidade ORDER BY rank DESC) FILTER (WHERE modalidade IS NOT NULL))[1] AS modalidade,
    (array_agg(tipo_renda ORDER BY rank DESC) FILTER (WHERE tipo_renda IS NOT NULL))[1] AS tipo_renda,
    (array_agg(comprovacao ORDER BY rank DESC) FILTER (WHERE comprovacao IS NOT NULL))[1] AS comprovacao,
    (array_agg(tipo_imovel ORDER BY rank DESC) FILTER (WHERE tipo_imovel IS NOT NULL))[1] AS tipo_imovel,
    (array_agg(correspondente ORDER BY rank DESC) FILTER (WHERE correspondente IS NOT NULL))[1] AS correspondente,
    string_agg(DISTINCT observacao, ' | ') FILTER (WHERE observacao IS NOT NULL) AS observacao,
    (array_agg(vgv ORDER BY rank DESC) FILTER (WHERE vgv > 0))[1] AS vgv,
    (array_agg(valor_avaliacao ORDER BY rank DESC) FILTER (WHERE valor_avaliacao > 0))[1] AS valor_avaliacao,
    (array_agg(valor_fecho ORDER BY rank DESC) FILTER (WHERE valor_fecho > 0))[1] AS valor_fecho,
    coalesce(bool_or(ccv), false) AS ccv,
    string_agg(DISTINCT aba, ', ') AS abas
  FROM keyed
  GROUP BY lote, pessoa_key
)
SELECT
  g.*,
  a.nome_exibicao AS corretor_resolvido,
  a.corretor_id,
  coalesce(a.coordenador_id, cr.coordenador_id) AS coordenador_id,
  co.nome AS coordenador_nome
FROM grouped g
LEFT JOIN public.corretor_aliases a ON a.alias_norm = public.norm_text(g.corretor_raw)
LEFT JOIN public.corretores cr ON cr.id = a.corretor_id
LEFT JOIN public.coordenadores co ON co.id = coalesce(a.coordenador_id, cr.coordenador_id);

-- ─── Importação: insere novos, atribui consultor aos que estão na central ───
CREATE OR REPLACE FUNCTION public.importar_leads_staging(p_lote text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_atribuidos int;
  v_inseridos int;
BEGIN
  IF NOT (public.is_app_admin() OR current_user IN ('postgres', 'service_role')) THEN
    RAISE EXCEPTION 'Apenas administradores podem importar leads';
  END IF;

  CREATE TEMP TABLE tmp_import ON COMMIT DROP AS
  SELECT v.*, existing.id AS lead_existente_id
  FROM public.v_import_leads_consolidado v
  LEFT JOIN LATERAL (
    SELECT l.id FROM public.leads l
    WHERE (v.cpf IS NOT NULL AND public.cpf_key(l.cpf) = v.cpf)
       OR (public.phone_key(v.telefone) IS NOT NULL AND public.phone_key(l.telefone) = public.phone_key(v.telefone))
    ORDER BY l.atualizado_em DESC
    LIMIT 1
  ) existing ON true
  WHERE v.lote = p_lote;

  -- Já existe e está na central → recebe o consultor da planilha
  UPDATE public.leads l
  SET corretor = t.corretor_resolvido,
      corretor_id = t.corretor_id,
      coordenador_id = t.coordenador_id,
      coordenador = t.coordenador_nome,
      corretor_origem = coalesce(l.corretor_origem, t.corretor_raw),
      atualizado_em = now()
  FROM tmp_import t
  WHERE l.id = t.lead_existente_id
    AND t.corretor_resolvido IS NOT NULL
    AND l.corretor_id IS NULL
    AND coalesce(trim(l.corretor), '') = '';
  GET DIAGNOSTICS v_atribuidos = ROW_COUNT;

  -- Novos: consultor conhecido vai para ele; desconhecido/vazio fica na central (corretor NULL)
  INSERT INTO public.leads (
    id, nome, cpf, telefone, email, cidade, zona, etapa, origem,
    corretor, corretor_id, coordenador, coordenador_id, corretor_origem,
    construtora, modalidade, tipo_renda, comprovacao, tipo_imovel, correspondente,
    observacao, vgv, valor_avaliacao, valor_fecho, ccv, criado_em, atualizado_em
  )
  SELECT
    'bd-' || md5(t.pessoa_key), t.nome, t.cpf, t.telefone, t.email, t.cidade, t.zona, t.etapa,
    coalesce(t.origem, 'Banco de Dados - Dashboard'),
    t.corretor_resolvido, t.corretor_id, t.coordenador_nome, t.coordenador_id, t.corretor_raw,
    t.construtora, t.modalidade, t.tipo_renda, t.comprovacao, t.tipo_imovel, t.correspondente,
    t.observacao, t.vgv, t.valor_avaliacao, t.valor_fecho, t.ccv,
    coalesce(t.data_entrada::timestamptz, now()), now()
  FROM tmp_import t
  WHERE t.lead_existente_id IS NULL
  ON CONFLICT (id) DO NOTHING;
  GET DIAGNOSTICS v_inseridos = ROW_COUNT;

  RETURN jsonb_build_object(
    'pessoas_na_planilha', (SELECT count(*) FROM tmp_import),
    'ja_existiam', (SELECT count(*) FROM tmp_import WHERE lead_existente_id IS NOT NULL),
    'existentes_atribuidos', v_atribuidos,
    'inseridos', v_inseridos,
    'inseridos_com_consultor', (SELECT count(*) FROM tmp_import WHERE lead_existente_id IS NULL AND corretor_resolvido IS NOT NULL),
    'inseridos_central', (SELECT count(*) FROM tmp_import WHERE lead_existente_id IS NULL AND corretor_resolvido IS NULL)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.importar_leads_staging(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.importar_leads_staging(text) TO authenticated;

-- Apelidos de corretores ficam vazios no greenfield. Cadastre-os no admin após criar a equipe.


-- ============================================================
-- FILE: 20261007155000_import_functions_search_path.sql
-- ============================================================
-- Fixa o search_path das funções auxiliares da importação (recomendação do advisor do Supabase).
ALTER FUNCTION public.digits_only(text) SET search_path = '';
ALTER FUNCTION public.cpf_key(text) SET search_path = '';
ALTER FUNCTION public.phone_key(text) SET search_path = '';
ALTER FUNCTION public.norm_text(text) SET search_path = '';
ALTER FUNCTION public.etapa_rank(public.etapa_funil) SET search_path = '';


-- ============================================================
-- FILE: 20261007160000_leads_central_view_batch_distribuir.sql
-- ============================================================
-- Central = leads sem consultor (nem id, nem nome). View usada pela tela de distribuição.
CREATE OR REPLACE VIEW public.v_leads_central
WITH (security_invoker = true) AS
SELECT
  id, nome, cpf, telefone, cidade, etapa, construtora, produto, origem,
  observacao, corretor_origem, criado_em, atualizado_em
FROM public.leads
WHERE corretor_id IS NULL
  AND coalesce(trim(corretor), '') = '';

-- Distribui vários leads da central para um corretor em uma única chamada
CREATE OR REPLACE FUNCTION public.admin_distribuir_leads(p_lead_ids text[], p_corretor_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_corr public.corretores%ROWTYPE;
  v_coord_nome text;
  v_total int;
BEGIN
  IF NOT public.is_app_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem distribuir leads';
  END IF;

  IF coalesce(array_length(p_lead_ids, 1), 0) = 0 THEN
    RETURN 0;
  END IF;

  SELECT * INTO v_corr FROM public.corretores WHERE id = p_corretor_id AND ativo;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Corretor não encontrado ou inativo';
  END IF;

  SELECT nome INTO v_coord_nome FROM public.coordenadores WHERE id = v_corr.coordenador_id;

  UPDATE public.leads
  SET corretor_id = v_corr.id,
      corretor = v_corr.nome,
      coordenador_id = v_corr.coordenador_id,
      coordenador = v_coord_nome,
      atualizado_em = now()
  WHERE id = ANY (p_lead_ids);
  GET DIAGNOSTICS v_total = ROW_COUNT;

  RETURN v_total;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_distribuir_leads(text[], uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_distribuir_leads(text[], uuid) TO authenticated;


-- ============================================================
-- FILE: 20261007170000_leads_group_count.sql
-- ============================================================
-- Agregação de leads no banco (contagem + soma de VGV por campo), respeitando RLS.
-- Substitui contagens feitas no navegador, que eram cortadas no limite de 1000 linhas da API.
CREATE INDEX IF NOT EXISTS idx_leads_origem ON public.leads (origem);
CREATE INDEX IF NOT EXISTS idx_leads_construtora ON public.leads (construtora);
CREATE INDEX IF NOT EXISTS idx_leads_coordenador ON public.leads (coordenador);

CREATE OR REPLACE FUNCTION public.leads_group_count(p_field text, p_filters jsonb DEFAULT '{}'::jsonb)
RETURNS TABLE (label text, total bigint, vgv numeric)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_expr text;
BEGIN
  v_expr := CASE p_field
    WHEN 'mes' THEN 'to_char(l.criado_em, ''YYYY-MM'')'
    WHEN 'etapa' THEN 'l.etapa::text'
    WHEN 'corretor' THEN 'l.corretor'
    WHEN 'coordenador' THEN 'l.coordenador'
    WHEN 'origem' THEN 'l.origem'
    WHEN 'cidade' THEN 'l.cidade'
    WHEN 'construtora' THEN 'l.construtora'
    WHEN 'tipo_renda' THEN 'l.tipo_renda'
    WHEN 'comprovacao' THEN 'l.comprovacao'
    WHEN 'modalidade' THEN 'l.modalidade'
    WHEN 'tipo_imovel' THEN 'l.tipo_imovel'
    WHEN 'produto' THEN 'l.produto'
    WHEN 'bairro' THEN 'l.bairro'
    WHEN 'situacao_reprovado' THEN 'l.situacao_reprovado'
  END;

  IF v_expr IS NULL THEN
    RAISE EXCEPTION 'Campo de agrupamento inválido: %', p_field;
  END IF;

  -- Filtros chegam como parâmetro ($1), nunca concatenados no SQL
  RETURN QUERY EXECUTE format($q$
    SELECT %1$s AS label, count(*)::bigint AS total, coalesce(sum(l.vgv), 0)::numeric AS vgv
    FROM public.leads l
    WHERE nullif(trim(%1$s), '') IS NOT NULL
      AND ($1->>'etapa' IS NULL OR l.etapa::text = $1->>'etapa')
      AND ($1->>'corretor' IS NULL OR l.corretor = $1->>'corretor' OR l.corretor_id::text = $1->>'corretor')
      AND ($1->>'coordenador' IS NULL OR l.coordenador = $1->>'coordenador' OR l.coordenador_id::text = $1->>'coordenador')
      AND ($1->>'construtora' IS NULL OR l.construtora = $1->>'construtora')
      AND ($1->>'cidade' IS NULL OR l.cidade = $1->>'cidade')
      AND ($1->>'origem' IS NULL OR l.origem = $1->>'origem')
      AND ($1->>'situacao' IS NULL OR l.situacao_reprovado = $1->>'situacao')
      AND ($1->>'dataInicio' IS NULL OR l.criado_em >= ($1->>'dataInicio')::date)
      AND ($1->>'dataFim' IS NULL OR l.criado_em < ($1->>'dataFim')::date + 1)
      AND ($1->>'search' IS NULL
        OR l.nome ILIKE '%%' || ($1->>'search') || '%%'
        OR l.cpf ILIKE '%%' || ($1->>'search') || '%%'
        OR l.telefone ILIKE '%%' || ($1->>'search') || '%%'
        OR l.email ILIKE '%%' || ($1->>'search') || '%%'
        OR l.id ILIKE '%%' || ($1->>'search') || '%%')
    GROUP BY 1
    ORDER BY 2 DESC
  $q$, v_expr)
  USING coalesce(p_filters, '{}'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.leads_group_count(text, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.leads_group_count(text, jsonb) TO authenticated;


-- ============================================================
-- FILE: 20261007180000_revoke_anon_security_definer.sql
-- ============================================================
-- Remove execução anônima de funções SECURITY DEFINER que não são usadas sem login.
-- Mantidas para anon (usadas pelo webhook/health): upsert_lead_from_webhook, ingest_webhook_log,
-- resolve_correspondente_nome, resolve_equipe_por_nome e os helpers de RLS.
REVOKE EXECUTE ON FUNCTION public.admin_distribuir_lead(text, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_distribuir_lead(text, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_set_equipe_ativo(text, uuid, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_equipe_ativo(text, uuid, boolean) TO authenticated;

-- Função de gatilho em auth.users: não deve ser chamada via API por ninguém.
REVOKE EXECUTE ON FUNCTION public.handle_new_corretor_user() FROM public, anon, authenticated;


-- ============================================================
-- FILE: 20261008130000_lead_categoria_imovel_correspondentes.sql
-- ============================================================
-- Modalidade do imóvel (novo, usado, aquisição e construção, empreendimento),
-- separada da modalidade de financiamento (MCMV, SBPE, direto, financiamento).
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS categoria_imovel text;

-- Valores antigos de imóvel que estavam gravados em `modalidade`
UPDATE public.leads
SET categoria_imovel = 'empreendimento', modalidade = NULL
WHERE upper(modalidade) = 'EMPREENDIMENTO';

UPDATE public.leads
SET tipo_imovel = coalesce(tipo_imovel, 'casa'), modalidade = NULL
WHERE upper(modalidade) = 'CASA';

-- Padroniza zona/tipo para os valores usados nos formulários
UPDATE public.leads SET zona = lower(zona) WHERE zona IS NOT NULL AND zona <> lower(zona);
UPDATE public.leads SET tipo_imovel = lower(tipo_imovel)
WHERE tipo_imovel IS NOT NULL AND tipo_imovel <> lower(tipo_imovel);

-- Catálogo de correspondentes (somente nomes de empresas, sem contatos pessoais).
INSERT INTO public.correspondentes_bancarios (nome, ativo)
SELECT v.nome, true
FROM (VALUES
  ('Alpha'),
  ('The Cred'),
  ('ZM'),
  ('CredCaixa'),
  ('DLS'),
  ('Líder'),
  ('ALSTHE'),
  ('ALSALTOS'),
  ('R2'),
  ('REPASSE'),
  ('TOPCRED'),
  ('PREMIER'),
  ('CLEIAROCHA'),
  ('MARYNA'),
  ('DAVIDSOLUÇÕES'),
  ('ASCORRESPONDENTE')
) AS v(nome)
WHERE NOT EXISTS (
  SELECT 1 FROM public.correspondentes_bancarios c WHERE lower(c.nome) = lower(v.nome)
);


-- ============================================================
-- FILE: 20261015160000_grants_authenticated.sql
-- ============================================================
-- Expõe o schema public à Data API para o papel authenticated.
-- RLS continua controlando quais linhas cada usuário vê.
-- anon não lê o CRM (apenas Auth no client).

GRANT USAGE ON SCHEMA public TO authenticated, anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
