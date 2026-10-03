CREATE OR REPLACE FUNCTION public.trg_lock_answer_evidence()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _status text;
BEGIN
  SELECT status INTO _status FROM public.student_submissions WHERE id = NEW.submission_id FOR SHARE;
  IF _status IN ('submitted','finalized') THEN
    IF TG_OP = 'INSERT'
       OR NEW.file_url IS DISTINCT FROM OLD.file_url
       OR NEW.file_type IS DISTINCT FROM OLD.file_type
       OR (OLD.extracted_text IS NOT NULL AND NEW.extracted_text IS DISTINCT FROM OLD.extracted_text) THEN
      RAISE EXCEPTION 'answer_locked: submission is %', _status USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END $$;