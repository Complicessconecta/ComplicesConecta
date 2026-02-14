-- =====================================================
-- TABLA profile_likes (Discover -> Match)
-- =====================================================
-- Fecha: 08 de Enero, 2026
-- Versión: 4.0 (Documento Maestro IA)
-- Descripción: Tabla determinista para persistir likes entre perfiles.
--              Se usa para calcular match mutuo antes de habilitar Chat.
-- =====================================================

-- Tabla base
CREATE TABLE IF NOT EXISTS public.profile_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  liked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT likes_no_self_like CHECK (liker_id <> liked_id),
  CONSTRAINT likes_unique_pair UNIQUE (liker_id, liked_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_profile_likes_liker_id ON public.profile_likes(liker_id);
CREATE INDEX IF NOT EXISTS idx_profile_likes_liked_id ON public.profile_likes(liked_id);

-- Habilitar RLS
ALTER TABLE public.profile_likes ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas antiguas (si existieran por ejecuciones previas)
DROP POLICY IF EXISTS "Users can view own profile likes" ON public.profile_likes;
DROP POLICY IF EXISTS "Users can create own profile likes" ON public.profile_likes;
DROP POLICY IF EXISTS "Users can delete own profile likes" ON public.profile_likes;

-- SELECT: pueden ver likes donde participan (liker o liked)
CREATE POLICY "Users can view own profile likes" ON public.profile_likes
  FOR SELECT
  USING (
    auth.uid() = liker_id OR auth.uid() = liked_id
  );

-- INSERT: solo el liker puede crear su like
CREATE POLICY "Users can create own profile likes" ON public.profile_likes
  FOR INSERT
  WITH CHECK (
    auth.uid() = liker_id
  );

-- DELETE: solo el liker puede borrar su like
CREATE POLICY "Users can delete own profile likes" ON public.profile_likes
  FOR DELETE
  USING (
    auth.uid() = liker_id
  );
