-- Add reset token fields to profiles with RLS restrictions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reset_token_hash text,
  ADD COLUMN IF NOT EXISTS token_expiry timestamp with time zone;

-- Restrict column access for client roles
REVOKE SELECT (reset_token_hash, token_expiry) ON public.profiles FROM anon, authenticated;
GRANT SELECT (reset_token_hash, token_expiry) ON public.profiles TO service_role;
GRANT UPDATE (reset_token_hash, token_expiry) ON public.profiles TO service_role;

-- Allow service_role to manage reset tokens under RLS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'service_role_manage_reset_tokens'
  ) THEN
    EXECUTE 'CREATE POLICY service_role_manage_reset_tokens ON public.profiles FOR UPDATE USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'service_role_read_reset_tokens'
  ) THEN
    EXECUTE 'CREATE POLICY service_role_read_reset_tokens ON public.profiles FOR SELECT USING (auth.role() = ''service_role'')';
  END IF;
END $$;
