

# Fix LearnTab Content + Make TextbookEpisode Show One Section Per Page

## Problem
1. **LearnTab**: Recently visited cards display raw episode IDs instead of proper titles. Episode list has unnecessary "Episode N:" prefix.
2. **TextbookEpisode**: All blocks render on one long scrollable page. The user's JSX and screenshots clearly show ONE section at a time with Previous/Continue buttons to navigate between them — like a paginated reading experience.

## Plan

### 1. Fix LearnTab content display (`src/components/student/LearnTab.tsx`)

**Recently Visited cards (lines 140-180):**
- Fetch episode details (title, duration) by joining `episode_progress` with `tb_episodes` table, or do a secondary lookup
- Show actual episode title instead of `Ep: ch1-ep1`
- Show the correct subject name per episode (currently shows the active tab subject for all)

**Episode list (lines 278-332):**
- Remove "Episode N:" prefix — just show the episode title directly (matching JSX: "Number Types & Classification" not "Episode 1: Number Types & Classification")
- Add block count display: `• {ep.blocks?.length} blocks` next to duration

### 2. Paginate TextbookEpisode — one block per page (`src/pages/TextbookEpisode.tsx`)

This is the big change. Currently all blocks render in a scrollable list. Change to show only ONE block at a time.

**New state:**
- `activeBlockIndex` (already exists as `activeBlock`) — controls which single block is rendered
- Remove scroll-based IntersectionObserver for active block detection (no longer needed since we show one at a time)

**Layout change (lines 832-963):**
- Instead of mapping ALL phase blocks and rendering them all, render ONLY `blocks[activeBlockIndex]`
- Show the block's phase header above it
- Show the block content using existing `renderBlock()`
- Show "Got it! ✓" / "Nailed it!" button below the block

**Bottom navigation bar:**
- `← Previous` button (disabled on first block)
- Center: "✓ Section complete" label if current block is understood
- `Continue →` button (teal `#0D9488` background) — marks current as understood + advances to next block
- On last block: show completion card instead of Continue

**Top bar update:**
- Section counter shows `{activeBlockIndex + 1}/{blocks.length}` (already works)
- Progress bar reflects understood/total (already works)
- Phase breadcrumb shows current block's phase (already works)

**Sidebar update:**
- Clicking a section in sidebar sets `activeBlockIndex` to that block's index (already does `scrollToBlock` — change to `setActiveBlock`)

**What stays the same:**
- All block renderers (ConceptBlock, ActivityBlock, etc.)
- All Supabase data fetching and progress persistence
- Phase grouping logic (used for sidebar and breadcrumb)
- Tools toolbar
- Episode header and stats bar
- Completion card at the end
- Voice/AI integrations
- "Got it!" understood tracking

### Files Modified
1. `src/components/student/LearnTab.tsx` — Fix episode titles and block counts
2. `src/pages/TextbookEpisode.tsx` — Switch from scroll-all to one-block-per-page navigation

### No changes to
- Database, edge functions, block renderer components
- Content data structures

