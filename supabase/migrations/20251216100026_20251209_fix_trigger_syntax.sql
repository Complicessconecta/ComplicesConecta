-- =====================================================
    -- FIX: Corregir sintaxis de triggers para PostgreSQL 12
    -- =====================================================

    -- Eliminar trigger si existe (para evitar conflictos)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'ai_compatibility_scores'
    ) AND EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = 'update_ai_scores_updated_at'
    ) THEN
        DROP TRIGGER IF EXISTS trigger_ai_scores_updated_at ON public.ai_compatibility_scores;

        CREATE TRIGGER trigger_ai_scores_updated_at
        BEFORE UPDATE ON public.ai_compatibility_scores
        FOR EACH ROW
        EXECUTE FUNCTION public.update_ai_scores_updated_at();
    END IF;
END $$;
