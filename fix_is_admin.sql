CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $func$
BEGIN
  IF check_user_id IS NULL THEN
    check_user_id := auth.uid();
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = check_user_id AND au.is_active = TRUE
  );
END;
$func$;
