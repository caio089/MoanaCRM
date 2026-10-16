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
