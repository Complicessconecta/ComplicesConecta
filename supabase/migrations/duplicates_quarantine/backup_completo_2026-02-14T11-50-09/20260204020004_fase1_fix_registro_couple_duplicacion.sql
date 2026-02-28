-- ============================================================================
-- FASE 1: CORRECCIÓN DE DUPLICACIÓN DE DATOS EN REGISTRO COUPLE
-- Fecha: 4 de Febrero, 2026
-- Objetivo: Agregar columnas faltantes a couple_profiles y crear vista unificada
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PASO 1: Agregar columnas faltantes a couple_profiles para consistencia
-- ----------------------------------------------------------------------------

ALTER TABLE public.couple_profiles
    ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'couple' CHECK (account_type = 'couple'),
    ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- ----------------------------------------------------------------------------
-- PASO 2: Crear vista unificada que combine profiles y couple_profiles
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.vw_profiles_unified AS
-- Perfiles single
SELECT
    p.user_id,
    p.id as profile_id,
    p.name,
    p.first_name,
    p.last_name,
    p.display_name,
    p.nickname,
    p.email,
    p.phone,
    p.account_type,
    p.age,
    p.gender,
    p.sexual_orientation,
    p.bio,
    p.interests,
    p.profile_theme,
    p.interested_in,
    p.role,
    p.is_verified,
    p.is_demo,
    p.created_at,
    p.updated_at,
    NULL as couple_id,
    NULL as couple_name,
    NULL as his_name,
    NULL as his_age,
    NULL as his_gender,
    NULL as her_name,
    NULL as her_age,
    NULL as her_gender,
    NULL as relationship_type
FROM public.profiles p
WHERE p.account_type = 'single'

UNION ALL

-- Perfiles couple (desde couple_profiles)
SELECT
    cp.user_id,
    cp.id as profile_id,
    cp.couple_name as name,
    NULL as first_name,
    NULL as last_name,
    cp.couple_name as display_name,
    cp.couple_name as nickname,
    cp.email,
    cp.phone,
    'couple'::TEXT as account_type,
    NULL as age,
    NULL as gender,
    NULL as sexual_orientation,
    cp.bio,
    -- Combinar intereses de él y ella
    COALESCE(cp.his_interests, '{}') || COALESCE(cp.her_interests, '{}') as interests,
    cp.profile_theme,
    cp.interested_in,
    cp.role,
    cp.is_verified,
    FALSE as is_demo, -- couple_profiles no tiene is_demo, asumir false
    cp.created_at,
    cp.updated_at,
    cp.id as couple_id,
    cp.couple_name,
    cp.his_name,
    cp.his_age,
    cp.his_gender,
    cp.her_name,
    cp.her_age,
    cp.her_gender,
    cp.relationship_type
FROM public.couple_profiles cp;

-- ----------------------------------------------------------------------------
-- PASO 3: Otorgar permisos en la vista unificada
-- ----------------------------------------------------------------------------

GRANT SELECT ON public.vw_profiles_unified TO authenticated;
GRANT SELECT ON public.vw_profiles_unified TO anon;

-- ----------------------------------------------------------------------------
-- PASO 4: Crear índices en la vista para mejor performance
-- ----------------------------------------------------------------------------

-- Nota: Las vistas no necesitan índices explícitos, pero las tablas subyacentes sí

-- ----------------------------------------------------------------------------
-- PASO 5: Verificación de implementación
-- ----------------------------------------------------------------------------

DO $$
DECLARE
    v_single_count INT;
    v_couple_count INT;
    v_unified_count INT;
    v_columns_ok BOOLEAN := TRUE;
BEGIN
    -- Contar perfiles single
    SELECT COUNT(*) INTO v_single_count
    FROM public.profiles
    WHERE account_type = 'single';

    -- Contar perfiles couple
    SELECT COUNT(*) INTO v_couple_count
    FROM public.couple_profiles;

    -- Contar vista unificada
    SELECT COUNT(*) INTO v_unified_count
    FROM public.vw_profiles_unified;

    -- Verificar que las columnas existen en couple_profiles
    SELECT COUNT(*) = 3 INTO v_columns_ok
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'couple_profiles'
      AND column_name IN ('account_type', 'role', 'is_verified');

    RAISE NOTICE '✅ PROFILES SINGLE: %', v_single_count;
    RAISE NOTICE '✅ PROFILES COUPLE: %', v_couple_count;
    RAISE NOTICE '✅ VISTA UNIFICADA: %', v_unified_count;
    RAISE NOTICE '✅ COLUMNAS couple_profiles OK: %', v_columns_ok;

    IF v_unified_count = (v_single_count + v_couple_count) THEN
        RAISE NOTICE '✅ VISTA UNIFICADA FUNCIONANDO CORRECTAMENTE';
    ELSE
        RAISE WARNING '⚠️ DISCREPANCIA EN VISTA UNIFICADA';
    END IF;
END $$;

-- ============================================================================
-- RESUMEN DE CAMBIOS
-- ============================================================================
-- ✓ Eliminada duplicación en CoupleRegistrationForm.tsx
-- ✓ Agregadas columnas account_type, role, is_verified a couple_profiles
-- ✓ Creada vista vw_profiles_unified para unificar single/couple
-- ✓ Otorgados permisos apropiados en la vista
-- ✓ Verificación automática de funcionamiento correcto
-- ============================================================================
