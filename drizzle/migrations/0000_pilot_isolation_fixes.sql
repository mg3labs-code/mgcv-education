-- Students may only read their own submissions; all writes go through the
-- manage-assignment function so students can't change scores or status.
DROP POLICY IF EXISTS "Students can manage own submissions" ON public.student_submissions;
CREATE POLICY "Students can view own submissions" ON public.student_submissions
  FOR SELECT TO authenticated USING (auth.uid() = student_id);

-- Students no longer insert answers directly (server function writes them).
DROP POLICY IF EXISTS "Students can insert own answers" ON public.student_answers;

-- Backfill board/section on assignments and calendar rows where the teacher
-- covers exactly one board+section for that grade+subject.
WITH single AS (
  SELECT teacher_id, grade, lower(subject) AS subj, min(board) AS board, min(section) AS section
  FROM public.teacher_teaching_map
  GROUP BY teacher_id, grade, lower(subject)
  HAVING count(DISTINCT (board, section)) = 1
)
UPDATE public.assignments a
SET board = COALESCE(a.board, s.board), section = COALESCE(a.section, s.section)
FROM single s
WHERE s.teacher_id = a.teacher_id
  AND 'Class ' || s.grade::text = a.class_name
  AND s.subj = lower(a.subject)
  AND (a.board IS NULL OR a.section IS NULL);

WITH single AS (
  SELECT teacher_id, grade, lower(subject) AS subj, min(board) AS board, min(section) AS section
  FROM public.teacher_teaching_map
  GROUP BY teacher_id, grade, lower(subject)
  HAVING count(DISTINCT (board, section)) = 1
)
UPDATE public.calendar c
SET board = COALESCE(c.board, s.board), section = COALESCE(c.section, s.section)
FROM single s
WHERE s.teacher_id = c.teacher_id
  AND 'Class ' || s.grade::text = c.class_name
  AND s.subj = lower(c.subject)
  AND (c.board IS NULL OR c.section IS NULL);