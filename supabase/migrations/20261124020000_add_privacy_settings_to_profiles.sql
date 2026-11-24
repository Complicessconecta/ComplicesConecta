-- ============================================================================
-- Migración: columna privacy_settings (jsonb) en public.profiles (2026-11-24)
--
-- La columna ya existía en couple_profiles (tipos generados y producción)
-- pero NO en profiles: los componentes SinglePrivacySection y
-- CouplePrivacySection leían/escribían profiles.privacy_settings y el
-- Type Check fallaba (la columna no existe en el tipo generado).
-- Verificado en producción (solo lectura): privacy_settings existe
-- únicamente en couple_profiles; en profiles no existe.
--
-- Esta migración añade la columna a profiles para que los ajustes de
-- privacidad del perfil individual se guarden en la cuenta (igual que
-- en pareja). Las políticas RLS existentes de profiles ya cubren el
-- UPDATE de la tabla; no se crean ni se cambian políticas aquí.
-- La revisión de políticas para las 9 funciones de privacidad es un
-- paso posterior, no esta migración.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS privacy_settings jsonb;
