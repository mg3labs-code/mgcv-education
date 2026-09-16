CREATE OR REPLACE FUNCTION public.m_fn_log_calendar_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.m_calendar_audit (
        calendar_id, teacher, board, class_name, section, subject,
        old_data, new_data
    ) VALUES (
        NEW.id,
        COALESCE(auth.uid()::text, 'system'),
        NEW.board,
        NEW.class_name,
        NEW.section,
        NEW.subject,
        CASE WHEN TG_OP = 'UPDATE' THEN OLD.calendar_data ELSE NULL END,
        NEW.calendar_data
    );
    RETURN NEW;
END;
$$;