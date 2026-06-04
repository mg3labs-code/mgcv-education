# Engagement Engine v2 — 4 features + a simulation

## A. 3-Interest onboarding (replace 1-pick gate)

Today the picker is shown the first time a student opens any pilot episode, single-select, stored in `localStorage`. Move it earlier and allow up to 3.

- New onboarding step right after signup: "Pick 3 worlds you like" — 10 tiles (🏏 Sports · 🍕 Food · 🚆 Travel · 🎮 Games · 💰 Money · 🎬 Movies · 🌿 Nature · 🚀 Space · 📱 Tech · 🏙 My City).
- Saved to `profiles.interests text[]` (new column, migration).
- Episode picks **interest #1** by default; the chip at the top lets the student switch to #2 or #3 for that episode only.
- Existing single-tile gate inside `TextbookEpisode` is removed (no more "before we start" wall).

## B. Pre-episode curiosity prompt

Before Day-1 Spark renders, show a one-screen card:
> "🏏 Quick thought before we start — what's the trickiest thing about *real numbers* in cricket you've ever wondered?"
> [text field, 80 chars max, **Skip** allowed]

- Stored in `curiosity_arc_progress.day1_first_thought` (column already exists).
- Mirrored back on Day-2 ("Yesterday you wondered: …") — this hook already exists, we just feed it.

The prompts come from a small bank keyed by `(interest, subject)` — 1 sentence each, written to be tricky-but-readable for Class 7+. Example bank for real-numbers:
- sports → "How can a team **win** a match but still have a **negative** run-rate?"
- food → "Why does 1000 ÷ 3 = ₹333.33 each but 3 × ₹333.33 ≠ ₹1000?"
- gaming → "Your FPS says 60. The GPU says 59.9404. Which one is lying?"
- tech → "Your battery shows 67% — the chip reports 66.842%. Why does the UI round?"
…and 6 more.

## C. Remove day-lock, open back-and-forth navigation

Currently Day-2 and Day-3 are gated on previous day completion. Per your direction: **all three days are reachable from the top tab at any time**. Student decides the order. Already-completed days keep their green tick; un-completed don't block.

Concrete change: in `StageTopbar` / day-toggle logic, drop the `disabled` flag based on completion. Persist `viewDay` regardless of progress.

## D. Weekly summary: "Did the interest engine help me?"

A new card on the student dashboard, shown once a week:

> **Your week with 🏏 cricket lens**
> · Episodes finished: 4 (vs 1.6 weekly avg before)
> · Day-2 recall accuracy: **78%** (vs 54% pre-interest)
> · Retention risk dropped from **High → Medium** on 3 concepts
> · Time-to-first-answer: **42 sec** (down from 1m 18s)
> _"You're thinking faster when the question comes from cricket."_

Data sources already in DB:
- `episode_progress.layer_scores` → day-completion flags + explain scores
- `episode_interactions.time_spent_seconds`, `correct_on_first_try`
- `retention_predictions.risk_level`
- `profiles.interests` (new) tells us the cutover date

Implementation: one read-only RPC `get_weekly_interest_summary(_user_id, _interest_tag)` that returns the 4 numbers + pre/post comparison. Card calls it; no new tables, no edge function.

## E. Simulate 10 hybrid students end-to-end (verification, not feature)

After A–D are wired, run a Node script via `code--exec`:
1. Create 10 dummy auth users via service-role key.
2. For each: pick 1–3 random interests from the 10 → fill `profiles.interests`.
3. Walk them through: login → onboarding → pick interest → curiosity prompt → Day-1 (detective + sort) → Day-2 (recall + explain) → Day-3 (case + teach-back), in random order (since lock is gone).
4. Write fake answers (50% correct, 50% wrong) into `episode_interactions` and `episode_progress`.
5. At the end, query `retention_predictions` + the new weekly-summary RPC to confirm numbers flow.
6. Print a pass/fail table per student.

This is a script run, not committed code — output goes to console.

---

## Build order this turn

1. Migration: `profiles.interests text[]` + `get_weekly_interest_summary` RPC.
2. Onboarding step + 10-tile picker.
3. Pre-episode curiosity prompt component + interest×subject prompt bank.
4. Remove day-lock in StageTopbar / Day-router.
5. Weekly summary card on dashboard.
6. Run the 10-student simulation script and show results.

Step 1 needs your approval (migration tool). Everything else is frontend + 1 edge-case-free RPC.

---

## One thing I want to lock before I build

When the student opens an episode, should I auto-pick interest #1 from their 3-list, or show a tiny "Today's lens: 🏏 Cricket [swap]" pill and let them choose every time? **Default: auto-pick #1 with a "swap" pill** — fewer taps. Tell me if you want the explicit picker instead.
