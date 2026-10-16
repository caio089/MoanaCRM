-- Remove execução anônima de funções SECURITY DEFINER que não são usadas sem login.
-- Mantidas para anon (usadas pelo webhook/health): upsert_lead_from_webhook, ingest_webhook_log,
-- resolve_correspondente_nome, resolve_equipe_por_nome e os helpers de RLS.
REVOKE EXECUTE ON FUNCTION public.admin_distribuir_lead(text, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_distribuir_lead(text, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_set_equipe_ativo(text, uuid, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_equipe_ativo(text, uuid, boolean) TO authenticated;

-- Função de gatilho em auth.users: não deve ser chamada via API por ninguém.
REVOKE EXECUTE ON FUNCTION public.handle_new_corretor_user() FROM public, anon, authenticated;
