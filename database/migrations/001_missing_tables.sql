-- MIGRACIÓN: Tablas Faltantes para CómplicesConecta
-- Fecha: January 10, 2026
-- Rama: refact-inteligente-Tra-2025-12-26
-- Reglas: Documento Maestro IA v4.0 (cambios acumulativos, sin eliminaciones)

-- =====================================================
-- TABLA: swinger_interests
-- Propósito: Almacenar intereses específicos de swingers para IA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.swinger_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest_name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  preference_level INTEGER CHECK (preference_level BETWEEN 1 AND 5),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_swinger_interests_user_id ON public.swinger_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_swinger_interests_category ON public.swinger_interests(category);
CREATE INDEX IF NOT EXISTS idx_swinger_interests_active ON public.swinger_interests(is_active) WHERE is_active = true;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_swinger_interests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_swinger_interests_updated_at
  BEFORE UPDATE ON public.swinger_interests
  FOR EACH ROW
  EXECUTE FUNCTION update_swinger_interests_updated_at();

-- =====================================================
-- TABLA: couple_profile_likes
-- Propósito: Likes específicos para perfiles de pareja
-- =====================================================

CREATE TABLE IF NOT EXISTS public.couple_profile_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_couple_id UUID NOT NULL REFERENCES public.couple_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(liker_user_id, liked_couple_id)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_couple_profile_likes_liker ON public.couple_profile_likes(liker_user_id);
CREATE INDEX IF NOT EXISTS idx_couple_profile_likes_liked ON public.couple_profile_likes(liked_couple_id);
CREATE INDEX IF NOT EXISTS idx_couple_profile_likes_created ON public.couple_profile_likes(created_at DESC);

-- =====================================================
-- TABLA: biometric_auth
-- Propósito: Almacenar datos de autenticación biométrica
-- =====================================================

CREATE TABLE IF NOT EXISTS public.biometric_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  biometric_type VARCHAR(50) NOT NULL, -- 'fingerprint', 'face_id', etc.
  device_id VARCHAR(255),
  is_enabled BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, biometric_type, device_id)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_biometric_auth_user_id ON public.biometric_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_auth_enabled ON public.biometric_auth(is_enabled) WHERE is_enabled = true;

-- Trigger para updated_at
CREATE TRIGGER trigger_biometric_auth_updated_at
  BEFORE UPDATE ON public.biometric_auth
  FOR EACH ROW
  EXECUTE FUNCTION update_biometric_auth_updated_at();

-- =====================================================
-- TABLA: gallery_access_requests
-- Propósito: Solicitudes de acceso a galerías privadas en chat
-- =====================================================

CREATE TABLE IF NOT EXISTS public.gallery_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  other_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_gallery_access_viewer ON public.gallery_access_requests(viewer_id);
CREATE INDEX IF NOT EXISTS idx_gallery_access_owner ON public.gallery_access_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_gallery_access_status ON public.gallery_access_requests(status);
CREATE INDEX IF NOT EXISTS idx_gallery_access_created ON public.gallery_access_requests(created_at DESC);

-- Trigger para updated_at
CREATE TRIGGER trigger_gallery_access_updated_at
  BEFORE UPDATE ON public.gallery_access_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_gallery_access_updated_at();

-- =====================================================
-- POLICIES DE SEGURIDAD (RLS)
-- =====================================================

-- swinger_interests
ALTER TABLE public.swinger_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own swinger interests"
  ON public.swinger_interests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own swinger interests"
  ON public.swinger_interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own swinger interests"
  ON public.swinger_interests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own swinger interests"
  ON public.swinger_interests FOR DELETE
  USING (auth.uid() = user_id);

-- couple_profile_likes
ALTER TABLE public.couple_profile_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own couple likes"
  ON public.couple_profile_likes FOR SELECT
  USING (auth.uid() = liker_user_id);

CREATE POLICY "Users can insert own couple likes"
  ON public.couple_profile_likes FOR INSERT
  WITH CHECK (auth.uid() = liker_user_id);

CREATE POLICY "Users can delete own couple likes"
  ON public.couple_profile_likes FOR DELETE
  USING (auth.uid() = liker_user_id);

-- biometric_auth
ALTER TABLE public.biometric_auth ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own biometric auth"
  ON public.biometric_auth FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own biometric auth"
  ON public.biometric_auth FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own biometric auth"
  ON public.biometric_auth FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own biometric auth"
  ON public.biometric_auth FOR DELETE
  USING (auth.uid() = user_id);

-- gallery_access_requests
ALTER TABLE public.gallery_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gallery requests"
  ON public.gallery_access_requests FOR SELECT
  USING (auth.uid() = viewer_id OR auth.uid() = owner_id);

CREATE POLICY "Users can insert gallery requests as viewer"
  ON public.gallery_access_requests FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Owners can update gallery requests"
  ON public.gallery_access_requests FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own gallery requests"
  ON public.gallery_access_requests FOR DELETE
  USING (auth.uid() = viewer_id);

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE public.swinger_interests IS 'Intereses específicos de swingers para matching con IA';
COMMENT ON TABLE public.couple_profile_likes IS 'Likes específicos para perfiles de pareja';
COMMENT ON TABLE public.biometric_auth IS 'Datos de autenticación biométrica de usuarios';
COMMENT ON TABLE public.gallery_access_requests IS 'Solicitudes de acceso a galerías privadas en chat';
