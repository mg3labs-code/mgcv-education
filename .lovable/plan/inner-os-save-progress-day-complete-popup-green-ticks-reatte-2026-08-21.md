# Inner OS: save progress, day-complete popup, green ticks + reattempt

Right now everything in `/student/inner-os` lives in React state only: finishing a module, XP and day unlocks all vanish on refresh, and there is no completion popup. This plan adds persistence and the completion signals you asked for.

## What the student will see

1. **Finish a session** — the last card's "Finish Session" now saves to the backend and shows a green tick on that module in the left path (already styled as "Completed").
2. **Finish the last module of a day** — a celebration popup appears: "Day 1 complete!" with the day's blurb, XP earned, what unlocks next (Day 2 · Build), and two buttons: "Continue to Day 2" and "Close".
3. **Return later** — progress is restored from the backend, so completed modules keep their green tick, XP and streak counts are correct, and the next unlocked day is where you left off.
4. **Chapter/journey list** — each journey chip (Algebraic Identities, Number Systems) shows a green tick when all its modules are done, plus a small "Reattempt" button next to it that clears that journey's saved progress and restarts it from Day 1 module 1 (after a confirm dialog). Individual completed modules in the path also get a small reattempt affordance so a single session can be redone without wiping the journey.

## Technical approach

- **Storage**: reuse the existing `episode_progress` table (no schema change). One row per module: `chapter_id = "inneros:<journeyId>"`, `episode_id = <module.id>`, `completion_pct`, `completed_at`, and `layer_scores` holding `{ day, steps_done, xp }`. This table already has RLS scoped to the signed-in user, so no policy work is needed.
- **New hook** `src/hooks/useInnerOSProgress.ts`:
  - loads all `inneros:*` rows for the user (React Query, keyed by user + journey),
  - `completeModule(journeyId, module, xp)` upserts a row with `completion_pct: 100`,
  - `resetJourney(journeyId)` and `resetModule(...)` delete the matching rows,
  - exposes `doneModuleIds: Set<string>`, `xp` (sum of saved XP), and per-journey done counts for the chips.
- **`src/pages/StudentInnerOS.tsx`**: replace the local `completed`/`xp` state with hook-backed values (keep optimistic local state so the UI stays instant), call `completeModule` inside `advance()` when the module finishes, and detect "last module of this day just completed" to open the popup.
- **New component** `src/components/inner-os/DayCompleteModal.tsx`: styled with the existing `ios-*` design tokens (card, 3D button) so it matches the Kitchen Manager theme — no new colors hardcoded.
- **Left panel**: green tick already rendered for `done` status; add a `Reattempt` ghost button on done modules and on journey chips, wired to the reset mutations.
- Day-unlock logic (`dayUnlocked`) keeps working unchanged because it reads from the same module-done set.

## Notes

- Progress only saves for signed-in students; the route is already behind `ProtectedRoute`.
- Nothing in the question content, steps, or wording changes.
