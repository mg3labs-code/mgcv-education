
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interest_tag TEXT;

CREATE TABLE IF NOT EXISTS public.curiosity_arc_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_key TEXT NOT NULL,
  current_day INT NOT NULL DEFAULT 1,
  current_step TEXT NOT NULL DEFAULT 'hook',
  interest_tag TEXT,
  day1_first_thought TEXT,
  day1_guess TEXT,
  day1_completed_at TIMESTAMPTZ,
  day2_belief TEXT,
  day2_own_words TEXT,
  day2_completed_at TIMESTAMPTZ,
  day3_case_answers JSONB DEFAULT '{}'::jsonb,
  day3_teach_line TEXT,
  day3_completed_at TIMESTAMPTZ,
  signals JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, concept_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.curiosity_arc_progress TO authenticated;
GRANT ALL ON public.curiosity_arc_progress TO service_role;

ALTER TABLE public.curiosity_arc_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage their own arc progress"
  ON public.curiosity_arc_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_curiosity_arc_progress_updated_at
  BEFORE UPDATE ON public.curiosity_arc_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
