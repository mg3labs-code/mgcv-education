

# Streamline Attraction Demo: Shorter, Smarter Flow

## Problem
The current 6-phase flow (Hook → Bridge → Ground → Branch → Apply → Advance) is too long and deep. Students — especially grades 6-8 — will lose focus or deviate before reaching the curriculum connection. The "3-reply patience rule" in Phase 1 alone means 3+ exchanges before anything meaningful happens.

## Key Insight
The goal is to **hook and connect fast** while still feeling natural. Not every student needs all 6 phases. The AI should read the student's energy and skip/merge phases when appropriate.

## Changes to the System Prompt (both `attraction-flow/index.ts` and `sarvam-voice-relay/index.ts`)

### 1. Compress 6 phases → 4 phases
- **Phase 1: CONNECT** (was Hook) — 1-2 replies max. Find their interest, react with excitement. One curious question, move on.
- **Phase 2: BRIDGE** (was Bridge + Ground merged) — Connect their interest to a concept in 1-2 replies. Reveal the textbook link immediately after explaining in simple words. No separate "Ground" phase.
- **Phase 3: EXPLORE** (was Branch + Apply merged) — Check understanding AND give a fun problem in the same flow. Adapt: challenge strong students, guide weak ones.
- **Phase 4: WOW** (was Advance) — One "mind-blown" cross-domain connection + motivation. Quick exit.

### 2. Reduce patience rule from 3 replies → 1-2 replies
- Reply 1: React with excitement, ask ONE follow-up about their interest
- Reply 2: Already start bridging — "Oh that is so cool! You know WHY that happens?"
- No more mandatory 3 exchanges of pure curiosity

### 3. Add smart shortcuts
- If student gives a detailed answer → skip ahead (e.g., jump from Phase 1 to Phase 3)
- If student seems bored or gives short answers → compress and wrap up faster
- If student is already engaged and curious → spend more time, don't rush
- Add explicit instruction: "The WHOLE conversation should be 8-12 exchanges total, not more"

### 4. Add escape/wrap-up logic
- If student deviates (talks about something unrelated), gently steer back once, then pivot to their new interest
- After 12+ exchanges, start wrapping up regardless of phase
- End every session with a clear takeaway: "Today you figured out [X] through [their interest]!"

## Updated Phase Bar (Frontend)
Update `PHASES` array from 6 → 4 items to match new compressed flow. Update phase tag parsing accordingly.

### UI Changes in `AttractionDemo.tsx`
- Update `PHASES` constant: 4 phases instead of 6
- Update `stripPhaseTag` to handle `[PHASE:1]` through `[PHASE:4]`
- No other UI changes needed

## Files to Change

| File | Change |
|---|---|
| `supabase/functions/attraction-flow/index.ts` | Rewrite SYSTEM_PROMPT with 4-phase compressed flow, reduced patience rule, smart shortcuts, wrap-up logic |
| `supabase/functions/sarvam-voice-relay/index.ts` | Same prompt changes for voice version |
| `src/pages/AttractionDemo.tsx` | Update PHASES array from 6 → 4 phases with new labels/icons |

