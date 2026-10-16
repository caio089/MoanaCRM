-- Fixa o search_path das funções auxiliares da importação (recomendação do advisor do Supabase).
ALTER FUNCTION public.digits_only(text) SET search_path = '';
ALTER FUNCTION public.cpf_key(text) SET search_path = '';
ALTER FUNCTION public.phone_key(text) SET search_path = '';
ALTER FUNCTION public.norm_text(text) SET search_path = '';
ALTER FUNCTION public.etapa_rank(public.etapa_funil) SET search_path = '';
