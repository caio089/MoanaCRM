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
