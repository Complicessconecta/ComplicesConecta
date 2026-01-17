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

COMMENT ON TABLE public.fingerprint_bans IS 'Tabla de huellas digitales baneadas - RLS habilitado v3.9.2';
COMMENT ON TABLE public.blocked_fingerprints IS 'Tabla de huellas digitales bloqueadas - RLS habilitado v3.9.2';
COMMENT ON TABLE public.smart_matches IS 'Tabla de matches inteligentes - RLS habilitado v3.9.2';
COMMENT ON TABLE public.predictive_matching IS 'Tabla de matching predictivo - RLS habilitado v3.9.2';
COMMENT ON TABLE public.sustainable_events IS 'Tabla de eventos sostenibles - RLS habilitado v3.9.2';
