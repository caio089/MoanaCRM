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
