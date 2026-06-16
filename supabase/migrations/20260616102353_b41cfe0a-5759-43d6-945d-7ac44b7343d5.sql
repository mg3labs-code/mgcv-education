
-- ============================================================
-- 1. teacher_assignments: which (class, subject) a teacher teaches
-- ============================================================
CREATE TABLE public.teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_name text,
  class_name text NOT NULL,
  subject text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, class_name, subject)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_assignments TO authenticated;
GRANT ALL ON public.teacher_assignments TO service_role;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage own assignments"
  ON public.teacher_assignments FOR ALL
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Admins manage all teacher assignments"
  ON public.teacher_assignments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view teachers of their class"
  ON public.teacher_assignments FOR SELECT
  USING (class_name = public.get_user_class(auth.uid()));

CREATE TRIGGER ta_set_updated_at
  BEFORE UPDATE ON public.teacher_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. teacher_teaches() helper
-- ============================================================
CREATE OR REPLACE FUNCTION public.teacher_teaches(_teacher_id uuid, _class_name text, _subject text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_assignments
    WHERE teacher_id = _teacher_id
      AND class_name = _class_name
      AND (_subject IS NULL OR subject = _subject)
  );
$$;

-- ============================================================
-- 3. national_holidays reference table (Jun 2025 - May 2026)
-- ============================================================
CREATE TABLE public.national_holidays (
  date date PRIMARY KEY,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.national_holidays TO anon, authenticated;
GRANT ALL ON public.national_holidays TO service_role;
ALTER TABLE public.national_holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view national holidays"
  ON public.national_holidays FOR SELECT
  USING (true);

CREATE POLICY "Admins manage national holidays"
  ON public.national_holidays FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.national_holidays (date, label) VALUES
  ('2025-08-15', 'Independence Day'),
  ('2025-08-19', 'Raksha Bandhan'),
  ('2025-08-26', 'Janmashtami'),
  ('2025-10-02', 'Gandhi Jayanti'),
  ('2025-10-20', 'Dussehra'),
  ('2025-10-21', 'Diwali'),
  ('2025-11-15', 'Guru Nanak Jayanti'),
  ('2025-12-25', 'Christmas Day'),
  ('2026-01-26', 'Republic Day'),
  ('2026-02-15', 'Maha Shivaratri'),
  ('2026-03-04', 'Holi'),
  ('2026-03-20', 'Eid-ul-Fitr'),
  ('2026-04-03', 'Good Friday'),
  ('2026-05-01', 'Buddha Purnima'),
  ('2026-05-27', 'Bakrid');

-- ============================================================
-- 4. calendar table (one row per scheduled entry)
-- ============================================================
CREATE TABLE public.calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_name text,
  class_name text NOT NULL,
  subject text NOT NULL,
  date date NOT NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('topic','practice','test','assignment','holiday')),
  chapter_id text,
  chapter_name text,
  chapter_color text,
  topic_key text,
  topic_title text,
  label text,
  is_national_holiday boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_name, subject, date, entry_type)
);

CREATE INDEX idx_calendar_class_subject_date ON public.calendar (class_name, subject, date);
CREATE INDEX idx_calendar_teacher_date ON public.calendar (teacher_id, date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar TO authenticated;
GRANT ALL ON public.calendar TO service_role;
ALTER TABLE public.calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers select calendar for assigned classes"
  ON public.calendar FOR SELECT
  USING (
    auth.uid() = teacher_id
    OR public.teacher_teaches(auth.uid(), class_name, subject)
  );

CREATE POLICY "Teachers insert calendar for assigned classes"
  ON public.calendar FOR INSERT
  WITH CHECK (
    auth.uid() = teacher_id
    AND public.teacher_teaches(auth.uid(), class_name, subject)
  );

CREATE POLICY "Teachers update calendar for assigned classes"
  ON public.calendar FOR UPDATE
  USING (public.teacher_teaches(auth.uid(), class_name, subject))
  WITH CHECK (public.teacher_teaches(auth.uid(), class_name, subject));

CREATE POLICY "Teachers delete calendar for assigned classes"
  ON public.calendar FOR DELETE
  USING (public.teacher_teaches(auth.uid(), class_name, subject));

CREATE POLICY "Students view calendar for their class"
  ON public.calendar FOR SELECT
  USING (class_name = public.get_user_class(auth.uid()));

CREATE POLICY "Admins manage calendar"
  ON public.calendar FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER calendar_set_updated_at
  BEFORE UPDATE ON public.calendar
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar;
ALTER TABLE public.calendar REPLICA IDENTITY FULL;

-- ============================================================
-- 5. Add subject column to existing teacher-writable tables
-- ============================================================
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE public.teacher_alerts ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE public.teaching_schedules ADD COLUMN IF NOT EXISTS subject_norm text;

-- ============================================================
-- 6. Tighten RLS on teaching_schedules (require teacher_teaches when subject known)
-- ============================================================
DROP POLICY IF EXISTS "Teachers can insert own schedules" ON public.teaching_schedules;
DROP POLICY IF EXISTS "Teachers can update own schedules" ON public.teaching_schedules;
DROP POLICY IF EXISTS "Teachers can delete own schedules" ON public.teaching_schedules;

CREATE POLICY "Teachers insert schedules for assigned classes"
  ON public.teaching_schedules FOR INSERT
  WITH CHECK (
    auth.uid() = teacher_id
    AND (subject IS NULL OR public.teacher_teaches(auth.uid(), class_name, subject))
  );

CREATE POLICY "Teachers update schedules for assigned classes"
  ON public.teaching_schedules FOR UPDATE
  USING (auth.uid() = teacher_id)
  WITH CHECK (
    auth.uid() = teacher_id
    AND (subject IS NULL OR public.teacher_teaches(auth.uid(), class_name, subject))
  );

CREATE POLICY "Teachers delete schedules for assigned classes"
  ON public.teaching_schedules FOR DELETE
  USING (auth.uid() = teacher_id);

-- ============================================================
-- 7. Tighten RLS on assignments
-- ============================================================
DROP POLICY IF EXISTS "Teachers can manage own assignments" ON public.assignments;

CREATE POLICY "Teachers select own assignments"
  ON public.assignments FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers insert assignments for assigned classes"
  ON public.assignments FOR INSERT
  WITH CHECK (
    auth.uid() = teacher_id
    AND (subject IS NULL OR public.teacher_teaches(auth.uid(), class_name, subject))
  );

CREATE POLICY "Teachers update own assignments"
  ON public.assignments FOR UPDATE
  USING (auth.uid() = teacher_id)
  WITH CHECK (
    auth.uid() = teacher_id
    AND (subject IS NULL OR public.teacher_teaches(auth.uid(), class_name, subject))
  );

CREATE POLICY "Teachers delete own assignments"
  ON public.assignments FOR DELETE
  USING (auth.uid() = teacher_id);

-- ============================================================
-- 8. Tighten RLS on attendance
-- ============================================================
DROP POLICY IF EXISTS "Teachers can manage own attendance" ON public.attendance;

CREATE POLICY "Teachers select own attendance"
  ON public.attendance FOR SELECT
  USING (public.has_role(auth.uid(), 'teacher'::app_role) AND auth.uid() = teacher_id);

CREATE POLICY "Teachers insert attendance for assigned classes"
  ON public.attendance FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'teacher'::app_role)
    AND auth.uid() = teacher_id
    AND (subject IS NULL OR public.teacher_teaches(auth.uid(), COALESCE((SELECT class_name FROM public.profiles WHERE user_id = student_id), ''), subject))
  );

CREATE POLICY "Teachers update own attendance"
  ON public.attendance FOR UPDATE
  USING (public.has_role(auth.uid(), 'teacher'::app_role) AND auth.uid() = teacher_id)
  WITH CHECK (public.has_role(auth.uid(), 'teacher'::app_role) AND auth.uid() = teacher_id);

CREATE POLICY "Teachers delete own attendance"
  ON public.attendance FOR DELETE
  USING (public.has_role(auth.uid(), 'teacher'::app_role) AND auth.uid() = teacher_id);
