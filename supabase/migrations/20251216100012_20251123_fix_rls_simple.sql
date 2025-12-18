-- =====================================================
-- MIGRACIÓN: Fix RLS Simple
-- NOTA: Se ha deshabilitado la acción de DESHABILITAR RLS
-- para mantener la seguridad y consistencia con la migración anterior.
-- =====================================================

-- Originalmente esto deshabilitaba RLS. Ahora solo aseguramos que esté habilitado.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    RAISE NOTICE 'RLS mantenido habilitado en profiles (omitido DISABLE RLS)';
END $$;
