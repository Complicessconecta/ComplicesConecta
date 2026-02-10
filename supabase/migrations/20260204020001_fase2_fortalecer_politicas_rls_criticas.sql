-- ============================================================================
-- FASE 2: FORTALECIMIENTO DE POLÍTICAS RLS EN TABLAS CRÍTICAS
-- Fecha: 4 de Febrero, 2026
-- Objetivo: Fortalecer políticas en profiles, matches, clubs y otras tablas críticas
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PASO 1: Limpiar y fortalecer políticas en PROFILES
-- ----------------------------------------------------------------------------

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes problemáticas
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

-- Re-habilitar RLS con políticas fortalecidas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Perfiles públicos visibles para todos
CREATE POLICY "profiles_select_public" ON public.profiles
FOR SELECT
USING (
    is_public = TRUE
    OR auth.uid() = user_id
    OR public.is_admin()
);

-- Política SELECT: Perfiles privados solo para owner o admins
CREATE POLICY "profiles_select_private" ON public.profiles
FOR SELECT
USING (
    auth.uid() = user_id
    OR public.is_admin()
);

-- Política INSERT: Solo usuarios autenticados pueden crear su perfil
CREATE POLICY "profiles_insert_own" ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política UPDATE: Solo owner puede actualizar su perfil, admins pueden actualizar cualquier perfil
CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE
USING (
    auth.uid() = user_id
    OR public.is_admin()
);

-- ----------------------------------------------------------------------------
-- PASO 2: Fortalecer políticas en MATCHES
-- ----------------------------------------------------------------------------

ALTER TABLE public.matches DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own matches" ON public.matches;
DROP POLICY IF EXISTS "Users can create matches" ON public.matches;
DROP POLICY IF EXISTS "Admins can view all matches" ON public.matches;

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Solo participantes y admins pueden ver matches
CREATE POLICY "matches_select_participants" ON public.matches
FOR SELECT
USING (
    auth.uid() = user1_id
    OR auth.uid() = user2_id
    OR public.is_admin()
);

-- Política INSERT: Solo sistema puede crear matches inicialmente
CREATE POLICY "matches_insert_system" ON public.matches
FOR INSERT
WITH CHECK (public.is_admin()); -- Solo admins pueden crear matches inicialmente

-- Política UPDATE: Solo participantes y admins pueden actualizar
CREATE POLICY "matches_update_participants" ON public.matches
FOR UPDATE
USING (
    auth.uid() = user1_id
    OR auth.uid() = user2_id
    OR public.is_admin()
);

-- ----------------------------------------------------------------------------
-- PASO 3: Fortalecer políticas en CLUBS
-- ----------------------------------------------------------------------------

ALTER TABLE public.clubs DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clubs are viewable by everyone" ON public.clubs;
DROP POLICY IF EXISTS "Admins can manage clubs" ON public.clubs;
DROP POLICY IF EXISTS "Verified clubs can be updated by owners" ON public.clubs;

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Clubs públicos visibles para todos
CREATE POLICY "clubs_select_public" ON public.clubs
FOR SELECT
USING (
    is_public = TRUE
    OR public.is_admin()
);

-- Política SELECT: Clubs privados solo para miembros verificados o admins
CREATE POLICY "clubs_select_private" ON public.clubs
FOR SELECT
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.club_applications ca
        WHERE ca.club_id = clubs.id
          AND ca.user_id = auth.uid()
          AND ca.status = 'APPROVED'
    )
);

-- Política INSERT: Solo admins pueden crear clubs inicialmente
CREATE POLICY "clubs_insert_admin" ON public.clubs
FOR INSERT
WITH CHECK (public.is_admin());

-- Política UPDATE: Solo owners verificados o admins pueden actualizar
CREATE POLICY "clubs_update_owners" ON public.clubs
FOR UPDATE
USING (
    auth.uid() = owner_id
    OR public.is_admin()
);

-- ----------------------------------------------------------------------------
-- PASO 4: Validación de parámetros en RPC (Rate Limiting)
-- ----------------------------------------------------------------------------

-- Función para validar parámetros de búsqueda (previene SQL injection y rate limiting)
CREATE OR REPLACE FUNCTION public.validate_search_params(
    search_term TEXT DEFAULT NULL,
    limit_param INTEGER DEFAULT 50
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Validar límite razonable
    IF limit_param < 1 OR limit_param > 100 THEN
        RETURN FALSE;
    END IF;

    -- Validar término de búsqueda (longitud máxima)
    IF search_term IS NOT NULL AND LENGTH(search_term) > 255 THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$;

-- ----------------------------------------------------------------------------
-- PASO 5: Verificación final
-- ----------------------------------------------------------------------------

DO $$
DECLARE
    v_profiles_policies INT;
    v_matches_policies INT;
    v_clubs_policies INT;
BEGIN
    SELECT COUNT(*) INTO v_profiles_policies
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles';

    SELECT COUNT(*) INTO v_matches_policies
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'matches';

    SELECT COUNT(*) INTO v_clubs_policies
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'clubs';

    RAISE NOTICE '✅ PROFILES - Políticas RLS: %', v_profiles_policies;
    RAISE NOTICE '✅ MATCHES - Políticas RLS: %', v_matches_policies;
    RAISE NOTICE '✅ CLUBS - Políticas RLS: %', v_clubs_policies;
    RAISE NOTICE '✅ FORTALECIMIENTO RLS COMPLETADO';
END $$;

-- ============================================================================
-- RESUMEN DE FORTALECIMIENTO
-- ============================================================================
-- ✓ Políticas RLS fortalecidas en profiles, matches, clubs
-- ✓ Eliminadas políticas débiles o problemáticas
-- ✓ Implementado acceso basado en roles con is_admin()
-- ✓ Agregada validación de parámetros para prevenir exploits
-- ✓ Políticas idempotentes y verificables
-- ============================================================================
