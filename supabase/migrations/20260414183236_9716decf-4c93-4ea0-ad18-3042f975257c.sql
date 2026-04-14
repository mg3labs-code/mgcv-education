ALTER TABLE public.student_preferences 
ADD COLUMN IF NOT EXISTS milestones_seen jsonb DEFAULT '{}'::jsonb;