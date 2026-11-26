-- ============================================================================
-- FIX is_admin(), is_super_admin() e is_admin_or_moderator() CON search_path SEGURO
-- Auditoría: hallazgo M8 (análogo al de is_admin, ya corregido en
-- 20260204020007_fix_is_admin_search_path.sql).
--
-- REESCRITURA 2026-11-24 (la versión anterior FALLÓ en producción el
-- 2026-11-24 04:44 CST con ERROR 42703): esa versión creaba
-- is_super_admin(check_user_id uuid), pero en producción existe
-- is_super_admin() SIN argumentos (verificado por pg_get_functiondef).
-- Esta versión corrige las funciones que REALMENTE existen:
-- - is_admin() no-arg, SECURITY DEFINER: solo cambia search_path
--   ('public' -> '') con ALTER FUNCTION; el cuerpo y los grants no se tocan.
-- - is_super_admin() no-arg, SECURITY DEFINER: igual, solo search_path.
-- - is_admin_or_moderator() LANGUAGE sql: se recrea con public.user_roles
--   calificado (lo referenciaba sin esquema y dejaría de resolver con
--   search_path = '') y SET search_path = ''.
-- Sin cambios de lógica, sin tocar políticas RLS.
-- ============================================================================

-- is_admin(): solo search_path; cuerpo y grants intactos.
ALTER FUNCTION public.is_admin() SET search_path = '';

-- is_super_admin(): solo search_path; cuerpo y grants intactos.
ALTER FUNCTION public.is_super_admin() SET search_path = '';

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

-- ----------------------------------------------------------------------------
-- Verificación: TODAS las sobrecargas de las tres funciones deben quedar
-- con search_path = ''. Falla la migración si alguna no quedó así (por
-- ejemplo, si existiera además una sobrecarga is_super_admin(uuid)).
--
-- NOTA 2026-11-24: Postgres guarda SET search_path = '' como el elemento
-- 'search_path=""' (con comillas dobles) en proconfig, NO como
-- 'search_path='. La versión anterior buscaba 'search_path=' y por eso
-- falló en producción aunque los ALTER sí se habían aplicado (la
-- transacción se revirtió y nada cambió). Esta verificación busca la
-- forma exacta que Postgres guarda.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_total integer;
    v_fixed integer;
BEGIN
    SELECT count(*) INTO v_total
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('is_admin', 'is_super_admin', 'is_admin_or_moderator');

    SELECT count(*) INTO v_fixed
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('is_admin', 'is_super_admin', 'is_admin_or_moderator')
      AND 'search_path=""' = ANY (p.proconfig);

    IF v_total <> 3 OR v_fixed <> v_total THEN
        RAISE EXCEPTION 'search_path fix incompleto: % de % sobrecargas con search_path = '''' (se esperaban 3)', v_fixed, v_total;
    END IF;

    RAISE NOTICE 'OK: is_admin(), is_super_admin() e is_admin_or_moderator() con SET search_path = ''''';
END $$;
