ALTER TABLE public.student_answers
  ADD COLUMN IF NOT EXISTS answer_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS evaluation_attempt uuid,
  ADD COLUMN IF NOT EXISTS evaluation_expires_at timestamptz;

CREATE OR REPLACE FUNCTION public.replace_editable_answer(
  _submission_id uuid,
  _question_id uuid,
  _student_id uuid,
  _extracted_text text,
  _file_url text,
  _file_type text
)
RETURNS public.student_answers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _status text;
  _answer public.student_answers;
BEGIN
  SELECT status INTO _status
  FROM public.student_submissions
  WHERE id = _submission_id AND student_id = _student_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'submission_not_found' USING ERRCODE = 'P0001';
  END IF;
  IF _status = 'submitted' THEN
    RAISE EXCEPTION 'answer_locked: submission is submitted' USING ERRCODE = 'P0001';
  END IF;
  IF _status = 'finalized' THEN
    RAISE EXCEPTION 'answer_locked: submission is finalized' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.student_answers (
    submission_id, question_id, student_id, extracted_text, file_url, file_type,
    processing_status, processing_error, retry_count, ai_score, ai_confidence,
    ai_feedback, answer_version, evaluation_attempt, evaluation_expires_at
  ) VALUES (
    _submission_id, _question_id, _student_id, NULLIF(_extracted_text, ''), _file_url, _file_type,
    'pending', NULL, 0, NULL, NULL, NULL, 1, NULL, NULL
  )
  ON CONFLICT (submission_id, question_id) DO UPDATE SET
    extracted_text = NULLIF(EXCLUDED.extracted_text, ''),
    file_url = EXCLUDED.file_url,
    file_type = EXCLUDED.file_type,
    processing_status = 'pending',
    processing_error = NULL,
    retry_count = 0,
    ai_score = NULL,
    ai_confidence = NULL,
    ai_feedback = NULL,
    answer_version = student_answers.answer_version + 1,
    evaluation_attempt = NULL,
    evaluation_expires_at = NULL,
    updated_at = now()
  RETURNING * INTO _answer;

  RETURN _answer;
END;
$$;

CREATE OR REPLACE FUNCTION public.begin_answer_evaluation(_answer_id uuid)
RETURNS TABLE(answer_version integer, evaluation_attempt uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _attempt uuid := gen_random_uuid();
BEGIN
  RETURN QUERY
  UPDATE public.student_answers sa
  SET processing_status = 'processing',
      processing_error = NULL,
      evaluation_attempt = _attempt,
      evaluation_expires_at = now() + interval '75 seconds',
      updated_at = now()
  FROM public.student_submissions ss
  WHERE sa.id = _answer_id
    AND ss.id = sa.submission_id
    AND ss.status <> 'finalized'
  RETURNING sa.answer_version, sa.evaluation_attempt;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_answer_extracted_text(
  _answer_id uuid,
  _answer_version integer,
  _attempt uuid,
  _text text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _count integer;
BEGIN
  UPDATE public.student_answers sa
  SET extracted_text = _text
  FROM public.student_submissions ss
  WHERE sa.id = _answer_id
    AND ss.id = sa.submission_id
    AND ss.status <> 'finalized'
    AND sa.answer_version = _answer_version
    AND sa.evaluation_attempt = _attempt;
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_answer_evaluation(
  _answer_id uuid,
  _answer_version integer,
  _attempt uuid,
  _error text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _count integer;
BEGIN
  UPDATE public.student_answers sa
  SET processing_status = 'failed',
      processing_error = left(_error, 1000),
      retry_count = sa.retry_count + 1,
      ai_score = NULL,
      ai_confidence = NULL,
      ai_feedback = NULL,
      evaluation_attempt = NULL,
      evaluation_expires_at = NULL,
      updated_at = now()
  FROM public.student_submissions ss
  WHERE sa.id = _answer_id
    AND ss.id = sa.submission_id
    AND ss.status <> 'finalized'
    AND sa.answer_version = _answer_version
    AND sa.evaluation_attempt = _attempt;
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_answer_evaluation(
  _answer_id uuid,
  _answer_version integer,
  _attempt uuid,
  _score numeric,
  _confidence numeric,
  _feedback jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _count integer;
BEGIN
  UPDATE public.student_answers sa
  SET processing_status = 'success',
      processing_error = NULL,
      ai_score = _score,
      ai_confidence = _confidence,
      ai_feedback = _feedback,
      evaluation_attempt = NULL,
      evaluation_expires_at = NULL,
      updated_at = now()
  FROM public.student_submissions ss
  WHERE sa.id = _answer_id
    AND ss.id = sa.submission_id
    AND ss.status <> 'finalized'
    AND sa.answer_version = _answer_version
    AND sa.evaluation_attempt = _attempt;
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_stale_answer_evaluations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _count integer;
BEGIN
  UPDATE public.student_answers sa
  SET processing_status = 'failed',
      processing_error = 'Evaluation timed out. Please retry.',
      retry_count = sa.retry_count + 1,
      ai_score = NULL,
      ai_confidence = NULL,
      ai_feedback = NULL,
      evaluation_attempt = NULL,
      evaluation_expires_at = NULL,
      updated_at = now()
  FROM public.student_submissions ss
  WHERE ss.id = sa.submission_id
    AND ss.status <> 'finalized'
    AND sa.processing_status = 'processing'
    AND sa.evaluation_expires_at < now();
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

REVOKE ALL ON FUNCTION public.replace_editable_answer(uuid, uuid, uuid, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.begin_answer_evaluation(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.save_answer_extracted_text(uuid, integer, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_answer_evaluation(uuid, integer, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_answer_evaluation(uuid, integer, uuid, numeric, numeric, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.expire_stale_answer_evaluations() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.replace_editable_answer(uuid, uuid, uuid, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.begin_answer_evaluation(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.save_answer_extracted_text(uuid, integer, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_answer_evaluation(uuid, integer, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_answer_evaluation(uuid, integer, uuid, numeric, numeric, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.expire_stale_answer_evaluations() TO service_role;