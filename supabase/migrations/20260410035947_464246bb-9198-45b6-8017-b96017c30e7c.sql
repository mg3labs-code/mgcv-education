
-- Add source column to distinguish manual vs auto-generated assignments
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS schedule_topic_key text,
  ADD COLUMN IF NOT EXISTS schedule_date date;

-- Index for efficient lookup of auto-homework by class + date
CREATE INDEX IF NOT EXISTS idx_assignments_auto_homework 
  ON public.assignments (class_name, schedule_date, source) 
  WHERE source = 'auto_homework';
