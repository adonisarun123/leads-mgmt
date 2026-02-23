-- Allow staff to update new_placements (for priority changes)
DROP POLICY IF EXISTS "Staff can update priority on new_placements" ON public.new_placements;
CREATE POLICY "Staff can update priority on new_placements"
ON public.new_placements
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role))
WITH CHECK (has_role(auth.uid(), 'staff'::app_role));

-- Allow staff to update replacements (for priority changes)
DROP POLICY IF EXISTS "Staff can update priority on replacements" ON public.replacements;
CREATE POLICY "Staff can update priority on replacements"
ON public.replacements
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role))
WITH CHECK (has_role(auth.uid(), 'staff'::app_role));
