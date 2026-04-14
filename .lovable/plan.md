

# Progressive Disclosure Implementation Plan

## Overview
Transform the student experience from time-based unlocks to **behavior-driven progressive disclosure** across 3 systems: behavioral dashboard phases, textbook phase locking, and guided discovery toasts.

---

## Step 1: Database Migration
Add `milestones_seen` JSONB column to `student_preferences` table to track which discovery moments have fired (persists across devices).

```sql
ALTER TABLE public.student_preferences 
ADD COLUMN IF NOT EXISTS milestones_seen jsonb DEFAULT '{}'::jsonb;
```

---

## Step 2: Behavioral Dashboard Phases (StudentDashboard.tsx)

**Current** (lines 461-467): Uses `accountAgeDays` for phases 3 & 4.

**New logic:**
- Phase 1: Default (< 3 episodes)
- Phase 2: `eps >= 3` (Inner OS unlocks) — already correct
- Phase 3: `eps >= 5 AND hasUsedScholarMethod` (Scholar Methods unlock)
- Phase 4: `eps >= 10 AND streakDays >= 5` (Hero Inner OS)

Add a query to `method_sessions` to check `hasUsedScholarMethod` (any completed session where `method_type` is `defense` or `first_principles`).

Update locked placeholder text:
- "Your Learning Strengths" → "Complete 3 episodes to unlock" (already correct)
- "Think Like a Scholar" → "Complete 5 episodes & try a Scholar Method to unlock"

---

## Step 3: Textbook 3-Phase Locking (TextbookEpisode.tsx)

**Current** (line 232): `isBlockLocked` always returns `false`.

**New logic:**
- **Understand phase** blocks: Always unlocked
- **Prove phase** blocks: Locked until ALL Understand blocks are marked understood
- **Master phase** blocks: Locked until ALL Prove blocks are marked understood
- **JEE phase** blocks: Follow Master phase unlock (locked until Master is available)

Implementation:
1. Compute `understandIndices` and `proveIndices` from `phaseIndices`
2. Check `understoodBlocks` set against these indices
3. Show lock icon + toast "Complete all Understand sections first 🔒" when tapping locked block
4. Fire a one-time unlock toast when a phase transitions: "🎯 Test Yourself unlocked!" and "🚀 Challenge Yourself unlocked!"

---

## Step 4: Discovery Toasts Hook (new: src/hooks/useDiscoveryToasts.ts)

A hook that reads milestones from `student_preferences.milestones_seen` and fires one-time toasts based on behavioral triggers:

| Milestone Key | Trigger | Toast Message |
|---|---|---|
| `first_episode` | `episodeCount >= 1` | "🔥 1 day streak! Keep going tomorrow" |
| `inner_os_unlocked` | `episodeCount >= 3` | "📊 Your Learning Strengths are ready!" |
| `first_assignment` | First submission exists | "✅ Your teacher can see your work now" |
| `scholar_unlocked` | `episodeCount >= 5 && hasUsedMethod` | "🎓 Scholar Methods unlocked!" |
| `growth_ready` | `streakDays >= 7` | "📈 My Growth is ready — see your week!" |

After firing, mark the milestone in the DB so it never fires again.

---

## Step 5: Streak Badge in TopNavbar

Add `🔥 {streakDays}` badge in the student navbar (next to the existing streak badge area, line ~130 of TopNavbar.tsx). Only show when `streakDays >= 1`. Currently there's a static "🔥" badge at phase >= 3 — change to show actual streak count and display from phase >= 1 once `streakDays >= 1`.

---

## Step 6: Phase Transition Animations (StudentDashboard.tsx)

When Inner OS transitions from locked placeholder to visible card (phase 1→2), add a one-time scale-up + glow CSS animation. Track in localStorage whether the user has seen the "unlock" animation to avoid replaying it.

---

## Files Modified

1. **Migration** — Add `milestones_seen` column
2. **`src/pages/StudentDashboard.tsx`** — Behavioral phase logic, method_sessions query, updated placeholder text
3. **`src/pages/TextbookEpisode.tsx`** — `isBlockLocked` with real phase locking logic, unlock toasts
4. **`src/hooks/useDiscoveryToasts.ts`** — New hook for milestone-based one-time toasts
5. **`src/components/TopNavbar.tsx`** — Dynamic streak badge with count
6. **`src/integrations/supabase/types.ts`** — Will auto-update after migration

## Priority Order
1. Textbook phase locking (biggest learning impact)
2. Behavioral dashboard phases
3. Discovery toasts + streak badge
4. Phase transition animations

