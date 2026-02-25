-- Fix recursive RLS loop between assignments <-> profiles
-- 1) Add a SECURITY DEFINER helper so profile access checks don't recurse into RLS-protected assignment queries
CREATE OR REPLACE FUNCTION public.teacher_manages_class(_teacher_id uuid, _class_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.assignments a
    WHERE a.teacher_id = _teacher_id
      AND a.class_name = _class_name
  );
$$;

-- 2) Replace recursive teacher profile policy with a non-recursive version
DROP POLICY IF EXISTS "Teachers can view student profiles in their class" ON public.profiles;

CREATE POLICY "Teachers can view student profiles in their class"
ON public.profiles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND profiles.class_name IS NOT NULL
  AND profiles.class_name <> ''
  AND public.teacher_manages_class(auth.uid(), profiles.class_name)
  AND EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = profiles.user_id
      AND ur.role = 'student'::public.app_role
  )
);