-- ============================================================================
-- MIGRACIÓN: Crear tablas de solicitudes para producción
-- Fecha: 19 de Enero, 2026
-- Descripción: Asegurar que las tablas invitations y gallery_permissions existan
--              con todas las columnas necesarias para la funcionalidad de solicitudes
-- ============================================================================

-- ---------------------------------------------------------------------------
-- TABLA: invitations (Solicitudes recibidas y enviadas)
-- ---------------------------------------------------------------------------

-- Crear tabla invitations si no existe
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_profile UUID NOT NULL,
  to_profile UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'connection',
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  decided_at TIMESTAMPTZ
);

-- Agregar columnas faltantes si no existen
DO $$
BEGIN
  -- Columna type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'invitations' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE public.invitations ADD COLUMN type TEXT NOT NULL DEFAULT 'connection';
    RAISE NOTICE '✅ Columna type agregada a invitations';
  END IF;

  -- Columna status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'invitations' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.invitations ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
    RAISE NOTICE '✅ Columna status agregada a invitations';
  END IF;

  -- Columna message
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'invitations' 
    AND column_name = 'message'
  ) THEN
    ALTER TABLE public.invitations ADD COLUMN message TEXT;
    RAISE NOTICE '✅ Columna message agregada a invitations';
  END IF;

  -- Columna updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'invitations' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.invitations ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✅ Columna updated_at agregada a invitations';
  END IF;

  -- Columna decided_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'invitations' 
    AND column_name = 'decided_at'
  ) THEN
    ALTER TABLE public.invitations ADD COLUMN decided_at TIMESTAMPTZ;
    RAISE NOTICE '✅ Columna decided_at agregada a invitations';
  END IF;
END $$;

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_invitations_from_profile ON public.invitations(from_profile);
CREATE INDEX IF NOT EXISTS idx_invitations_to_profile ON public.invitations(to_profile);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_type ON public.invitations(type);
CREATE INDEX IF NOT EXISTS idx_invitations_created_at ON public.invitations(created_at DESC);

-- Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invitations_updated_at ON public.invitations;
CREATE TRIGGER invitations_updated_at
    BEFORE UPDATE ON public.invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_invitations_updated_at();

-- Comentarios
COMMENT ON TABLE public.invitations IS 'Solicitudes de conexión entre usuarios';
COMMENT ON COLUMN public.invitations.from_profile IS 'ID del perfil que envía la solicitud';
COMMENT ON COLUMN public.invitations.to_profile IS 'ID del perfil que recibe la solicitud';
COMMENT ON COLUMN public.invitations.type IS 'Tipo de solicitud: chat, gallery, profile, connection';
COMMENT ON COLUMN public.invitations.status IS 'Estado: pending, accepted, declined, expired';
COMMENT ON COLUMN public.invitations.message IS 'Mensaje opcional de la solicitud';
COMMENT ON COLUMN public.invitations.decided_at IS 'Fecha en que se aceptó o rechazó la solicitud';

-- ---------------------------------------------------------------------------
-- TABLA: gallery_permissions (Permisos de galería)
-- ---------------------------------------------------------------------------

-- Crear tabla gallery_permissions si no existe
CREATE TABLE IF NOT EXISTS public.gallery_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_owner_id UUID NOT NULL,
  granted_by UUID NOT NULL,
  granted_to UUID NOT NULL,
  permission_type TEXT NOT NULL DEFAULT 'view',
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar columnas faltantes si no existen
DO $$
BEGIN
  -- Columna gallery_owner_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gallery_permissions' 
    AND column_name = 'gallery_owner_id'
  ) THEN
    ALTER TABLE public.gallery_permissions ADD COLUMN gallery_owner_id UUID;
    RAISE NOTICE '✅ Columna gallery_owner_id agregada a gallery_permissions';
  END IF;
    
  -- Columna granted_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gallery_permissions' 
    AND column_name = 'granted_by'
  ) THEN
    ALTER TABLE public.gallery_permissions ADD COLUMN granted_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
    RAISE NOTICE '✅ Columna granted_by agregada a gallery_permissions';
  END IF;
    
  -- Columna granted_to
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gallery_permissions' 
    AND column_name = 'granted_to'
  ) THEN
    ALTER TABLE public.gallery_permissions ADD COLUMN granted_to UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
    RAISE NOTICE '✅ Columna granted_to agregada a gallery_permissions';
  END IF;
    
  -- Columna permission_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gallery_permissions' 
    AND column_name = 'permission_type'
  ) THEN
    ALTER TABLE public.gallery_permissions ADD COLUMN permission_type TEXT NOT NULL DEFAULT 'view';
    RAISE NOTICE '✅ Columna permission_type agregada a gallery_permissions';
  END IF;
    
  -- Columna status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gallery_permissions' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.gallery_permissions ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
    RAISE NOTICE '✅ Columna status agregada a gallery_permissions';
  END IF;
    
  -- Columna expires_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gallery_permissions' 
    AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE gallery_permissions ADD COLUMN expires_at TIMESTAMPTZ;
    RAISE NOTICE '✅ Columna expires_at agregada a gallery_permissions';
  END IF;
    
  -- Columna updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gallery_permissions' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE gallery_permissions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✅ Columna updated_at agregada a gallery_permissions';
  END IF;
END $$;

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_gallery_permissions_gallery_owner_id ON public.gallery_permissions(gallery_owner_id);
CREATE INDEX IF NOT EXISTS idx_gallery_permissions_granted_to ON public.gallery_permissions(granted_to);
CREATE INDEX IF NOT EXISTS idx_gallery_permissions_status ON public.gallery_permissions(status);
CREATE INDEX IF NOT EXISTS idx_gallery_permissions_permission_type ON public.gallery_permissions(permission_type);

-- Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_gallery_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gallery_permissions_updated_at ON public.gallery_permissions;
CREATE TRIGGER gallery_permissions_updated_at
    BEFORE UPDATE ON public.gallery_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_gallery_permissions_updated_at();

-- Comentarios
COMMENT ON TABLE public.gallery_permissions IS 'Permisos de acceso a galerías privadas';
COMMENT ON COLUMN public.gallery_permissions.gallery_owner_id IS 'ID del propietario de la galería';
COMMENT ON COLUMN public.gallery_permissions.granted_by IS 'ID del usuario que otorgó el permiso';
COMMENT ON COLUMN public.gallery_permissions.granted_to IS 'ID del usuario que recibe el permiso';
COMMENT ON COLUMN public.gallery_permissions.permission_type IS 'Tipo de permiso: view, comment, share';
COMMENT ON COLUMN public.gallery_permissions.status IS 'Estado: active, revoked, expired';
COMMENT ON COLUMN public.gallery_permissions.expires_at IS 'Fecha de expiración del permiso (opcional)';

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- ---------------------------------------------------------------------------

-- Habilitar RLS en invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Política RLS para invitations: usuarios pueden ver sus propias solicitudes (enviadas y recibidas)
DROP POLICY IF EXISTS "Users can view their invitations" ON public.invitations;
CREATE POLICY "Users can view their invitations" ON public.invitations
  FOR SELECT
  USING (
    auth.uid() = from_profile 
    OR auth.uid() = to_profile
  );

-- Política RLS para invitations: usuarios pueden insertar solicitudes que envían
DROP POLICY IF EXISTS "Users can insert invitations they send" ON public.invitations;
CREATE POLICY "Users can insert invitations they send" ON public.invitations
  FOR INSERT
  WITH CHECK (auth.uid() = from_profile);

-- Política RLS para invitations: usuarios pueden actualizar solicitudes que reciben
DROP POLICY IF EXISTS "Users can update invitations they receive" ON public.invitations;
CREATE POLICY "Users can update invitations they receive" ON public.invitations
  FOR UPDATE
  USING (auth.uid() = to_profile);

-- Habilitar RLS en gallery_permissions
ALTER TABLE public.gallery_permissions ENABLE ROW LEVEL SECURITY;

-- Política RLS para gallery_permissions: usuarios pueden ver permisos donde son propietarios o destinatarios
DROP POLICY IF EXISTS "Users can view their gallery permissions" ON public.gallery_permissions;
CREATE POLICY "Users can view their gallery permissions" ON public.gallery_permissions
  FOR SELECT
  USING (
    auth.uid() = gallery_owner_id 
    OR auth.uid() = granted_to
  );

-- Política RLS para gallery_permissions: usuarios pueden insertar permisos para sus galerías
DROP POLICY IF EXISTS "Users can insert gallery permissions they own" ON public.gallery_permissions;
CREATE POLICY "Users can insert gallery permissions they own" ON public.gallery_permissions
  FOR INSERT
  WITH CHECK (auth.uid() = gallery_owner_id);

-- Política RLS para gallery_permissions: usuarios pueden actualizar permisos que otorgaron
DROP POLICY IF EXISTS "Users can update gallery permissions they granted" ON public.gallery_permissions;
CREATE POLICY "Users can update gallery permissions they granted" ON public.gallery_permissions
  FOR UPDATE
  USING (auth.uid() = granted_by);

-- Política RLS para gallery_permissions: usuarios pueden eliminar permisos que otorgaron
DROP POLICY IF EXISTS "Users can delete gallery permissions they granted" ON public.gallery_permissions;
CREATE POLICY "Users can delete gallery permissions they granted" ON public.gallery_permissions
  FOR DELETE
  USING (auth.uid() = granted_by);

-- ============================================================================
-- NOTIFICACIÓN FINAL
-- ============================================================================
RAISE NOTICE '✅ Migración completada: Tablas invitations y gallery_permissions creadas/actualizadas';
