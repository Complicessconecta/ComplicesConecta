-- migrate:up

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Tablas faltantes detectadas por auditoría de referencias Supabase en src/
-- Nota: esta migración es idempotente y crea RLS + policies mínimas.
-- -----------------------------------------------------------------------------

-- 1) chat_requests
CREATE TABLE IF NOT EXISTS public.chat_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  other_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_chat_requests_sender_id ON public.chat_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_requests_receiver_id ON public.chat_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_requests_other_user_id ON public.chat_requests(other_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_requests_created_at ON public.chat_requests(created_at DESC);

ALTER TABLE public.chat_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='chat_requests' AND policyname='chat_requests_select_policy'
  ) THEN
    CREATE POLICY chat_requests_select_policy
    ON public.chat_requests
    FOR SELECT
    USING (
      auth.role() = 'service_role'
      OR auth.uid() = sender_id
      OR auth.uid() = receiver_id
      OR auth.uid() = other_user_id
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='chat_requests' AND policyname='chat_requests_insert_policy'
  ) THEN
    CREATE POLICY chat_requests_insert_policy
    ON public.chat_requests
    FOR INSERT
    WITH CHECK (
      auth.role() = 'service_role'
      OR auth.uid() = sender_id
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='chat_requests' AND policyname='chat_requests_update_policy'
  ) THEN
    CREATE POLICY chat_requests_update_policy
    ON public.chat_requests
    FOR UPDATE
    USING (
      auth.role() = 'service_role'
      OR auth.uid() = sender_id
      OR auth.uid() = receiver_id
    )
    WITH CHECK (
      auth.role() = 'service_role'
      OR auth.uid() = sender_id
      OR auth.uid() = receiver_id
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='chat_requests' AND policyname='chat_requests_delete_policy'
  ) THEN
    CREATE POLICY chat_requests_delete_policy
    ON public.chat_requests
    FOR DELETE
    USING (
      auth.role() = 'service_role'
      OR auth.uid() = sender_id
      OR auth.uid() = receiver_id
    );
  END IF;
END $$;

-- 2) chat_permissions
CREATE TABLE IF NOT EXISTS public.chat_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  other_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_permissions_unique
ON public.chat_permissions(sender_id, receiver_id, other_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_permissions_other_user_id
ON public.chat_permissions(other_user_id);

ALTER TABLE public.chat_permissions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='chat_permissions' AND policyname='chat_permissions_select_policy'
  ) THEN
    CREATE POLICY chat_permissions_select_policy
    ON public.chat_permissions
    FOR SELECT
    USING (
      auth.role() = 'service_role'
      OR auth.uid() = sender_id
      OR auth.uid() = receiver_id
      OR auth.uid() = other_user_id
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='chat_permissions' AND policyname='chat_permissions_insert_policy'
  ) THEN
    CREATE POLICY chat_permissions_insert_policy
    ON public.chat_permissions
    FOR INSERT
    WITH CHECK (
      auth.role() = 'service_role'
      OR auth.uid() = sender_id
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='chat_permissions' AND policyname='chat_permissions_update_policy'
  ) THEN
    CREATE POLICY chat_permissions_update_policy
    ON public.chat_permissions
    FOR UPDATE
    USING (
      auth.role() = 'service_role'
      OR auth.uid() = sender_id
      OR auth.uid() = receiver_id
    )
    WITH CHECK (
      auth.role() = 'service_role'
      OR auth.uid() = sender_id
      OR auth.uid() = receiver_id
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='chat_permissions' AND policyname='chat_permissions_delete_policy'
  ) THEN
    CREATE POLICY chat_permissions_delete_policy
    ON public.chat_permissions
    FOR DELETE
    USING (
      auth.role() = 'service_role'
      OR auth.uid() = sender_id
      OR auth.uid() = receiver_id
    );
  END IF;
END $$;

-- 3) gallery_access
CREATE TABLE IF NOT EXISTS public.gallery_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_gallery_access_unique
ON public.gallery_access(owner_id, viewer_id);

ALTER TABLE public.gallery_access ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='gallery_access' AND policyname='gallery_access_select_policy'
  ) THEN
    CREATE POLICY gallery_access_select_policy
    ON public.gallery_access
    FOR SELECT
    USING (
      auth.role() = 'service_role'
      OR auth.uid() = owner_id
      OR auth.uid() = viewer_id
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='gallery_access' AND policyname='gallery_access_insert_policy'
  ) THEN
    CREATE POLICY gallery_access_insert_policy
    ON public.gallery_access
    FOR INSERT
    WITH CHECK (
      auth.role() = 'service_role'
      OR auth.uid() = viewer_id
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='gallery_access' AND policyname='gallery_access_update_policy'
  ) THEN
    CREATE POLICY gallery_access_update_policy
    ON public.gallery_access
    FOR UPDATE
    USING (
      auth.role() = 'service_role'
      OR auth.uid() = owner_id
    )
    WITH CHECK (
      auth.role() = 'service_role'
      OR auth.uid() = owner_id
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='gallery_access' AND policyname='gallery_access_delete_policy'
  ) THEN
    CREATE POLICY gallery_access_delete_policy
    ON public.gallery_access
    FOR DELETE
    USING (
      auth.role() = 'service_role'
      OR auth.uid() = owner_id
    );
  END IF;
END $$;

-- 4) club_applications
CREATE TABLE IF NOT EXISTS public.club_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_name text NOT NULL,
  owner_age integer,
  owner_gender text,
  owner_rfc text,
  rep_name text,
  rep_position text,
  rep_phone text,
  rep_email text,
  club_name text NOT NULL,
  address text,
  location text,
  state text,
  zip_code text,
  phone text,
  whatsapp text,
  website text,
  use_app_as_website boolean NOT NULL DEFAULT false,
  email text,
  description text,
  club_type text,
  hours text,
  capacity integer,
  documents_url text,
  company_rfc text,
  license text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  temp_password text,
  temp_password_expires_at timestamptz,
  temp_password_used boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_club_applications_status ON public.club_applications(status);
CREATE INDEX IF NOT EXISTS idx_club_applications_created_at ON public.club_applications(created_at DESC);

ALTER TABLE public.club_applications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='club_applications' AND policyname='club_applications_insert_policy'
  ) THEN
    CREATE POLICY club_applications_insert_policy
    ON public.club_applications
    FOR INSERT
    WITH CHECK (auth.role() IN ('authenticated','service_role'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='club_applications' AND policyname='club_applications_select_policy'
  ) THEN
    CREATE POLICY club_applications_select_policy
    ON public.club_applications
    FOR SELECT
    USING (auth.role() = 'service_role' OR public.is_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='club_applications' AND policyname='club_applications_update_policy'
  ) THEN
    CREATE POLICY club_applications_update_policy
    ON public.club_applications
    FOR UPDATE
    USING (auth.role() = 'service_role' OR public.is_admin(auth.uid()))
    WITH CHECK (auth.role() = 'service_role' OR public.is_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='club_applications' AND policyname='club_applications_delete_policy'
  ) THEN
    CREATE POLICY club_applications_delete_policy
    ON public.club_applications
    FOR DELETE
    USING (auth.role() = 'service_role' OR public.is_admin(auth.uid()));
  END IF;
END $$;

-- 5) content_permissions
CREATE TABLE IF NOT EXISTS public.content_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_permissions_unique
ON public.content_permissions(user_id, content_id);

ALTER TABLE public.content_permissions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='content_permissions' AND policyname='content_permissions_select_policy'
  ) THEN
    CREATE POLICY content_permissions_select_policy
    ON public.content_permissions
    FOR SELECT
    USING (auth.role() = 'service_role' OR auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='content_permissions' AND policyname='content_permissions_insert_policy'
  ) THEN
    CREATE POLICY content_permissions_insert_policy
    ON public.content_permissions
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='content_permissions' AND policyname='content_permissions_delete_policy'
  ) THEN
    CREATE POLICY content_permissions_delete_policy
    ON public.content_permissions
    FOR DELETE
    USING (auth.role() = 'service_role' OR auth.uid() = user_id);
  END IF;
END $$;

-- 6) content_violations
CREATE TABLE IF NOT EXISTS public.content_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content_id text,
  event_type text NOT NULL,
  reason text,
  details text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_content_violations_event_type ON public.content_violations(event_type);
CREATE INDEX IF NOT EXISTS idx_content_violations_created_at ON public.content_violations(created_at DESC);

ALTER TABLE public.content_violations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='content_violations' AND policyname='content_violations_insert_policy'
  ) THEN
    CREATE POLICY content_violations_insert_policy
    ON public.content_violations
    FOR INSERT
    WITH CHECK (auth.role() IN ('authenticated','service_role'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='content_violations' AND policyname='content_violations_select_policy'
  ) THEN
    CREATE POLICY content_violations_select_policy
    ON public.content_violations
    FOR SELECT
    USING (auth.role() = 'service_role' OR public.is_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='content_violations' AND policyname='content_violations_update_policy'
  ) THEN
    CREATE POLICY content_violations_update_policy
    ON public.content_violations
    FOR UPDATE
    USING (auth.role() = 'service_role' OR public.is_admin(auth.uid()))
    WITH CHECK (auth.role() = 'service_role' OR public.is_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='content_violations' AND policyname='content_violations_delete_policy'
  ) THEN
    CREATE POLICY content_violations_delete_policy
    ON public.content_violations
    FOR DELETE
    USING (auth.role() = 'service_role' OR public.is_admin(auth.uid()));
  END IF;
END $$;

-- 7) View: couple_profiles_with_partners
CREATE OR REPLACE VIEW public.couple_profiles_with_partners
AS
SELECT
  cp.id,
  cp.user_id,
  cp.partner_1_id AS partner1_id,
  cp.partner_2_id AS partner2_id,
  cp.couple_name,
  cp.couple_bio,
  cp.relationship_type,
  cp.location,
  cp.is_verified,
  cp.is_premium,
  cp.created_at,
  cp.updated_at,
  p1.first_name AS partner1_first_name,
  p1.last_name AS partner1_last_name,
  p1.age AS partner1_age,
  p1.gender AS partner1_gender,
  p1.bio AS partner1_bio,
  p2.first_name AS partner2_first_name,
  p2.last_name AS partner2_last_name,
  p2.age AS partner2_age,
  p2.gender AS partner2_gender,
  p2.bio AS partner2_bio
FROM public.couple_profiles cp
LEFT JOIN public.profiles p1 ON p1.id = cp.partner_1_id
LEFT JOIN public.profiles p2 ON p2.id = cp.partner_2_id;

-- migrate:down

DROP VIEW IF EXISTS public.couple_profiles_with_partners;

DROP POLICY IF EXISTS content_violations_delete_policy ON public.content_violations;
DROP POLICY IF EXISTS content_violations_update_policy ON public.content_violations;
DROP POLICY IF EXISTS content_violations_select_policy ON public.content_violations;
DROP POLICY IF EXISTS content_violations_insert_policy ON public.content_violations;

DROP TABLE IF EXISTS public.content_violations;

DROP POLICY IF EXISTS content_permissions_delete_policy ON public.content_permissions;
DROP POLICY IF EXISTS content_permissions_insert_policy ON public.content_permissions;
DROP POLICY IF EXISTS content_permissions_select_policy ON public.content_permissions;

DROP TABLE IF EXISTS public.content_permissions;

DROP POLICY IF EXISTS club_applications_delete_policy ON public.club_applications;
DROP POLICY IF EXISTS club_applications_update_policy ON public.club_applications;
DROP POLICY IF EXISTS club_applications_select_policy ON public.club_applications;
DROP POLICY IF EXISTS club_applications_insert_policy ON public.club_applications;

DROP TABLE IF EXISTS public.club_applications;

DROP POLICY IF EXISTS gallery_access_delete_policy ON public.gallery_access;
DROP POLICY IF EXISTS gallery_access_update_policy ON public.gallery_access;
DROP POLICY IF EXISTS gallery_access_insert_policy ON public.gallery_access;
DROP POLICY IF EXISTS gallery_access_select_policy ON public.gallery_access;

DROP TABLE IF EXISTS public.gallery_access;

DROP POLICY IF EXISTS chat_permissions_delete_policy ON public.chat_permissions;
DROP POLICY IF EXISTS chat_permissions_update_policy ON public.chat_permissions;
DROP POLICY IF EXISTS chat_permissions_insert_policy ON public.chat_permissions;
DROP POLICY IF EXISTS chat_permissions_select_policy ON public.chat_permissions;

DROP TABLE IF EXISTS public.chat_permissions;

DROP POLICY IF EXISTS chat_requests_delete_policy ON public.chat_requests;
DROP POLICY IF EXISTS chat_requests_update_policy ON public.chat_requests;
DROP POLICY IF EXISTS chat_requests_insert_policy ON public.chat_requests;
DROP POLICY IF EXISTS chat_requests_select_policy ON public.chat_requests;

DROP TABLE IF EXISTS public.chat_requests;
