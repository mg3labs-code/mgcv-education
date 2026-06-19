CREATE POLICY "Teachers insert own assignments" ON public.assignments FOR INSERT TO authenticated WITH CHECK (auth.uid() = teacher_id AND public.has_role(auth.uid(), 'teacher'::app_role));
CREATE POLICY "Teachers update own assignments" ON public.assignments FOR UPDATE TO authenticated USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Students read published assignments for their class" ON public.assignments FOR SELECT TO authenticated USING (is_published = true AND EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.user_id = auth.uid() AND ('Class ' || sp.grade::text) = assignments.class_name AND (assignments.board IS NULL OR assignments.board = sp.board) AND (assignments.section IS NULL OR assignments.section = sp.section)));

CREATE POLICY "Students read questions for visible assignments" ON public.assignment_questions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.assignments a JOIN public.student_profiles sp ON sp.user_id = auth.uid() WHERE a.id = assignment_questions.assignment_id AND a.is_published = true AND ('Class ' || sp.grade::text) = a.class_name AND (a.board IS NULL OR a.board = sp.board) AND (a.section IS NULL OR a.section = sp.section)));

CREATE POLICY "Teachers read own calendar" ON public.calendar FOR SELECT TO authenticated USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers insert own calendar" ON public.calendar FOR INSERT TO authenticated WITH CHECK (auth.uid() = teacher_id AND public.has_role(auth.uid(), 'teacher'::app_role));
CREATE POLICY "Teachers update own calendar" ON public.calendar FOR UPDATE TO authenticated USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Teachers delete own calendar" ON public.calendar FOR DELETE TO authenticated USING (auth.uid() = teacher_id);
CREATE POLICY "Students read calendar for their class" ON public.calendar FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.user_id = auth.uid() AND ('Class ' || sp.grade::text) = calendar.class_name AND (calendar.board IS NULL OR calendar.board = sp.board) AND (calendar.section IS NULL OR calendar.section = sp.section)));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'calendar') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.calendar';
  END IF;
END $$;

DROP POLICY IF EXISTS "Teachers manage own alerts" ON public.teacher_alerts;
CREATE POLICY "Teachers manage own alerts" ON public.teacher_alerts FOR ALL TO authenticated USING (auth.uid() = teacher_id AND public.has_role(auth.uid(), 'teacher'::app_role)) WITH CHECK (auth.uid() = teacher_id AND public.has_role(auth.uid(), 'teacher'::app_role));

GRANT SELECT ON public.teacher_world_digests TO authenticated;
GRANT ALL ON public.teacher_world_digests TO service_role;
CREATE POLICY "Teachers read digests for assigned classes" ON public.teacher_world_digests FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.teacher_teaching_map ttm WHERE ttm.teacher_id = auth.uid() AND ttm.subject = teacher_world_digests.subject AND ('Class ' || ttm.grade::text) = teacher_world_digests.class_name AND ttm.board = teacher_world_digests.board));

CREATE POLICY "Teachers insert own schedules" ON public.teaching_schedules FOR INSERT TO authenticated WITH CHECK (auth.uid() = teacher_id AND public.has_role(auth.uid(), 'teacher'::app_role));
CREATE POLICY "Teachers update own schedules" ON public.teaching_schedules FOR UPDATE TO authenticated USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);