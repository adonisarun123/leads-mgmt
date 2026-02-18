
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IN ('suraj@ezyhelpers.com', 'arun@ezyhelpers.com') THEN
    INSERT INTO public.user_roles (user_id, role, approved) VALUES (NEW.id, 'admin', true);
  ELSE
    INSERT INTO public.user_roles (user_id, role, approved) VALUES (NEW.id, 'staff', false);
  END IF;
  RETURN NEW;
END;
$$;
