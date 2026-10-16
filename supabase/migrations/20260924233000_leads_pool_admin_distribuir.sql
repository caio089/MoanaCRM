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
