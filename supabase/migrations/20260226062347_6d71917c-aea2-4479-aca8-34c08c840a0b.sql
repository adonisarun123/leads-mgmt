
CREATE POLICY "Manager can update status on new_placements"
ON public.new_placements FOR UPDATE
USING (has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Manager can update status on replacements"
ON public.replacements FOR UPDATE
USING (has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'manager'::app_role));
