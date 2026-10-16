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
