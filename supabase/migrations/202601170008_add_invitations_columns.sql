-- ============================================================================
-- Invitations Table Setup - Agregar columnas faltantes
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Agregar columnas faltantes a tabla invitations
-- ============================================================================

-- Verificar si la tabla invitations existe y agregar columnas faltantes
DO $$
BEGIN
  -- Verificar si la tabla invitations existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'invitations'
  ) THEN
    -- Agregar columna type si no existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'invitations' 
      AND column_name = 'type'
    ) THEN
      ALTER TABLE public.invitations ADD COLUMN type TEXT DEFAULT 'default';
      RAISE NOTICE '✅ Columna type agregada a invitations';
    END IF;

    -- Agregar columna status si no existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'invitations' 
      AND column_name = 'status'
    ) THEN
      ALTER TABLE public.invitations ADD COLUMN status TEXT DEFAULT 'pending';
      RAISE NOTICE '✅ Columna status agregada a invitations';
    END IF;
  ELSE
    RAISE NOTICE '⚠️ Tabla invitations no existe';
  END IF;
END $$;

-- Comentarios
COMMENT ON COLUMN public.invitations.type IS 'Tipo de invitación';
COMMENT ON COLUMN public.invitations.status IS 'Estado de la invitación';
