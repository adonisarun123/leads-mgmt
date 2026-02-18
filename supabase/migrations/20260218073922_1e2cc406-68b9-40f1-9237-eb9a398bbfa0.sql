
-- Fix overly permissive insert policy on notifications
-- Edge functions use service_role which bypasses RLS, so we can restrict this
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
