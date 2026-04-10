
CREATE TABLE public.episode_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  chapter_id TEXT NOT NULL,
  episode_id TEXT NOT NULL,
  block_index INTEGER NOT NULL,
  block_type TEXT NOT NULL,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  wrong_attempts INTEGER NOT NULL DEFAULT 0,
  correct_on_first_try BOOLEAN DEFAULT true,
  comprehension_result TEXT DEFAULT NULL,
  comprehension_attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  UNIQUE (user_id, chapter_id, episode_id, block_index)
);

ALTER TABLE public.episode_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own interactions"
  ON public.episode_interactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Teachers read class student interactions"
  ON public.episode_interactions FOR SELECT
  USING (
    has_role(auth.uid(), 'teacher'::app_role)
    AND get_user_class(user_id) IN (
      SELECT DISTINCT class_name FROM assignments WHERE teacher_id = auth.uid()
    )
  );

CREATE INDEX idx_episode_interactions_user ON public.episode_interactions (user_id, episode_id);
