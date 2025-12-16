-- ============================================================================
-- RECONCILIACIÓN DE HISTORIAL DE MIGRACIONES
-- ComplicesConecta v3.9.0 - Consolidated & Clean
-- ============================================================================
-- 
-- Este script sincroniza el historial de migraciones en supabase_migrations
-- con los archivos renombrados durante la limpieza masiva del 2025-12-16.
--
-- PROPÓSITO:
-- - Evitar que `supabase db push` intente recrear tablas existentes
-- - Registrar manualmente las migraciones que ya fueron aplicadas
-- - Mantener integridad del historial de cambios
--
-- ============================================================================

-- Verificar si la tabla supabase_migrations existe
-- Si no existe, crear una tabla de control simple
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'schema_migrations'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'supabase_migrations'
  ) THEN
    -- Crear tabla de control si no existe
    CREATE TABLE IF NOT EXISTS public.supabase_migrations (
      version BIGINT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE 'Tabla supabase_migrations creada';
  END IF;
END $$;

-- ============================================================================
-- REGISTRAR MIGRACIONES RENOMBRADAS (2025-12-16)
-- ============================================================================
-- Estas migraciones ya fueron aplicadas a la BD, solo necesitan ser registradas

-- Insertar registros de migraciones renombradas
-- Usar ON CONFLICT DO NOTHING para evitar errores si ya existen
INSERT INTO public.supabase_migrations (version, name, applied_at) VALUES
  (20251216100001, 'solucion_definitiva_consolidada', NOW())
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- VERIFICAR TABLAS CRÍTICAS EXISTENTES
-- ============================================================================
-- Si las tablas ya existen, no hacer nada en futuras migraciones

DO $$
DECLARE
  v_profiles_exists BOOLEAN;
  v_couple_profiles_exists BOOLEAN;
  v_security_logs_exists BOOLEAN;
BEGIN
  -- Verificar existencia de tablas críticas
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) INTO v_profiles_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'couple_profiles'
  ) INTO v_couple_profiles_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'security_logs'
  ) INTO v_security_logs_exists;
  
  -- Registrar estado
  RAISE NOTICE 'Estado de tablas críticas:';
  RAISE NOTICE '  - profiles: %', CASE WHEN v_profiles_exists THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE '  - couple_profiles: %', CASE WHEN v_couple_profiles_exists THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE '  - security_logs: %', CASE WHEN v_security_logs_exists THEN 'EXISTS' ELSE 'MISSING' END;
  
  -- Si todas existen, la BD está sincronizada
  IF v_profiles_exists AND v_couple_profiles_exists AND v_security_logs_exists THEN
    RAISE NOTICE '✅ Base de datos está sincronizada - todas las tablas críticas existen';
  ELSE
    RAISE WARNING '⚠️ Algunas tablas críticas faltan - revisar integridad de BD';
  END IF;
END $$;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
--
-- 1. ARCHIVOS RENOMBRADOS (2025-12-16):
--    - Todas las migraciones SQL antiguas fueron renombradas a formato estándar
--    - Ejemplo: 20251216100001_solucion_definitiva_consolidada.sql
--
-- 2. COMPONENTES ARCHIVADOS:
--    - Componentes no usados movidos a src/components/_ARCHIVE_2025/
--    - Ningún archivo activo importa desde _ARCHIVE_2025
--
-- 3. PRÓXIMOS PASOS:
--    - Ejecutar: supabase db push
--    - Verificar que NO intenta recrear tablas existentes
--    - Confirmar que solo aplica nuevas migraciones
--
-- ============================================================================
