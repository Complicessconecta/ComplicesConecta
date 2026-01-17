-- ============================================================================
-- CORRECCIÓN DE SEGURIDAD - VISTAS SECURITY DEFINER
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Cambiar vistas SECURITY DEFINER a SECURITY INVOKER
-- ============================================================================

DO $$
BEGIN
    -- user_staking_summary
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' AND viewname = 'user_staking_summary'
    ) THEN
        EXECUTE 'ALTER VIEW public.user_staking_summary SET (security_invoker = true)';
        RAISE NOTICE '✅ user_staking_summary cambiado a SECURITY INVOKER';
    END IF;
    
    -- recent_transactions
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' AND viewname = 'recent_transactions'
    ) THEN
        EXECUTE 'ALTER VIEW public.recent_transactions SET (security_invoker = true)';
        RAISE NOTICE '✅ recent_transactions cambiado a SECURITY INVOKER';
    END IF;
    
    -- story_engagement_metrics
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' AND viewname = 'story_engagement_metrics'
    ) THEN
        EXECUTE 'ALTER VIEW public.story_engagement_metrics SET (security_invoker = true)';
        RAISE NOTICE '✅ story_engagement_metrics cambiado a SECURITY INVOKER';
    END IF;
    
    -- popular_hashtags
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' AND viewname = 'popular_hashtags'
    ) THEN
        EXECUTE 'ALTER VIEW public.popular_hashtags SET (security_invoker = true)';
        RAISE NOTICE '✅ popular_hashtags cambiado a SECURITY INVOKER';
    END IF;
    
    -- user_story_stats
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' AND viewname = 'user_story_stats'
    ) THEN
        EXECUTE 'ALTER VIEW public.user_story_stats SET (security_invoker = true)';
        RAISE NOTICE '✅ user_story_stats cambiado a SECURITY INVOKER';
    END IF;
    
    -- security_metrics
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' AND viewname = 'security_metrics'
    ) THEN
        EXECUTE 'ALTER VIEW public.security_metrics SET (security_invoker = true)';
        RAISE NOTICE '✅ security_metrics cambiado a SECURITY INVOKER';
    END IF;
    
    -- active_security_flags
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' AND viewname = 'active_security_flags'
    ) THEN
        EXECUTE 'ALTER VIEW public.active_security_flags SET (security_invoker = true)';
        RAISE NOTICE '✅ active_security_flags cambiado a SECURITY INVOKER';
    END IF;
    
    -- two_factor_stats
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' AND viewname = 'two_factor_stats'
    ) THEN
        EXECUTE 'ALTER VIEW public.two_factor_stats SET (security_invoker = true)';
        RAISE NOTICE '✅ two_factor_stats cambiado a SECURITY INVOKER';
    END IF;
    
    -- current_token_metrics
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' AND viewname = 'current_token_metrics'
    ) THEN
        EXECUTE 'ALTER VIEW public.current_token_metrics SET (security_invoker = true)';
        RAISE NOTICE '✅ current_token_metrics cambiado a SECURITY INVOKER';
    END IF;
    
    -- staking_metrics
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' AND viewname = 'staking_metrics'
    ) THEN
        EXECUTE 'ALTER VIEW public.staking_metrics SET (security_invoker = true)';
        RAISE NOTICE '✅ staking_metrics cambiado a SECURITY INVOKER';
    END IF;
    
    -- performance_metrics_daily
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' AND viewname = 'performance_metrics_daily'
    ) THEN
        EXECUTE 'ALTER VIEW public.performance_metrics_daily SET (security_invoker = true)';
        RAISE NOTICE '✅ performance_metrics_daily cambiado a SECURITY INVOKER';
    END IF;
    
    -- unresolved_errors_summary
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' AND viewname = 'unresolved_errors_summary'
    ) THEN
        EXECUTE 'ALTER VIEW public.unresolved_errors_summary SET (security_invoker = true)';
        RAISE NOTICE '✅ unresolved_errors_summary cambiado a SECURITY INVOKER';
    END IF;
    
    -- web_vitals_daily
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' AND viewname = 'web_vitals_daily'
    ) THEN
        EXECUTE 'ALTER VIEW public.web_vitals_daily SET (security_invoker = true)';
        RAISE NOTICE '✅ web_vitals_daily cambiado a SECURITY INVOKER';
    END IF;
    
    -- active_worldid_verifications
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' AND viewname = 'active_worldid_verifications'
    ) THEN
        EXECUTE 'ALTER VIEW public.active_worldid_verifications SET (security_invoker = true)';
        RAISE NOTICE '✅ active_worldid_verifications cambiado a SECURITY INVOKER';
    END IF;
    
    -- geographic_hotspots
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' AND viewname = 'geographic_hotspots'
    ) THEN
        EXECUTE 'ALTER VIEW public.geographic_hotspots SET (security_invoker = true)';
        RAISE NOTICE '✅ geographic_hotspots cambiado a SECURITY INVOKER';
    END IF;
    
    RAISE NOTICE '✅ Corrección de seguridad completada: Todas las vistas cambiadas a SECURITY INVOKER';
END $$;
