
DROP POLICY IF EXISTS "Service can update reasoning visuals" ON public.reasoning_visuals;
DROP POLICY IF EXISTS "Service can delete reasoning visuals" ON public.reasoning_visuals;
DROP POLICY IF EXISTS "Service can insert reasoning visuals" ON public.reasoning_visuals;

CREATE POLICY "Service role can insert reasoning visuals"
ON public.reasoning_visuals
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update reasoning visuals"
ON public.reasoning_visuals
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can delete reasoning visuals"
ON public.reasoning_visuals
FOR DELETE
TO service_role
USING (true);
