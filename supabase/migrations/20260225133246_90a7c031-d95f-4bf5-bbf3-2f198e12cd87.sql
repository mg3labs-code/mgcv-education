-- Fix recursion: student policy on assignments queries profiles, which queries assignments
-- Create a security definer function to check student class
CREATE OR REPLACE FUNCTION public.get_user_class(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT class_name FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1;
$$;

-- Replace student policy on assignments
DROP POLICY IF EXISTS "Students can view published assignments for their class" ON public.assignments;

CREATE POLICY "Students can view published assignments for their class"
ON public.assignments
FOR SELECT
USING (
  is_published = true
  AND class_name IS NOT NULL
  AND class_name <> ''
  AND class_name = public.get_user_class(auth.uid())
);

-- Also fix student policy on assignment_questions (same recursion through profiles)
DROP POLICY IF EXISTS "Students can view questions for their class assignments" ON public.assignment_questions;

CREATE POLICY "Students can view questions for their class assignments"
ON public.assignment_questions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.id = assignment_questions.assignment_id
      AND a.is_published = true
      AND a.class_name = public.get_user_class(auth.uid())
  )
);

-- Also fix student policy on teaching_schedules
DROP POLICY IF EXISTS "Students can view schedules for their class" ON public.teaching_schedules;

CREATE POLICY "Students can view schedules for their class"
ON public.teaching_schedules
FOR SELECT
USING (
  class_name IS NOT NULL
  AND class_name <> ''
  AND class_name = public.get_user_class(auth.uid())
);