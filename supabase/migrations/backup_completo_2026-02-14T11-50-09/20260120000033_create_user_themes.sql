-- Crear tabla user_themes
CREATE TABLE IF NOT EXISTS public.user_themes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bg_url TEXT,
  particles_intensity INTEGER DEFAULT 50,
  glow_level TEXT DEFAULT 'medium' CHECK (glow_level IN ('low', 'medium', 'high')),
  enable_particles BOOLEAN DEFAULT true,
  enable_background_animations BOOLEAN DEFAULT true,
  animation_speed TEXT DEFAULT 'normal' CHECK (animation_speed IN ('slow', 'normal', 'fast')),
  enable_glass_ui BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_user_themes_user_id ON public.user_themes(user_id);

-- Habilitar RLS
ALTER TABLE public.user_themes ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan ver sus propios temas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_themes'
      AND policyname = 'Users can view own themes'
  ) THEN
    CREATE POLICY "Users can view own themes"
      ON public.user_themes FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Política para que los usuarios puedan insertar sus propios temas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_themes'
      AND policyname = 'Users can insert own themes'
  ) THEN
    CREATE POLICY "Users can insert own themes"
      ON public.user_themes FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Política para que los usuarios puedan actualizar sus propios temas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_themes'
      AND policyname = 'Users can update own themes'
  ) THEN
    CREATE POLICY "Users can update own themes"
      ON public.user_themes FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Política para que los usuarios puedan eliminar sus propios temas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_themes'
      AND policyname = 'Users can delete own themes'
  ) THEN
    CREATE POLICY "Users can delete own themes"
      ON public.user_themes FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_user_themes_updated_at'
  ) THEN
    CREATE TRIGGER update_user_themes_updated_at
      BEFORE UPDATE ON public.user_themes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;
