DROP POLICY IF EXISTS "Students can upload own answer files" ON storage.objects;
DROP POLICY IF EXISTS "Students can update own answer files" ON storage.objects;
DROP POLICY IF EXISTS "Students can delete own answer files" ON storage.objects;

CREATE OR REPLACE FUNCTION public.trg_lock_answer_evidence()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _status text;
BEGIN
  SELECT status INTO _status FROM public.student_submissions WHERE id = NEW.submission_id FOR SHARE;
  IF _status IN ('submitted','finalized') THEN
    IF TG_OP = 'INSERT' OR NEW.file_url IS DISTINCT FROM OLD.file_url OR NEW.file_type IS DISTINCT FROM OLD.file_type THEN
      RAISE EXCEPTION 'answer_locked: submission is %', _status USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS student_answers_lock_evidence ON public.student_answers;
CREATE TRIGGER student_answers_lock_evidence BEFORE INSERT OR UPDATE ON public.student_answers
FOR EACH ROW EXECUTE FUNCTION public.trg_lock_answer_evidence();