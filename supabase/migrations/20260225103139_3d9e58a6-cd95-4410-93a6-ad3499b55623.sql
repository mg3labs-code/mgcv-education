-- Allow teachers to view profiles of students in their classes
CREATE POLICY "Teachers can view student profiles in their class"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'teacher'
  )
  AND
  EXISTS (
    SELECT 1 FROM assignments a
    WHERE a.teacher_id = auth.uid()
    AND a.class_name = profiles.class_name
  )
);