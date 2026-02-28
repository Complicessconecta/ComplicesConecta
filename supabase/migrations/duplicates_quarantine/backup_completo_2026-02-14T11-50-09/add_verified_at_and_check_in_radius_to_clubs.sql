-- Agregar columnas verified_at y check_in_radius_meters a la tabla clubs
-- Estas columnas son necesarias para el funcionamiento de AdminPartners.tsx

ALTER TABLE public.clubs
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS check_in_radius_meters INTEGER DEFAULT 50;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_clubs_verified_at ON public.clubs(verified_at);
CREATE INDEX IF NOT EXISTS idx_clubs_check_in_radius_meters ON public.clubs(check_in_radius_meters);

-- Comentarios sobre las columnas
COMMENT ON COLUMN public.clubs.verified_at IS 'Fecha y hora en que el club fue verificado';
COMMENT ON COLUMN public.clubs.check_in_radius_meters IS 'Radio en metros para el check-in en el club';
