-- =====================================================
    -- FIX: Corregir sintaxis de triggers para PostgreSQL 12
    -- =====================================================

    -- Eliminar trigger si existe (para evitar conflictos)
    DROP TRIGGER IF EXISTS trigger_ai_scores_updated_at ON ai_compatibility_scores;
-- Crear trigger sin IF NOT EXISTS (no soportado en PG12)
    CREATE TRIGGER trigger_ai_scores_updated_at
    BEFORE UPDATE ON ai_compatibility_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_scores_updated_at();
-- Verificación
    SELECT 'Trigger syntax fixed' as status;
