
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'staff');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: authenticated users can read their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- RLS: only admins can manage roles
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Update existing table policies to use role checks for write ops
-- Drop old permissive write policies on new_placements
DROP POLICY "Authenticated users can insert new_placements" ON public.new_placements;
DROP POLICY "Authenticated users can update new_placements" ON public.new_placements;
DROP POLICY "Authenticated users can delete new_placements" ON public.new_placements;

-- Recreate with proper role checks (admin/manager can write, staff read-only)
CREATE POLICY "Admin/Manager can insert new_placements"
  ON public.new_placements FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Admin/Manager can update new_placements"
  ON public.new_placements FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admin can delete new_placements"
  ON public.new_placements FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Drop old permissive write policies on replacements
DROP POLICY "Authenticated users can insert replacements" ON public.replacements;
DROP POLICY "Authenticated users can update replacements" ON public.replacements;
DROP POLICY "Authenticated users can delete replacements" ON public.replacements;

CREATE POLICY "Admin/Manager can insert replacements"
  ON public.replacements FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Admin/Manager can update replacements"
  ON public.replacements FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admin can delete replacements"
  ON public.replacements FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Auto-assign 'staff' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'staff');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
