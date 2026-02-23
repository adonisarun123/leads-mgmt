-- Add comments column to both tables
ALTER TABLE public.new_placements ADD COLUMN IF NOT EXISTS comments text;
ALTER TABLE public.replacements ADD COLUMN IF NOT EXISTS comments text;
