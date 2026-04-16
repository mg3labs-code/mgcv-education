

# Plan: Textbook Episode — Multi-Fix (FlipReveal, Progress, Quiz Placement, Dedup)

The user raised ~8 issues in their previous message. This plan addresses all of them in a single implementation pass.

## Issues & Fixes

### 1. FlipRevealCard: Move after first section, not at top
**Current**: FlipRevealCard renders BEFORE the block content (line 861–874 in TextbookEpisode.tsx).
**Fix**: Move it AFTER the first `<section>` inside ConceptBlock, or more practically, render it AFTER the content `<div>` (line 876) instead of before it. This places the visual breakdown after the student reads the first section of the concept.

### 2. FlipRevealCard: Auto-flip back after 4 seconds
**Current**: Card stays flipped until manually clicked.
**Fix**: In `FlipRevealCard.tsx`, add a `useEffect` that sets a 4-second timer when `flipped` becomes `true`, then auto-sets `flipped = false`. Reset timer if user interacts.

### 3. Duplicate defense prompts (orange Assumptions + green ComprehensionCheck)
**Current**: Both `AssumptionsBlock` (with "Challenge your assumptions" orange prompt) AND `SectionQuizGate`/`ComprehensionCheck` (green "What did you understand?") appear for `assumptions` type blocks since `CONTENT_TYPES` includes it.
**Fix**: Remove `"assumptions"` from `CONTENT_TYPES` set (line 503). Assumptions blocks already have their own interactive defense mechanism — they don't need ComprehensionCheck on top.

### 4. Progress not saved / sections look fresh on revisit
**Current**: `understoodBlocks` loads from DB on mount (line 312–328), but `blockCompleted` and `visitedBlocks` reset on every mount. When navigating back, interactive blocks appear unfinished.
**Fix**: 
- Persist `blockCompleted` alongside `understoodBlocks` in `layer_scores` JSON (add `completed` array).
- On load, restore `blockCompleted` from DB.
- Also restore `visitedBlocks` from localStorage (already partially done via `visited_blocks_*` key, but `isFirstVisitToBlock` logic needs to also check `understoodBlocks`).

### 5. Icon Quiz placement — should be in sections 5-11, not section 1
**Current**: `SectionQuizGate` renders for ALL `CONTENT_TYPES` blocks (`concept`, `reasoning`, `connections`, `implications`), including the very first concept block.
**Fix**: Only show `SectionQuizGate` quiz game when `activeBlock >= 4` (5th section onwards). For blocks 0-3, show only `ComprehensionCheck` directly. This ensures the quiz appears in the harder middle/later sections where it helps simplify complexity.

### 6. Duplicate/repetitive quiz questions in same episode
**Current**: Each block independently fetches quiz from `reasoning_visuals` by slug. Multiple concept blocks in the same episode can show similar quizzes.
**Fix**: In `SectionQuizGate`, track which quizzes have been shown in the episode via a Set passed as prop or context. If quiz slug was already used, skip to ComprehensionCheck directly.

### 7. JEE mini text not displaying
**Current**: Need to check `JeeExtensionBlock` rendering — likely a content structure mismatch.
**Fix**: Will inspect and fix the content access pattern in JeeExtensionBlock to handle both `sections` array and flat content shapes.

### 8. Time spent per page not persisted
**Current**: `sectionTimings` resets on remount. `persistInteraction` is called only on advance.
**Fix**: Also call `persistInteraction` on component unmount (cleanup effect) for the current active block, so partial time is saved even if the student exits mid-section.

## Files to Change

| File | Changes |
|------|---------|
| `src/components/textbook/FlipRevealCard.tsx` | Add 4s auto-flip-back timer |
| `src/pages/TextbookEpisode.tsx` | Move FlipRevealCard after content; remove `assumptions` from CONTENT_TYPES; gate quiz to blocks 5+; persist blockCompleted; save time on unmount; pass shown-quiz tracking |
| `src/components/textbook/SectionQuizGate.tsx` | Accept `shownSlugs` prop to skip duplicate quizzes; skip quiz if block index < 5 |
| `src/components/textbook/JeeExtensionBlock.tsx` | Fix content rendering for edge cases |

## Not changing
- ComprehensionCheck component itself — stays intact
- Content generation or text complexity — that's a separate content pipeline task
- Math template differences — requires separate audit

