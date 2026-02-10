-- ============================================================================
-- FASE 3: ÍNDICES OPTIMIZADOS PARA COUPLE_PROFILES
-- Fecha: 4 de Febrero, 2026
-- Objetivo: Crear índices apropiados en couple_profiles para mejor performance
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PASO 1: Índices para couple_profiles
-- ----------------------------------------------------------------------------

-- Índice para búsquedas por user_id (muy común en consultas)
CREATE INDEX IF NOT EXISTS idx_couple_profiles_user_id ON public.couple_profiles(user_id);

-- Índice compuesto para email + user_id (búsquedas de perfil)
CREATE INDEX IF NOT EXISTS idx_couple_profiles_email_user_id ON public.couple_profiles(email, user_id);

-- Índice para couple_name (búsquedas por nombre de pareja)
CREATE INDEX IF NOT EXISTS idx_couple_profiles_couple_name ON public.couple_profiles(couple_name);

-- Índice para relationship_type (filtrado por tipo de relación)
CREATE INDEX IF NOT EXISTS idx_couple_profiles_relationship_type ON public.couple_profiles(relationship_type);

-- Índice para location (búsquedas geográficas)
CREATE INDEX IF NOT EXISTS idx_couple_profiles_location ON public.couple_profiles(location);

-- Índice compuesto para intereses (parejas con intereses específicos)
-- Nota: Los intereses están en arrays JSON, usar GIN index
CREATE INDEX IF NOT EXISTS idx_couple_profiles_his_interests_gin ON public.couple_profiles USING gin(his_interests);
CREATE INDEX IF NOT EXISTS idx_couple_profiles_her_interests_gin ON public.couple_profiles USING gin(her_interests);
CREATE INDEX IF NOT EXISTS idx_couple_profiles_interested_in_gin ON public.couple_profiles USING gin(interested_in);

-- Índice para is_verified (filtrado de perfiles verificados)
CREATE INDEX IF NOT EXISTS idx_couple_profiles_is_verified ON public.couple_profiles(is_verified) WHERE is_verified = true;

-- Índice compuesto para edad de miembros (rango de edad)
CREATE INDEX IF NOT EXISTS idx_couple_profiles_ages ON public.couple_profiles(his_age, her_age);

-- Índice compuesto para género de miembros (matching)
CREATE INDEX IF NOT EXISTS idx_couple_profiles_genders ON public.couple_profiles(his_gender, her_gender);

-- ----------------------------------------------------------------------------
-- PASO 2: Índices para vista unificada vw_profiles_unified
-- ----------------------------------------------------------------------------

-- Nota: Las vistas no necesitan índices físicos, pero optimizar las tablas subyacentes
-- Los índices anteriores en couple_profiles mejorarán las consultas a la vista

-- ----------------------------------------------------------------------------
-- PASO 3: Verificación de índices creados
-- ----------------------------------------------------------------------------

DO $$
DECLARE
    v_index_count INT;
BEGIN
    -- Contar índices creados en couple_profiles
    SELECT COUNT(*) INTO v_index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'couple_profiles'
      AND indexname LIKE 'idx_couple_profiles%';

    RAISE NOTICE '✅ ÍNDICES CREADOS EN couple_profiles: %', v_index_count;

    -- Verificar índices específicos
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_couple_profiles_user_id') THEN
        RAISE NOTICE '✅ idx_couple_profiles_user_id - CREADO';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_couple_profiles_email_user_id') THEN
        RAISE NOTICE '✅ idx_couple_profiles_email_user_id - CREADO';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_couple_profiles_his_interests_gin') THEN
        RAISE NOTICE '✅ idx_couple_profiles_his_interests_gin - CREADO';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_couple_profiles_her_interests_gin') THEN
        RAISE NOTICE '✅ idx_couple_profiles_her_interests_gin - CREADO';
    END IF;

    RAISE NOTICE '✅ OPTIMIZACIÓN DE ÍNDICES COMPLETADA PARA couple_profiles';
END $$;

-- ============================================================================
-- RESUMEN DE ÍNDICES OPTIMIZADOS
-- ============================================================================
-- ✓ Índice user_id - Consultas de perfil por usuario
-- ✓ Índice email_user_id - Búsquedas de perfil por email
-- ✓ Índice couple_name - Búsquedas por nombre de pareja
-- ✓ Índice relationship_type - Filtros por tipo de relación
-- ✓ Índice location - Búsquedas geográficas
-- ✓ Índices GIN para arrays - his_interests, her_interests, interested_in
-- ✓ Índice is_verified - Perfiles verificados
-- ✓ Índice compuesto ages - Rangos de edad
-- ✓ Índice compuesto genders - Matching por género
-- ============================================================================
