-- Agregar columnas de ubicación a la tabla messages para ChatWithLocation
-- Fecha: 28 Feb 2026

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS location_latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_address TEXT;

-- Comentario para documentar el propósito de estas columnas
COMMENT ON COLUMN messages.location_latitude IS 'Latitud de la ubicación del mensaje';
COMMENT ON COLUMN messages.location_longitude IS 'Longitud de la ubicación del mensaje';
COMMENT ON COLUMN messages.location_address IS 'Dirección de la ubicación del mensaje';
