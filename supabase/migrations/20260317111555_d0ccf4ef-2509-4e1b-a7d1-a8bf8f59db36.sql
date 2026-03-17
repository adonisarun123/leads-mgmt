
ALTER TABLE public.new_placements DROP CONSTRAINT new_placements_sales_person_check;
ALTER TABLE public.new_placements ADD CONSTRAINT new_placements_sales_person_check CHECK (sales_person = ANY (ARRAY['Laxmi'::text, 'Anjum'::text, 'Saritha'::text, 'Rashmi'::text, 'Ashma'::text]));

ALTER TABLE public.replacements DROP CONSTRAINT replacements_sales_person_check;
ALTER TABLE public.replacements ADD CONSTRAINT replacements_sales_person_check CHECK (sales_person = ANY (ARRAY['Laxmi'::text, 'Anjum'::text, 'Saritha'::text, 'Rashmi'::text, 'Ashma'::text]));
