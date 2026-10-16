-- Cadastro automático de corretor ao criar usuário no Auth
-- (já aplicado no projeto remoto; mantido no repo para rastreio)

ALTER TABLE public.corretores
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_corretores_user_id ON public.corretores(user_id);

CREATE OR REPLACE FUNCTION public.handle_new_corretor_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_nome text;
BEGIN
  v_role := coalesce(
    NEW.raw_app_meta_data->>'role',
    NEW.raw_user_meta_data->>'role',
    'user'
  );

  IF lower(v_role) = 'admin' THEN
    RETURN NEW;
  END IF;

  v_nome := nullif(trim(coalesce(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'nome',
    split_part(NEW.email, '@', 1)
  )), '');

  IF v_nome IS NULL THEN
    v_nome := split_part(NEW.email, '@', 1);
  END IF;

  INSERT INTO public.corretores (nome, email, user_id, ativo)
  VALUES (v_nome, NEW.email, NEW.id, true)
  ON CONFLICT (user_id) DO UPDATE
    SET nome = EXCLUDED.nome,
        email = EXCLUDED.email,
        ativo = true,
        atualizado_em = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_corretor ON auth.users;
CREATE TRIGGER on_auth_user_created_corretor
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_corretor_user();

DROP POLICY IF EXISTS "corretores_insert_own" ON public.corretores;
CREATE POLICY "corretores_insert_own"
  ON public.corretores FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_app_admin());

DROP POLICY IF EXISTS "corretores_update_own" ON public.corretores;
CREATE POLICY "corretores_update_own"
  ON public.corretores FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_app_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_app_admin());
