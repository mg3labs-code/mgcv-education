
-- 1) Storage: scope teacher read on answer-files to their own assignments' submissions
DROP POLICY IF EXISTS "Teachers can view all answer files" ON storage.objects;
CREATE POLICY "Teachers can view answer files for own assignments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'answer-files'
  AND public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND EXISTS (
    SELECT 1
    FROM public.student_submissions ss
    JOIN public.assignments a ON a.id = ss.assignment_id
    WHERE a.teacher_id = auth.uid()
      AND ss.student_id::text = (storage.foldername(name))[1]
  )
);

-- 2) student_answers: restrict student to SELECT + INSERT only
DROP POLICY IF EXISTS "Students can manage own answers" ON public.student_answers;
CREATE POLICY "Students can view own answers"
ON public.student_answers FOR SELECT
TO authenticated
USING (auth.uid() = student_id);
CREATE POLICY "Students can insert own answers"
ON public.student_answers FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

-- 3) teacher_world_digests: explicit restrictive write block for authenticated
CREATE POLICY "Block authenticated writes on world digests insert"
ON public.teacher_world_digests AS RESTRICTIVE FOR INSERT
TO authenticated
WITH CHECK (false);
CREATE POLICY "Block authenticated writes on world digests update"
ON public.teacher_world_digests AS RESTRICTIVE FOR UPDATE
TO authenticated
USING (false) WITH CHECK (false);
CREATE POLICY "Block authenticated writes on world digests delete"
ON public.teacher_world_digests AS RESTRICTIVE FOR DELETE
TO authenticated
USING (false);
