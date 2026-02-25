
-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  student_id UUID NOT NULL,
  class_name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, date)
);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Teachers can manage attendance for their class
CREATE POLICY "Teachers can manage attendance"
ON public.attendance
FOR ALL
USING (has_role(auth.uid(), 'teacher'::app_role))
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role) AND auth.uid() = teacher_id);

-- Students can view their own attendance
CREATE POLICY "Students can view own attendance"
ON public.attendance
FOR SELECT
USING (auth.uid() = student_id);

-- Create parent_messages table for Parent Connect
CREATE TABLE public.parent_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  student_id UUID NOT NULL,
  parent_email TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  class_name TEXT NOT NULL
);

ALTER TABLE public.parent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage parent messages"
ON public.parent_messages
FOR ALL
USING (has_role(auth.uid(), 'teacher'::app_role) AND auth.uid() = teacher_id)
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role) AND auth.uid() = teacher_id);

-- Trigger for updated_at on attendance
CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
