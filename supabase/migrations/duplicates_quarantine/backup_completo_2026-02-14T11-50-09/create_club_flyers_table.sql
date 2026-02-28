-- Crear tabla club_flyers
-- Esta tabla almacena los flyers promocionales de los clubs

CREATE TABLE IF NOT EXISTS public.club_flyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  event_date TIMESTAMPTZ,
  event_end_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  ai_processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (ai_processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processed_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_club_flyers_club_id ON public.club_flyers(club_id);
CREATE INDEX IF NOT EXISTS idx_club_flyers_is_active ON public.club_flyers(is_active);
CREATE INDEX IF NOT EXISTS idx_club_flyers_is_featured ON public.club_flyers(is_featured);
CREATE INDEX IF NOT EXISTS idx_club_flyers_event_date ON public.club_flyers(event_date);
CREATE INDEX IF NOT EXISTS idx_club_flyers_ai_processing_status ON public.club_flyers(ai_processing_status);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.club_flyers ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir lectura a todos los usuarios autenticados
DROP POLICY IF EXISTS "Permitir lectura a usuarios autenticados" ON public.club_flyers;
CREATE POLICY "Permitir lectura a usuarios autenticados"
ON public.club_flyers
FOR SELECT
TO authenticated
USING (true);

-- Política para permitir inserción a administradores
DROP POLICY IF EXISTS "Permitir inserción a administradores" ON public.club_flyers;
CREATE POLICY "Permitir inserción a administradores"
ON public.club_flyers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Política para permitir actualización a administradores
DROP POLICY IF EXISTS "Permitir actualización a administradores" ON public.club_flyers;
CREATE POLICY "Permitir actualización a administradores"
ON public.club_flyers
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
DROP POLICY IF EXISTS "Permitir eliminación a administradores" ON public.club_flyers;
CREATE POLICY "Permitir eliminación a administradores"
ON public.club_flyers
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
CREATE OR REPLACE FUNCTION update_club_flyers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_club_flyers_update ON public.club_flyers;
CREATE TRIGGER on_club_flyers_update
BEFORE UPDATE ON public.club_flyers
FOR EACH ROW
EXECUTE FUNCTION update_club_flyers_updated_at();

-- Comentario sobre la tabla
COMMENT ON TABLE public.club_flyers IS 'Almacena los flyers promocionales de los clubs';
COMMENT ON COLUMN public.club_flyers.ai_processing_status IS 'Estado del procesamiento de IA del flyer (watermark, blur, etc.)';
COMMENT ON COLUMN public.club_flyers.processed_image_url IS 'URL de la imagen procesada con watermark y blur';
