-- =====================================================
-- FIX: Reemplazar uuid_generate_v4 con gen_random_uuid
-- =====================================================

-- Crear función uuid_generate_v4 si no existe (para compatibilidad)
CREATE OR REPLACE FUNCTION uuid_generate_v4()
RETURNS uuid AS $$
BEGIN
  RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Verificación
SELECT 'UUID function fixed' as status;
