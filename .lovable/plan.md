

# Fix & Complete Elite Methods + Seed 2 Episodes Per Subject

## Critical Bug: Edge Functions Broken

Both `tutorial-defense` and `first-principles` edge functions use `GEMINI_API_KEY` which **does not exist** in secrets. They will always fail and fall back to hardcoded responses. Must switch to Lovable AI gateway (`LOVABLE_API_KEY`).

## Current State

| Item | Status |
|---|---|
| Tutorial Defense modal | UI works, but AI calls fail (no GEMINI_API_KEY). No scoring, no session tracking, no brainstorming mode |
| First Principles modal | UI works, but AI calls fail. 3-step flow exists but no confidence indicators, no simplified reasoning prompts |
| Math Ch1 Ep1 | 11 content blocks in DB |
| Math Ch1 Eps 2-7 | Metadata exists, 0 content blocks |
| Other 6 subjects | Chapter metadata exists, 0 episodes, 0 blocks |

## Plan (4 parts)

### Part 1: Fix Edge Functions — Switch to Lovable AI Gateway

**`supabase/functions/tutorial-defense/index.ts`** — Rewrite to use `LOVABLE_API_KEY` + `ai.gateway.lovable.dev`. Enhance the system prompt to be more brainstorming-style: challenge with small confidence-building cross-questions, give hints when stuck, celebrate small wins, track exchange count and auto-wrap-up with a score/summary after 6 rounds. Support all subjects (not just "mathematics").

**`supabase/functions/first-principles/index.ts`** — Rewrite to use Lovable AI gateway. Make feedback more simplified: short confidence-building nudges, small reasoning cross-questions ("achha, but what if..."), celebrate effort.

### Part 2: Enhance Tutorial Defense Modal

- Add exchange counter (show "Round 3/6")
- Add confidence meter that fills as student answers well
- Add "Hint" button for when student is stuck
- After final round: show score summary card (what you defended well, areas to explore more)
- Track session in `method_sessions` table on completion
- Make it brainstorming-style: tutor acknowledges good points, builds on them, then pushes one step deeper

### Part 3: Enhance First Principles Modal

- Add micro-encouragement between steps ("You're thinking like a scientist!")
- Add quick confidence-check after each step (thumbs up/down: "Did this feel clear?")
- Simplify step instructions to Grade 4-5 language
- Track session in `method_sessions` table on completion
- After completion: show a "Your rebuilt understanding" summary card

### Part 4: Seed 2 Episodes Per Subject with Full 11-Block Content

Insert episode metadata + use `generate-chapter-content` edge function to generate all 11 blocks per episode. Episodes to create:

| Subject | Ep1 | Ep2 |
|---|---|---|
| Mathematics (already has 7 eps) | Generate blocks for Ep2 "The Bee Puzzle & Division Algorithm" | Generate blocks for Ep3 "Euclid's Algorithm for HCF" |
| Physics — Heat | "What is Heat?" (Concept) | "Temperature vs Heat" (Concept) |
| Chemistry — Chemical Reactions | "What is a Chemical Reaction?" (Concept) | "Writing Chemical Equations" (Concept) |
| Biology — Nutrition | "What is Nutrition?" (Concept) | "Photosynthesis" (Concept) |
| English — A Letter to God | "Story Introduction" (Concept) | "Character Analysis — Lencho" (Deep Dive) |
| Telugu — తెలుగు భాష చరిత్ర | "తెలుగు భాష పుట్టుక" (Concept) | "భాష వికాసం" (Concept) |
| Social Studies — Indian National Movement | "Rise of Indian Nationalism" (Concept) | "Gandhian Era" (Deep Dive) |

For Math: Eps 2-3 already have metadata — just need content generation.
For other 6 subjects: Insert 2 episodes each (12 total), then generate content.

**Total**: 14 episodes × 11 blocks = 154 content blocks to generate.

## Files Changed

| File | Change |
|---|---|
| `supabase/functions/tutorial-defense/index.ts` | Rewrite: Lovable AI gateway, brainstorming style, subject-agnostic, exchange tracking |
| `supabase/functions/first-principles/index.ts` | Rewrite: Lovable AI gateway, simplified reasoning, confidence nudges |
| `src/components/textbook/TutorialDefenseModal.tsx` | Add round counter, confidence meter, hint button, score summary, method_sessions tracking |
| `src/components/textbook/FirstPrinciplesModal.tsx` | Add encouragement, confidence checks, summary card, method_sessions tracking |
| SQL INSERT | 12 new episodes (2 per non-Math subject) |
| Edge function call | Trigger `generate-chapter-content` for 14 episodes |

