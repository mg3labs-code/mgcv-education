
-- 1. assignments DELETE: require teacher role
DROP POLICY IF EXISTS "Teachers delete own assignments" ON public.assignments;
CREATE POLICY "Teachers delete own assignments" ON public.assignments
  FOR DELETE TO authenticated
  USING (auth.uid() = teacher_id AND public.has_role(auth.uid(), 'teacher'::app_role));

-- 2. teacher_todos: require teacher role
DROP POLICY IF EXISTS "Teachers manage own todos" ON public.teacher_todos;
CREATE POLICY "Teachers manage own todos" ON public.teacher_todos
  FOR ALL TO authenticated
  USING (auth.uid() = teacher_id AND public.has_role(auth.uid(), 'teacher'::app_role))
  WITH CHECK (auth.uid() = teacher_id AND public.has_role(auth.uid(), 'teacher'::app_role));

-- 3. teaching_schedules DELETE: require teacher role
DROP POLICY IF EXISTS "Teachers delete schedules for assigned classes" ON public.teaching_schedules;
CREATE POLICY "Teachers delete schedules for assigned classes" ON public.teaching_schedules
  FOR DELETE TO authenticated
  USING (auth.uid() = teacher_id AND public.has_role(auth.uid(), 'teacher'::app_role));

-- 4. calendar DELETE: require teacher role
DROP POLICY IF EXISTS "Teachers delete own calendar" ON public.calendar;
CREATE POLICY "Teachers delete own calendar" ON public.calendar
  FOR DELETE TO authenticated
  USING (auth.uid() = teacher_id AND public.has_role(auth.uid(), 'teacher'::app_role));

-- 5. sections INSERT: restrict to teachers/admins
DROP POLICY IF EXISTS "auth users can add custom sections" ON public.sections;
CREATE POLICY "Teachers and admins add custom sections" ON public.sections
  FOR INSERT TO authenticated
  WITH CHECK (
    is_default = false
    AND (public.has_role(auth.uid(), 'teacher'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  );

-- 6. Realtime channel scoping: users may only subscribe to their own user-scoped channel
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users subscribe to own channels" ON realtime.messages;
CREATE POLICY "Users subscribe to own channels" ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    realtime.topic() = auth.uid()::text
    OR realtime.topic() LIKE auth.uid()::text || ':%'
    OR realtime.topic() LIKE 'user:' || auth.uid()::text || '%'
  );
