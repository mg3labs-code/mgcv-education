-- Students (and anyone using the Data API) may not read teacher-only question fields.
REVOKE SELECT ON public.assignment_questions FROM anon, authenticated;
GRANT SELECT (id, assignment_id, question_number, question_text, max_score, created_at)
  ON public.assignment_questions TO authenticated;

-- Teachers read the full question record (hints + rubric) only for their own assignments.
CREATE OR REPLACE FUNCTION public.get_teacher_assignment_questions(_assignment_ids uuid[])
RETURNS TABLE(id uuid, assignment_id uuid, question_number integer, question_text text,
              max_score numeric, rubric jsonb, expected_answer_hints text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT q.id, q.assignment_id, q.question_number, q.question_text, q.max_score,
         q.rubric, q.expected_answer_hints, q.created_at
  FROM public.assignment_questions q
  JOIN public.assignments a ON a.id = q.assignment_id
  WHERE q.assignment_id = ANY(_assignment_ids) AND a.teacher_id = auth.uid()
  ORDER BY q.assignment_id, q.question_number
$$;
REVOKE ALL ON FUNCTION public.get_teacher_assignment_questions(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_teacher_assignment_questions(uuid[]) TO authenticated;

-- Keep assignment totals equal to the sum of its remaining questions.
CREATE OR REPLACE FUNCTION public.recompute_assignment_total(_assignment_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.assignments a
  SET max_total_score = (SELECT COALESCE(SUM(max_score), 0) FROM public.assignment_questions WHERE assignment_id = _assignment_id)
  WHERE a.id = _assignment_id
$$;
REVOKE ALL ON FUNCTION public.recompute_assignment_total(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.trg_recompute_assignment_total()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_assignment_total(OLD.assignment_id);
    RETURN OLD;
  END IF;
  PERFORM public.recompute_assignment_total(NEW.assignment_id);
  IF TG_OP = 'UPDATE' AND OLD.assignment_id IS DISTINCT FROM NEW.assignment_id THEN
    PERFORM public.recompute_assignment_total(OLD.assignment_id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS assignment_questions_recompute_total ON public.assignment_questions;
CREATE TRIGGER assignment_questions_recompute_total
AFTER INSERT OR DELETE OR UPDATE OF max_score, assignment_id ON public.assignment_questions
FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_assignment_total();