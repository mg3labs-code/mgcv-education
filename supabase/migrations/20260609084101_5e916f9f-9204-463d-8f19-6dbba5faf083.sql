
CREATE TABLE public.teacher_world_digests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  class_name text NOT NULL,
  board text NOT NULL DEFAULT 'CBSE',
  payload jsonb NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  UNIQUE (subject, class_name, board)
);

GRANT SELECT ON public.teacher_world_digests TO authenticated;
GRANT ALL ON public.teacher_world_digests TO service_role;

ALTER TABLE public.teacher_world_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers and admins can read digests"
  ON public.teacher_world_digests
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'teacher'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
