CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  requested_role text;
  assigned_role app_role;
  meta jsonb;
  tm jsonb;
  requested_grade integer;
BEGIN
  meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  requested_role := COALESCE(meta->>'role', 'student');

  IF requested_role = 'teacher' THEN assigned_role := 'teacher'::app_role;
  ELSIF requested_role = 'admin' THEN assigned_role := 'admin'::app_role;
  ELSE assigned_role := 'student'::app_role;
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role) ON CONFLICT DO NOTHING;

  IF assigned_role = 'student'::app_role THEN
    requested_grade := COALESCE(
      NULLIF(meta->>'grade', '')::integer,
      NULLIF(regexp_replace(COALESCE(meta->>'class_name', ''), '\D', '', 'g'), '')::integer,
      9
    );
    IF requested_grade < 6 OR requested_grade > 10 THEN
      requested_grade := 9;
    END IF;

    INSERT INTO public.student_profiles (user_id, full_name, phone, board, grade, section, school_name)
    VALUES (
      NEW.id,
      COALESCE(meta->>'full_name',''),
      meta->>'phone',
      COALESCE(NULLIF(meta->>'board',''), 'CBSE'),
      requested_grade,
      COALESCE(NULLIF(upper(meta->>'section'),''), 'A'),
      NULLIF(meta->>'school_name','')
    )
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.student_inner_os (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    INSERT INTO public.student_preferences (user_id, grade) VALUES (NEW.id, requested_grade) ON CONFLICT DO NOTHING;
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
$function$;

CREATE OR REPLACE FUNCTION public.get_teacher_explanations(
  _board text,
  _grade integer,
  _section text,
  _subject text
)
RETURNS TABLE(
  student_id uuid,
  student_name text,
  board text,
  grade integer,
  section text,
  chapter_id text,
  episode_id text,
  explanation text,
  score integer,
  band text,
  feedback text,
  next_step text,
  completed_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    sp.user_id,
    sp.full_name,
    sp.board,
    sp.grade,
    sp.section,
    ep.chapter_id,
    ep.episode_id,
    ep.layer_scores->>'day2_explanation',
    CASE
      WHEN (ep.layer_scores #>> '{day2_explain_score,score}') ~ '^\d+$'
      THEN (ep.layer_scores #>> '{day2_explain_score,score}')::integer
      ELSE NULL
    END,
    ep.layer_scores #>> '{day2_explain_score,band}',
    ep.layer_scores #>> '{day2_explain_score,feedback}',
    ep.layer_scores #>> '{day2_explain_score,next_step}',
    COALESCE((ep.layer_scores->>'day2_completed_at')::timestamptz, ep.completed_at)
  FROM public.student_profiles sp
  JOIN public.episode_progress ep ON ep.user_id = sp.user_id
  WHERE auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.teacher_teaching_map ttm
      WHERE ttm.teacher_id = auth.uid()
        AND ttm.board = _board
        AND ttm.grade = _grade
        AND ttm.section = _section
        AND lower(ttm.subject) = lower(_subject)
    )
    AND sp.board = _board
    AND sp.grade = _grade
    AND sp.section = _section
    AND NULLIF(btrim(ep.layer_scores->>'day2_explanation'), '') IS NOT NULL
    AND (
      (lower(_subject) IN ('mathematics', 'maths', 'math') AND ep.chapter_id ~* '^(ch[0-9]+|math|real-number)')
      OR (lower(_subject) = 'chemistry' AND ep.chapter_id ~* 'chem')
      OR (lower(_subject) = 'physics' AND ep.chapter_id ~* 'phys')
      OR (lower(_subject) IN ('science', 'biology') AND ep.chapter_id ~* '^(sci|bio)')
      OR (lower(_subject) IN ('social science', 'geography') AND ep.chapter_id ~* '(india|geo|history|civics)')
      OR (lower(_subject) NOT IN ('mathematics','maths','math','chemistry','physics','science','biology','social science','geography'))
    )
  ORDER BY COALESCE((ep.layer_scores->>'day2_completed_at')::timestamptz, ep.completed_at) DESC NULLS LAST;
$function$;

REVOKE ALL ON FUNCTION public.get_teacher_explanations(text, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_teacher_explanations(text, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_teacher_explanations(text, integer, text, text) TO service_role;