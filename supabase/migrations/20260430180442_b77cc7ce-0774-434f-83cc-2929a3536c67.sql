-- 1. Add optional region/city to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS city text;

-- 2. concept_rungs: stores the 5-rung ladder per concept
CREATE TABLE IF NOT EXISTS public.concept_rungs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id text NOT NULL,
  episode_id text NOT NULL,
  concept_key text NOT NULL,
  subject text NOT NULL,
  region text,
  rung_1 jsonb NOT NULL DEFAULT '{}'::jsonb,
  rung_2 jsonb NOT NULL DEFAULT '{}'::jsonb,
  rung_3 jsonb NOT NULL DEFAULT '{}'::jsonb,
  rung_4 jsonb NOT NULL DEFAULT '{}'::jsonb,
  rung_5 jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL DEFAULT 'authored',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS concept_rungs_unique
  ON public.concept_rungs (chapter_id, episode_id, concept_key, COALESCE(region, ''));

CREATE INDEX IF NOT EXISTS concept_rungs_lookup
  ON public.concept_rungs (chapter_id, episode_id, concept_key);

ALTER TABLE public.concept_rungs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read concept_rungs"
  ON public.concept_rungs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role manages concept_rungs"
  ON public.concept_rungs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_concept_rungs_updated_at
  BEFORE UPDATE ON public.concept_rungs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. student_rung_state: where each student currently is
CREATE TABLE IF NOT EXISTS public.student_rung_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  chapter_id text NOT NULL,
  episode_id text NOT NULL,
  concept_key text NOT NULL,
  current_rung integer NOT NULL DEFAULT 1,
  last_signal jsonb NOT NULL DEFAULT '{}'::jsonb,
  vibe_check_shown_today boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS student_rung_state_unique
  ON public.student_rung_state (user_id, chapter_id, episode_id, concept_key);

ALTER TABLE public.student_rung_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own rung state"
  ON public.student_rung_state FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Teachers read class student rung state"
  ON public.student_rung_state FOR SELECT
  USING (
    has_role(auth.uid(), 'teacher'::app_role)
    AND get_user_class(user_id) IN (
      SELECT DISTINCT a.class_name FROM assignments a WHERE a.teacher_id = auth.uid()
    )
  );

CREATE TRIGGER update_student_rung_state_updated_at
  BEFORE UPDATE ON public.student_rung_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();