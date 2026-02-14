-- Crear tabla club_verifications
-- Esta tabla almacena las verificaciones de clubs que necesitan ser aprobadas por administradores

CREATE TABLE IF NOT EXISTS public.club_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  documents JSONB DEFAULT '{}',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_club_verifications_club_id ON public.club_verifications(club_id);
CREATE INDEX IF NOT EXISTS idx_club_verifications_user_id ON public.club_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_club_verifications_status ON public.club_verifications(status);
CREATE INDEX IF NOT EXISTS idx_club_verifications_submitted_at ON public.club_verifications(submitted_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.club_verifications ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir lectura a todos los usuarios autenticados
DROP POLICY IF EXISTS "Permitir lectura a usuarios autenticados" ON public.club_verifications;
CREATE POLICY "Permitir lectura a usuarios autenticados"
ON public.club_verifications
FOR SELECT
TO authenticated
USING (true);

-- Política para permitir inserción a usuarios autenticados
DROP POLICY IF EXISTS "Permitir inserción a usuarios autenticados" ON public.club_verifications;
CREATE POLICY "Permitir inserción a usuarios autenticados"
ON public.club_verifications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

-- Política para permitir actualización a administradores
DROP POLICY IF EXISTS "Permitir actualización a administradores" ON public.club_verifications;
CREATE POLICY "Permitir actualización a administradores"
ON public.club_verifications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Política para permitir eliminación a administradores
DROP POLICY IF EXISTS "Permitir eliminación a administradores" ON public.club_verifications;
CREATE POLICY "Permitir eliminación a administradores"
ON public.club_verifications
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_club_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_club_verifications_update ON public.club_verifications;
CREATE TRIGGER on_club_verifications_update
BEFORE UPDATE ON public.club_verifications
FOR EACH ROW
EXECUTE FUNCTION update_club_verifications_updated_at();

-- Comentario sobre la tabla
COMMENT ON TABLE public.club_verifications IS 'Almacena las verificaciones de clubs que necesitan ser aprobadas por administradores';
COMMENT ON COLUMN public.club_verifications.documents IS 'Documentos de verificación del club (licencias, permisos, etc.)';
