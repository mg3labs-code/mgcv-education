CREATE OR REPLACE FUNCTION public.recalculate_retention_predictions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_count integer := 0;
BEGIN
  WITH source_rows AS (
    SELECT
      ep.user_id,
      ep.chapter_id,
      ep.episode_id,
      ep.layer_scores,
      ep.completion_pct,
      ep.time_spent_seconds,
      COALESCE(existing.concept_key, ep.episode_id) AS concept_key,
      COALESCE(existing.concept_label, initcap(replace(ep.episode_id, '-', ' '))) AS concept_label
    FROM public.episode_progress ep
    LEFT JOIN LATERAL (
      SELECT rp.concept_key, rp.concept_label
      FROM public.retention_predictions rp
      WHERE rp.user_id = ep.user_id
        AND rp.chapter_id = ep.chapter_id
        AND rp.episode_id = ep.episode_id
      ORDER BY rp.generated_at DESC
      LIMIT 1
    ) existing ON true
    WHERE ep.layer_scores ?| ARRAY['day1_completed_at', 'day2_completed_at', 'day3_completed_at']
  ), signals AS (
    SELECT
      sr.*,
      (sr.layer_scores ? 'day1_completed_at') AS day1_done,
      (sr.layer_scores ? 'day2_completed_at') AS day2_done,
      (sr.layer_scores ? 'day3_completed_at') AS day3_done,
      COALESCE((sr.layer_scores->>'day1_detective_correct')::boolean, false) AS day1_detective_correct,
      NULLIF(sr.layer_scores #>> '{day2_explain_score,score}', '')::numeric AS day2_score,
      NULLIF(sr.layer_scores #>> '{day3_explain_score,score}', '')::numeric AS day3_score
    FROM source_rows sr
  ), scored AS (
    SELECT
      s.*,
      ((CASE WHEN day1_done THEN 1 ELSE 0 END) + (CASE WHEN day2_done THEN 1 ELSE 0 END) + (CASE WHEN day3_done THEN 1 ELSE 0 END)) AS completion_count,
      ((CASE WHEN day2_score IS NULL THEN 0 ELSE 1 END) + (CASE WHEN day3_score IS NULL THEN 0 ELSE 1 END)) AS explain_count,
      COALESCE((COALESCE(day2_score, 0) + COALESCE(day3_score, 0)) / NULLIF((CASE WHEN day2_score IS NULL THEN 0 ELSE 1 END) + (CASE WHEN day3_score IS NULL THEN 0 ELSE 1 END), 0), 55) AS explain_avg
    FROM signals s
  ), predictions AS (
    SELECT
      user_id,
      chapter_id,
      episode_id,
      concept_key,
      concept_label,
      LEAST(100, GREATEST(0, ROUND(
        100
        - explain_avg
        + (100 - (((completion_count::numeric / 3) * 100))) * 0.35
        + (2 - explain_count) * 8
        - (CASE WHEN day1_detective_correct THEN 8 ELSE -8 END)
      )))::integer AS risk_score,
      LEAST(100, GREATEST(0, ROUND(40 + completion_count * 12 + explain_count * 10 + CASE WHEN day1_done THEN 6 ELSE 0 END)))::integer AS confidence,
      jsonb_build_object(
        'day1_completed', day1_done,
        'day2_completed', day2_done,
        'day3_completed', day3_done,
        'day1_detective_correct', day1_detective_correct,
        'day2_explain_score', day2_score,
        'day3_explain_score', day3_score,
        'completion_pct', completion_pct,
        'time_spent_seconds', time_spent_seconds,
        'explain_average', ROUND(explain_avg),
        'recalculated_by', 'nightly_job'
      ) AS signals
    FROM scored
  ), upserted AS (
    INSERT INTO public.retention_predictions (
      user_id,
      chapter_id,
      episode_id,
      concept_key,
      concept_label,
      risk_score,
      risk_level,
      confidence,
      signals,
      recommended_action,
      predicted_for_date,
      generated_at,
      updated_at
    )
    SELECT
      user_id,
      chapter_id,
      episode_id,
      concept_key,
      concept_label,
      risk_score,
      CASE WHEN risk_score >= 70 THEN 'high' WHEN risk_score >= 40 THEN 'medium' ELSE 'low' END,
      confidence,
      signals,
      CASE
        WHEN risk_score >= 70 THEN 'Review the concept with one worked example, then ask the student to explain it again in simple words.'
        WHEN risk_score >= 40 THEN 'Give a five-minute recap and one fresh practice question next week.'
        ELSE 'Use one quick retrieval question next week to keep memory strong.'
      END,
      CURRENT_DATE + 7,
      now(),
      now()
    FROM predictions
    ON CONFLICT (user_id, chapter_id, episode_id, concept_key, predicted_for_date)
    DO UPDATE SET
      risk_score = EXCLUDED.risk_score,
      risk_level = EXCLUDED.risk_level,
      confidence = EXCLUDED.confidence,
      signals = EXCLUDED.signals,
      recommended_action = EXCLUDED.recommended_action,
      generated_at = now(),
      updated_at = now()
    RETURNING 1
  )
  SELECT COUNT(*) INTO affected_count FROM upserted;

  RETURN affected_count;
END;
$$;

REVOKE ALL ON FUNCTION public.recalculate_retention_predictions() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.recalculate_retention_predictions() FROM authenticated;