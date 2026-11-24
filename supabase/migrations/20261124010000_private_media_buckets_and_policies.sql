-- ============================================================================
-- Migración: buckets de Storage + RLS que faltaban (2026-11-24)
-- Auditoría 2026-11-24 §4 / C6 + verificación de producción con datos reales.
--
-- QUÉ FALTABA (verificado por grep en el repo):
-- 1. NINGÚN bucket se crea en ninguna migración. El código ya asume dos:
--    - `media` (privado): private-media.ts + SecureMediaService.createSignedUrl
--      (URLs firmadas 1 h para la galería privada). Sin bucket, los perfiles
--      reales solo ven el placeholder.
--    - `profile-images` (público): useCouplePhotos.ts lo usa con getPublicUrl.
-- 2. No existe NINGUNA política sobre storage.objects en las migraciones.
-- 3. Las tablas public.media y public.gallery_unlocks YA EXISTEN en
--    producción, pero con OTRO esquema que el que asumía esta migración:
--    media usa (user_id, file_url, is_public, ...) y gallery_unlocks usa
--    (user_id, profile_id, unlock_reason, ...) sin target_profile_id
--    (verificado 2026-11-24 en information_schema). Es el esquema que usa
--    el código (EnhancedGallery, ImageGallery, Chat). Aquí las políticas se
--    escriben contra ese esquema real y se agrega la columna
--    target_profile_id que el código inserta. El CREATE TABLE queda como
--    definición canónica para una base nueva; en producción es no-op.
--
-- DECISIÓN DE DISEÑO (leer antes de endurecer): la política SELECT de
-- `media` permite a cualquier usuario autenticado firmar URLs de cualquier
-- ruta del bucket. Es deliberado y coincide con la arquitectura actual del
-- código: la puerta de acceso vive en la app
-- (SecureMediaService.checkMediaPermissions + PIN de la galería) y el
-- firmado se hace desde el cliente del espectador, así que Storage no puede
-- distinguir "espectador aprobado" con las rutas actuales
-- (people/<tipo>/privado/<archivo>, sin user_id en la ruta). El secreto
-- real es la URL firmada (1 h) + que las rutas no se listan. Endurecimiento
-- futuro (no en esta migración): rutas por dueño
-- (people/<user_id>/...) + firmado vía Edge Function con service_role.
--
-- PENDIENTE DEL PROPIETARIO (no es SQL): subir las 62 imágenes de
-- public/assets/people/*/privado/ al bucket `media` (rutas people/...),
-- verificar una galería real con URLs firmadas y DESPUÉS borrarlas de
-- public/. Esta migración no mueve archivos.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Buckets
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', false)
ON CONFLICT (id) DO UPDATE SET public = false;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- RLS ya viene habilitado en storage.objects en Supabase y NO se reafirma
-- aquí: ALTER TABLE sobre storage.objects falla con ERROR 42501
-- ("must be owner of table objects") porque esa tabla pertenece a
-- supabase_storage_admin, no al rol postgres del editor SQL / db push.
-- Las políticas CREATE POLICY de abajo sí funcionan con postgres.

-- ----------------------------------------------------------------------------
-- 2. Políticas de Storage para el bucket `media` (privado)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "media_select_authenticated" ON storage.objects;
CREATE POLICY "media_select_authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_insert_owner" ON storage.objects;
CREATE POLICY "media_insert_owner"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'media' AND owner = auth.uid());

DROP POLICY IF EXISTS "media_update_owner" ON storage.objects;
CREATE POLICY "media_update_owner"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'media' AND owner = auth.uid())
WITH CHECK (bucket_id = 'media' AND owner = auth.uid());

DROP POLICY IF EXISTS "media_delete_owner" ON storage.objects;
CREATE POLICY "media_delete_owner"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'media' AND owner = auth.uid());

-- ----------------------------------------------------------------------------
-- 3. Políticas de Storage para el bucket `profile-images` (público)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "profile_images_select_public" ON storage.objects;
CREATE POLICY "profile_images_select_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "profile_images_insert_owner" ON storage.objects;
CREATE POLICY "profile_images_insert_owner"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-images' AND owner = auth.uid());

DROP POLICY IF EXISTS "profile_images_update_owner" ON storage.objects;
CREATE POLICY "profile_images_update_owner"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profile-images' AND owner = auth.uid())
WITH CHECK (bucket_id = 'profile-images' AND owner = auth.uid());

DROP POLICY IF EXISTS "profile_images_delete_owner" ON storage.objects;
CREATE POLICY "profile_images_delete_owner"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profile-images' AND owner = auth.uid());

-- ----------------------------------------------------------------------------
-- 4. Tabla public.media (alineada al esquema REAL de producción)
--    Verificado 2026-11-24 en information_schema: la tabla YA EXISTE con
--    (user_id, file_name, file_path, file_url, file_type, mime_type,
--    file_size, width, height, duration, thumbnail_url, is_public,
--    is_verified, metadata, tags, created_at, updated_at). Es el esquema que
--    usa EnhancedGallery.tsx (select("*"), .eq("user_id", ...),
--    .eq("is_public", ...), file_url/thumbnail_url). La definición anterior
--    (profile_id, url, type, is_private) NO existe en producción: sus
--    políticas fallaban con 42703. El CREATE TABLE queda como definición
--    canónica para una base nueva; en producción es no-op.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_name VARCHAR,
  file_path TEXT,
  file_url TEXT,
  file_type VARCHAR,
  mime_type VARCHAR,
  file_size BIGINT,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  thumbnail_url TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_user_id ON public.media(user_id);
CREATE INDEX IF NOT EXISTS idx_media_file_type ON public.media(file_type);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON public.media(created_at DESC);

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- El dueño es user_id (UID de auth). SELECT: filas propias o públicas,
-- que es lo que necesita EnhancedGallery (privadas propias con
-- is_public=false solo el dueño; públicas de cualquier usuario).
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios archivos multimedia" ON public.media;
CREATE POLICY "Usuarios pueden ver sus propios archivos multimedia"
  ON public.media FOR SELECT
  USING (user_id = auth.uid() OR is_public IS TRUE);

DROP POLICY IF EXISTS "Usuarios pueden crear sus propios archivos multimedia" ON public.media;
CREATE POLICY "Usuarios pueden crear sus propios archivos multimedia"
  ON public.media FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios archivos multimedia" ON public.media;
CREATE POLICY "Usuarios pueden actualizar sus propios archivos multimedia"
  ON public.media FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios archivos multimedia" ON public.media;
CREATE POLICY "Usuarios pueden eliminar sus propios archivos multimedia"
  ON public.media FOR DELETE
  USING (user_id = auth.uid());


-- ----------------------------------------------------------------------------
-- 5. Tabla public.gallery_unlocks (alineada al esquema REAL de producción)
--    Verificado 2026-11-24 en information_schema: YA EXISTE con (user_id,
--    profile_id, created_at, updated_at, is_active, expires_at,
--    unlock_reason, unlocked_by). El código (ImageGallery.tsx, Chat.tsx) lee
--    profile_id filtrando por user_id = UID de auth, e inserta
--    target_profile_id, columna que NO existe en producción: se agrega con
--    ADD COLUMN IF NOT EXISTS. unlock_reason / unlocked_by no los usa
--    ningún código; se conservan para que una base nueva sea idéntica.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gallery_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  unlock_reason TEXT,
  unlocked_by UUID
);

-- El código inserta target_profile_id; en producción falta: agregarla.
ALTER TABLE public.gallery_unlocks
  ADD COLUMN IF NOT EXISTS target_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_gallery_unlocks_user_id ON public.gallery_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_unlocks_profile_id ON public.gallery_unlocks(profile_id);
CREATE INDEX IF NOT EXISTS idx_gallery_unlocks_target_profile_id ON public.gallery_unlocks(target_profile_id);
CREATE INDEX IF NOT EXISTS idx_gallery_unlocks_is_active ON public.gallery_unlocks(is_active);

ALTER TABLE public.gallery_unlocks ENABLE ROW LEVEL SECURITY;

-- El dueño es user_id (UID de auth): así lo lee y escribe el código
-- (select profile_id where user_id = user.id; insert {user_id, profile_id}).
DROP POLICY IF EXISTS "Usuarios pueden ver sus desbloqueos de galería" ON public.gallery_unlocks;
CREATE POLICY "Usuarios pueden ver sus desbloqueos de galería"
  ON public.gallery_unlocks FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuarios pueden crear desbloqueos de galería" ON public.gallery_unlocks;
CREATE POLICY "Usuarios pueden crear desbloqueos de galería"
  ON public.gallery_unlocks FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus desbloqueos de galería" ON public.gallery_unlocks;
CREATE POLICY "Usuarios pueden actualizar sus desbloqueos de galería"
  ON public.gallery_unlocks FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuarios pueden eliminar sus desbloqueos de galería" ON public.gallery_unlocks;
CREATE POLICY "Usuarios pueden eliminar sus desbloqueos de galería"
  ON public.gallery_unlocks FOR DELETE
  USING (user_id = auth.uid());


-- ----------------------------------------------------------------------------
-- Verificación: los buckets y las tablas deben existir tras la migración.
-- Falla la migración si falta alguno.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_media boolean;
    v_profile_images boolean;
    v_media_table boolean;
    v_unlocks_table boolean;
    v_target_col boolean;
BEGIN
    SELECT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'media') INTO v_media;
    SELECT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile-images') INTO v_profile_images;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'media') INTO v_media_table;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gallery_unlocks') INTO v_unlocks_table;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gallery_unlocks' AND column_name = 'target_profile_id') INTO v_target_col;

    IF NOT v_media OR NOT v_profile_images OR NOT v_media_table OR NOT v_unlocks_table OR NOT v_target_col THEN
        RAISE EXCEPTION 'Migración media incompleta: bucket media=%, profile-images=%, tabla media=%, gallery_unlocks=%, columna target_profile_id=%',
            v_media, v_profile_images, v_media_table, v_unlocks_table, v_target_col;
    END IF;

    RAISE NOTICE 'OK: buckets media (privado) y profile-images (publico); tablas media y gallery_unlocks con RLS';
END $$;
