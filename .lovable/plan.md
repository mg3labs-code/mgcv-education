

# Transform TextbookEpisode into Immersive Module Mode

## Design Philosophy — How Elite Teams Build This

Top 1% learning apps (Coursera, Duolingo, Brilliant, Khan Academy) follow one rule: **content IS the screen**. Everything else is hidden until needed. The current page has ~10 layers of chrome before content starts. Elite designers would:

- **Kill the shell**: No app header, no breadcrumbs, no sidebar. The lesson owns the viewport.
- **Thin progress**: A single line — close button + segmented dots + counter. Nothing else.
- **Bottom sheet for navigation**: Sections accessible via swipe/tap, not a persistent sidebar.
- **Tools on demand**: Hidden behind a "⋯" button, not always visible.
- **Exit with intent**: Close button triggers confirmation ("Leave? Progress saved.").

```text
CURRENT (10 layers before content):          IMMERSIVE (content at line 3):
┌──────────────────────────┐                ┌──────────────────────────┐
│ PageLayout header/nav    │                │ ✕  ■■■□□□□□□□□   3/11   │
│ Breadcrumb trail         │                │ 🔍 Discover • Read      │
│ Scroll progress bar      │                │                          │
│ ☰ Sections + phase nav   │                │ The Number Family        │
│ 3/11 progress + Tools    │                │                          │
│ ┌── Gradient header ──┐  │                │ 🔢 Counting Numbers...   │
│ │ ← Real Numbers 8min │  │                │ N = {1, 2, 3, ...}      │
│ │ Number Types & ...   │  │                │                          │
│ └─────────────────────┘  │                │ 📖 See textbook text ▼  │
│ Stats: 11 | 11 | 8min   │                ├──────────────────────────┤
│ Phase: 🔍 Discover       │                │ ☰  ←Prev  ⋯  [Got it✓] │
│ Section card with icon   │                │            Continue →    │
├──────────────────────────┤                └──────────────────────────┘
│ CONTENT (finally!)       │
└──────────────────────────┘
```

## What Changes

### File: `src/pages/TextbookEpisode.tsx`

**1. Remove outer shell**
- Remove `<PageLayout>` wrapper entirely
- Remove breadcrumbs, scroll progress bar
- Render a `position: fixed; inset: 0` full-screen container with `#F9FAFB` background
- Content area: `max-width: 720px`, centered, `overflow-y: auto`

**2. New top bar (single line)**
- Left: `✕` close button (triggers exit confirmation modal)
- Center: segmented progress dots — one per block, filled = completed, highlighted = current
- Right: `3/11` counter text
- Height: ~44px total

**3. Phase indicator (tiny badge)**
- One line below top bar: `🔍 Discover • Read` — phase icon + label + block type
- No background card, just inline text, 12px font

**4. Content area**
- Section title + subtitle as plain headings (no card wrapper for the header)
- Existing `renderBlock()` renders the block content directly
- Add collapsible "📖 See original textbook text" toggle at bottom of each block (purple border, inline expand)
- Keep the "Got it! ✓" checkpoint gating logic (Continue disabled until marked)

**5. Bottom bar (fixed)**
- Left: `☰` button → opens sections bottom sheet
- Center: `← Prev` + `⋯` tools popup
- Right: `Got it! ✓` button + `Continue →` (gated)
- Fixed to bottom, white background, border-top

**6. Sections → bottom sheet (replaces sidebar)**
- Convert current left sidebar into a bottom sheet overlay
- Slides up from bottom with backdrop
- Shows: progress bar, phase groups with section buttons, "Deep Path" teaser
- Tap section → navigates and closes sheet

**7. Exit confirmation modal**
- When `✕` is tapped: "Leave this lesson? Progress is saved. You can continue from section N next time."
- Two buttons: `Stay` / `Leave` (Leave navigates to chapter page)

**8. Completion screen**
- Full-screen celebration when all blocks done: "Lesson Complete!" with stat gains
- Shows +% for Clarity, Thinking, Focus
- "Back to Chapter →" button to close module
- Keep existing Tutorial Defense + First Principles buttons

**9. Responsive behavior**
- Mobile: full viewport, content fills width with 16px padding
- Tablet/Desktop: content centered at max-width 720px, comfortable reading
- Bottom sheet works identically across all sizes

### What stays unchanged
- All block renderer components (ConceptBlock, DragDropActivityBlock, RecallBlock, etc.)
- `renderBlock()` function logic
- `useChapterEpisodes`, `useEpisodeBlocks` hooks
- Progress persistence to database
- `toggleUnderstood`, `goToBlock` state logic
- Voice/AI integrations
- TutorialDefenseModal, FirstPrinciplesModal
- Tools toolbar content (just moved to bottom bar popup)

### No backend/DB changes

