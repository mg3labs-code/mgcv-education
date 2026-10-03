DROP POLICY IF EXISTS "Teachers can grade answers for own assignments" ON public.student_answers;
DROP POLICY IF EXISTS "Teachers can grade submissions for own assignments" ON public.student_submissions;
COMMENT ON TABLE public.student_submissions IS 'Writes only via manage-assignment (server computes totals and enforces teacher ownership).';