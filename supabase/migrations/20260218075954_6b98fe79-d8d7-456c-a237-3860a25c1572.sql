
-- Update handle_new_user to reject non-ezyhelpers.com email domains server-side
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Server-side domain restriction
  IF split_part(NEW.email, '@', 2) <> 'ezyhelpers.com' THEN
    RAISE EXCEPTION 'Only @ezyhelpers.com email addresses are allowed to sign up.';
  END IF;

  IF NEW.email IN ('suraj@ezyhelpers.com', 'arun@ezyhelpers.com') THEN
    INSERT INTO public.user_roles (user_id, role, approved) VALUES (NEW.id, 'admin', true);
  ELSE
    INSERT INTO public.user_roles (user_id, role, approved) VALUES (NEW.id, 'staff', false);
  END IF;
  RETURN NEW;
END;
$function$;
