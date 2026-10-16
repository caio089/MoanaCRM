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
