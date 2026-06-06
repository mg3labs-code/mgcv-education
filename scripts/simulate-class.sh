#!/usr/bin/env bash
# Streams live class activity (interactions + curiosity prompts) so the
# teacher Misconception Map, Thinking Signals feed, and class depth
# dashboards update in real time.
#
# Usage:  bash scripts/simulate-class.sh [iterations] [delay_seconds]

set -euo pipefail
ITER="${1:-80}"
DELAY="${2:-2}"

[ -z "${PGHOST:-}" ] && { echo "PGHOST not set"; exit 1; }
CLASS="Class 10"

mapfile -t STUDENTS < <(psql -tA -c "
  SELECT p.user_id FROM profiles p
  JOIN user_roles ur ON ur.user_id=p.user_id AND ur.role='student'
  WHERE p.class_name='${CLASS}'")
[ "${#STUDENTS[@]}" -eq 0 ] && { echo "no students"; exit 1; }
echo "Simulating ${#STUDENTS[@]} students × ${ITER} ticks (${DELAY}s)…"

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
INTERESTS=(cricket space gaming food movies tech nature travel)
THOUGHTS=(
  "Why does 1000÷3 give 333.33 each but ×3 isnt 1000?"
  "Can a team win but still have a negative run-rate?"
  "If primes never end, is there a biggest one we know?"
  "Why is the hypotenuse always the longest side?"
  "How does a leaf actually catch sunlight?"
  "Is zero really a number or a placeholder?"
)
BLOCKS=(ladder vibe_check first_thought mcq sort reflect)
pick() { local arr=("$@"); echo "${arr[$RANDOM % ${#arr[@]}]}"; }

for ((i=1;i<=ITER;i++)); do
  STU="${STUDENTS[$RANDOM % ${#STUDENTS[@]}]}"
  EP="$(pick "${EPISODES[@]}")"
  CH="${EP%%|*}"; rest="${EP#*|}"; EID="${rest%%|*}"; CK="${rest##*|}"
  CORRECT=$(( RANDOM % 100 < 65 ? 1 : 0 ))
  TIME=$(( 8 + RANDOM % 50 ))
  WRONG=$(( CORRECT == 1 ? 0 : 1 + RANDOM % 3 ))
  IDX=$(( 1 + RANDOM % 200 ))
  BLOCK="$(pick "${BLOCKS[@]}")"
  INT="$(pick "${INTERESTS[@]}")"
  CB=$([ $CORRECT -eq 1 ] && echo true || echo false)

  psql -q <<SQL >/dev/null 2>&1 || true
INSERT INTO episode_interactions
  (user_id, chapter_id, episode_id, block_index, block_type,
   time_spent_seconds, wrong_attempts, answer_changes, correct_on_first_try, completed_at)
VALUES
  ('${STU}','${CH}','${EID}', ${IDX}, '${BLOCK}',
   ${TIME}, ${WRONG}, ${WRONG}, ${CB}, now());
SQL

  if [ $((RANDOM % 4)) -eq 0 ]; then
    TH="$(pick "${THOUGHTS[@]}")"
    psql -q <<SQL >/dev/null 2>&1 || true
INSERT INTO curiosity_arc_progress
  (user_id, concept_key, interest_tag, current_day, current_step,
   day1_first_thought, updated_at)
VALUES
  ('${STU}','${CK}','${INT}', 1, 'hook',
   '${TH//\'/\'\'}', now())
ON CONFLICT DO NOTHING;
SQL
  fi

  printf "[%02d/%d] %s %s/%s rung-like=%d %s\n" \
    "$i" "$ITER" "${STU:0:8}" "$CH" "$EID" "$IDX" \
    "$([ $CORRECT -eq 1 ] && echo ✓ || echo ✗)"
  sleep "$DELAY"
done
echo "Simulation complete."
