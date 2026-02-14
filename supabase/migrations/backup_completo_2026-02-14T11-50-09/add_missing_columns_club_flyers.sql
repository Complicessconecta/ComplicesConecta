-- Agregar columnas faltantes a la tabla club_flyers
-- Estas columnas son necesarias para el funcionamiento de AdminPartners.tsx

ALTER TABLE public.club_flyers
ADD COLUMN IF NOT EXISTS watermark_applied BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS blur_applied BOOLEAN NOT NULL DEFAULT false;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_club_flyers_watermark_applied ON public.club_flyers(watermark_applied);
CREATE INDEX IF NOT EXISTS idx_club_flyers_blur_applied ON public.club_flyers(blur_applied);

-- Comentario sobre las columnas
COMMENT ON COLUMN public.club_flyers.watermark_applied IS 'Indica si se aplicó el watermark al flyer';
COMMENT ON COLUMN public.club_flyers.blur_applied IS 'Indica si se aplicó el blur al flyer';
