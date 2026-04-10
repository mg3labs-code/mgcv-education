ALTER TABLE public.content_blocks ADD COLUMN depth text NOT NULL DEFAULT 'board';

CREATE INDEX idx_content_blocks_depth ON public.content_blocks (depth);