
-- Teaching schedules table - teachers create and manage, students view
CREATE TABLE public.teaching_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  subject text NOT NULL DEFAULT 'Mathematics',
  class_name text NOT NULL DEFAULT '',
  schedule_data jsonb NOT NULL DEFAULT '{}',
  chapters_data jsonb NOT NULL DEFAULT '[]',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teaching_schedules ENABLE ROW LEVEL SECURITY;

-- Teachers can manage their own schedules
CREATE POLICY "Teachers can view own schedules"
  ON public.teaching_schedules FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert own schedules"
  ON public.teaching_schedules FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update own schedules"
  ON public.teaching_schedules FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete own schedules"
  ON public.teaching_schedules FOR DELETE
  USING (auth.uid() = teacher_id);

-- Students can view schedules for their class
CREATE POLICY "Students can view schedules for their class"
  ON public.teaching_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
      AND p.class_name = teaching_schedules.class_name
      AND p.class_name IS NOT NULL
      AND p.class_name != ''
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_teaching_schedules_updated_at
  BEFORE UPDATE ON public.teaching_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
