
-- Allow all approved users to update comments on new_placements
CREATE POLICY "Approved users can update comments on new_placements"
ON public.new_placements
FOR UPDATE
USING (is_approved(auth.uid()))
WITH CHECK (is_approved(auth.uid()));

-- Allow all approved users to update comments on replacements
CREATE POLICY "Approved users can update comments on replacements"
ON public.replacements
FOR UPDATE
USING (is_approved(auth.uid()))
WITH CHECK (is_approved(auth.uid()));
