-- Migración: Agregar columnas faltantes a tablas existentes
-- Fecha: 7 Diciembre 2025
-- Propósito: Corregir estructura de tablas si faltan columnas

-- Agregar columnas faltantes a couple_disputes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'couple_disputes') THEN
    -- Agregar couple_agreement_id si no existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'couple_disputes' AND column_name = 'couple_agreement_id'
    ) THEN
      ALTER TABLE couple_disputes 
      ADD COLUMN couple_agreement_id UUID REFERENCES couple_agreements(id) ON DELETE CASCADE;
      
      CREATE INDEX IF NOT EXISTS idx_couple_disputes_couple_agreement_id ON couple_disputes(couple_agreement_id);
    END IF;
    
    -- Agregar couple_id si no existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'couple_disputes' AND column_name = 'couple_id'
    ) THEN
      ALTER TABLE couple_disputes 
      ADD COLUMN couple_id UUID REFERENCES couple_profiles(id) ON DELETE CASCADE;
      
      CREATE INDEX IF NOT EXISTS idx_couple_disputes_couple_id ON couple_disputes(couple_id);
    END IF;
  END IF;
END $$;

-- Agregar columnas faltantes a profiles
DO $$
BEGIN
    -- first_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'first_name') THEN
        ALTER TABLE profiles ADD COLUMN first_name TEXT;
    END IF;
    -- last_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_name') THEN
        ALTER TABLE profiles ADD COLUMN last_name TEXT;
    END IF;
    -- email
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE profiles ADD COLUMN email TEXT UNIQUE;
    END IF;
    -- phone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE profiles ADD COLUMN phone TEXT;
    END IF;
    -- age
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'age') THEN
        ALTER TABLE profiles ADD COLUMN age INTEGER;
    END IF;
    -- gender
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gender') THEN
        ALTER TABLE profiles ADD COLUMN gender TEXT;
    END IF;
    -- bio
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
        ALTER TABLE profiles ADD COLUMN bio TEXT;
    END IF;
    -- location
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location') THEN
        ALTER TABLE profiles ADD COLUMN location TEXT;
    END IF;
    -- city
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'city') THEN
        ALTER TABLE profiles ADD COLUMN city TEXT;
    END IF;
    -- latitude
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'latitude') THEN
        ALTER TABLE profiles ADD COLUMN latitude NUMERIC;
    END IF;
    -- longitude
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'longitude') THEN
        ALTER TABLE profiles ADD COLUMN longitude NUMERIC;
    END IF;
    -- avatar_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
    END IF;
    -- cover_image_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'cover_image_url') THEN
        ALTER TABLE profiles ADD COLUMN cover_image_url TEXT;
    END IF;
    -- interests
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'interests') THEN
        ALTER TABLE profiles ADD COLUMN interests TEXT[] DEFAULT '{}';
    END IF;
    -- looking_for
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'looking_for') THEN
        ALTER TABLE profiles ADD COLUMN looking_for TEXT[] DEFAULT '{}';
    END IF;
    -- experience_level
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'experience_level') THEN
        ALTER TABLE profiles ADD COLUMN experience_level TEXT DEFAULT 'beginner';
    END IF;
    -- relationship_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'relationship_type') THEN
        ALTER TABLE profiles ADD COLUMN relationship_type TEXT DEFAULT 'dating';
    END IF;
    -- is_verified
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_verified') THEN
        ALTER TABLE profiles ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
    END IF;
    -- is_active
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_active') THEN
        ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    -- is_online
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_online') THEN
        ALTER TABLE profiles ADD COLUMN is_online BOOLEAN DEFAULT FALSE;
    END IF;
    -- last_active
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_active') THEN
        ALTER TABLE profiles ADD COLUMN last_active TIMESTAMPTZ;
    END IF;
    -- role
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
         -- Check if type user_role exists
         IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
             CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator', 'superadmin');
         END IF;
         ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'user';
    END IF;
    -- profile_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'profile_type') THEN
        ALTER TABLE profiles ADD COLUMN profile_type TEXT DEFAULT 'single';
    END IF;
    -- preferences
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferences') THEN
        ALTER TABLE profiles ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
    END IF;
    -- statistics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'statistics') THEN
        ALTER TABLE profiles ADD COLUMN statistics JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Agregar columna dispute_id a frozen_assets si no existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'frozen_assets') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'frozen_assets' AND column_name = 'dispute_id'
    ) THEN
      ALTER TABLE frozen_assets 
      ADD COLUMN dispute_id UUID REFERENCES couple_disputes(id) ON DELETE SET NULL;
      
      -- Crear índice si no existe
      CREATE INDEX IF NOT EXISTS idx_frozen_assets_dispute_id ON frozen_assets(dispute_id);
    END IF;
  END IF;
END $$;

-- Verificar que todas las columnas necesarias existen en couple_agreements
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'couple_agreements') THEN
    -- Agregar columnas faltantes si es necesario
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'couple_agreements' AND column_name = 'agreement_hash'
    ) THEN
      ALTER TABLE couple_agreements 
      ADD COLUMN agreement_hash VARCHAR(64) NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'couple_agreements' AND column_name = 'death_clause_text'
    ) THEN
      ALTER TABLE couple_agreements 
      ADD COLUMN death_clause_text TEXT;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'couple_agreements' AND column_name = 'asset_disposition_clause'
    ) THEN
      ALTER TABLE couple_agreements 
      ADD COLUMN asset_disposition_clause TEXT;
    END IF;
  END IF;
END $$;

-- Verificar que todas las columnas necesarias existen en user_consents
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_consents') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_consents' AND column_name = 'consent_text_hash'
    ) THEN
      ALTER TABLE user_consents 
      ADD COLUMN consent_text_hash VARCHAR(64) NOT NULL DEFAULT '';
    END IF;
  END IF;
END $$;
