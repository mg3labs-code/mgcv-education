
-- Subjects table
CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  board text NOT NULL DEFAULT 'Telangana',
  grade integer NOT NULL DEFAULT 10,
  color text DEFAULT '#6366f1',
  icon text DEFAULT '📚',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Textbook chapters table
CREATE TABLE public.tb_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  slug text NOT NULL,
  number integer NOT NULL,
  title text NOT NULL,
  subtitle text,
  color text DEFAULT '#6366f1',
  periods integer DEFAULT 0,
  page_range text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Textbook episodes table
CREATE TABLE public.tb_episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid REFERENCES public.tb_chapters(id) ON DELETE CASCADE NOT NULL,
  slug text NOT NULL,
  number integer NOT NULL,
  title text NOT NULL,
  subtitle text,
  duration text DEFAULT '8 min',
  type text NOT NULL DEFAULT 'Concept',
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Content blocks table (all 11 types)
CREATE TABLE public.content_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id uuid REFERENCES public.tb_episodes(id) ON DELETE CASCADE NOT NULL,
  block_type text NOT NULL,
  title text,
  icon text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;

-- Public read policies for all authenticated users
CREATE POLICY "Anyone can read subjects" ON public.subjects FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can read published chapters" ON public.tb_chapters FOR SELECT TO public USING (is_published = true);
CREATE POLICY "Anyone can read published episodes" ON public.tb_episodes FOR SELECT TO public USING (is_published = true);
CREATE POLICY "Anyone can read content blocks" ON public.content_blocks FOR SELECT TO public USING (true);

-- Teacher/admin write policies
CREATE POLICY "Teachers can manage chapters" ON public.tb_chapters FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can manage episodes" ON public.tb_episodes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can manage content blocks" ON public.content_blocks FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can manage subjects" ON public.subjects FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'teacher') OR has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_tb_chapters_subject ON public.tb_chapters(subject_id);
CREATE INDEX idx_tb_episodes_chapter ON public.tb_episodes(chapter_id);
CREATE INDEX idx_content_blocks_episode ON public.content_blocks(episode_id);
CREATE INDEX idx_tb_chapters_slug ON public.tb_chapters(slug);
CREATE INDEX idx_tb_episodes_slug ON public.tb_episodes(slug);
