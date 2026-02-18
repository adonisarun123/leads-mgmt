
-- Activity logs table
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all logs"
  ON public.activity_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can insert logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_activity_logs_created_at ON public.activity_logs (created_at DESC);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs (user_id);
CREATE INDEX idx_activity_logs_entity ON public.activity_logs (entity_type, entity_id);

-- Notifications table for in-app aging alerts
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'aging_alert',
  read boolean NOT NULL DEFAULT false,
  entity_type text,
  entity_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_notifications_user ON public.notifications (user_id, read, created_at DESC);

-- Update edit RLS: admin only for new_placements
DROP POLICY IF EXISTS "Admin/Manager can update new_placements" ON public.new_placements;
CREATE POLICY "Admin can update new_placements"
  ON public.new_placements FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Update edit RLS: admin only for replacements  
DROP POLICY IF EXISTS "Admin/Manager can update replacements" ON public.replacements;
CREATE POLICY "Admin can update replacements"
  ON public.replacements FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
