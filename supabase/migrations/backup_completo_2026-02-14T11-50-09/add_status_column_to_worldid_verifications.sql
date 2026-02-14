-- Agregar columna status a la tabla worldid_verifications
-- Esta columna es necesaria para el funcionamiento de useWorldID.ts

ALTER TABLE public.worldid_verifications
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed', 'expired'));

-- Crear índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_worldid_verifications_status ON public.worldid_verifications(status);

-- Comentario sobre la columna
COMMENT ON COLUMN public.worldid_verifications.status IS 'Estado de la verificación (pending, verified, failed, expired)';
