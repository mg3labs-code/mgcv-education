
-- 1. Chapter metadata table (one row per chapter per teacher/class/subject)
CREATE TABLE IF NOT EXISTS public.calendar_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  board text,
  class_name text NOT NULL,
  section text,
  subject text NOT NULL,
  chapter_id text NOT NULL,
  chapter_name text NOT NULL,
  chapter_color text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, class_name, subject, chapter_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_chapters TO authenticated;
GRANT ALL ON public.calendar_chapters TO service_role;

ALTER TABLE public.calendar_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers read own calendar_chapters"
  ON public.calendar_chapters FOR SELECT TO authenticated
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers insert own calendar_chapters"
  ON public.calendar_chapters FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = teacher_id AND public.has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Teachers update own calendar_chapters"
  ON public.calendar_chapters FOR UPDATE TO authenticated
  USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers delete own calendar_chapters"
  ON public.calendar_chapters FOR DELETE TO authenticated
  USING (auth.uid() = teacher_id AND public.has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Students read calendar_chapters for their class"
  ON public.calendar_chapters FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      WHERE sp.user_id = auth.uid()
        AND ('Class ' || sp.grade::text) = calendar_chapters.class_name
        AND (calendar_chapters.board IS NULL OR calendar_chapters.board = sp.board)
        AND (calendar_chapters.section IS NULL OR calendar_chapters.section = sp.section)
    )
  );

CREATE POLICY "Admins manage calendar_chapters"
  ON public.calendar_chapters FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER calendar_chapters_set_updated_at
  BEFORE UPDATE ON public.calendar_chapters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Link the per-date calendar table to chapter metadata
ALTER TABLE public.calendar
  ADD COLUMN IF NOT EXISTS chapter_ref_id uuid
  REFERENCES public.calendar_chapters(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_chapter_ref ON public.calendar(chapter_ref_id);

-- 3. Allow weekly Saturday assignment rows to be stored alongside other entry types
--    (already allowed by existing check constraint: assignment is in the list)
