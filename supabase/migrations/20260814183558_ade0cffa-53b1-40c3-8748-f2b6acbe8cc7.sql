CREATE TABLE public.doc_translation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size bigint,
  file_path text,
  doc_type text NOT NULL DEFAULT 'auto',
  source_lang text NOT NULL DEFAULT 'en',
  target_lang text NOT NULL DEFAULT 'te',
  term_style text NOT NULL DEFAULT 'bracket',
  status text NOT NULL DEFAULT 'pending',
  total_chunks integer NOT NULL DEFAULT 0,
  done_chunks integer NOT NULL DEFAULT 0,
  failed_chunks integer NOT NULL DEFAULT 0,
  content_hash text,
  validation jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX doc_jobs_dedupe ON public.doc_translation_jobs (user_id, content_hash, target_lang, term_style) WHERE content_hash IS NOT NULL;

CREATE TABLE public.doc_translation_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.doc_translation_jobs(id) ON DELETE CASCADE,
  idx integer NOT NULL,
  kind text NOT NULL DEFAULT 'block',
  source jsonb NOT NULL,
  translated jsonb,
  source_hash text,
  status text NOT NULL DEFAULT 'pending',
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, idx)
);
CREATE INDEX doc_chunks_job_status ON public.doc_translation_chunks (job_id, status);

CREATE TABLE public.doc_glossary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  english text NOT NULL,
  target_lang text NOT NULL DEFAULT 'te',
  translation text NOT NULL,
  rule text NOT NULL DEFAULT 'always',
  domain text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (english, target_lang)
);

CREATE TABLE public.doc_translation_cache (
  source_hash text NOT NULL,
  target_lang text NOT NULL,
  term_style text NOT NULL,
  translated jsonb NOT NULL,
  hits integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_hash, target_lang, term_style)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.doc_translation_jobs TO authenticated;
GRANT ALL ON public.doc_translation_jobs TO service_role;
GRANT SELECT, INSERT ON public.doc_translation_chunks TO authenticated;
GRANT ALL ON public.doc_translation_chunks TO service_role;
GRANT SELECT ON public.doc_glossary TO authenticated;
GRANT ALL ON public.doc_glossary TO service_role;
GRANT ALL ON public.doc_translation_cache TO service_role;

ALTER TABLE public.doc_translation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_translation_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_glossary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_translation_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own jobs select" ON public.doc_translation_jobs FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own jobs insert" ON public.doc_translation_jobs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own jobs update" ON public.doc_translation_jobs FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own jobs delete" ON public.doc_translation_jobs FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "own chunks select" ON public.doc_translation_chunks FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.doc_translation_jobs j WHERE j.id = job_id AND (j.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "own chunks insert" ON public.doc_translation_chunks FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.doc_translation_jobs j WHERE j.id = job_id AND j.user_id = auth.uid()));

CREATE POLICY "glossary read" ON public.doc_glossary FOR SELECT TO authenticated USING (true);
CREATE POLICY "glossary admin write" ON public.doc_glossary FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER doc_jobs_updated_at BEFORE UPDATE ON public.doc_translation_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.doc_glossary (english, target_lang, translation, rule, domain) VALUES
('Photosynthesis','te','కిరణజన్య సంయోగక్రియ','always','biology'),
('Cell','te','కణం','always','biology'),
('Mitochondria','te','మైటోకాండ్రియా','both','biology'),
('Cellular Respiration','te','కణ శ్వాసక్రియ','both','biology'),
('Force','te','బలం','always','physics'),
('Momentum','te','ద్రవ్యవేగం','always','physics'),
('Acceleration','te','త్వరణం','always','physics'),
('Velocity','te','వేగం','always','physics'),
('Algorithm','te','అల్గారిథమ్','keep_english','cs'),
('Machine Learning','te','మెషిన్ లెర్నింగ్','keep_english','cs'),
('Constitution','te','రాజ్యాంగం','always','civics'),
('Fundamental Rights','te','ప్రాథమిక హక్కులు','always','civics'),
('Equation','te','సమీకరణం','always','maths'),
('Polynomial','te','బహుపది','both','maths'),
('Probability','te','సంభావ్యత','always','maths'),
('Triangle','te','త్రిభుజం','always','maths'),
('Democracy','te','ప్రజాస్వామ్యం','always','civics'),
('Ecosystem','te','పరిసర వ్యవస్థ','both','biology'),
('Atom','te','పరమాణువు','always','chemistry'),
('Molecule','te','అణువు','always','chemistry')
ON CONFLICT DO NOTHING;