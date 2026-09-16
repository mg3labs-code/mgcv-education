REVOKE ALL ON FUNCTION public.m_fn_log_calendar_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.m_fn_log_calendar_change() FROM anon;
REVOKE ALL ON FUNCTION public.m_fn_log_calendar_change() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.m_fn_log_calendar_change() TO service_role;