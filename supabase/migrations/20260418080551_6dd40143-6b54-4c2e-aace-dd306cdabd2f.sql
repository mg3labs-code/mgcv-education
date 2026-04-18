
-- 1. Fix handle_new_user: prevent self-assignment of admin role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  requested_role text;
  assigned_role app_role;
BEGIN
  requested_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');

  -- Only allow self-assignment of student or teacher; never admin
  IF requested_role = 'teacher' THEN
    assigned_role := 'teacher'::app_role;
  ELSE
    assigned_role := 'student'::app_role;
  END IF;

  INSERT INTO public.profiles (user_id, full_name, class_name, school_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'class_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'school_name', '')
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role);

  IF assigned_role = 'student'::app_role THEN
    INSERT INTO public.student_inner_os (user_id) VALUES (NEW.id);
    INSERT INTO public.student_preferences (user_id) VALUES (NEW.id);
    INSERT INTO public.daily_activity (user_id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$function$;

-- 2. Lock down profile updates: prevent students from changing class_name / school_name after onboarding
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Allow updates to own profile, but class_name and school_name are immutable for non-admins
-- once set (onboarding writes them once via this same policy because OLD values are empty).
CREATE POLICY "Users can update own profile (locked sensitive fields)"
ON public.profiles
FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (
      -- class_name: allow setting only when currently empty (onboarding) OR unchanged
      (COALESCE(class_name, '') = COALESCE((SELECT p.class_name FROM public.profiles p WHERE p.user_id = auth.uid()), '')
       OR COALESCE((SELECT p.class_name FROM public.profiles p WHERE p.user_id = auth.uid()), '') = '')
      AND
      -- school_name: same rule
      (COALESCE(school_name, '') = COALESCE((SELECT p.school_name FROM public.profiles p WHERE p.user_id = auth.uid()), '')
       OR COALESCE((SELECT p.school_name FROM public.profiles p WHERE p.user_id = auth.uid()), '') = '')
    )
  )
);

-- 3. Tighten attendance policy: teachers can only access their own records
DROP POLICY IF EXISTS "Teachers can manage attendance" ON public.attendance;

CREATE POLICY "Teachers can manage own attendance"
ON public.attendance
FOR ALL
TO public
USING (
  public.has_role(auth.uid(), 'teacher'::app_role)
  AND auth.uid() = teacher_id
)
WITH CHECK (
  public.has_role(auth.uid(), 'teacher'::app_role)
  AND auth.uid() = teacher_id
);

-- 4. Add explicit SELECT policy for parent_messages (defensive)
DROP POLICY IF EXISTS "Teachers read own parent messages" ON public.parent_messages;
CREATE POLICY "Teachers read own parent messages"
ON public.parent_messages
FOR SELECT
TO public
USING (
  public.has_role(auth.uid(), 'teacher'::app_role)
  AND auth.uid() = teacher_id
);

-- 5. Restrict reasoning-visuals storage upload to service_role only
DROP POLICY IF EXISTS "Service role can upload reasoning visuals" ON storage.objects;

CREATE POLICY "Service role can upload reasoning visuals"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'reasoning-visuals');
