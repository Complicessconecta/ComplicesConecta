-- Tabla para almacenar likes entre usuarios
-- Fecha: 21 de Enero, 2026
-- Proyecto: ComplicesConetca v3.9.2

CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  liked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(liker_id, liked_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_likes_liker_id ON public.likes(liker_id);
CREATE INDEX IF NOT EXISTS idx_likes_liked_id ON public.likes(liked_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON public.likes(created_at DESC);

-- RLS Policies
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'likes'
      AND policyname = 'Users can see likes they sent or received'
  ) THEN
    CREATE POLICY "Users can see likes they sent or received"
      ON public.likes FOR SELECT
      USING (auth.uid() = liker_id OR auth.uid() = liked_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'likes'
      AND policyname = 'Users can create likes'
  ) THEN
    CREATE POLICY "Users can create likes"
      ON public.likes FOR INSERT
      WITH CHECK (auth.uid() = liker_id);
  END IF;
END $$;
