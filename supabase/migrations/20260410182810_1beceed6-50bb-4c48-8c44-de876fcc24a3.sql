INSERT INTO storage.buckets (id, name, public) VALUES ('reasoning-visuals', 'reasoning-visuals', true);

CREATE POLICY "Anyone can view reasoning visuals" ON storage.objects FOR SELECT USING (bucket_id = 'reasoning-visuals');

CREATE POLICY "Service role can upload reasoning visuals" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'reasoning-visuals');