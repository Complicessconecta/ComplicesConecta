-- Crear tabla swinger_interests para almacenar intereses de swingers
-- Esta tabla es necesaria para el funcionamiento de useInterests.ts

CREATE TABLE IF NOT EXISTS public.swinger_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_swinger_interests_category ON public.swinger_interests(category);
CREATE INDEX IF NOT EXISTS idx_swinger_interests_is_active ON public.swinger_interests(is_active);

-- Comentarios sobre las columnas
COMMENT ON TABLE public.swinger_interests IS 'Intereses disponibles para swingers';
COMMENT ON COLUMN public.swinger_interests.name IS 'Nombre del interés';
COMMENT ON COLUMN public.swinger_interests.category IS 'Categoría del interés';
COMMENT ON COLUMN public.swinger_interests.description IS 'Descripción del interés';
COMMENT ON COLUMN public.swinger_interests.icon IS 'Icono del interés';
COMMENT ON COLUMN public.swinger_interests.is_active IS 'Indica si el interés está activo';
COMMENT ON COLUMN public.swinger_interests.metadata IS 'Metadatos adicionales del interés';

-- Crear tabla user_interests para relacionar usuarios con intereses
CREATE TABLE IF NOT EXISTS public.user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL REFERENCES public.swinger_interests(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, interest_id)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON public.user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_interest_id ON public.user_interests(interest_id);

-- Comentarios sobre las columnas
COMMENT ON TABLE public.user_interests IS 'Relación entre usuarios e intereses';
COMMENT ON COLUMN public.user_interests.user_id IS 'ID del usuario';
COMMENT ON COLUMN public.user_interests.interest_id IS 'ID del interés';

-- Habilitar RLS
ALTER TABLE public.swinger_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para swinger_interests
CREATE POLICY "Todos pueden ver intereses activos"
  ON public.swinger_interests FOR SELECT
  USING (is_active = TRUE);

-- Políticas RLS para user_interests
CREATE POLICY "Usuarios pueden ver sus propios intereses"
  ON public.user_interests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Usuarios pueden crear sus propios intereses"
  ON public.user_interests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios pueden eliminar sus propios intereses"
  ON public.user_interests FOR DELETE
  USING (user_id = auth.uid());
