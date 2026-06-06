#!/usr/bin/env bash
# Streams realistic live updates for the teacher / school dashboards.
# Picks random (student × concept) tuples and emits rung climbs, first-thoughts,
# interactions and Inner-OS bumps every ~2s so realtime widgets light up.
#
# Usage:  bash scripts/simulate-class.sh [iterations] [delay_seconds]
# Default: 60 iterations, 2 second delay (≈ 2 minutes of "live class").
#
# Requires: PG* env vars set (psql connects to the Supabase Postgres).

set -euo pipefail
ITER="${1:-60}"
DELAY="${2:-2}"

if [ -z "${PGHOST:-}" ]; then
  echo "PGHOST not set — cannot run simulation." >&2; exit 1
fi

CLASS="Class 10"

# Load class-10 student ids
mapfile -t STUDENTS < <(psql -tA -c "
  SELECT p.user_id FROM profiles p
  JOIN user_roles ur ON ur.user_id=p.user_id AND ur.role='student'
  WHERE p.class_name='${CLASS}'")

if [ "${#STUDENTS[@]}" -eq 0 ]; then
  echo "No Class 10 students found. Aborting." >&2; exit 1
fi
echo "Simulating ${#STUDENTS[@]} students across ${ITER} ticks (${DELAY}s apart)…"

# Episode × concept pool
EPISODES=(
  "real-numbers|euclid-division|euclid-lemma"
  "real-numbers|fundamental-theorem|prime-factorization"
  "polynomials|intro|degree-and-terms"
  "polynomials|zeros|zeros-of-polynomial"
  "triangles|pythagoras|pythagoras-theorem"
  "triangles|similarity|aaa-criterion"
  "ch1|ch1-ep1|real-numbers"
  "ch1|ch1-ep3|prime-factorization"
  "bio-ch1|bio-ch1-ep2|photosynthesis"
)

INTERESTS=("cricket" "space" "gaming" "food" "movies" "tech" "nature" "travel")
THOUGHTS=(
  "Why does 1000÷3 give 333.33 each but ×3 isnt 1000?"
  "Can a team win but still have a negative run-rate?"
  "Does the universe end or just keep going?"
  "Why does my FPS counter say 60 if GPU reports 59.94?"
  "How does a leaf actually catch sunlight?"
  "Is zero really a number or a placeholder?"
  "If primes never end, is there a biggest one we know?"
  "Why is the hypotenuse always the longest side?"
)
BLOCKS=("ladder" "vibe_check" "first_thought" "mcq" "sort" "reflect")

rand_pick() { local arr=("$@"); echo "${arr[$RANDOM % ${#arr[@]}]}"; }

for ((i=1; i<=ITER; i++)); do
  STU="${STUDENTS[$RANDOM % ${#STUDENTS[@]}]}"
  EP="$(rand_pick "${EPISODES[@]}")"
  CH="${EP%%|*}"; rest="${EP#*|}"; EID="${rest%%|*}"; CK="${rest##*|}"
  CORRECT=$(( RANDOM % 100 < 65 ? 1 : 0 ))
  TIME=$(( 8 + RANDOM % 50 ))
  WRONG=$(( CORRECT == 1 ? 0 : 1 + RANDOM % 3 ))
  RUNG=$(( 1 + RANDOM % 5 ))
  TRACK_R=$(( RANDOM % 100 ))
  TRACK=$([ $TRACK_R -lt 25 ] && echo "foundation" || ([ $TRACK_R -lt 80 ] && echo "core" || echo "advanced"))
  BLOCK="$(rand_pick "${BLOCKS[@]}")"
  INT="$(rand_pick "${INTERESTS[@]}")"
  THOUGHT="$(rand_pick "${THOUGHTS[@]}")"
  CORRECT_BOOL=$([ $CORRECT -eq 1 ] && echo true || echo false)

  psql -q <<SQL >/dev/null
INSERT INTO episode_interactions
  (user_id, chapter_id, episode_id, block_index, block_type,
   time_spent_seconds, wrong_attempts, answer_changes, correct_on_first_try, completed_at)
VALUES
  ('${STU}','${CH}','${EID}', ${RUNG}, '${BLOCK}',
   ${TIME}, ${WRONG}, ${WRONG}, ${CORRECT_BOOL}, now());

INSERT INTO student_rung_state
  (user_id, chapter_id, episode_id, concept_key, current_rung, depth_track,
   last_signal, vibe_check_shown_today, updated_at)
VALUES
  ('${STU}','${CH}','${EID}','${CK}', ${RUNG}, '${TRACK}',
   jsonb_build_object('timeSec',${TIME},'wrongAttempts',${WRONG},'correct',${CORRECT_BOOL}),
   ($RANDOM % 3 = 0), now())
ON CONFLICT (user_id, chapter_id, episode_id, concept_key)
DO UPDATE SET current_rung=EXCLUDED.current_rung, depth_track=EXCLUDED.depth_track,
              last_signal=EXCLUDED.last_signal, updated_at=now();

INSERT INTO curiosity_arc_progress
  (user_id, concept_key, interest_tag, current_day, current_step,
   day1_first_thought, updated_at)
VALUES
  ('${STU}','${CK}','${INT}', 1, 'hook',
   $([ $((RANDOM % 4)) -eq 0 ] && echo "'${THOUGHT//\'/\'\'}'" || echo "NULL"),
   now())
ON CONFLICT DO NOTHING;

UPDATE student_inner_os SET
  momentum_score = LEAST(100, momentum_score + (CASE WHEN ${CORRECT} = 1 THEN 1 ELSE 0 END)),
  thinking_score = LEAST(100, thinking_score + (CASE WHEN ${RUNG} >= 4 THEN 1 ELSE 0 END)),
  overall_score  = LEAST(100, overall_score  + (CASE WHEN ${CORRECT} = 1 THEN 1 ELSE 0 END)),
  updated_at = now()
WHERE user_id = '${STU}';
SQL

  printf "[%02d/%d] %s · ch=%s ep=%s rung=%d %s track=%s\n" \
    "$i" "$ITER" "${STU:0:8}" "$CH" "$EID" "$RUNG" \
    "$([ $CORRECT -eq 1 ] && echo ✓ || echo ✗)" "$TRACK"
  sleep "$DELAY"
done

echo "Done. Refresh the teacher dashboard to see the aggregated impact."
