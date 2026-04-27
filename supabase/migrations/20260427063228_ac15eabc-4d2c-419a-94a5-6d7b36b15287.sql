CREATE TABLE public.retention_predictions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  chapter_id text NOT NULL,
  episode_id text NOT NULL,
  concept_key text NOT NULL,
  concept_label text NOT NULL,
  risk_score integer NOT NULL DEFAULT 50,
  risk_level text NOT NULL DEFAULT 'medium',
  confidence integer NOT NULL DEFAULT 50,
  signals jsonb NOT NULL DEFAULT '{}'::jsonb,
  recommended_action text NOT NULL DEFAULT 'Do a short recap and explain the idea once more.',
  predicted_for_date date NOT NULL DEFAULT (CURRENT_DATE + 7),
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT retention_predictions_score_range CHECK (risk_score >= 0 AND risk_score <= 100),
  CONSTRAINT retention_predictions_confidence_range CHECK (confidence >= 0 AND confidence <= 100),
  CONSTRAINT retention_predictions_level_check CHECK (risk_level IN ('low', 'medium', 'high')),
  CONSTRAINT retention_predictions_unique_key UNIQUE (user_id, chapter_id, episode_id, concept_key, predicted_for_date)
);

ALTER TABLE public.retention_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own retention predictions"
ON public.retention_predictions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view class retention predictions"
ON public.retention_predictions
FOR SELECT
USING (
  public.has_role(auth.uid(), 'teacher'::app_role)
  AND public.get_user_class(user_id) IN (
    SELECT DISTINCT assignments.class_name
    FROM public.assignments
    WHERE assignments.teacher_id = auth.uid()
  )
);

CREATE TRIGGER update_retention_predictions_updated_at
BEFORE UPDATE ON public.retention_predictions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_retention_predictions_user_date
ON public.retention_predictions (user_id, predicted_for_date DESC);

CREATE INDEX idx_retention_predictions_chapter_episode
ON public.retention_predictions (chapter_id, episode_id);

CREATE INDEX idx_retention_predictions_risk
ON public.retention_predictions (risk_level, risk_score DESC);