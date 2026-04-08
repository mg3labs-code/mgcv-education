
-- 1. user_roles: restrict INSERT/UPDATE/DELETE to admins only
CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. app_config: restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can read app config" ON public.app_config;
CREATE POLICY "Authenticated users can read app config"
ON public.app_config FOR SELECT
TO authenticated
USING (true);

-- 3. student_inner_os: add INSERT policy scoped to own user
CREATE POLICY "Students insert own scores"
ON public.student_inner_os FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. teacher_alerts: restrict INSERT to teachers only
CREATE POLICY "Only teachers can insert alerts"
ON public.teacher_alerts FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'teacher') AND auth.uid() = teacher_id);

-- 5. answer-files storage: owner-scoped DELETE and UPDATE
CREATE POLICY "Students can delete own answer files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'answer-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Students can update own answer files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'answer-files' AND auth.uid()::text = (storage.foldername(name))[1]);
