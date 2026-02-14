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
        AND data_type = 'character varying'
    ) THEN
      ALTER TABLE public.couple_profiles
        ALTER COLUMN interested_in DROP DEFAULT;

      ALTER TABLE public.couple_profiles
        ALTER COLUMN interested_in TYPE text[]
        USING (
          CASE
            WHEN interested_in IS NULL OR interested_in = '' THEN NULL
            ELSE ARRAY[interested_in::text]
          END
        );

      ALTER TABLE public.couple_profiles
        ALTER COLUMN interested_in SET DEFAULT ARRAY['couples']::text[];
    END IF;
  END IF;
END
$$;

ALTER TABLE public.couple_profiles
  DROP CONSTRAINT IF EXISTS couple_profiles_interested_in_check;

ALTER TABLE public.couple_profiles
  ADD CONSTRAINT couple_profiles_interested_in_check
  CHECK (
    interested_in IS NULL
    OR interested_in <@ ARRAY['singles', 'couples', 'both', 'groups']::text[]
  );

DROP INDEX IF EXISTS public.idx_couple_profiles_interested_in;

CREATE INDEX IF NOT EXISTS idx_couple_profiles_interested_in
  ON public.couple_profiles
  USING GIN (interested_in);
