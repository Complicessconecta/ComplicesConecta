-- ============================================================================
-- FASE 3: OPTIMIZACIÓN DE PERFORMANCE - ÍNDICES, TRIGGERS, CONSTRAINTS
-- Fecha: 4 de Febrero, 2026
-- Objetivo: Optimizar queries críticas, corregir triggers problemáticos,
--          mejorar constraints para performance y consistencia
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PASO 1: OPTIMIZACIÓN DE ÍNDICES
-- ----------------------------------------------------------------------------

-- Eliminar índices redundantes o poco utilizados
DROP INDEX IF EXISTS idx_profiles_created_at;
DROP INDEX IF EXISTS idx_matches_created_at;
DROP INDEX IF EXISTS idx_clubs_created_at;
DROP INDEX IF EXISTS idx_admin_users_created_at;

-- Crear índices compuestos para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_profiles_location_active ON public.profiles(location, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_age_gender_active ON public.profiles(age, gender, is_active) WHERE is_active = TRUE AND is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_interests_active ON public.profiles USING gin(interests) WHERE is_active = TRUE AND is_public = TRUE;

-- Índices para matches - optimizar búsquedas de compatibilidad
CREATE INDEX IF NOT EXISTS idx_matches_users_status ON public.matches(user1_id, user2_id, status);
CREATE INDEX IF NOT EXISTS idx_matches_status_created ON public.matches(status, created_at DESC) WHERE status IN ('PENDING_AGREEMENT', 'RESOLVED_TRANSFERRED');

-- Índices para clubs - optimizar discovery
CREATE INDEX IF NOT EXISTS idx_clubs_location_active ON public.clubs(location, is_active) WHERE is_active = TRUE AND is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_clubs_category_members ON public.clubs(category, member_count DESC) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_clubs_owner_verified ON public.clubs(owner_id, is_verified) WHERE is_active = TRUE;

-- Índices para admin_users - optimizar gestión
CREATE INDEX IF NOT EXISTS idx_admin_users_role_active ON public.admin_users(role, is_active) WHERE is_active = TRUE;

-- ----------------------------------------------------------------------------
-- PASO 2: CORRECCIÓN Y OPTIMIZACIÓN DE TRIGGERS
-- ----------------------------------------------------------------------------

-- Función mejorada para actualizar updated_at (con verificación de cambios)
CREATE OR REPLACE FUNCTION public.update_updated_at_column_optimized()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actualizar si hay cambios reales en campos relevantes
    IF (OLD.* IS DISTINCT FROM NEW.*) THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Reemplazar triggers existentes con versión optimizada
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column_optimized();

DROP TRIGGER IF EXISTS update_matches_updated_at ON public.matches;
CREATE TRIGGER update_matches_updated_at
    BEFORE UPDATE ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column_optimized();

DROP TRIGGER IF EXISTS update_clubs_updated_at ON public.clubs;
CREATE TRIGGER update_clubs_updated_at
    BEFORE UPDATE ON public.clubs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column_optimized();

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column_optimized();

-- ----------------------------------------------------------------------------
-- PASO 3: MEJORA DE CONSTRAINTS
-- ----------------------------------------------------------------------------

-- Agregar constraints únicos faltantes
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_email_unique,
    ADD CONSTRAINT profiles_email_unique UNIQUE (email) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE public.clubs
    DROP CONSTRAINT IF EXISTS clubs_name_unique,
    ADD CONSTRAINT clubs_name_unique UNIQUE (name) DEFERRABLE INITIALLY DEFERRED;

-- Constraints de integridad referencial con CASCADE apropiado
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS fk_profiles_agreement_id,
    ADD CONSTRAINT fk_profiles_agreement_id
        FOREIGN KEY (agreement_id) REFERENCES public.couple_agreements(id) ON DELETE SET NULL;

ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS fk_profiles_dispute_id,
    ADD CONSTRAINT fk_profiles_dispute_id
        FOREIGN KEY (dispute_id) REFERENCES public.couple_disputes(id) ON DELETE SET NULL;

-- Constraints check para validación de datos
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_age_check,
    ADD CONSTRAINT profiles_age_check CHECK (age >= 18 AND age <= 120);

ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_gender_check,
    ADD CONSTRAINT profiles_gender_check CHECK (gender IN ('male', 'female', 'non-binary', 'other'));

ALTER TABLE public.matches
    DROP CONSTRAINT IF EXISTS matches_different_users_check,
    ADD CONSTRAINT matches_different_users_check CHECK (user1_id != user2_id);

-- ----------------------------------------------------------------------------
-- PASO 4: FUNCIONES DE PERFORMANCE
-- ----------------------------------------------------------------------------

-- Función para reindexar tablas críticas (mantenimiento)
CREATE OR REPLACE FUNCTION public.reindex_critical_tables()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Reindexar tablas críticas
    REINDEX TABLE CONCURRENTLY public.profiles;
    REINDEX TABLE CONCURRENTLY public.matches;
    REINDEX TABLE CONCURRENTLY public.clubs;
    REINDEX TABLE CONCURRENTLY public.admin_users;

    RAISE NOTICE '✅ Reindexado completado en tablas críticas';
END;
$$;

-- Función para analizar queries lentas (diagnóstico)
CREATE OR REPLACE FUNCTION public.analyze_slow_queries()
RETURNS TABLE (
    query TEXT,
    total_time NUMERIC,
    mean_time NUMERIC,
    calls BIGINT,
    rows BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pg_stat_statements.query,
        pg_stat_statements.total_time,
        pg_stat_statements.mean_time,
        pg_stat_statements.calls,
        pg_stat_statements.rows
    FROM pg_stat_statements
    WHERE pg_stat_statements.total_time > 1000  -- Más de 1 segundo
    ORDER BY pg_stat_statements.total_time DESC
    LIMIT 10;
END;
$$;

-- ----------------------------------------------------------------------------
-- PASO 5: OPTIMIZACIONES DE VACUUM Y ANÁLISIS
-- ----------------------------------------------------------------------------

-- Vacuum analyze en tablas críticas para optimizar
VACUUM (ANALYZE) public.profiles;
VACUUM (ANALYZE) public.matches;
VACUUM (ANALYZE) public.clubs;
VACUUM (ANALYZE) public.admin_users;

-- ----------------------------------------------------------------------------
-- PASO 6: VERIFICACIÓN FINAL
-- ----------------------------------------------------------------------------

DO $$
DECLARE
    v_index_count INT;
    v_trigger_count INT;
    v_constraint_count INT;
BEGIN
    -- Contar índices optimizados
    SELECT COUNT(*) INTO v_index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'matches', 'clubs', 'admin_users')
      AND indexname LIKE 'idx_%';

    -- Contar triggers
    SELECT COUNT(*) INTO v_trigger_count
    FROM information_schema.triggers
    WHERE event_object_schema = 'public'
      AND event_object_table IN ('profiles', 'matches', 'clubs', 'admin_users');

    -- Contar constraints
    SELECT COUNT(*) INTO v_constraint_count
    FROM pg_constraint
    WHERE connamespace = 'public'::regnamespace
      AND conrelid::regclass::text IN ('profiles', 'matches', 'clubs', 'admin_users');

    RAISE NOTICE '✅ ÍNDICES OPTIMIZADOS: %', v_index_count;
    RAISE NOTICE '✅ TRIGGERS OPTIMIZADOS: %', v_trigger_count;
    RAISE NOTICE '✅ CONSTRAINTS MEJORADOS: %', v_constraint_count;
    RAISE NOTICE '✅ OPTIMIZACIÓN DE PERFORMANCE COMPLETADA';
END $$;

-- ============================================================================
-- RESUMEN DE OPTIMIZACIONES
-- ============================================================================
-- ✓ Índices compuestos creados para queries frecuentes
-- ✓ Triggers updated_at optimizados (solo actualizan si hay cambios)
-- ✓ Constraints únicos y de integridad agregados
-- ✓ Funciones de mantenimiento y diagnóstico implementadas
-- ✓ VACUUM ANALYZE ejecutado en tablas críticas
-- ✓ Verificación automática de optimizaciones aplicadas
-- ============================================================================
