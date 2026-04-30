# Confidence Ladder — psychological progression for every student

## The core idea (in one breath)

Every concept opens with something the student can answer correctly in under 10 seconds. The brace drops. Then the app walks them up a 5-rung ladder — recognize → notice → explain → defend → apply — pacing itself from how they're behaving. They never see rung numbers. They just feel "I'm getting it." Explorer / Builder / Master keeps working as the *depth* dial; the ladder is the *confidence angle* dial. Both run together.

## The 5 rungs (used internally, never shown to student)

```
Rung 1  RECOGNIZE   "I already know this"        gimme, 10-sec yes
Rung 2  NOTICE      "Wait, that's me too"        small surprise, one twist
Rung 3  EXPLAIN     "I can say it in my words"   short produced answer
Rung 4  DEFEND      "I can hold my ground"       one tricky case / contradiction
Rung 5  APPLY       "I can use this somewhere new"  transfer to fresh scenario
```

Mapping to existing days (per your "hybrid" answer):

```
Day 1 Spark    → Rung 1, then Rung 2
                 If student is winning fast, ONE bonus Rung-3 card before finish.
Day 2 Build    → Rung 3, then Rung 4
Day 3 Master   → Rung 5
```

Skippable bonus rung is silent — no popup, no "level up" — just one extra card titled "One more — see if this clicks" with a "Skip" link.

## How the app decides to climb (pacing engine)

Behavior-first, vibe-check as backup.

**Behavior signals (already captured in `episode_interactions`)**
- `time_spent_seconds` on the rung
- `wrong_attempts`
- `correct_on_first_try`
- `answer_changes` (hesitation proxy)

**Auto-climb rule**
- Correct, fast, no changes → climb to next rung
- Correct but slow OR 1 wrong then correct → stay one beat, give a same-rung reinforcer, then climb
- Wrong twice OR ambiguous (correct but very slow + multiple changes) → trigger vibe-check

**Vibe-check (only when ambiguous)** — three taps, takes 2 seconds:
- 😌 Too easy
- 🙂 Just right
- 😣 Felt hard

→ "Too easy" jumps a rung. "Just right" continues. "Felt hard" repeats with a softer angle (different clothing).

The student sees the vibe-check at most once per day, and only when behavior is unclear.

## Content: where each rung's text comes from

Per your answer — **hand-authored Ch1 + AI fallback for the rest.**

- Chapter 1 of every subject (Maths, Physics, Chemistry, Biology) gets hand-written Rung 1–5 openers stored in a new `concept_rungs` table. These are the showcase. Quality bar: a 9th-grader reads Rung 1 and smiles within 5 seconds.
- All other chapters: a new edge function `generate-concept-rungs` calls Lovable AI (`google/gemini-2.5-flash`) the first time a concept is opened, generates all 5 rungs in one call, and caches them in `concept_rungs`. Subsequent students see cached output instantly.
- Regeneration: a "Refresh examples" button in teacher view (later) — out of scope for this pass.

## Geography: light touch only

Per your answer — used only at Rung 1 and Rung 2.

- Add optional `region` and `city` to `profiles` (collected in onboarding with a "Skip" option).
- The Rung 1–2 generator/author uses the region as *flavor* (e.g., "Hyderabad metro" instead of "a metro train") when it fits. Rungs 3–5 stay universal.
- If region is empty, fall back to universal Indian-student examples (your phone, your school bag, cricket).

## What each "clothing" looks like (so you see it concretely)

Concept: **Real Numbers / Irrational Numbers (Maths Class 10, Chapter 1)**

```
Rung 1  "Your phone battery shows 47%. Is 47 a whole number?"          [yes/no tap]
Rung 2  "Your friend says √2 = 1.41. You divide 1.41 × 1.41.
         Do you get exactly 2?"                                        [yes/no + reveal]
Rung 3  "In your own words: why can't √2 be written as a/b?"           [1-line input]
Rung 4  "A classmate insists 0.999... ≠ 1. What do you tell them?"     [short answer]
Rung 5  "Design a 5-second test to check if a number a friend gives
         you is rational or not."                                      [open prompt]
```

Concept: **Photosynthesis (Biology Class 10, Chapter 1)** — stakes clothing

```
Rung 1  "The plant on a windowsill needs ___ to make food."            [pick: sun/soil/wifi]
Rung 2  "If you cover its leaves with foil for 3 days, what happens?"  [pick + reveal]
Rung 3  "Explain to your younger cousin: where does the leaf's
         green colour come from, and why does it matter?"              [short input]
Rung 4  "A friend says 'plants eat soil.' Convince them otherwise
         using one experiment they could do at home."                  [short input]
Rung 5  "If Earth lost all chlorophyll tomorrow, list 3 things that
         would break in 30 days."                                      [open input]
```

Notice: same concept, same 3 days, but the student is *climbing* not just consuming.

## What changes in the codebase

### Database (schema migration)
- New table `concept_rungs`:
  - `id`, `chapter_id (uuid)`, `episode_id (uuid)`, `concept_key text`, `subject text`
  - `rung_1_jsonb`, `rung_2_jsonb`, `rung_3_jsonb`, `rung_4_jsonb`, `rung_5_jsonb` — each holds `{prompt, type, options?, answer?, clothing}`
  - `source text` ('authored' | 'ai-generated')
  - `region text NULL` (for Rung 1–2 region variants)
  - `created_at`, `updated_at`
  - RLS: anyone authenticated can read; only service_role can insert/update
- New table `student_rung_state`:
  - `id`, `user_id`, `chapter_id`, `episode_id`, `concept_key`
  - `current_rung int`, `last_signal jsonb` (time, wrong_attempts, vibe-check answer)
  - `updated_at`
  - RLS: students manage own
- `profiles`: add nullable `region text`, `city text`

### Frontend
- `src/data/concepts/` — TS files with hand-authored Chapter 1 rungs for all 4 subjects (seed data; also inserted into `concept_rungs` via migration).
- `src/hooks/useConceptRungs.ts` — fetches/caches rungs for current concept; calls edge function on miss.
- `src/hooks/useRungPacing.ts` — reads `episode_interactions`, decides next rung, returns `{currentRung, shouldVibeCheck, climb(), repeat()}`.
- `src/components/episode/RungCard.tsx` — single component that renders any rung type (yes/no, MCQ, short-input, open-input). Replaces nothing; gets injected at the *top* of Day1Spark / Day2Build / Day3Master before the existing content.
- `src/components/episode/VibeCheck.tsx` — 3-emoji tap row, only renders when `shouldVibeCheck` is true.
- `src/components/onboarding/RegionStep.tsx` — optional region/city step in `StudentOnboarding`, with "Skip" link.
- `Day1Spark.tsx`, `Day2Build.tsx`, `Day3Master.tsx` — each gets a small header section that mounts `RungCard` for the day's assigned rung(s); existing content stays untouched below.

### Edge function
- `supabase/functions/generate-concept-rungs/index.ts` — accepts `{chapter_id, episode_id, concept_key, subject, region?}`, calls Lovable AI to produce all 5 rungs in one structured JSON call, writes to `concept_rungs`, returns the row. Idempotent.

### Existing systems — untouched
- Explorer / Builder / Master mode select stays exactly as is.
- All Pilot 1, Pilot 2, 7-layer HTML, textbook blocks, dashboards — unchanged.
- The ladder is purely additive on top of existing days.

## Telemetry (so we can see if it actually works)

Logged into existing `episode_interactions` with new `block_type`s:
- `rung_1_recognize` … `rung_5_apply`
- `vibe_check`

Teacher dashboard later can show: "What % of weak-tier students climbed past Rung 2 this week?" — but that's a follow-up.

## Out of scope for this pass
- Teacher-side "regenerate examples" button
- Per-class rung tuning
- Showing rung numbers/badges to students (we deliberately don't)
- Localization beyond Rung 1–2 flavor
- Authoring rungs for chapters beyond Ch1 (AI handles these on-demand)

## What I will build, in order
1. Migration: `concept_rungs`, `student_rung_state`, `profiles.region/city`
2. Seed: hand-authored Ch1 rungs for Maths/Physics/Chemistry/Biology
3. Edge function: `generate-concept-rungs`
4. Hooks: `useConceptRungs`, `useRungPacing`
5. UI: `RungCard`, `VibeCheck`, mount into Day1/Day2/Day3
6. Onboarding: optional region/city step
7. Smoke test: open a Ch1 episode, verify Rung 1 appears, climb works, vibe-check triggers on slow answer
8. Smoke test: open a non-Ch1 episode, verify AI generates and caches

Approve and I'll start with step 1.