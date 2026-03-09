

# Comparison: Current App vs HTML Reference

## Verdict: The HTML is better for students. Here's why.

### Current App Problems
1. **11 separate blocks shown one-at-a-time** with pill navigation — student sees tiny fragments, loses the big picture
2. **Too many UI elements**: progress bar + percentage + pill row + block header + icon + label + "block type" subtitle — visual overload
3. **Each layer feels disconnected** — clicking through 11 pills feels like a chore, not a learning journey
4. **No visual hierarchy between layers** — Layer 1 (basic definition) looks identical to Layer 7 (deep reflection). No color differentiation, no sense of progression

### HTML Reference Strengths
1. **Single scrollable page** — all 7 layers visible in one flow, student scrolls naturally like reading a textbook
2. **Color-coded layers** — Layer 3 is warm yellow, Layer 4 is blue, Layer 5 is green, Layer 7 is indigo. Student instantly sees "I'm going deeper"
3. **Minimal chrome** — no pill navigation, no block counters, no "block type" labels cluttering the UI
4. **Completion actions at the bottom** — natural endpoint with 3 clear cards (Tutorial Defense, First Principles, Dashboard)
5. **Everything feels like ONE episode**, not 11 disconnected screens

## Plan: Rebuild TextbookEpisode as a Single Scrollable Page

### Design Approach
Replace the one-block-at-a-time stepper with a **single scrollable page** showing all blocks in sequence. Keep the existing block renderers but wrap them in a continuous layout with:

- **Layer number badges** (LAYER 1, LAYER 2, etc.) with color-coded backgrounds
- **Smooth scroll** with a floating progress indicator (thin bar at top)
- **Completion actions section** at the bottom (3 cards: Tutorial Defense, First Principles, View Growth)
- **Sticky top bar** with episode title + back button only

### Changes in `src/pages/TextbookEpisode.tsx`

1. **Remove** the `currentBlock` state and one-at-a-time rendering
2. **Remove** the pill navigation row
3. **Render ALL blocks** in a vertical scroll layout with `episode.blocks.map()`
4. **Add layer colors**: Map block types to background tints:
   - `concept`, `activity` → white (Layers 1-2)
   - `reasoning` → warm amber bg (`bg-amber-50`)
   - `assumptions` → sky blue bg (`bg-sky-50`)
   - `connections` → green bg (`bg-emerald-50`)
   - `application` → warm amber bg (`bg-amber-50`)
   - `implications` → indigo bg (`bg-indigo-50`)
   - `recall`, `explain`, `assessment`, `exercise` → white
5. **Add layer number badges** for layers 3-7 (the NEW blocks) — small colored badge saying "LAYER 3 · Reasoning"
6. **Replace bottom navigation** (Previous/Next buttons) with a **Completion Actions** section: 3 cards (Tutorial Defense, First Principles, Continue to Next Episode)
7. **Add scroll-based progress**: thin progress bar at top of page that fills as user scrolls down
8. **Keep** all existing block renderer components unchanged — they work fine

### What Gets Simpler
- No state management for `currentBlock`
- No pill navigation to maintain
- No Previous/Next button logic
- Student just scrolls — natural, familiar, zero learning curve

### What Stays the Same
- All 11 block renderers (ConceptBlock, ActivityBlock, etc.) — untouched
- TutorialDefenseModal and FirstPrinciplesModal — untouched
- Data model in textbookData.ts — untouched
- All other pages — untouched

### File Changes

| File | Change |
|---|---|
| `src/pages/TextbookEpisode.tsx` | Rewrite layout from stepper → scrollable page with color-coded sections and completion actions |

One file change. All block components reused as-is.

