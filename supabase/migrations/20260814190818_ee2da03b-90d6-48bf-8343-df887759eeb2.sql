ALTER TABLE public.doc_translation_jobs ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.doc_translation_jobs ADD COLUMN IF NOT EXISTS guest_id text;
CREATE INDEX IF NOT EXISTS doc_translation_jobs_guest_idx ON public.doc_translation_jobs (guest_id, content_hash);