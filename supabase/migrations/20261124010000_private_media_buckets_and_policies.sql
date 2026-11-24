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
-- 3. Las tablas public.media y public.gallery_unlocks solo existían como
--    archivos SIN timestamp (create_media_table.sql,
--    create_gallery_unlocks_table.sql): `supabase db push` nunca las aplica.
--    Además sus políticas tenían un bug: `profile_id = auth.uid()` compara
--    el UUID del PERFIL con el UID de auth, y en este esquema
--    profiles.id != profiles.user_id. Con esa política nadie podía leer ni
--    escribir sus propias filas. Aquí quedan corregidas (subconsulta por
--    user_id) y con timestamp, que es lo que `db push` aplica.
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

-- RLS ya viene habilitado en storage.objects en Supabase; se reafirma.
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

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
-- 4. Tabla public.media (versión con timestamp y RLS corregido)
--    Original sin timestamp: supabase/migrations/create_media_table.sql
--    (nunca aplicado por `db push`). Se usa en EnhancedGallery.tsx.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'audio')),
  title TEXT,
  description TEXT,
  is_private BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_media_profile_id ON public.media(profile_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON public.media(type);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON public.media(created_at DESC);

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- CORRECCIÓN: el original decía `profile_id = auth.uid()` (perfil UUID vs
-- auth UID: nunca coincide). El dueño se resuelve por profiles.user_id.
-- SELECT: filas propias, o filas NO privadas de un perfil cuyo
-- privacy_settings.media_public no sea false (misma regla que
-- SecureMediaService.isPublicContent: por defecto el contenido es público).
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios archivos multimedia" ON public.media;
CREATE POLICY "Usuarios pueden ver sus propios archivos multimedia"
  ON public.media FOR SELECT
  USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR (
      is_private IS NOT TRUE
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = media.profile_id
          AND COALESCE((p.privacy_settings ->> 'media_public')::boolean, TRUE)
      )
    )
  );

DROP POLICY IF EXISTS "Usuarios pueden crear sus propios archivos multimedia" ON public.media;
CREATE POLICY "Usuarios pueden crear sus propios archivos multimedia"
  ON public.media FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios archivos multimedia" ON public.media;
CREATE POLICY "Usuarios pueden actualizar sus propios archivos multimedia"
  ON public.media FOR UPDATE
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios archivos multimedia" ON public.media;
CREATE POLICY "Usuarios pueden eliminar sus propios archivos multimedia"
  ON public.media FOR DELETE
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- ----------------------------------------------------------------------------
-- 5. Tabla public.gallery_unlocks (versión con timestamp y RLS corregido)
--    Original sin timestamp: supabase/migrations/create_gallery_unlocks_table.sql
--    (nunca aplicado por `db push`). Se usa en ImageGallery.tsx, Chat.tsx y
--    GalleryPrivacyService.ts.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gallery_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT CHECK (reason IN ('match', 'premium', 'admin', 'other')),
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_gallery_unlocks_profile_id ON public.gallery_unlocks(profile_id);
CREATE INDEX IF NOT EXISTS idx_gallery_unlocks_target_profile_id ON public.gallery_unlocks(target_profile_id);
CREATE INDEX IF NOT EXISTS idx_gallery_unlocks_unlocked_at ON public.gallery_unlocks(unlocked_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_unlocks_is_active ON public.gallery_unlocks(is_active);

ALTER TABLE public.gallery_unlocks ENABLE ROW LEVEL SECURITY;

-- CORRECCIÓN: igual que en public.media, el dueño se resuelve por
-- profiles.user_id, no por `profile_id = auth.uid()`.
DROP POLICY IF EXISTS "Usuarios pueden ver sus desbloqueos de galería" ON public.gallery_unlocks;
CREATE POLICY "Usuarios pueden ver sus desbloqueos de galería"
  ON public.gallery_unlocks FOR SELECT
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Usuarios pueden ver desbloqueos de su galería" ON public.gallery_unlocks;
CREATE POLICY "Usuarios pueden ver desbloqueos de su galería"
  ON public.gallery_unlocks FOR SELECT
  USING (target_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Usuarios pueden crear desbloqueos de galería" ON public.gallery_unlocks;
CREATE POLICY "Usuarios pueden crear desbloqueos de galería"
  ON public.gallery_unlocks FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus desbloqueos de galería" ON public.gallery_unlocks;
CREATE POLICY "Usuarios pueden actualizar sus desbloqueos de galería"
  ON public.gallery_unlocks FOR UPDATE
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Usuarios pueden eliminar sus desbloqueos de galería" ON public.gallery_unlocks;
CREATE POLICY "Usuarios pueden eliminar sus desbloqueos de galería"
  ON public.gallery_unlocks FOR DELETE
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

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
BEGIN
    SELECT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'media') INTO v_media;
    SELECT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile-images') INTO v_profile_images;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'media') INTO v_media_table;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gallery_unlocks') INTO v_unlocks_table;

    IF NOT v_media OR NOT v_profile_images OR NOT v_media_table OR NOT v_unlocks_table THEN
        RAISE EXCEPTION 'Migración media incompleta: bucket media=%, profile-images=%, tabla media=%, gallery_unlocks=%',
            v_media, v_profile_images, v_media_table, v_unlocks_table;
    END IF;

    RAISE NOTICE 'OK: buckets media (privado) y profile-images (publico); tablas media y gallery_unlocks con RLS';
END $$;
