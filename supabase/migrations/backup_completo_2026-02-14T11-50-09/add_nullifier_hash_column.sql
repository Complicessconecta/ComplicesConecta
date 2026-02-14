-- Agregar columna nullifier_hash a la tabla worldid_verifications
-- Esta columna es necesaria para el funcionamiento de useWorldID.ts

ALTER TABLE public.worldid_verifications
ADD COLUMN IF NOT EXISTS nullifier_hash TEXT;

-- Crear índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_worldid_verifications_nullifier_hash ON public.worldid_verifications(nullifier_hash);

-- Comentario sobre la columna
COMMENT ON COLUMN public.worldid_verifications.nullifier_hash IS 'Hash del nullifier de WorldID';
