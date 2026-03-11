
-- 1. student_inner_os
CREATE TABLE public.student_inner_os (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  clarity_score integer NOT NULL DEFAULT 45,
  thinking_score integer NOT NULL DEFAULT 40,
  attention_score integer NOT NULL DEFAULT 42,
  momentum_score integer NOT NULL DEFAULT 38,
  character_score integer NOT NULL DEFAULT 44,
  overall_score integer NOT NULL DEFAULT 42,
  streak_days integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  weekly_growth numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.student_inner_os ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own scores" ON public.student_inner_os FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Students update own scores" ON public.student_inner_os FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Teachers read class student scores" ON public.student_inner_os FOR SELECT USING (
  has_role(auth.uid(), 'teacher') AND get_user_class(user_id) IN (
    SELECT DISTINCT class_name FROM public.assignments WHERE teacher_id = auth.uid()
  )
);

-- 2. student_breakthroughs
CREATE TABLE public.student_breakthroughs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT '🏆',
  dimension text,
  xp_earned integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.student_breakthroughs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own breakthroughs" ON public.student_breakthroughs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Students insert own breakthroughs" ON public.student_breakthroughs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Teachers read class student breakthroughs" ON public.student_breakthroughs FOR SELECT USING (
  has_role(auth.uid(), 'teacher') AND get_user_class(user_id) IN (
    SELECT DISTINCT class_name FROM public.assignments WHERE teacher_id = auth.uid()
  )
);

-- 3. episode_progress
CREATE TABLE public.episode_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id text NOT NULL,
  episode_id text NOT NULL,
  layer_scores jsonb NOT NULL DEFAULT '{}',
  completion_pct integer NOT NULL DEFAULT 0,
  time_spent_seconds integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(user_id, chapter_id, episode_id)
);
ALTER TABLE public.episode_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own episode progress" ON public.episode_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Teachers read class student progress" ON public.episode_progress FOR SELECT USING (
  has_role(auth.uid(), 'teacher') AND get_user_class(user_id) IN (
    SELECT DISTINCT class_name FROM public.assignments WHERE teacher_id = auth.uid()
  )
);

-- 4. method_sessions
CREATE TABLE public.method_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method_type text NOT NULL,
  chapter_id text,
  episode_id text,
  score integer,
  duration_seconds integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.method_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own method sessions" ON public.method_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Teachers read class student methods" ON public.method_sessions FOR SELECT USING (
  has_role(auth.uid(), 'teacher') AND get_user_class(user_id) IN (
    SELECT DISTINCT class_name FROM public.assignments WHERE teacher_id = auth.uid()
  )
);

-- 5. daily_activity
CREATE TABLE public.daily_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  episodes_completed integer NOT NULL DEFAULT 0,
  time_spent_seconds integer NOT NULL DEFAULT 0,
  methods_used integer NOT NULL DEFAULT 0,
  layers_completed integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_date)
);
ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own daily activity" ON public.daily_activity FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Teachers read class student activity" ON public.daily_activity FOR SELECT USING (
  has_role(auth.uid(), 'teacher') AND get_user_class(user_id) IN (
    SELECT DISTINCT class_name FROM public.assignments WHERE teacher_id = auth.uid()
  )
);

-- 6. teacher_alerts
CREATE TABLE public.teacher_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_name text NOT NULL,
  alert_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  suggested_action text,
  is_read boolean NOT NULL DEFAULT false,
  is_dismissed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.teacher_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers manage own alerts" ON public.teacher_alerts FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- 7. teacher_todos
CREATE TABLE public.teacher_todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  title text NOT NULL,
  description text,
  class_name text,
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'medium',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.teacher_todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers manage own todos" ON public.teacher_todos FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- 8. student_preferences
CREATE TABLE public.student_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  grade integer,
  learning_style text,
  interests text[],
  preferred_language text NOT NULL DEFAULT 'en',
  difficulty_level text NOT NULL DEFAULT 'medium',
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.student_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own preferences" ON public.student_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Teachers read class student preferences" ON public.student_preferences FOR SELECT USING (
  has_role(auth.uid(), 'teacher') AND get_user_class(user_id) IN (
    SELECT DISTINCT class_name FROM public.assignments WHERE teacher_id = auth.uid()
  )
);

-- updated_at triggers
CREATE TRIGGER update_student_inner_os_updated_at BEFORE UPDATE ON public.student_inner_os FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teacher_todos_updated_at BEFORE UPDATE ON public.teacher_todos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_student_preferences_updated_at BEFORE UPDATE ON public.student_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
