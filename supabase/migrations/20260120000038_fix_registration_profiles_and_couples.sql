ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS sexual_orientation text,
  ADD COLUMN IF NOT EXISTS profile_theme text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'interested_in'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'interested_in'
        AND data_type = 'text'
    ) THEN
      ALTER TABLE public.profiles
        ALTER COLUMN interested_in TYPE text[]
        USING (
          CASE
            WHEN interested_in IS NULL OR interested_in = '' THEN NULL
            ELSE ARRAY[interested_in]
          END
        );
    END IF;
  END IF;
END
$$;

ALTER TABLE public.couple_profiles
  ADD COLUMN IF NOT EXISTS couple_name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS profile_theme text,
  ADD COLUMN IF NOT EXISTS relationship_type text,
  ADD COLUMN IF NOT EXISTS his_name text,
  ADD COLUMN IF NOT EXISTS his_age integer,
  ADD COLUMN IF NOT EXISTS his_gender text,
  ADD COLUMN IF NOT EXISTS his_interests text[],
  ADD COLUMN IF NOT EXISTS her_name text,
  ADD COLUMN IF NOT EXISTS her_age integer,
  ADD COLUMN IF NOT EXISTS her_gender text,
  ADD COLUMN IF NOT EXISTS her_interests text[];

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'couple_profiles'
      AND column_name = 'interested_in'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'couple_profiles'
        AND column_name = 'interested_in'
        AND data_type = 'text'
    ) THEN
      ALTER TABLE public.couple_profiles
        ALTER COLUMN interested_in TYPE text[]
        USING (
          CASE
            WHEN interested_in IS NULL OR interested_in = '' THEN NULL
            ELSE ARRAY[interested_in]
          END
        );
    END IF;
  END IF;
END
$$;
