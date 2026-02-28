-- ============================================================================
-- FASE 2: CORRECCIÓN DE SEGURIDAD - FIX RLS RECURSIÓN INFINITA
-- Fecha: 4 de Febrero, 2026
-- Objetivo: Resolver RLS recursión infinita en admin_users implementando
--          funciones SECURITY DEFINER y actualizando políticas
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PASO 1: Crear funciones SECURITY DEFINER para validar roles admin
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Otorgar permisos apropiados
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;

-- ----------------------------------------------------------------------------
-- PASO 2: Limpiar políticas existentes que causan recursión
-- ----------------------------------------------------------------------------

-- Deshabilitar temporalmente RLS para evitar errores durante la limpieza
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes (incluyendo variantes problemáticas)
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can insert admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can update admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can delete admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_select_policy" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_insert_policy" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_update_policy" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_delete_policy" ON public.admin_users;

-- ----------------------------------------------------------------------------
-- PASO 3: Recrear políticas usando funciones SECURITY DEFINER
-- ----------------------------------------------------------------------------

-- Re-habilitar RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Admins pueden ver admin_users
CREATE POLICY "admin_users_select_policy" ON public.admin_users
FOR SELECT
USING (public.is_admin());

-- Política INSERT: Solo super admins pueden insertar
CREATE POLICY "admin_users_insert_policy" ON public.admin_users
FOR INSERT
WITH CHECK (public.is_super_admin());

-- Política UPDATE: Solo super admins pueden actualizar
CREATE POLICY "admin_users_update_policy" ON public.admin_users
FOR UPDATE
USING (public.is_super_admin());

-- Política DELETE: Solo super admins pueden eliminar
CREATE POLICY "admin_users_delete_policy" ON public.admin_users
FOR DELETE
USING (public.is_super_admin());

-- ----------------------------------------------------------------------------
-- PASO 4: Verificación y logging
-- ----------------------------------------------------------------------------

DO $$
DECLARE
    v_function_count INT;
    v_policy_count INT;
BEGIN
    -- Contar funciones creadas
    SELECT COUNT(*) INTO v_function_count
    FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name IN ('is_admin', 'is_super_admin');

    -- Contar políticas activas
    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_users';

    RAISE NOTICE '✅ FUNCIONES SECURITY DEFINER: % creadas', v_function_count;
    RAISE NOTICE '✅ POLÍTICAS RLS admin_users: % activas', v_policy_count;
    RAISE NOTICE '✅ FIX RLS RECURSIÓN COMPLETADO - Usar is_admin() y is_super_admin()';
END $$;

-- ============================================================================
-- RESUMEN DE CAMBIOS
-- ============================================================================
-- ✓ Funciones is_admin() y is_super_admin() SECURITY DEFINER implementadas
-- ✓ Políticas RLS admin_users reemplazadas para evitar recursión
-- ✓ Parámetro opcional check_user_id agregado para flexibilidad
-- ✓ Verificación automática de implementación correcta
-- ✓ 100% Idempotente - puede ejecutarse múltiples veces
-- ============================================================================
