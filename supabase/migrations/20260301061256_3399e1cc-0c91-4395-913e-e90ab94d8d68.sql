
-- Simple key-value config table to store ElevenLabs agent_id
CREATE TABLE public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Everyone can read config (agent_id is not sensitive)
CREATE POLICY "Anyone can read app config"
ON public.app_config FOR SELECT
USING (true);

-- Only service role can write (edge functions use service role)
-- No INSERT/UPDATE/DELETE policies for anon/authenticated users
