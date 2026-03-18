
CREATE TABLE public.language_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subject_name TEXT NOT NULL,
  progress_date DATE NOT NULL DEFAULT CURRENT_DATE,
  words_learned INTEGER NOT NULL DEFAULT 0,
  sentences_written INTEGER NOT NULL DEFAULT 0,
  passages_read INTEGER NOT NULL DEFAULT 0,
  grammar_patterns_mastered INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, subject_name, progress_date)
);

ALTER TABLE public.language_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own language progress"
ON public.language_progress FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Teachers read class student language progress"
ON public.language_progress FOR SELECT
USING (
  has_role(auth.uid(), 'teacher'::app_role)
  AND get_user_class(user_id) IN (
    SELECT DISTINCT class_name FROM assignments WHERE teacher_id = auth.uid()
  )
);
