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
