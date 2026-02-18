
-- Add approved flag to user_roles (default false so new signups need admin approval)
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false;

-- Create function to check if user is approved
CREATE OR REPLACE FUNCTION public.is_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND approved = true
  )
$$;

-- Update the handle_new_user trigger to default approved=false
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, approved) VALUES (NEW.id, 'staff', false);
  RETURN NEW;
END;
$$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS: SELECT on all tables requires approved user
DROP POLICY IF EXISTS "Authenticated users can view all new_placements" ON public.new_placements;
CREATE POLICY "Approved users can view all new_placements"
  ON public.new_placements FOR SELECT
  USING (public.is_approved(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can view all replacements" ON public.replacements;
CREATE POLICY "Approved users can view all replacements"
  ON public.replacements FOR SELECT
  USING (public.is_approved(auth.uid()));

-- Allow users to view their own role (even if not approved, so UI can show pending state)
-- Already exists, keep it.

-- Allow admins to update user_roles (for approval)
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow users to view own role
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can also view all roles for approval management
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
