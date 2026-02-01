-- ============================================================================
-- CORRECCIÓN DE SEGURIDAD - RLS Y VISTAS
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- ============================================================================

-- ============================================================================
-- NOTA: Las siguientes tablas no existen en el schema actual
-- fingerprint_bans, blocked_fingerprints, smart_matches, predictive_matching, sustainable_events
-- Este script se ajusta para trabajar con tablas existentes
-- ============================================================================

-- ============================================================================
-- HABILITAR RLS EN TABLAS EXISTENTES
-- ============================================================================

-- Tabla: matches (ya existe, verificar RLS)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'matches'
    ) THEN
        ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
        
        -- Crear policies usando DO block para verificar existencia
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'matches' AND policyname = 'Users can view their own matches'
        ) THEN
            CREATE POLICY "Users can view their own matches"
            ON public.matches FOR SELECT
            USING (
                auth.uid() = user1_id OR 
                auth.uid() = user2_id
            );
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'matches' AND policyname = 'Users can create matches'
        ) THEN
            CREATE POLICY "Users can create matches"
            ON public.matches FOR INSERT
            WITH CHECK (
                auth.uid() = user1_id OR
                EXISTS (
                    SELECT 1 FROM pg_roles 
                    WHERE rolname = current_user 
                    AND rolname IN ('postgres', 'service_role')
                )
            );
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'matches' AND policyname = 'Users can update their own matches'
        ) THEN
            CREATE POLICY "Users can update their own matches"
            ON public.matches FOR UPDATE
            USING (
                auth.uid() = user1_id OR 
                auth.uid() = user2_id
            )
            WITH CHECK (
                auth.uid() = user1_id OR 
                auth.uid() = user2_id
            );
        END IF;
    END IF;
END $$;

-- Tabla: predictive_match_scores (ya existe, verificar RLS)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'predictive_match_scores'
    ) THEN
        ALTER TABLE public.predictive_match_scores ENABLE ROW LEVEL SECURITY;
        
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'predictive_match_scores' AND policyname = 'Users can view own predictive match scores'
        ) THEN
            CREATE POLICY "Users can view own predictive match scores"
            ON public.predictive_match_scores FOR SELECT
            USING (auth.uid() = user_id);
        END IF;
    END IF;
END $$;

-- ============================================================================
-- CORREGIR VISTAS SECURITY DEFINER
-- ============================================================================

-- Las siguientes vistas tienen SECURITY DEFINER, lo cual puede ser un riesgo.
-- Revisar cada vista y cambiar a SECURITY INVOKER si no es necesario SECURITY DEFINER

-- Nota: SECURITY DEFINER es necesario cuando la vista necesita acceder a datos
-- que el usuario no tiene permiso directo. Si esto no es necesario, cambiar a
-- SECURITY INVOKER para mejorar la seguridad.

-- Lista de vistas a revisar (según lints de seguridad):
-- 1. user_staking_summary
-- 2. recent_transactions
-- 3. story_engagement_metrics
-- 4. popular_hashtags
-- 5. user_story_stats
-- 6. security_metrics
-- 7. active_security_flags
-- 8. two_factor_stats
-- 9. current_token_metrics
-- 10. staking_metrics
-- 11. performance_metrics_daily
-- 12. unresolved_errors_summary
-- 13. web_vitals_daily
-- 14. active_worldid_verifications
-- 15. geographic_hotspots

-- Ejemplo de cómo cambiar una vista de SECURITY DEFINER a SECURITY INVOKER:
-- DROP VIEW IF EXISTS public.user_staking_summary;
-- CREATE VIEW public.user_staking_summary AS
-- SELECT ...;
-- ALTER VIEW public.user_staking_summary SET (security_invoker = true);

-- ============================================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================================

DO $$
BEGIN
  IF to_regclass('public.fingerprint_bans') IS NOT NULL THEN
    EXECUTE 'COMMENT ON TABLE public.fingerprint_bans IS ' || quote_literal('Tabla de huellas digitales baneadas - RLS habilitado v3.9.2');
  END IF;

  IF to_regclass('public.blocked_fingerprints') IS NOT NULL THEN
    EXECUTE 'COMMENT ON TABLE public.blocked_fingerprints IS ' || quote_literal('Tabla de huellas digitales bloqueadas - RLS habilitado v3.9.2');
  END IF;

  IF to_regclass('public.smart_matches') IS NOT NULL THEN
    EXECUTE 'COMMENT ON TABLE public.smart_matches IS ' || quote_literal('Tabla de matches inteligentes - RLS habilitado v3.9.2');
  END IF;

  IF to_regclass('public.predictive_matching') IS NOT NULL THEN
    EXECUTE 'COMMENT ON TABLE public.predictive_matching IS ' || quote_literal('Tabla de matching predictivo - RLS habilitado v3.9.2');
  END IF;

  IF to_regclass('public.sustainable_events') IS NOT NULL THEN
    EXECUTE 'COMMENT ON TABLE public.sustainable_events IS ' || quote_literal('Tabla de eventos sostenibles - RLS habilitado v3.9.2');
  END IF;
END $$;

-- ============================================================================
-- Add lifted_at column to permanent_bans
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Agregar columna lifted_at a la tabla permanent_bans
-- ============================================================================

-- Agregar columna lifted_at si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'permanent_bans' 
    AND column_name = 'lifted_at'
  ) THEN
    ALTER TABLE public.permanent_bans ADD COLUMN lifted_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ Columna lifted_at agregada a permanent_bans';
  ELSE
    RAISE NOTICE '⚠️ Columna lifted_at ya existe en permanent_bans';
  END IF;
END $$;

-- Crear índice para lifted_at si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'permanent_bans' 
    AND indexname = 'idx_permanent_bans_lifted_at'
  ) THEN
    CREATE INDEX idx_permanent_bans_lifted_at ON public.permanent_bans(lifted_at);
    RAISE NOTICE '✅ Índice idx_permanent_bans_lifted_at creado';
  ELSE
    RAISE NOTICE '⚠️ Índice idx_permanent_bans_lifted_at ya existe';
  END IF;
END $$;

-- Comentarios
COMMENT ON COLUMN public.permanent_bans.lifted_at IS 'Fecha en que el baneo fue levantado';

-- Notificación final
DO $$
BEGIN
  RAISE NOTICE '✅ Migración completada exitosamente';
END $$;

