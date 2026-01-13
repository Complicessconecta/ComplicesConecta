-- Tabla para solicitudes de registro de clubs
-- Creado: 12 de Enero, 2026
-- Propósito: Almacenar solicitudes de terceros para registrar sus clubs

CREATE TABLE IF NOT EXISTS public.club_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información del Propietario
  owner_name TEXT NOT NULL,
  owner_age INTEGER NOT NULL,
  owner_gender TEXT NOT NULL CHECK (owner_gender IN ('M', 'F')),
  owner_rfc TEXT NOT NULL,
  
  -- Información del Representante (opcional)
  rep_name TEXT,
  rep_position TEXT,
  rep_phone TEXT,
  rep_email TEXT,
  
  -- Información del Club
  club_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  website TEXT,
  use_app_as_website BOOLEAN DEFAULT FALSE,
  email TEXT NOT NULL,
  
  -- Detalles del Club
  description TEXT NOT NULL,
  club_type TEXT NOT NULL,
  hours TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  
  -- Documentos
  documents_url TEXT NOT NULL,
  company_rfc TEXT,
  license TEXT,
  
  -- Estado y Metadatos
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'review')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  
  -- Credenciales de Acceso Temporal
  temp_password TEXT,
  temp_password_expires_at TIMESTAMP WITH TIME ZONE,
  temp_password_used BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT club_applications_owner_rfc_format CHECK (owner_rfc ~ '^[A-Z&Ñ]{3,4}[0-9]{2}[0-9]{2}[0-9]{2}[0-9]{3}$'),
  CONSTRAINT club_applications_phone_format CHECK (phone ~ '^\+?[0-9\s\-\(\)]+$'),
  CONSTRAINT club_applications_email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_club_applications_status ON public.club_applications(status);
CREATE INDEX IF NOT EXISTS idx_club_applications_city ON public.club_applications(city);
CREATE INDEX IF NOT EXISTS idx_club_applications_state ON public.club_applications(state);
CREATE INDEX IF NOT EXISTS idx_club_applications_created_at ON public.club_applications(created_at DESC);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_club_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER club_applications_updated_at
  BEFORE UPDATE ON public.club_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_club_applications_updated_at();

-- Comentarios de la tabla
COMMENT ON TABLE public.club_applications IS 'Solicitudes de registro de clubs de terceros para verificación';
COMMENT ON COLUMN public.club_applications.status IS 'Estado de la solicitud: pending, approved, rejected, review';
COMMENT ON COLUMN public.club_applications.documents_url IS 'URL de documentos legales en Google Drive, Dropbox o similar';
COMMENT ON COLUMN public.club_applications.use_app_as_website IS 'Si el club usará la app como su sitio web oficial';

-- Políticas de seguridad (RLS)
ALTER TABLE public.club_applications ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura (solo administradores pueden ver todas las solicitudes)
CREATE POLICY "Admins can view all applications" ON public.club_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('complicesconectasw@outlook.es')
    )
  );

-- Política de inserción (cualquiera puede crear solicitud)
CREATE POLICY "Anyone can create application" ON public.club_applications
  FOR INSERT WITH CHECK (true);

-- Política de actualización (solo administradores)
CREATE POLICY "Admins can update applications" ON public.club_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('complicesconectasw@outlook.es')
    )
  );
