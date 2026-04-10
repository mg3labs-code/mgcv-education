

## Review: What's Built vs What's Missing

### Already Built (Working)
1. **Section Celebration** — Center-screen animated celebration (Nailed it!, On fire!, etc.) with confetti burst after each section. Auto-dismisses after 1.4s.
2. **Comprehension Check** — "What did you understand?" prompt on first visit to content blocks (concept, reasoning, connections, implications). AI evaluates via `inline-evaluate`. If wrong, asks to revise. Skip available after 1 attempt. Subsequent visits skip it.
3. **Fun Loading Transition** — Full-screen loading with bouncing runner emoji, floating subject icons, progress bar, and rotating tips. Replaces skeleton loader.
4. **"Nailed it" button removed** — Bottom bar now has Continue/Finish buttons that trigger celebration before advancing.
5. **Section time tracking** — `sectionTimings` state tracks seconds spent per block.
6. **Visited blocks** — Persisted to `localStorage` per episode.

### What's Missing / Incomplete

| # | Gap | Detail |
|---|-----|--------|
| 1 | **Timing data never saved to DB** | `sectionTimings` is in React state only — lost on page close. Never persisted to `episode_progress` or any table. |
| 2 | **No micro-pattern tracking** | Wrong answer counts, retry behavior, hesitation time, comprehension check results — none tracked. You mentioned 47 micro-patterns; none are captured yet. |
| 3 | **No database table for interaction analytics** | No `episode_interactions` or similar table exists to store per-block behavioral data (time, errors, retries, state-of-mind signals). |
| 4 | **Activity blocks don't report wrong attempts** | Activity/Assessment/Recall blocks call `onComplete` but don't report *how many wrong*, *time to first correct*, or *retry count*. |
| 5 | **Loading transition could be lighter** | Current one uses `framer-motion` with 8 floating emojis + infinite animations. Could be optimized if app feels slow. |

### Plan to Fix

**Step 1 — Create `episode_interactions` table**
Store per-block interaction data: `user_id`, `chapter_id`, `episode_id`, `block_index`, `block_type`, `time_spent_seconds`, `wrong_attempts`, `correct_on_first_try`, `comprehension_result` (pass/revise/skip), `comprehension_attempts`, `completed_at`. This enables Inner OS analysis.

**Step 2 — Persist timing + behavior data on section advance**
When `advanceWithCelebration` fires (or on page unload), upsert the current block's timing and interaction data to `episode_interactions`.

**Step 3 — Add wrong-attempt tracking to activity blocks**
Update `EpisodeBlocks.tsx` — `ActivityBlock`, `AssessmentBlock`, `RecallBlock` to accept and call an `onWrongAttempt` callback. Track wrong count in `TextbookEpisode.tsx` state, persist alongside timing.

**Step 4 — Save comprehension check results**
Update `ComprehensionCheck` to report pass/revise/skip + attempt count back to parent. Parent persists to `episode_interactions`.

**Step 5 — Optimize loading transition**
Reduce floating emojis from 8 to 4, use CSS animations instead of framer-motion for the simple bits, ensure transition completes when data arrives (not stuck at 95%).

