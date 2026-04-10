CREATE TABLE public.reasoning_visuals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  subject text NOT NULL DEFAULT 'Science',
  grade text NOT NULL DEFAULT 'Grade 10',
  slug text NOT NULL,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  search_tokens tsvector GENERATED ALWAYS AS (
    to_tsvector('english', topic || ' ' || subject)
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reasoning_visuals_slug ON public.reasoning_visuals (slug);
CREATE INDEX idx_reasoning_visuals_search ON public.reasoning_visuals USING gin (search_tokens);

ALTER TABLE public.reasoning_visuals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reasoning visuals" ON public.reasoning_visuals
  FOR SELECT USING (true);

CREATE POLICY "Service can insert reasoning visuals" ON public.reasoning_visuals
  FOR INSERT WITH CHECK (true);