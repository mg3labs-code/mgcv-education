
-- Compatibility view: union of all role profiles, exposing legacy column shape.
CREATE OR REPLACE VIEW public.profiles WITH (security_invoker = true) AS
SELECT
  sp.user_id                          AS id,
  sp.user_id                          AS user_id,
  sp.full_name                        AS full_name,
  ('Class ' || sp.grade::text)        AS class_name,
  sp.school_name                      AS school_name,
  sp.board                            AS region,
  pref.interests                      AS interests,
  NULL::text                          AS interest_tag,
  pref.updated_at                     AS interests_set_at,
  sp.created_at                       AS created_at,
  sp.updated_at                       AS updated_at,
  'student'::text                     AS profile_kind
FROM public.student_profiles sp
LEFT JOIN public.student_preferences pref ON pref.user_id = sp.user_id
UNION ALL
SELECT
  tp.user_id, tp.user_id, tp.full_name,
  NULL::text, tp.school_name, NULL::text,
  NULL::text[], NULL::text, NULL::timestamptz,
  tp.created_at, tp.updated_at, 'teacher'::text
FROM public.teacher_profiles tp
UNION ALL
SELECT
  ap.user_id, ap.user_id, ap.full_name,
  NULL::text, NULL::text, NULL::text,
  NULL::text[], NULL::text, NULL::timestamptz,
  ap.created_at, ap.updated_at, 'admin'::text
FROM public.admin_profiles ap;

GRANT SELECT ON public.profiles TO authenticated;

-- INSTEAD OF triggers so legacy inserts/updates against `profiles` work for students.
CREATE OR REPLACE FUNCTION public.profiles_compat_upsert()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  _grade int;
BEGIN
  _grade := COALESCE(NULLIF(regexp_replace(COALESCE(NEW.class_name, ''), '\D', '', 'g'), '')::int, 9);
  INSERT INTO public.student_profiles (user_id, full_name, board, grade, section, school_name)
  VALUES (
    NEW.user_id,
    COALESCE(NEW.full_name, ''),
    COALESCE(NEW.region, 'CBSE'),
    _grade,
    'A',
    NEW.school_name
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name   = EXCLUDED.full_name,
    grade       = EXCLUDED.grade,
    school_name = EXCLUDED.school_name,
    updated_at  = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.profiles_compat_update()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  _grade int;
BEGIN
  _grade := COALESCE(NULLIF(regexp_replace(COALESCE(NEW.class_name, ''), '\D', '', 'g'), '')::int, NULL);
  UPDATE public.student_profiles SET
    full_name   = COALESCE(NEW.full_name, full_name),
    grade       = COALESCE(_grade, grade),
    school_name = COALESCE(NEW.school_name, school_name),
    updated_at  = now()
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_insert_compat ON public.profiles;
CREATE TRIGGER profiles_insert_compat INSTEAD OF INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_compat_upsert();

DROP TRIGGER IF EXISTS profiles_update_compat ON public.profiles;
CREATE TRIGGER profiles_update_compat INSTEAD OF UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_compat_update();
