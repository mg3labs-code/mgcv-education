
-- ============================================
-- PHASE 1: AI Assignment System Schema
-- ============================================

-- Assignments (teacher creates these)
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  class_name TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT 'Mathematics',
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  max_total_score NUMERIC(6,2),
  unlock_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage own assignments"
  ON public.assignments FOR ALL
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Students can view published assignments for their class"
  ON public.assignments FOR SELECT
  USING (
    is_published = true AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
        AND p.class_name = assignments.class_name
        AND p.class_name IS NOT NULL
        AND p.class_name <> ''
    )
  );

-- Assignment questions
CREATE TABLE public.assignment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  question_number INT NOT NULL,
  question_text TEXT NOT NULL,
  max_score NUMERIC(5,2) NOT NULL DEFAULT 10,
  rubric JSONB NOT NULL DEFAULT '[]',
  expected_answer_hints TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.assignment_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage questions for own assignments"
  ON public.assignment_questions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM assignments a WHERE a.id = assignment_id AND a.teacher_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM assignments a WHERE a.id = assignment_id AND a.teacher_id = auth.uid())
  );

CREATE POLICY "Students can view questions for their class assignments"
  ON public.assignment_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN profiles p ON p.class_name = a.class_name
      WHERE a.id = assignment_id
        AND a.is_published = true
        AND p.user_id = auth.uid()
    )
  );

-- Student submissions (one per student per assignment)
CREATE TABLE public.student_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  -- statuses: in_progress, submitted, graded, finalized
  submitted_at TIMESTAMPTZ,
  finalized_at TIMESTAMPTZ,
  finalized_by UUID,
  total_score NUMERIC(6,2),
  teacher_remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

ALTER TABLE public.student_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own submissions"
  ON public.student_submissions FOR ALL
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teachers can view and grade submissions for own assignments"
  ON public.student_submissions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM assignments a WHERE a.id = assignment_id AND a.teacher_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM assignments a WHERE a.id = assignment_id AND a.teacher_id = auth.uid())
  );

-- Student answers (one per question per submission)
CREATE TABLE public.student_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.student_submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.assignment_questions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  file_url TEXT,
  file_type TEXT,
  extracted_text TEXT,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  -- statuses: pending, processing, success, failed
  processing_error TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  ai_feedback JSONB,
  -- structure: { strengths: [], mistakes: [], suggestions: [], rubric_scores: {} }
  ai_score NUMERIC(5,2),
  ai_confidence NUMERIC(5,2),
  -- 0-100, how confident AI is in its evaluation
  teacher_feedback TEXT,
  teacher_score NUMERIC(5,2),
  is_teacher_reviewed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(submission_id, question_id)
);

ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own answers"
  ON public.student_answers FOR ALL
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teachers can view and grade answers for own assignments"
  ON public.student_answers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM student_submissions ss
      JOIN assignments a ON a.id = ss.assignment_id
      WHERE ss.id = submission_id AND a.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_submissions ss
      JOIN assignments a ON a.id = ss.assignment_id
      WHERE ss.id = submission_id AND a.teacher_id = auth.uid()
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_submissions_updated_at
  BEFORE UPDATE ON public.student_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_answers_updated_at
  BEFORE UPDATE ON public.student_answers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for answer uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('answer-files', 'answer-files', false);

CREATE POLICY "Students can upload own answer files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'answer-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Students can view own answer files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'answer-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Teachers can view all answer files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'answer-files' AND
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'teacher')
  );
