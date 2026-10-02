DROP POLICY IF EXISTS "Students read published assignments for their class" ON public.assignments;
CREATE POLICY "Students read published assignments for their class" ON public.assignments FOR SELECT TO authenticated
USING (is_published = true AND EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.user_id = auth.uid() AND ('Class ' || sp.grade::text) = assignments.class_name AND assignments.board = sp.board AND assignments.section = sp.section));
DROP POLICY IF EXISTS "Students read calendar for their class" ON public.calendar;
CREATE POLICY "Students read calendar for their class" ON public.calendar FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.user_id = auth.uid() AND ('Class ' || sp.grade::text) = calendar.class_name AND calendar.board = sp.board AND calendar.section = sp.section));