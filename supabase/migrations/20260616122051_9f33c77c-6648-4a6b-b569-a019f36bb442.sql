
-- 1. Wipe operational data
TRUNCATE TABLE
  public.attendance, public.calendar, public.assignment_questions, public.assignments,
  public.episode_progress, public.episode_interactions, public.teacher_todos,
  public.teacher_alerts, public.teacher_world_digests, public.student_inner_os,
  public.student_preferences, public.daily_activity, public.retention_predictions,
  public.parent_messages, public.chat_messages, public.chat_sessions,
  public.student_submissions, public.student_answers, public.student_breakthroughs,
  public.student_rung_state, public.teaching_schedules, public.method_sessions,
  public.curiosity_arc_progress, public.language_progress
RESTART IDENTITY CASCADE;

DROP VIEW IF EXISTS public.assignment_questions_student;
DROP TABLE IF EXISTS public.teacher_assignments CASCADE;

-- CASCADE so dependent policies are removed; we'll recreate compatible functions below
DROP FUNCTION IF EXISTS public.teacher_teaches(uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.teacher_manages_class(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_class(uuid) CASCADE;

DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Lookups
CREATE TABLE public.boards (code text PRIMARY KEY, name text NOT NULL, sort_order int NOT NULL DEFAULT 0);
GRANT SELECT ON public.boards TO authenticated, anon;
GRANT ALL ON public.boards TO service_role;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "boards readable by all" ON public.boards FOR SELECT USING (true);

CREATE TABLE public.grades (grade int PRIMARY KEY, label text NOT NULL);
GRANT SELECT ON public.grades TO authenticated, anon;
GRANT ALL ON public.grades TO service_role;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grades readable by all" ON public.grades FOR SELECT USING (true);

CREATE TABLE public.sections (code text PRIMARY KEY, school_name text, is_default boolean NOT NULL DEFAULT false);
GRANT SELECT ON public.sections TO authenticated, anon;
GRANT INSERT ON public.sections TO authenticated;
GRANT ALL ON public.sections TO service_role;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sections readable by all" ON public.sections FOR SELECT USING (true);
CREATE POLICY "auth users can add custom sections" ON public.sections FOR INSERT TO authenticated WITH CHECK (is_default = false);

CREATE TABLE public.subjects_catalog (code text PRIMARY KEY, name text NOT NULL, sort_order int NOT NULL DEFAULT 0);
GRANT SELECT ON public.subjects_catalog TO authenticated, anon;
GRANT ALL ON public.subjects_catalog TO service_role;
ALTER TABLE public.subjects_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subjects_catalog readable by all" ON public.subjects_catalog FOR SELECT USING (true);

INSERT INTO public.boards (code, name, sort_order) VALUES
  ('CBSE','CBSE',1),('ICSE','ICSE',2),('BSE_TELANGANA','BSE Telangana',3),('IB','IB',4),('IGCSE','IGCSE',5);
INSERT INTO public.grades (grade,label) VALUES (7,'Class 7'),(8,'Class 8'),(9,'Class 9');
INSERT INTO public.sections (code,is_default) VALUES ('A',true),('B',true),('C',true),('D',true),('E',true),('F',true);
INSERT INTO public.subjects_catalog (code,name,sort_order) VALUES
  ('Mathematics','Mathematics',1),('Science','Science',2),('Physics','Physics',3),('Chemistry','Chemistry',4),
  ('Biology','Biology',5),('English','English',6),('Social Science','Social Science',7),
  ('Hindi','Hindi',8),('Sanskrit','Sanskrit',9),('Telugu','Telugu',10);

-- 3. Profile tables
CREATE TABLE public.student_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text,
  board text NOT NULL,
  grade int NOT NULL,
  section text NOT NULL,
  school_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX student_profiles_bgs_idx ON public.student_profiles (board, grade, section);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_profiles TO authenticated;
GRANT ALL ON public.student_profiles TO service_role;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.teacher_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text,
  school_name text,
  sections text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_profiles TO authenticated;
GRANT ALL ON public.teacher_profiles TO service_role;
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.admin_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text,
  boards text[] NOT NULL DEFAULT '{}',
  grades int[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_profiles TO authenticated;
GRANT ALL ON public.admin_profiles TO service_role;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Teaching map
CREATE TABLE public.teacher_teaching_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  board text NOT NULL,
  grade int NOT NULL,
  section text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, subject, board, grade, section)
);
CREATE INDEX ttm_lookup_idx ON public.teacher_teaching_map (board, grade, section, subject);
CREATE INDEX ttm_teacher_idx ON public.teacher_teaching_map (teacher_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_teaching_map TO authenticated;
GRANT ALL ON public.teacher_teaching_map TO service_role;
ALTER TABLE public.teacher_teaching_map ENABLE ROW LEVEL SECURITY;

-- 5. Helpers
CREATE OR REPLACE FUNCTION public.student_context(_user_id uuid)
RETURNS TABLE(board text, grade int, section text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT board, grade, section FROM public.student_profiles WHERE user_id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.teacher_covers(_teacher_id uuid, _board text, _grade int, _section text, _subject text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_teaching_map
    WHERE teacher_id = _teacher_id AND board = _board AND grade = _grade AND section = _section
      AND (_subject IS NULL OR subject = _subject)
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_class(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT 'Class ' || grade::text FROM public.student_profiles WHERE user_id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.teacher_teaches(_teacher_id uuid, _class_name text, _subject text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_teaching_map
    WHERE teacher_id = _teacher_id
      AND 'Class ' || grade::text = _class_name
      AND (_subject IS NULL OR subject = _subject)
  );
$$;

CREATE OR REPLACE FUNCTION public.teacher_manages_class(_teacher_id uuid, _class_name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.teacher_teaches(_teacher_id, _class_name, NULL);
$$;

-- 6. RLS policies
CREATE POLICY "students self read" ON public.student_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "students self insert" ON public.student_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "students self update" ON public.student_profiles FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "teachers read their students" ON public.student_profiles FOR SELECT USING (public.teacher_covers(auth.uid(), board, grade, section, NULL));
CREATE POLICY "admins read all students" ON public.student_profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "teachers self read" ON public.teacher_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "teachers self insert" ON public.teacher_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "teachers self update" ON public.teacher_profiles FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admins read all teachers" ON public.teacher_profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "students see their teachers" ON public.teacher_profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.teacher_teaching_map m, public.student_profiles s
          WHERE s.user_id = auth.uid() AND m.teacher_id = teacher_profiles.user_id
            AND m.board=s.board AND m.grade=s.grade AND m.section=s.section)
);

CREATE POLICY "admin self read" ON public.admin_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "admin self insert" ON public.admin_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin self update" ON public.admin_profiles FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "teacher manages own map" ON public.teacher_teaching_map FOR ALL
  USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "students see matching teachers" ON public.teacher_teaching_map FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.student_profiles s
          WHERE s.user_id = auth.uid() AND s.board = teacher_teaching_map.board
            AND s.grade = teacher_teaching_map.grade AND s.section = teacher_teaching_map.section)
);
CREATE POLICY "admins read all map" ON public.teacher_teaching_map FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 7. Signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  requested_role text;
  assigned_role app_role;
  meta jsonb;
  tm jsonb;
BEGIN
  meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  requested_role := COALESCE(meta->>'role', 'student');

  IF requested_role = 'teacher' THEN assigned_role := 'teacher'::app_role;
  ELSIF requested_role = 'admin' THEN assigned_role := 'admin'::app_role;
  ELSE assigned_role := 'student'::app_role;
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role) ON CONFLICT DO NOTHING;

  IF assigned_role = 'student'::app_role THEN
    INSERT INTO public.student_profiles (user_id, full_name, phone, board, grade, section, school_name)
    VALUES (NEW.id, COALESCE(meta->>'full_name',''), meta->>'phone',
            COALESCE(meta->>'board','CBSE'), COALESCE((meta->>'grade')::int, 9),
            COALESCE(meta->>'section','A'), meta->>'school_name')
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.student_inner_os (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    INSERT INTO public.student_preferences (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    INSERT INTO public.daily_activity (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;

  ELSIF assigned_role = 'teacher'::app_role THEN
    INSERT INTO public.teacher_profiles (user_id, full_name, phone, school_name, sections)
    VALUES (NEW.id, COALESCE(meta->>'full_name',''), meta->>'phone', meta->>'school_name',
            COALESCE(ARRAY(SELECT jsonb_array_elements_text(meta->'sections')), '{}'))
    ON CONFLICT (user_id) DO NOTHING;

    IF jsonb_typeof(meta->'teaching_map') = 'array' THEN
      FOR tm IN SELECT * FROM jsonb_array_elements(meta->'teaching_map') LOOP
        INSERT INTO public.teacher_teaching_map (teacher_id, subject, board, grade, section)
        VALUES (NEW.id, tm->>'subject', tm->>'board', (tm->>'grade')::int, tm->>'section')
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;

  ELSIF assigned_role = 'admin'::app_role THEN
    INSERT INTO public.admin_profiles (user_id, full_name, phone, boards, grades)
    VALUES (NEW.id, COALESCE(meta->>'full_name',''), meta->>'phone',
            COALESCE(ARRAY(SELECT jsonb_array_elements_text(meta->'boards')), '{}'),
            COALESCE(ARRAY(SELECT (jsonb_array_elements_text(meta->'grades'))::int), '{}'))
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER student_profiles_updated_at BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER teacher_profiles_updated_at BEFORE UPDATE ON public.teacher_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER admin_profiles_updated_at BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Convenience view
CREATE OR REPLACE VIEW public.my_teachers WITH (security_invoker = true) AS
SELECT tp.user_id AS teacher_id, tp.full_name, m.subject, m.board, m.grade, m.section
FROM public.teacher_teaching_map m
JOIN public.teacher_profiles tp ON tp.user_id = m.teacher_id
WHERE EXISTS (SELECT 1 FROM public.student_profiles s
              WHERE s.user_id = auth.uid()
                AND s.board = m.board AND s.grade = m.grade AND s.section = m.section);
GRANT SELECT ON public.my_teachers TO authenticated;

-- 9. Extend operational tables with board/section (so future filtering can use them)
ALTER TABLE public.assignments        ADD COLUMN IF NOT EXISTS board text, ADD COLUMN IF NOT EXISTS section text;
ALTER TABLE public.attendance         ADD COLUMN IF NOT EXISTS board text, ADD COLUMN IF NOT EXISTS section text;
ALTER TABLE public.calendar           ADD COLUMN IF NOT EXISTS board text, ADD COLUMN IF NOT EXISTS section text;
ALTER TABLE public.teaching_schedules ADD COLUMN IF NOT EXISTS board text, ADD COLUMN IF NOT EXISTS section text;

-- 10. Restore the safe view for student-facing assignment questions (was dropped earlier)
CREATE OR REPLACE VIEW public.assignment_questions_student WITH (security_invoker = true) AS
SELECT id, assignment_id, question_number, question_text, max_score, created_at
FROM public.assignment_questions q
WHERE EXISTS (
  SELECT 1 FROM public.assignments a
  WHERE a.id = q.assignment_id
    AND a.class_name = public.get_user_class(auth.uid())
);
GRANT SELECT ON public.assignment_questions_student TO authenticated;
