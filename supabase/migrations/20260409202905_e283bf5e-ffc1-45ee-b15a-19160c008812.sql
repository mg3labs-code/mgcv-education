
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, class_name, school_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'class_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'school_name', '')
  );
  
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
$function$;
