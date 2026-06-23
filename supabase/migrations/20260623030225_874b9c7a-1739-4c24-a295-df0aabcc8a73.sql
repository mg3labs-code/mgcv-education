
-- 1) parent_messages: tighten restrictive SELECT to owning teacher
DROP POLICY IF EXISTS "students cannot read parent messages" ON public.parent_messages;
CREATE POLICY "parent_messages select owner only"
ON public.parent_messages
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (auth.uid() = teacher_id);

-- 2) teacher_profiles: revoke phone column from authenticated/anon
REVOKE SELECT (phone) ON public.teacher_profiles FROM authenticated;
REVOKE SELECT (phone) ON public.teacher_profiles FROM anon;
GRANT SELECT (phone) ON public.teacher_profiles TO service_role;

-- 3) student_breakthroughs: explicit immutability
DROP POLICY IF EXISTS "student_breakthroughs no update" ON public.student_breakthroughs;
DROP POLICY IF EXISTS "student_breakthroughs no delete" ON public.student_breakthroughs;
CREATE POLICY "student_breakthroughs no update"
ON public.student_breakthroughs
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);
CREATE POLICY "student_breakthroughs no delete"
ON public.student_breakthroughs
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (false);

-- 4) visual-aids bucket: restrict writes to service_role; keep public read (bucket is public)
DROP POLICY IF EXISTS "visual-aids service_role insert" ON storage.objects;
DROP POLICY IF EXISTS "visual-aids service_role update" ON storage.objects;
DROP POLICY IF EXISTS "visual-aids service_role delete" ON storage.objects;
CREATE POLICY "visual-aids service_role insert"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'visual-aids');
CREATE POLICY "visual-aids service_role update"
ON storage.objects
FOR UPDATE
TO service_role
USING (bucket_id = 'visual-aids')
WITH CHECK (bucket_id = 'visual-aids');
CREATE POLICY "visual-aids service_role delete"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'visual-aids');
