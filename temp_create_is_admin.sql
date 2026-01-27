CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
      AND au.is_active = TRUE
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
