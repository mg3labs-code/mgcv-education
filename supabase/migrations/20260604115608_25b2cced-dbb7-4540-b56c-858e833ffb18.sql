
-- Add multi-interest column on profiles (keeps existing interest_tag for back-compat).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS interests_set_at timestamptz;

-- Weekly summary: compares the student's engagement BEFORE vs AFTER they set interests.
-- Returns ONE row per call (caller filters by user_id via auth.uid()).
CREATE OR REPLACE FUNCTION public.get_weekly_interest_summary(_user_id uuid)
RETURNS TABLE (
  has_interests boolean,
  top_interest text,
  cutover_at timestamptz,
  episodes_after integer,
  episodes_before integer,
  avg_time_after_seconds integer,
  avg_time_before_seconds integer,
  first_try_rate_after numeric,
  first_try_rate_before numeric,
  high_risk_after integer,
  high_risk_before integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH p AS (
    SELECT interests, interests_set_at
    FROM public.profiles
    WHERE user_id = _user_id
    LIMIT 1
  ), c AS (
    SELECT
      COALESCE((SELECT array_length(interests, 1) FROM p), 0) > 0 AS has_int,
      (SELECT interests[1] FROM p) AS top,
      (SELECT interests_set_at FROM p) AS cut
  ), ep AS (
    SELECT completed_at, time_spent_seconds,
           (completed_at IS NOT NULL AND completed_at >= (SELECT cut FROM c)) AS is_after
    FROM public.episode_progress
    WHERE user_id = _user_id AND completed_at IS NOT NULL
  ), ix AS (
    SELECT correct_on_first_try,
           (created_at >= (SELECT cut FROM c)) AS is_after
    FROM public.episode_interactions
    WHERE user_id = _user_id
  ), rp AS (
    SELECT risk_level,
           (generated_at >= (SELECT cut FROM c)) AS is_after
    FROM public.retention_predictions
    WHERE user_id = _user_id
  )
  SELECT
    (SELECT has_int FROM c),
    (SELECT top FROM c),
    (SELECT cut FROM c),
    COALESCE((SELECT COUNT(*)::int FROM ep WHERE is_after), 0),
    COALESCE((SELECT COUNT(*)::int FROM ep WHERE NOT is_after), 0),
    COALESCE((SELECT AVG(time_spent_seconds)::int FROM ep WHERE is_after), 0),
    COALESCE((SELECT AVG(time_spent_seconds)::int FROM ep WHERE NOT is_after), 0),
    COALESCE((SELECT ROUND(AVG(CASE WHEN correct_on_first_try THEN 1 ELSE 0 END)::numeric, 2) FROM ix WHERE is_after), 0),
    COALESCE((SELECT ROUND(AVG(CASE WHEN correct_on_first_try THEN 1 ELSE 0 END)::numeric, 2) FROM ix WHERE NOT is_after), 0),
    COALESCE((SELECT COUNT(*)::int FROM rp WHERE is_after AND risk_level = 'high'), 0),
    COALESCE((SELECT COUNT(*)::int FROM rp WHERE NOT is_after AND risk_level = 'high'), 0);
$$;

GRANT EXECUTE ON FUNCTION public.get_weekly_interest_summary(uuid) TO authenticated;
