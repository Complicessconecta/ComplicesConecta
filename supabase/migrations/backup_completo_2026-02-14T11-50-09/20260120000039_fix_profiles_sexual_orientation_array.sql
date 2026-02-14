DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'sexual_orientation'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'sexual_orientation'
        AND data_type = 'text'
    ) THEN
      ALTER TABLE public.profiles
        ALTER COLUMN sexual_orientation TYPE text[]
        USING (
          CASE
            WHEN sexual_orientation IS NULL OR sexual_orientation = '' THEN NULL
            ELSE ARRAY[sexual_orientation]
          END
        );
    END IF;
  END IF;
END
$$;
