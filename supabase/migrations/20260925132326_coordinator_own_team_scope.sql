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
