-- ============================================================================
-- Profile Verification Columns Setup
-- ComplicesConecta v3.9.2
-- Fecha: 17 de Enero, 2026
-- Descripción: Agregar columnas de verificación a la tabla profiles
-- ============================================================================

-- Agregar columnas de verificación a la tabla profiles
DO $$
BEGIN
  -- Columna para verificación por selfie
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'photo_verified'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN photo_verified BOOLEAN DEFAULT FALSE;
    RAISE NOTICE '✅ Columna photo_verified agregada a profiles';
  END IF;

  -- Columna para verificación por documento
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'id_verified'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN id_verified BOOLEAN DEFAULT FALSE;
    RAISE NOTICE '✅ Columna id_verified agregada a profiles';
  END IF;

  -- Columna para fecha de verificación por selfie
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'photo_verified_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN photo_verified_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ Columna photo_verified_at agregada a profiles';
  END IF;

  -- Columna para fecha de verificación por documento
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'id_verified_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN id_verified_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ Columna id_verified_at agregada a profiles';
  END IF;

  -- Columna para World ID nullifier hash
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'world_id_nullifier_hash'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN world_id_nullifier_hash TEXT;
    RAISE NOTICE '✅ Columna world_id_nullifier_hash agregada a profiles';
  END IF;

  -- Columna para fecha de verificación por World ID
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'world_id_verified_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN world_id_verified_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ Columna world_id_verified_at agregada a profiles';
  END IF;

  -- Columna para nivel de verificación
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'verification_level'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN verification_level TEXT DEFAULT 'none';
    RAISE NOTICE '✅ Columna verification_level agregada a profiles';
  END IF;

  -- Crear índices para las nuevas columnas
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND indexname = 'idx_profiles_photo_verified'
  ) THEN
    CREATE INDEX idx_profiles_photo_verified ON public.profiles(photo_verified);
    RAISE NOTICE '✅ Índice idx_profiles_photo_verified creado';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND indexname = 'idx_profiles_id_verified'
  ) THEN
    CREATE INDEX idx_profiles_id_verified ON public.profiles(id_verified);
    RAISE NOTICE '✅ Índice idx_profiles_id_verified creado';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND indexname = 'idx_profiles_verification_level'
  ) THEN
    CREATE INDEX idx_profiles_verification_level ON public.profiles(verification_level);
    RAISE NOTICE '✅ Índice idx_profiles_verification_level creado';
  END IF;

  -- Comentarios
  COMMENT ON COLUMN public.profiles.photo_verified IS 'Indica si el usuario ha verificado su identidad con selfie';
  COMMENT ON COLUMN public.profiles.id_verified IS 'Indica si el usuario ha verificado su identidad con documento oficial';
  COMMENT ON COLUMN public.profiles.photo_verified_at IS 'Fecha en que se verificó la selfie';
  COMMENT ON COLUMN public.profiles.id_verified_at IS 'Fecha en que se verificó el documento';
  COMMENT ON COLUMN public.profiles.world_id_nullifier_hash IS 'Hash nullifier de World ID del usuario';
  COMMENT ON COLUMN public.profiles.world_id_verified_at IS 'Fecha en que se verificó con World ID';
  COMMENT ON COLUMN public.profiles.verification_level IS 'Nivel de verificación del usuario (none, basic, medium, high)';

  RAISE NOTICE '✅ Columnas de verificación agregadas a profiles exitosamente';
END $$;
