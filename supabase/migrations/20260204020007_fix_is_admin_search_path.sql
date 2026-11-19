-- ============================================================================
-- JWT COMPLEMENT (2026-11-19): FIX is_admin() SIN search_path SEGURO
-- Auditoría: hallazgo M8 — is_admin() no tenía SET search_path.
-- Objetivo: recrear AMBAS sobrecargas de public.is_admin con la lógica y
-- los grants EXACTOS que ya existen, cambiando SOLO search_path a ''.
-- Sin cambios de lógica, sin tocar políticas RLS, sin tocar is_super_admin
-- (mismo patrón M8, lo llaman políticas RLS: necesita su propia migración
-- análoga — ver JWT_COMPLEMENT_SUMMARY.md). NO aplicada: sin db push.
-- ============================================================================
--
-- Estado previo (verificado por grep en el repo):
-- - is_admin() sin argumentos: supabase/migrations/
--   20260120000037_fix_admin_users_rls_recursion_v2.sql — SECURITY DEFINER,
--   SET search_path = public, SET row_security = off.
-- - is_admin(uuid DEFAULT NULL): supabase/migrations/
--   20260204020000_fase2_fix_rls_admin_users_recursion_final.sql —
--   SECURITY DEFINER, SET search_path = public, SET row_security = off.
-- Ambas leen public.admin_users (calificado) y auth.uid() (calificado), así
-- que con search_path = '' siguen resolviendo igual; lo único que cambia es
-- que ya no se puede secuestrar la resolución de nombres no calificados
-- (aquí no queda ninguno sin calificar).
--
-- Grants originales (se conservan tal cual):
-- - REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
--   GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
-- - REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
--   GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- ----------------------------------------------------------------------------
-- Sobrecarga 1: is_admin() — sin argumentos, usa auth.uid()
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET row_security = off
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
      AND au.is_active = TRUE
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- Sobrecarga 2: is_admin(check_user_id uuid DEFAULT NULL)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET row_security = off
AS $$
DECLARE
    target_user_id uuid := COALESCE(check_user_id, auth.uid());
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.admin_users au
        WHERE au.user_id = target_user_id
          AND au.is_active = TRUE
    );
END;
$$;

-- Grants originales, sin cambios.
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- ----------------------------------------------------------------------------
-- Verificación: ambas sobrecargas deben quedar con search_path = ''.
-- Falla la migración si alguna no quedó así.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_count integer;
BEGIN
    SELECT count(*) INTO v_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'is_admin'
      AND 'search_path=' = ANY (p.proconfig);

    IF v_count <> 2 THEN
        RAISE EXCEPTION 'is_admin search_path fix incompleto: % de 2 sobrecargas con search_path = ''''', v_count;
    END IF;

    RAISE NOTICE 'OK: is_admin() e is_admin(uuid) con SET search_path = ''''';
END $$;
