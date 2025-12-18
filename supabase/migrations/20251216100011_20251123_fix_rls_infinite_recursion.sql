-- =====================================================
-- MIGRACIÓN CRÍTICA: Corregir Recursión Infinita en RLS
-- Solución: RLS usando solo metadata JWT y políticas simplificadas
-- =====================================================

-- 1. Asegurar que RLS esté activado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar todas las políticas anteriores para evitar conflictos
DROP POLICY IF EXISTS "Real users only see real profiles" ON profiles;
DROP POLICY IF EXISTS "Demo users only see demo profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view public profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Demo users see demo profiles only" ON profiles;
DROP POLICY IF EXISTS "Real users see real profiles only" ON profiles;
DROP POLICY IF EXISTS "Demo users access demo profiles" ON profiles;
DROP POLICY IF EXISTS "Real users access real profiles" ON profiles;
DROP POLICY IF EXISTS "separacion_demo_real" ON profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;

-- 3. Crear función auxiliar (opcional, pero útil para otras partes)
CREATE OR REPLACE FUNCTION public.is_demo_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    ((auth.jwt() -> 'user_metadata') ->> 'is_demo')::boolean,
    false
  );
$$;

COMMENT ON FUNCTION public.is_demo_user() IS 'Determina si el usuario actual es demo usando JWT metadata';

-- 4. Política principal de SELECT (Definitiva y Sin Recursión)
CREATE POLICY "separacion_demo_real"
ON profiles FOR SELECT USING (
  (COALESCE(((auth.jwt() -> 'user_metadata') ->> 'is_demo')::boolean, false) = true  AND (is_demo = true  OR user_id = auth.uid()))
  OR
  (COALESCE(((auth.jwt() -> 'user_metadata') ->> 'is_demo')::boolean, false) = false AND (is_demo = false OR user_id = auth.uid()))
);

-- 5. Políticas de Modificación
CREATE POLICY "insert_own_profile"   ON profiles FOR INSERT   WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_profile"   ON profiles FOR UPDATE  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. Índices
CREATE INDEX IF NOT EXISTS idx_profiles_user_id           ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_demo           ON profiles(is_demo);
CREATE INDEX IF NOT EXISTS idx_profiles_is_demo_user_id   ON profiles(is_demo, user_id);
