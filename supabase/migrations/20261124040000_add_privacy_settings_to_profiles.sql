-- Migración: columna privacy_settings en profiles (single).
-- La sección de Privacidad del perfil single guardaba sus 9 toggles
-- (+ extras birthDate/zodiacSign) en localStorage porque esta columna
-- no existía; couple_profiles ya la tiene (migración 20251027210460).
-- Con esta columna el single en real guarda y aplica sus ajustes en
-- Supabase como la pareja. No cambia RLS: las políticas existentes de
-- profiles ya cubren lectura/escritura del propio perfil.
-- (Aplicar en producción con el editor SQL de Supabase.)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS privacy_settings jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.privacy_settings IS
  'Ajustes de privacidad del perfil single (9 toggles + extras birthDate/zodiacSign). Ver src/lib/visibility.ts.';
