# Two engagement features — one for students, one for teachers

Both unlock the "real-world hook" promise across the whole product, not just one chapter.

---

## Feature 1 — Interest → Curiosity Engine (student-facing)

### What the student experiences

**Step A — One-time interest picker (on first login, after onboarding)**
A clean 8-tile grid (matches your `interest_to_curiosity_engine.html`):
🏏 Cricket · 🍔 Food · 🎬 Movies · 🎮 Gaming · 🎵 Music · ✈️ Travel · 💻 Tech · 🌧 Nature
Multi-select up to 3. Saved to `profiles.interest_tag` (already exists) — extended to `profiles.interests text[]` (array) so multiple stick.

**Step B — Every Day-1 hook now reframes through their top interest**
Example, real numbers chapter:
- Cricket kid sees: "A team flew to World Cup semis without playing their last match. A decimal that never ends decided it…"
- Food kid sees: "Bill ₹1000 split 3 ways = ₹333.33… each. Where's the extra paisa?"
- Music kid sees: "Tuner A says 120.000 BPM. Tuner B says 119.9999987… BPM. Both right. How?"
- Gaming kid sees: "Your FPS counter shows 60.0 — but the game engine actually runs at 59.9404… How do GPUs round?"

The 3-day arc plumbing already supports this (`getPilotInterestOverride`). I'll expand the override bank from 1 chapter × 4 interests to **all chapters × 8 interests** using the same subject-aware factory you just approved.

**Step C — "Why this hook?" chip on every screen**
A small pill at top: `🏏 Cricket lens · change`. One tap = pick a different interest for this episode only. Keeps the kid in control.

### Schema change (1 migration)
```
ALTER TABLE profiles ADD COLUMN interests text[] DEFAULT '{}';
-- keep interest_tag for back-compat (primary interest)
```

### Files
- `src/components/onboarding/InterestPicker.tsx` (new — 8-tile grid)
- `src/data/interestOverrides.ts` (new — bank of 8 interests × N chapters, with the cricket-HTML pattern)
- `src/components/episode/InterestChip.tsx` (new — "lens" switcher at top of episode)
- Wire into existing `Day1Spark` / `Day2Build` / `Day3Master` via the override hook that's already there.

---

## Feature 2 — Misconception Clusters (teacher-facing)

### What the teacher sees

A new card on the Teacher Dashboard: **"Common misconceptions this week"**.

Example:
> 📐 Real Numbers · Class 10-B
> **18 of 32 students** wrote variations of *"0.999… is close to 1 but not equal"*
> AI-clustered from submitted answers · [Re-explain this to class] [See exact answers]

When clicked → opens a "Re-teach in 90 seconds" panel with:
- The misconception in plain words
- The one-line fix (pre-written by AI)
- A 30-sec voice script the teacher can read out
- "Push as a quick recap to all 18 students" button (creates a `teacher_alert` on each affected student's home)

### How clustering works

Cron-style edge function `cluster-misconceptions` runs nightly:
1. Pulls last 7 days of `student_answers` where `ai_feedback->>'is_wrong' = true`
2. Groups by `(assignment.subject, question_id)`
3. For each group with ≥3 wrong answers, calls Lovable AI with all answer texts → returns up to 3 clusters with `{cluster_name, count, sample_quotes[], one_line_fix, reteach_script}`
4. Inserts into a new `misconception_clusters` table

### Schema (1 migration)
```
CREATE TABLE misconception_clusters (
  id uuid PK, teacher_id uuid, class_name text, subject text,
  chapter_id text, episode_id text, concept_label text,
  cluster_name text, student_count int, sample_quotes jsonb,
  one_line_fix text, reteach_script text,
  affected_student_ids uuid[], detected_at timestamptz,
  is_resolved bool default false
);
-- + GRANTs + RLS scoped to teacher_id = auth.uid()
```

### Files
- `supabase/migrations/...sql` (table + RLS + GRANTs)
- `supabase/functions/cluster-misconceptions/index.ts` (nightly clusterer)
- `src/components/teacher/MisconceptionClusters.tsx` (new card)
- `src/pages/TeacherDashboard.tsx` (add the card)
- "Push recap" button → reuses existing `teacher_alerts` table

---

## Build order (so you see value fast)

1. **Interest picker + chip** (front-end only, 1 file each) — instant visible change
2. **Expand the interest override bank** from 1 chapter → all current pilot chapters
3. **Misconception table + RLS migration**
4. **Clusterer edge function + teacher card**
5. **"Push re-explain to students" wire-up**

Step 1+2 ship together as "Interest Engine v1". Steps 3-5 ship as "Misconception Radar v1".

---

## Two quick decisions I need from you before I start

1. **Interest picker — when?** (a) Right after signup, mandatory · (b) Optional, dismissible card on dashboard · (c) Shown the first time they open ANY episode
2. **Misconception re-explain — where does it land for the student?** (a) A red banner on their dashboard "Your teacher noticed something — quick fix" · (b) Auto-injected as Day-2 recall when they next open that episode · (c) Both
