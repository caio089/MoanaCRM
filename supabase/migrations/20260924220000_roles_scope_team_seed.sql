-- Papéis comerciais + escopo coordenador/corretor (sem seed de pessoas)
-- Destino: Construtora Moana (MoanaCRM)

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Vínculo Auth ↔ coordenador
-- ---------------------------------------------------------------------------
ALTER TABLE public.coordenadores
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_coordenadores_user_id ON public.coordenadores(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_coordenadores_email_lower
  ON public.coordenadores (lower(email))
  WHERE email IS NOT NULL AND length(trim(email)) > 0;

CREATE UNIQUE INDEX IF NOT EXISTS uq_corretores_email_lower
  ON public.corretores (lower(email))
  WHERE email IS NOT NULL AND length(trim(email)) > 0;

-- ---------------------------------------------------------------------------
-- 2) Helpers de papel / escopo (JWT app_metadata.role)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.app_role()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT lower(coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() ->> 'role',
    'corretor'
  ));
$$;

CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT public.app_role() IN ('admin');
$$;

CREATE OR REPLACE FUNCTION public.is_app_coordenador()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT public.app_role() IN ('coordenador', 'supervisor');
$$;

CREATE OR REPLACE FUNCTION public.is_app_corretor()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT public.app_role() IN ('corretor', 'user', 'consultor')
    OR public.app_role() NOT IN ('admin', 'coordenador', 'supervisor');
$$;

CREATE OR REPLACE FUNCTION public.current_coordenador_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id
  FROM public.coordenadores c
  WHERE c.user_id = auth.uid()
     OR (c.email IS NOT NULL AND lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  ORDER BY CASE WHEN c.user_id = auth.uid() THEN 0 ELSE 1 END
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_corretor_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id
  FROM public.corretores c
  WHERE c.user_id = auth.uid()
     OR (c.email IS NOT NULL AND lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  ORDER BY CASE WHEN c.user_id = auth.uid() THEN 0 ELSE 1 END
  LIMIT 1;
$$;

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
    );
$$;

REVOKE ALL ON FUNCTION public.app_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_app_coordenador() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_app_corretor() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_coordenador_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_corretor_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_see_lead(public.leads) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.app_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_app_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_app_coordenador() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_app_corretor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_coordenador_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_corretor_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_see_lead(public.leads) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3) Signup: admin skip; coordenador → coordenadores; demais → corretores
-- ---------------------------------------------------------------------------
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
  v_role := lower(coalesce(
    NEW.raw_app_meta_data->>'role',
    NEW.raw_user_meta_data->>'role',
    'corretor'
  ));

  IF v_role IN ('admin') THEN
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

  IF v_role IN ('coordenador', 'supervisor') THEN
    -- Vincula cadastro existente por e-mail ou cria linha
    UPDATE public.coordenadores
       SET user_id = NEW.id,
           nome = COALESCE(NULLIF(trim(nome), ''), v_nome),
           email = COALESCE(email, NEW.email),
           ativo = true,
           atualizado_em = now()
     WHERE user_id = NEW.id
        OR (email IS NOT NULL AND lower(email) = lower(NEW.email));

    IF NOT FOUND THEN
      INSERT INTO public.coordenadores (nome, email, user_id, ativo)
      VALUES (v_nome, NEW.email, NEW.id, true);
    END IF;

    RETURN NEW;
  END IF;

  -- corretor (padrão)
  UPDATE public.corretores
     SET user_id = NEW.id,
         nome = COALESCE(NULLIF(trim(nome), ''), v_nome),
         email = COALESCE(email, NEW.email),
         ativo = true,
         atualizado_em = now()
   WHERE user_id = NEW.id
      OR (email IS NOT NULL AND lower(email) = lower(NEW.email));

  IF NOT FOUND THEN
    INSERT INTO public.corretores (nome, email, user_id, ativo)
    VALUES (v_nome, NEW.email, NEW.id, true)
    ON CONFLICT (user_id) DO UPDATE
      SET nome = EXCLUDED.nome,
          email = EXCLUDED.email,
          ativo = true,
          atualizado_em = now();
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4) RLS escopado
-- ---------------------------------------------------------------------------

-- Coordenadores
DROP POLICY IF EXISTS "coordenadores_select_authenticated" ON public.coordenadores;
CREATE POLICY "coordenadores_select_authenticated"
  ON public.coordenadores FOR SELECT TO authenticated
  USING (
    public.is_app_admin()
    OR user_id = auth.uid()
    OR id = public.current_coordenador_id()
    OR id IN (
      SELECT cr.coordenador_id
      FROM public.corretores cr
      WHERE cr.id = public.current_corretor_id()
        AND cr.coordenador_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "coordenadores_write_admin" ON public.coordenadores;
CREATE POLICY "coordenadores_write_admin"
  ON public.coordenadores FOR ALL TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

-- Corretores
DROP POLICY IF EXISTS "corretores_select_authenticated" ON public.corretores;
CREATE POLICY "corretores_select_authenticated"
  ON public.corretores FOR SELECT TO authenticated
  USING (
    public.is_app_admin()
    OR user_id = auth.uid()
    OR id = public.current_corretor_id()
    OR (
      public.is_app_coordenador()
      AND coordenador_id = public.current_coordenador_id()
    )
  );

DROP POLICY IF EXISTS "corretores_write_admin" ON public.corretores;
CREATE POLICY "corretores_write_admin"
  ON public.corretores FOR ALL TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

-- Leads
DROP POLICY IF EXISTS "leads_select_authenticated" ON public.leads;
CREATE POLICY "leads_select_authenticated"
  ON public.leads FOR SELECT TO authenticated
  USING (public.can_see_lead(leads));

DROP POLICY IF EXISTS "leads_write_admin" ON public.leads;
CREATE POLICY "leads_write_admin"
  ON public.leads FOR ALL TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

DROP POLICY IF EXISTS "leads_update_scoped" ON public.leads;
CREATE POLICY "leads_update_scoped"
  ON public.leads FOR UPDATE TO authenticated
  USING (public.can_see_lead(leads) AND NOT public.is_app_admin())
  WITH CHECK (public.can_see_lead(leads));

DROP POLICY IF EXISTS "leads_insert_scoped" ON public.leads;
CREATE POLICY "leads_insert_scoped"
  ON public.leads FOR INSERT TO authenticated
  WITH CHECK (
    public.is_app_admin()
    OR (
      public.is_app_coordenador()
      AND (
        coordenador_id = public.current_coordenador_id()
        OR coordenador_id IS NULL
      )
    )
    OR (
      public.current_corretor_id() IS NOT NULL
      AND (
        corretor_id = public.current_corretor_id()
        OR corretor_id IS NULL
      )
    )
  );

-- Histórico: leitura alinhada ao lead; escrita admin ou quem vê o lead
DROP POLICY IF EXISTS "historico_select_authenticated" ON public.historico_etapas;
CREATE POLICY "historico_select_authenticated"
  ON public.historico_etapas FOR SELECT TO authenticated
  USING (
    public.is_app_admin()
    OR EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = historico_etapas.lead_id
        AND public.can_see_lead(l)
    )
  );

DROP POLICY IF EXISTS "historico_write_admin" ON public.historico_etapas;
CREATE POLICY "historico_write_admin"
  ON public.historico_etapas FOR ALL TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

DROP POLICY IF EXISTS "historico_insert_scoped" ON public.historico_etapas;
CREATE POLICY "historico_insert_scoped"
  ON public.historico_etapas FOR INSERT TO authenticated
  WITH CHECK (
    public.is_app_admin()
    OR EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_id
        AND public.can_see_lead(l)
    )
  );

-- Correspondentes / catálogos: leitura autenticada; escrita admin (mantém)
-- (policies existentes de write_admin)

-- Sem seed de pessoas. Vínculo Auth ↔ equipe quando e-mails coincidirem (cadastros futuros).
UPDATE public.coordenadores c
SET user_id = u.id, atualizado_em = now()
FROM auth.users u
WHERE c.email IS NOT NULL
  AND lower(c.email) = lower(u.email)
  AND (c.user_id IS DISTINCT FROM u.id);

UPDATE public.corretores c
SET user_id = u.id, atualizado_em = now()
FROM auth.users u
WHERE c.email IS NOT NULL
  AND lower(c.email) = lower(u.email)
  AND (c.user_id IS DISTINCT FROM u.id);

COMMIT;
