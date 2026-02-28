-- =====================================================
-- ALINEACIÓN SEGURA DE matches (compatibilidad entre entornos)
-- =====================================================
-- Fecha: 08 de Enero, 2026
-- Versión: 4.0 (Documento Maestro IA)
-- Descripción:
--   1) Asegura que la tabla matches exista.
--   2) Agrega columnas extendidas (profile_id_1/profile_id_2/status/matched_at)
--      si faltan, sin romper entornos que ya las tengan.
--   3) Mantiene compatibilidad con el esquema mínimo (user1_id/user2_id/created_at)
--      usado en migraciones antiguas.
-- =====================================================

-- Crear tabla mínima si no existe (compat)
CREATE TABLE IF NOT EXISTS public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL,
  user2_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Agregar columnas extendidas si faltan
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS profile_id_1 uuid;

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS profile_id_2 uuid;

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS status text;

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS matched_at timestamptz;

-- FKs (solo si ya existe profiles; en Supabase siempre existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    -- Crear FKs si no existen
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'matches_profile_id_1_fkey'
    ) THEN
      ALTER TABLE public.matches
        ADD CONSTRAINT matches_profile_id_1_fkey
        FOREIGN KEY (profile_id_1) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'matches_profile_id_2_fkey'
    ) THEN
      ALTER TABLE public.matches
        ADD CONSTRAINT matches_profile_id_2_fkey
        FOREIGN KEY (profile_id_2) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Índice único determinista para evitar duplicados cuando se use perfil-canon
CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_profile_pair_unique
  ON public.matches(profile_id_1, profile_id_2)
  WHERE profile_id_1 IS NOT NULL AND profile_id_2 IS NOT NULL;

-- Índices de compatibilidad
CREATE INDEX IF NOT EXISTS idx_matches_user1_id ON public.matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2_id ON public.matches(user2_id);

-- RLS: no forzar si ya existe; asegurar habilitado
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Políticas: mantener existentes pero agregar una policy compatible con inserts
-- Nota: NO eliminamos policies existentes para no romper entornos.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'matches' AND policyname = 'Users can create matches v4'
  ) THEN
    CREATE POLICY "Users can create matches v4" ON public.matches
      FOR INSERT
      WITH CHECK (
        auth.uid() = user1_id OR auth.uid() = user2_id
      );
  END IF;
END $$;
