ALTER PUBLICATION supabase_realtime ADD TABLE public.student_rung_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.curiosity_arc_progress;
ALTER TABLE public.student_rung_state REPLICA IDENTITY FULL;
ALTER TABLE public.curiosity_arc_progress REPLICA IDENTITY FULL;