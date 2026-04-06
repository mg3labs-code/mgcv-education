

# Fix Textbook Episode: Reduce to 11 Sections, Fix Blank Visuals, Improve Exercise UI

## Problems Identified

1. **14 sections instead of 11**: The database has 3 standalone `visual_aid` blocks (at positions 2, 9, 13) that inflate the section count. These should be merged into their adjacent content blocks, not shown as separate full-screen sections.

2. **Blank visual sections**: The `visual_aid` blocks render broken image placeholders because the URLs are likely placeholders. When the image fails to load, the block shows an empty pink gradient bar with no fallback content.

3. **Exercise sections are plain text**: The `ExerciseBlock` just renders textbook questions as static text with no interactivity — no input fields, no "reveal answer" buttons, no attempt tracking.

## Plan

### Step 1: Merge visual_aid blocks into adjacent sections
Instead of rendering `visual_aid` as standalone sections, attach each `visual_aid` block's content as an inline visual within the preceding or following content block. In `TextbookEpisode.tsx`:
- Filter out `visual_aid` blocks from the main `blocks` array used for navigation
- When rendering a block, check if the next block in the unfiltered list is a `visual_aid` and render it inline below the main content
- This reduces 14 sections to 11

### Step 2: Fix VisualAidBlock fallback for broken images
In `src/components/textbook/VisualAidBlock.tsx`:
- When the image URL fails or is a placeholder, show a meaningful fallback: the caption text, explanation, and a search link (using `searchTerms`) instead of a broken image icon
- Add a "Search for this visual" button that opens Google Images with the `searchTerms`
- Show the `explanation` text as the primary content when no image loads

### Step 3: Upgrade ExerciseBlock interactivity
In `src/components/textbook/EpisodeBlocks.tsx` (`ExerciseBlock`):
- Add "Click to reveal answer" toggle per question (similar to RecallBlock)
- Add a subtle card wrapper per question with numbering
- Add a "Check your work" section if solutions are provided in the data

### Step 4: Fix title truncation
The title "book Textbook Practice: Prime Factorization" is truncated. Check the `title` field stored in DB — likely starts with "📕 Textbook..." and the emoji rendering causes the first characters to overflow. Ensure the title container has proper overflow handling.

## Files Modified
- `src/pages/TextbookEpisode.tsx` — filter visual_aid from navigation, render inline
- `src/components/textbook/VisualAidBlock.tsx` — add fallback UI for broken images
- `src/components/textbook/EpisodeBlocks.tsx` — upgrade ExerciseBlock with reveal answers

