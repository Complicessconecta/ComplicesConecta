-- ============================================================================
-- Clubs Table Setup
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Crear tabla clubs para Clubs.tsx
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  rating_average NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  website_url TEXT,
  phone TEXT,
  email TEXT,
  opening_hours JSONB,
  amenities JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_clubs_is_active ON public.clubs(is_active);
CREATE INDEX IF NOT EXISTS idx_clubs_is_featured ON public.clubs(is_featured);
CREATE INDEX IF NOT EXISTS idx_clubs_rating_average ON public.clubs(rating_average);
CREATE INDEX IF NOT EXISTS idx_clubs_location ON public.clubs(latitude, longitude);

-- Habilitar RLS
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY anyone_can_view_active_clubs ON public.clubs
FOR SELECT
USING (is_active = true);

CREATE POLICY authenticated_users_can_insert_clubs ON public.clubs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY authenticated_users_can_update_own_clubs ON public.clubs
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Crear trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_clubs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_clubs_updated_at
BEFORE UPDATE ON public.clubs
FOR EACH ROW
EXECUTE FUNCTION public.update_clubs_updated_at();

-- Comentarios
COMMENT ON TABLE public.clubs IS 'Clubs y eventos sociales';
