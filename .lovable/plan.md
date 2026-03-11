

# Restore Layer 1 & 2 Badges + Drag-Drop Activity + Better Typography & Theme

## Summary

Three changes in one pass:

1. **Restore Layer 1 (Definition) & Layer 2 (Mechanism) badges** with proper color coding — the content already fits the vision (Layer 1 = simplified definitions, Layer 2 = step-by-step classification process = mechanism)
2. **Convert Activity block to real drag-and-drop** — draggable number chips into category drop zones (N, W, Z, Q) with validation feedback, replacing the current textarea
3. **Upgrade typography, spacing, and color theme** for long-term reading comfort — larger fonts, serif headings, warm cream backgrounds, colored left-border accents

## Changes

### File: `src/pages/TextbookEpisode.tsx`

**Layer badges restored:**
- `concept` → `LAYER 1 · Definition` with violet badge/background (`bg-violet-50`)
- `activity` → `LAYER 2 · Mechanism` with rose badge/background (`bg-rose-50`)
- Remove the `CORE_BLOCKS` / `DEEP_BLOCKS` split logic — ALL blocks now get their layer badge and color
- Keep Layers 3–7 as they are
- Keep the "Deep Mastery" divider before Layer 3

**ActivityBlock rewrite — real drag-and-drop:**
- Render number chips as draggable elements (`draggable="true"`, `onDragStart`)
- Render 4 drop zones (N, W, Z, Q) with `onDragOver`/`onDrop` handlers
- Track placed items per category in state
- On drop: validate against `item.categories` — show green border if correct, red if wrong
- Items can be dragged to multiple zones (numbers can belong to multiple sets)
- "Reset" button to clear placements

**Typography & theme upgrade:**
- Episode title: `text-xl` → `text-2xl font-serif`
- Block titles: add `font-serif`
- Body text in sections: `text-sm` → `text-base leading-relaxed`
- Page wrapper: add `bg-[#faf9f7]` warm cream background
- Concept sections: add `border-l-4 border-blue-400` accent style
- Formula boxes: centered, larger mono font
- All blocks: softer rounded cards with gentle color tints matching their layer

**Top action bar (from screenshot):**
- Add pill buttons below the sticky header: MINDMAP, PRACTICE, Q BANK, SEARCH
- Styled as small gradient-tinted rounded pills
- PRACTICE scrolls to the activity block; others are placeholder buttons for now

### No data changes needed

The current `concept` block content works as Layer 1 (simplified definitions per number type) and the `activity` block content works as Layer 2 (mechanism = "how do you classify a number?" via drag-and-drop process). No changes to `textbookData.ts`.

