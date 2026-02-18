
-- Create new_placements table
CREATE TABLE public.new_placements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_in_date DATE NOT NULL,
  area TEXT NOT NULL,
  apartment TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('Live-in', 'Full-time', 'Part-time')),
  tasks TEXT[] NOT NULL,
  language TEXT[] NOT NULL,
  salary TEXT NOT NULL,
  lead_priority TEXT NOT NULL CHECK (lead_priority IN ('Hot', 'Warm', 'Cold')),
  lead_status TEXT NOT NULL CHECK (lead_status IN ('In-progress', 'Won', 'Lost')),
  sales_person TEXT NOT NULL CHECK (sales_person IN ('Laxmi', 'Anjum', 'Saritha', 'Rashmi')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create replacements table
CREATE TABLE public.replacements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_in_date DATE NOT NULL,
  area TEXT NOT NULL,
  apartment TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('Live-in', 'Full-time', 'Part-time')),
  tasks TEXT[] NOT NULL,
  language TEXT[] NOT NULL,
  salary TEXT NOT NULL,
  lead_priority TEXT NOT NULL CHECK (lead_priority IN ('Hot', 'Warm', 'Cold')),
  lead_status TEXT NOT NULL CHECK (lead_status IN ('In-progress', 'Won', 'Lost')),
  sales_person TEXT NOT NULL CHECK (sales_person IN ('Laxmi', 'Anjum', 'Saritha', 'Rashmi')),
  assign_to TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.new_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replacements ENABLE ROW LEVEL SECURITY;

-- RLS policies: all authenticated users can CRUD
CREATE POLICY "Authenticated users can view all new_placements"
  ON public.new_placements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert new_placements"
  ON public.new_placements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update new_placements"
  ON public.new_placements FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete new_placements"
  ON public.new_placements FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view all replacements"
  ON public.replacements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert replacements"
  ON public.replacements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update replacements"
  ON public.replacements FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete replacements"
  ON public.replacements FOR DELETE TO authenticated USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_new_placements_updated_at
  BEFORE UPDATE ON public.new_placements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_replacements_updated_at
  BEFORE UPDATE ON public.replacements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
