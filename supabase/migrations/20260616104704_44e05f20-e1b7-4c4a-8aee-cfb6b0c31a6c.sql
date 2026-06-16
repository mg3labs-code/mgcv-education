
DROP POLICY IF EXISTS "Students can view questions for their class assignments" ON public.assignment_questions;

CREATE OR REPLACE VIEW public.assignment_questions_student
WITH (security_invoker = true) AS
SELECT
  q.id,
  q.assignment_id,
  q.question_number,
  q.question_text,
  q.max_score,
  q.created_at
FROM public.assignment_questions q
WHERE EXISTS (
  SELECT 1 FROM public.assignments a
  WHERE a.id = q.assignment_id
    AND a.is_published = true
    AND a.class_name = public.get_user_class(auth.uid())
);

CREATE POLICY "Students can read safe question fields"
ON public.assignment_questions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.id = assignment_questions.assignment_id
      AND a.is_published = true
      AND a.class_name = public.get_user_class(auth.uid())
  )
);

REVOKE SELECT (rubric, expected_answer_hints) ON public.assignment_questions FROM authenticated;
GRANT SELECT (id, assignment_id, question_number, question_text, max_score, created_at)
  ON public.assignment_questions TO authenticated;

GRANT SELECT ON public.assignment_questions_student TO authenticated;

DROP POLICY IF EXISTS "Teachers and admins can read digests" ON public.teacher_world_digests;
CREATE POLICY "Teachers read digests for their classes"
ON public.teacher_world_digests
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR (
    public.has_role(auth.uid(), 'teacher'::app_role)
    AND public.teacher_manages_class(auth.uid(), class_name)
  )
);

DROP POLICY IF EXISTS "Teachers read own parent messages" ON public.parent_messages;

DROP POLICY IF EXISTS "Anyone can view reasoning visuals" ON storage.objects;
