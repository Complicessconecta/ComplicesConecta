-- ============================================================================
-- FIX CRÍTICO (V2): Evitar recursión infinita en policies RLS de admin_users
-- Fecha: January 20, 2026
-- Objetivo: Garantizar funciones SECURITY DEFINER con row_security = off y
--          reemplazar policies recursivas por llamadas a dichas funciones.
-- NOTA: Este script es idempotente y corrige drift cuando la policy recursiva
--       existe aunque haya historial de migración aplicado.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PASO 1: Funciones helper (SECURITY DEFINER) para validar rol admin/super_admin
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
      AND au.is_active = TRUE
      AND au.role = 'super_admin'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- ---------------------------------------------------------------------------
-- PASO 2: Reemplazar policies RLS de admin_users
-- ---------------------------------------------------------------------------

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Eliminar policies existentes (incluyendo variantes recursivas)
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can insert admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can update admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can delete admin_users" ON public.admin_users;

-- Recrear policies basadas en funciones (evita recursión)
CREATE POLICY "Admins can view admin_users" ON public.admin_users
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Super admins can insert admin_users" ON public.admin_users
  FOR INSERT
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can update admin_users" ON public.admin_users
  FOR UPDATE
  USING (public.is_super_admin());

CREATE POLICY "Super admins can delete admin_users" ON public.admin_users
  FOR DELETE
  USING (public.is_super_admin());
