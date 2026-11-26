-- ============================================================================
-- Tablas del ecosistema Clubs faltantes + club_id en user_consents
-- ComplicesConecta
-- Fecha: 24 de Noviembre, 2026
-- Descripción: crear club_events, club_discounts y club_members (los eventos,
-- descuentos y miembros hoy solo existen en memoria en ClubsDemo) y agregar
-- club_id a user_consents para el consentimiento por club (ClubConsentManager).
-- APLICAR EN VIVO EN SUPABASE ES UN PASO APARTE (no aplicado por este PR).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- club_events: eventos de un club (antes solo DEMO_EVENTS en ClubsDemo.tsx)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.club_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL,
  start_time text,
  end_time text,
  location text,
  capacity integer,
  registered_count integer NOT NULL DEFAULT 0,
  is_vip boolean NOT NULL DEFAULT false,
  price numeric,
  currency text NOT NULL DEFAULT '$',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_club_events_club_id ON public.club_events(club_id);
CREATE INDEX IF NOT EXISTS idx_club_events_date ON public.club_events(event_date);
CREATE INDEX IF NOT EXISTS idx_club_events_active ON public.club_events(is_active);

ALTER TABLE public.club_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'club_events'
      AND policyname = 'club_events_select_policy'
  ) THEN
    CREATE POLICY club_events_select_policy
      ON public.club_events FOR SELECT
      USING (is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'club_events'
      AND policyname = 'club_events_insert_policy'
  ) THEN
    CREATE POLICY club_events_insert_policy
      ON public.club_events FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'club_events'
      AND policyname = 'club_events_update_policy'
  ) THEN
    CREATE POLICY club_events_update_policy
      ON public.club_events FOR UPDATE
      USING (auth.uid() IS NOT NULL)
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'club_events'
      AND policyname = 'club_events_delete_policy'
  ) THEN
    CREATE POLICY club_events_delete_policy
      ON public.club_events FOR DELETE
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- club_discounts: descuentos/promociones de un club
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.club_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  code text NOT NULL,
  description text,
  discount_percent numeric,
  discount_amount numeric,
  valid_from timestamptz,
  valid_until timestamptz,
  max_uses integer,
  uses_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT club_discounts_code_per_club UNIQUE (club_id, code)
);

CREATE INDEX IF NOT EXISTS idx_club_discounts_club_id ON public.club_discounts(club_id);
CREATE INDEX IF NOT EXISTS idx_club_discounts_active ON public.club_discounts(is_active);

ALTER TABLE public.club_discounts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'club_discounts'
      AND policyname = 'club_discounts_select_policy'
  ) THEN
    CREATE POLICY club_discounts_select_policy
      ON public.club_discounts FOR SELECT
      USING (is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'club_discounts'
      AND policyname = 'club_discounts_insert_policy'
  ) THEN
    CREATE POLICY club_discounts_insert_policy
      ON public.club_discounts FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'club_discounts'
      AND policyname = 'club_discounts_update_policy'
  ) THEN
    CREATE POLICY club_discounts_update_policy
      ON public.club_discounts FOR UPDATE
      USING (auth.uid() IS NOT NULL)
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'club_discounts'
      AND policyname = 'club_discounts_delete_policy'
  ) THEN
    CREATE POLICY club_discounts_delete_policy
      ON public.club_discounts FOR DELETE
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- club_members: miembros de un club (usuarios que pertenecen a un club)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.club_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'active',
  joined_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT club_members_unique UNIQUE (club_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON public.club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user_id ON public.club_members(user_id);

ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'club_members'
      AND policyname = 'club_members_select_policy'
  ) THEN
    CREATE POLICY club_members_select_policy
      ON public.club_members FOR SELECT
      USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'club_members'
      AND policyname = 'club_members_insert_policy'
  ) THEN
    CREATE POLICY club_members_insert_policy
      ON public.club_members FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'club_members'
      AND policyname = 'club_members_update_policy'
  ) THEN
    CREATE POLICY club_members_update_policy
      ON public.club_members FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'club_members'
      AND policyname = 'club_members_delete_policy'
  ) THEN
    CREATE POLICY club_members_delete_policy
      ON public.club_members FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- user_consents.club_id: el consentimiento puede ser por club
-- (ClubConsentManager guarda club_id; NULL = consentimiento general).
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_consents
  ADD COLUMN IF NOT EXISTS club_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_consents_club_id ON public.user_consents(club_id);
