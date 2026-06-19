
CREATE POLICY "teachers insert own map" ON public.teacher_teaching_map
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = teacher_id AND has_role(auth.uid(), 'teacher'));

CREATE POLICY "teachers update own map" ON public.teacher_teaching_map
  FOR UPDATE TO authenticated
  USING (auth.uid() = teacher_id AND has_role(auth.uid(), 'teacher'))
  WITH CHECK (auth.uid() = teacher_id AND has_role(auth.uid(), 'teacher'));

CREATE POLICY "teachers delete own map" ON public.teacher_teaching_map
  FOR DELETE TO authenticated
  USING (auth.uid() = teacher_id AND has_role(auth.uid(), 'teacher'));
