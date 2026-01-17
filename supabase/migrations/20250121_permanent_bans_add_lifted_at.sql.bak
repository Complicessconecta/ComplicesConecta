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
