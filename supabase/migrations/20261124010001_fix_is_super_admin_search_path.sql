-- ============================================================================
-- FIX is_super_admin() e is_admin_or_moderator() SIN search_path SEGURO
-- Auditoría: hallazgo M8 (análogo al de is_admin, ya corregido en
-- 20260204020007_fix_is_admin_search_path.sql). is_super_admin() quedó
-- pendiente en esa migración (lo dice su propio encabezado).
-- Objetivo: recrear ambas funciones con la lógica y los grants EXACTOS que
-- ya existen, cambiando SOLO search_path a '' (y calificando
-- public.user_roles en is_admin_or_moderator, que lo referenciaba sin
-- esquema y dejaría de resolver con search_path = '').
-- Sin cambios de lógica, sin tocar políticas RLS. NO aplicada: sin db push.
-- ============================================================================
--
-- Estado previo (verificado por grep en el repo):
-- - is_super_admin(check_user_id uuid DEFAULT NULL): supabase/migrations/
--   20260204020000_fase2_fix_rls_admin_users_recursion_final.sql —
--   SECURITY DEFINER, SET search_path = public, SET row_security = off.
--   Lee public.admin_users (calificado) y auth.uid() (calificado).
-- - is_admin_or_moderator(): supabase/migrations/
--   20250101000000_bootstrap_core_schema.sql — LANGUAGE sql STABLE, sin
--   search_path y sin SECURITY DEFINER. Leía `user_roles` sin calificar;
--   aquí pasa a public.user_roles para que siga resolviendo igual.
--
-- Grants originales de is_super_admin (se conservan tal cual):
-- - REVOKE ALL ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC;
--   GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;

-- ----------------------------------------------------------------------------
-- is_super_admin(check_user_id uuid DEFAULT NULL)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id uuid DEFAULT NULL)
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
          AND au.role = 'super_admin'
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- is_admin_or_moderator()
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin_or_moderator()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role IN ('admin','superadmin','moderator')
    );
$$ LANGUAGE sql STABLE
SET search_path = '';

-- Grants originales de is_super_admin, sin cambios.
REVOKE ALL ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;

-- ----------------------------------------------------------------------------
-- Verificación: ambas funciones deben quedar con search_path = ''.
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
      AND p.proname IN ('is_super_admin', 'is_admin_or_moderator')
      AND 'search_path=' = ANY (p.proconfig);

    IF v_count <> 2 THEN
        RAISE EXCEPTION 'search_path fix incompleto: % de 2 funciones con search_path = ''''', v_count;
    END IF;

    RAISE NOTICE 'OK: is_super_admin(uuid) e is_admin_or_moderator() con SET search_path = ''''';
END $$;
