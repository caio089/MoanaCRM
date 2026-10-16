-- Leitura de equipe para selects de lead (antes o corretor só via a si mesmo e o form quebrava)
DROP POLICY IF EXISTS "corretores_select_authenticated" ON public.corretores;
CREATE POLICY "corretores_select_authenticated"
  ON public.corretores FOR SELECT TO authenticated
  USING (ativo = true OR public.is_app_admin() OR user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "coordenadores_select_authenticated" ON public.coordenadores;
CREATE POLICY "coordenadores_select_authenticated"
  ON public.coordenadores FOR SELECT TO authenticated
  USING (ativo = true OR public.is_app_admin() OR user_id = (SELECT auth.uid()));
