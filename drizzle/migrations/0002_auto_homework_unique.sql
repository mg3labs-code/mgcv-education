CREATE UNIQUE INDEX IF NOT EXISTS assignments_auto_homework_unique
ON public.assignments (teacher_id, COALESCE(board, ''), class_name, COALESCE(section, ''), subject, schedule_topic_key, schedule_date)
WHERE source = 'auto_homework';