-- Agregar columnas faltantes a la tabla club_verifications
-- Estas columnas son necesarias para el funcionamiento de AdminPartners.tsx

ALTER TABLE public.club_verifications
ADD COLUMN IF NOT EXISTS verification_type TEXT CHECK (verification_type IN ('manual', 'automatic', 'premium', 'admin')),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_club_verifications_verification_type ON public.club_verifications(verification_type);
CREATE INDEX IF NOT EXISTS idx_club_verifications_verified_by ON public.club_verifications(verified_by);

-- Comentario sobre las columnas
COMMENT ON COLUMN public.club_verifications.verification_type IS 'Tipo de verificación realizada (manual, automatic, premium, admin)';
COMMENT ON COLUMN public.club_verifications.notes IS 'Notas adicionales sobre la verificación';
COMMENT ON COLUMN public.club_verifications.verified_by IS 'ID del usuario que verificó el club';
