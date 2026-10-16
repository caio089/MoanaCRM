-- Quem enxerga o lead pode excluí-lo (admin já cobre via leads_write_admin ALL)
DROP POLICY IF EXISTS "leads_delete_scoped" ON public.leads;
CREATE POLICY "leads_delete_scoped"
  ON public.leads FOR DELETE TO authenticated
  USING (public.can_see_lead(leads));
