
-- 1. PHONE EXPOSURE: column-level privileges hide phone from cross-user reads.
REVOKE SELECT (phone) ON public.student_profiles FROM authenticated, anon;
REVOKE SELECT (phone) ON public.teacher_profiles FROM authenticated, anon;

-- Helper RPCs let a user fetch only their own phone (admins can fetch any).
CREATE OR REPLACE FUNCTION public.get_my_student_phone()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT phone FROM public.student_profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_teacher_phone()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT phone FROM public.teacher_profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_student_phone() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_teacher_phone() TO authenticated;

-- 2. PARENT MESSAGES: explicit restrictive policy so students can never read.
DROP POLICY IF EXISTS "students cannot read parent messages" ON public.parent_messages;
CREATE POLICY "students cannot read parent messages"
ON public.parent_messages
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'teacher'::app_role));

-- 3. TEACHER_TEACHING_MAP: only admins may insert/update/delete (no self-assign).
DROP POLICY IF EXISTS "teacher manages own map" ON public.teacher_teaching_map;

CREATE POLICY "admins manage map - insert"
ON public.teacher_teaching_map
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins manage map - update"
ON public.teacher_teaching_map
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins manage map - delete"
ON public.teacher_teaching_map
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Teachers can still see their own rows.
DROP POLICY IF EXISTS "teacher reads own map" ON public.teacher_teaching_map;
CREATE POLICY "teacher reads own map"
ON public.teacher_teaching_map
FOR SELECT TO authenticated
USING (auth.uid() = teacher_id);

-- 4. ATTENDANCE: explicit teacher INSERT policy.
DROP POLICY IF EXISTS "Teachers insert own attendance" ON public.attendance;
CREATE POLICY "Teachers insert own attendance"
ON public.attendance
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role) AND auth.uid() = teacher_id);

-- 5. STUDENT_ANSWERS: teachers can only view + update (grade), not insert/delete.
DROP POLICY IF EXISTS "Teachers can view and grade answers for own assignments" ON public.student_answers;

CREATE POLICY "Teachers can view answers for own assignments"
ON public.student_answers
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.student_submissions ss
  JOIN public.assignments a ON a.id = ss.assignment_id
  WHERE ss.id = student_answers.submission_id AND a.teacher_id = auth.uid()
));

CREATE POLICY "Teachers can grade answers for own assignments"
ON public.student_answers
FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.student_submissions ss
  JOIN public.assignments a ON a.id = ss.assignment_id
  WHERE ss.id = student_answers.submission_id AND a.teacher_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.student_submissions ss
  JOIN public.assignments a ON a.id = ss.assignment_id
  WHERE ss.id = student_answers.submission_id AND a.teacher_id = auth.uid()
));

-- 6. STUDENT_SUBMISSIONS: same restriction (view + update only).
DROP POLICY IF EXISTS "Teachers can view and grade submissions for own assignments" ON public.student_submissions;

CREATE POLICY "Teachers can view submissions for own assignments"
ON public.student_submissions
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.assignments a
  WHERE a.id = student_submissions.assignment_id AND a.teacher_id = auth.uid()
));

CREATE POLICY "Teachers can grade submissions for own assignments"
ON public.student_submissions
FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.assignments a
  WHERE a.id = student_submissions.assignment_id AND a.teacher_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.assignments a
  WHERE a.id = student_submissions.assignment_id AND a.teacher_id = auth.uid()
));
