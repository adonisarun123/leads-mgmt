
-- Remove user_email column from activity_logs to prevent email harvesting
ALTER TABLE public.activity_logs DROP COLUMN IF EXISTS user_email;
