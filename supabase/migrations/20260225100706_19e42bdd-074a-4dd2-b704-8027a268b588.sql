
-- Add unique constraint for upsert on student_answers (needed for file upload upsert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'student_answers_submission_question_unique'
  ) THEN
    ALTER TABLE public.student_answers 
    ADD CONSTRAINT student_answers_submission_question_unique 
    UNIQUE (submission_id, question_id);
  END IF;
END $$;
