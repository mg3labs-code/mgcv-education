
-- Update handle_new_user to seed student tables
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, class_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.raw_user_meta_data->>'class_name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'));
  
  -- Seed student-specific tables
  IF COALESCE((NEW.raw_user_meta_data->>'role')::text, 'student') = 'student' THEN
    INSERT INTO public.student_inner_os (user_id) VALUES (NEW.id);
    INSERT INTO public.student_preferences (user_id) VALUES (NEW.id);
    INSERT INTO public.daily_activity (user_id) VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- get_student_streak: count consecutive days of activity
CREATE OR REPLACE FUNCTION public.get_student_streak(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH ordered_days AS (
    SELECT activity_date,
           activity_date - (ROW_NUMBER() OVER (ORDER BY activity_date DESC))::int AS grp
    FROM public.daily_activity
    WHERE user_id = _user_id
    ORDER BY activity_date DESC
  ),
  current_streak AS (
    SELECT grp, COUNT(*) AS streak_len
    FROM ordered_days
    GROUP BY grp
    ORDER BY MAX(activity_date) DESC
    LIMIT 1
  )
  SELECT COALESCE((SELECT streak_len FROM current_streak), 0)::integer;
$$;

-- get_class_averages: aggregate Inner OS scores for a class
CREATE OR REPLACE FUNCTION public.get_class_averages(_class_name text)
RETURNS TABLE(
  avg_clarity numeric,
  avg_thinking numeric,
  avg_attention numeric,
  avg_momentum numeric,
  avg_character numeric,
  avg_overall numeric,
  student_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    ROUND(AVG(s.clarity_score), 1),
    ROUND(AVG(s.thinking_score), 1),
    ROUND(AVG(s.attention_score), 1),
    ROUND(AVG(s.momentum_score), 1),
    ROUND(AVG(s.character_score), 1),
    ROUND(AVG(s.overall_score), 1),
    COUNT(*)
  FROM public.student_inner_os s
  JOIN public.profiles p ON p.user_id = s.user_id
  WHERE p.class_name = _class_name;
$$;
