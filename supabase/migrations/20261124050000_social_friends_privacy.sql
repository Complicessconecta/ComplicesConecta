-- ============================================================================
-- Tablas sociales: amistades, solicitudes, bloqueos, retención de identidad
-- + visibilidad y país/geolocalización en los perfiles
-- ComplicesConecta
-- Fecha: 24 de Noviembre, 2026
-- Descripción: implementa los 6 puntos sociales de Wacko (ronda post-test
-- PR #72): país en registro, solicitud de amistad, geolocalización
-- aproximada, perfiles públicos/privados, reportar/bloquear con revisión
-- de administrador y retención de identidad tras la baja.
-- APLICAR EN VIVO EN SUPABASE ES UN PASO APARTE (no aplicado por este PR).
-- Flujo completo: docs/FLUJO_AMISTAD_PRIVACIDAD_PERFILES.md
-- Código: src/lib/countries.ts, src/lib/friends.ts,
-- src/lib/geolocation.ts, src/lib/profileVisibility.ts, src/lib/reportBlock.ts
-- ============================================================================
--
-- Tablas que YA existían y se reutilizan (no se duplican):
-- - public.reports: reportes de perfil con revisión admin (status,
--   reviewed_by, reviewed_at, resolution_notes, action_taken). Los motivos
--   desglosados (términos / conducta / material prohibido) viven en
--   src/lib/reportBlock.ts (REPORT_REASONS) y se guardan en reports.reason.
-- - public.gallery_access_requests: solicitudes de acceso a galería
--   (el flujo de "ver fotos" convive con friend_requests kind='photo_access').
-- - public.invitations: solicitudes de conexión genéricas (el flujo de
--   amistad usa la tabla nueva friend_requests para no mezclar estados).
-- - public.couple_profile_reports: reportes solo de pareja (se mantiene;
--   los reportes nuevos van a public.reports para ambos tipos de perfil).

-- ---------------------------------------------------------------------------
-- Columnas nuevas en profiles (single)
-- ---------------------------------------------------------------------------
-- country_code: país de origen del registro (ISO alfa-2, p. ej. 'MX').
--   El nombre + bandera se resuelven en src/lib/countries.ts.
-- visibility: 'public' (cualquiera ve el perfil) o 'private' (solo
--   amigos aceptados; los demás ven el aviso y deben enviar solicitud).
-- location_sharing_enabled: geolocalización para matching. Si es false,
--   la distancia aproximada de este perfil NO se muestra a nadie.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'private')),
  ADD COLUMN IF NOT EXISTS location_sharing_enabled boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.country_code IS
  'País de origen del registro (ISO alfa-2). La nacionalidad se muestra en el perfil como nombre + bandera. Ver src/lib/countries.ts.';
COMMENT ON COLUMN public.profiles.visibility IS
  'public: cualquiera ve el perfil. private: solo amigos aceptados; los demás deben enviar solicitud de amistad. Ver src/lib/profileVisibility.ts.';
COMMENT ON COLUMN public.profiles.location_sharing_enabled IS
  'Si es false, la distancia aproximada de este perfil no se muestra a nadie. Ver src/lib/geolocation.ts.';

-- ---------------------------------------------------------------------------
-- Columnas nuevas en couple_profiles (pareja)
-- ---------------------------------------------------------------------------
-- couple_profiles YA tiene country (texto) e is_public (booleano):
-- visibility es su espejo explícito (public <=> is_public true) y
-- country_code es el ISO que acompaña a country.
ALTER TABLE public.couple_profiles
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'private')),
  ADD COLUMN IF NOT EXISTS location_sharing_enabled boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.couple_profiles.country_code IS
  'País de origen del registro (ISO alfa-2). Acompaña a country (texto). Ver src/lib/countries.ts.';
COMMENT ON COLUMN public.couple_profiles.visibility IS
  'public: cualquiera ve el perfil. private: solo amigos aceptados. Espejo explícito de is_public. Ver src/lib/profileVisibility.ts.';
COMMENT ON COLUMN public.couple_profiles.location_sharing_enabled IS
  'Si es false, la distancia aproximada de esta pareja no se muestra a nadie. Ver src/lib/geolocation.ts.';

-- ---------------------------------------------------------------------------
-- friend_requests: solicitudes de amistad y de ver fotos
-- ---------------------------------------------------------------------------
-- kind: 'friendship' (solicitud de amistad) o 'photo_access' (pedir ver
--   las fotos/galería del perfil, p. ej. desde el chat).
-- status: 'pending' | 'accepted' | 'declined'.
-- Al aceptar una solicitud 'friendship' se crea la fila en friendships.
-- Las identidades son profiles.id (el mismo id que la app pasa como
-- profileId en los componentes sociales).
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'friendship'
    CHECK (kind IN ('friendship', 'photo_access')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined')),
  message text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  decided_at timestamptz,
  CHECK (requester_id <> addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_addressee
  ON public.friend_requests(addressee_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_requester
  ON public.friend_requests(requester_id, status);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'friend_requests'
      AND policyname = 'friend_requests_select_policy'
  ) THEN
    CREATE POLICY friend_requests_select_policy
      ON public.friend_requests FOR SELECT
      USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'friend_requests'
      AND policyname = 'friend_requests_insert_policy'
  ) THEN
    CREATE POLICY friend_requests_insert_policy
      ON public.friend_requests FOR INSERT
      WITH CHECK (auth.uid() = requester_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'friend_requests'
      AND policyname = 'friend_requests_update_policy'
  ) THEN
    CREATE POLICY friend_requests_update_policy
      ON public.friend_requests FOR UPDATE
      USING (auth.uid() = requester_id OR auth.uid() = addressee_id)
      WITH CHECK (auth.uid() = requester_id OR auth.uid() = addressee_id);
  END IF;
END $$;

COMMENT ON TABLE public.friend_requests IS
  'Solicitudes de amistad (kind=friendship) y de ver fotos (kind=photo_access). Ver src/lib/friends.ts.';

-- ---------------------------------------------------------------------------
-- friendships: amistades aceptadas (par ordenado, sin duplicados)
-- ---------------------------------------------------------------------------
-- user_id_a < user_id_b siempre (el CHECK lo garantiza): una amistad es
-- una sola fila, sin importar quién envió la solicitud.
-- Al eliminar la amistad, si el perfil eliminado es privado, el eliminado
-- vuelve a necesitar solicitud para verlo (gating en profileVisibility).
CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_a uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id_b uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CHECK (user_id_a < user_id_b),
  UNIQUE (user_id_a, user_id_b)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user_a
  ON public.friendships(user_id_a);
CREATE INDEX IF NOT EXISTS idx_friendships_user_b
  ON public.friendships(user_id_b);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'friendships'
      AND policyname = 'friendships_select_policy'
  ) THEN
    CREATE POLICY friendships_select_policy
      ON public.friendships FOR SELECT
      USING (auth.uid() = user_id_a OR auth.uid() = user_id_b);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'friendships'
      AND policyname = 'friendships_insert_policy'
  ) THEN
    CREATE POLICY friendships_insert_policy
      ON public.friendships FOR INSERT
      WITH CHECK (auth.uid() = user_id_a OR auth.uid() = user_id_b);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'friendships'
      AND policyname = 'friendships_delete_policy'
  ) THEN
    CREATE POLICY friendships_delete_policy
      ON public.friendships FOR DELETE
      USING (auth.uid() = user_id_a OR auth.uid() = user_id_b);
  END IF;
END $$;

COMMENT ON TABLE public.friendships IS
  'Amistades aceptadas (una fila por par, user_id_a < user_id_b). Ver src/lib/friends.ts.';

-- ---------------------------------------------------------------------------
-- profile_blocks: bloqueos (como Twitter)
-- ---------------------------------------------------------------------------
-- El bloqueado NO puede buscar a quien lo bloqueó ni ver su perfil: la
-- app filtra los resultados con isBlockedBy / isSearchBlockedSync
-- (src/lib/reportBlock.ts) antes de mostrarlos.
CREATE TABLE IF NOT EXISTS public.profile_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CHECK (blocker_id <> blocked_id),
  UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_blocks_blocker
  ON public.profile_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_profile_blocks_blocked
  ON public.profile_blocks(blocked_id);

ALTER TABLE public.profile_blocks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profile_blocks'
      AND policyname = 'profile_blocks_select_policy'
  ) THEN
    -- El bloqueado también puede leerlo: lo necesita para saber que no
    -- debe mostrar al bloqueador en sus búsquedas.
    CREATE POLICY profile_blocks_select_policy
      ON public.profile_blocks FOR SELECT
      USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profile_blocks'
      AND policyname = 'profile_blocks_insert_policy'
  ) THEN
    CREATE POLICY profile_blocks_insert_policy
      ON public.profile_blocks FOR INSERT
      WITH CHECK (auth.uid() = blocker_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profile_blocks'
      AND policyname = 'profile_blocks_delete_policy'
  ) THEN
    CREATE POLICY profile_blocks_delete_policy
      ON public.profile_blocks FOR DELETE
      USING (auth.uid() = blocker_id);
  END IF;
END $$;

COMMENT ON TABLE public.profile_blocks IS
  'Bloqueos entre perfiles (como Twitter): el bloqueado no puede buscar a quien lo bloqueó. Ver src/lib/reportBlock.ts.';

-- ---------------------------------------------------------------------------
-- retained_identities: identidad retenida tras la baja por reporte
-- ---------------------------------------------------------------------------
-- Cuando un administrador da de baja un perfil reportado, el correo, el
-- nombre de usuario (su ID) y el motivo SE QUEDAN aquí para que esa
-- persona no pueda registrarse después con otro nombre. La tabla es de
-- solo lectura para la app salvo inserción por administrador: NO hay
-- política de UPDATE ni de DELETE (la retención no se borra desde la app).
-- La comprobación en el registro (¿este correo / usuario ya fue dado de
-- baja?) la hace el servidor con rol administrador, no el cliente.
CREATE TABLE IF NOT EXISTS public.retained_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  username text NOT NULL,
  user_id uuid NOT NULL,
  ban_reason text NOT NULL,
  report_id uuid,
  banned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  banned_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (email),
  UNIQUE (username)
);

CREATE INDEX IF NOT EXISTS idx_retained_identities_user_id
  ON public.retained_identities(user_id);

ALTER TABLE public.retained_identities ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'retained_identities'
      AND policyname = 'retained_identities_admin_select_policy'
  ) THEN
    CREATE POLICY retained_identities_admin_select_policy
      ON public.retained_identities FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.user_id = auth.uid() AND p.is_admin = true
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'retained_identities'
      AND policyname = 'retained_identities_admin_insert_policy'
  ) THEN
    CREATE POLICY retained_identities_admin_insert_policy
      ON public.retained_identities FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.user_id = auth.uid() AND p.is_admin = true
        )
      );
  END IF;
END $$;

COMMENT ON TABLE public.retained_identities IS
  'Identidades retenidas tras baja por reporte (correo + nombre de usuario + motivo). Evita el re-registro con otro nombre. Sin UPDATE ni DELETE desde la app. Ver src/lib/reportBlock.ts (retainIdentityAfterBan).';
