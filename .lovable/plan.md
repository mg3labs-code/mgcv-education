

# Redesign FullTextbookView: Reuse Interactive Components in Scroll Layout

## Core Problem
The reading mode currently converts rich content blocks into flat text (`TopicBlock` objects), losing all the interactive UI, colors, and layout that the interactive view provides. This creates a confusing, downgraded experience.

## Solution: Render the SAME Components in a Continuous Scroll
Instead of converting blocks to plain text, render the actual `ReasoningBlock`, `AssumptionsBlock`, `ConnectionsBlock`, `ApplicationBlock`, `ImplicationsBlock`, `RecallBlock`, `ExplainBlock`, `ExerciseBlock`, `AssessmentBlock`, `ActivityBlock`, `ConceptBlock`, and `VisualAidBlock` components — the same ones used in the interactive view — in a single continuous scrollable page.

The only difference from the interactive view: no step-by-step navigation, no phase grouping, no "Mark as Understood" per block. Just clean linear reading with all content visible.

## What Changes

### File: `src/components/textbook/FullTextbookView.tsx` — Full Rewrite

**Remove**: The entire `convertBlock` / `TopicBlock` / `renderBlock` system (lines 8-336). This is the root cause of blank sections, wrong field names, and flat UI.

**Replace with**: Import and render the actual block components:
- `ConceptBlock`, `ActivityBlock`, `RecallBlock`, `ExplainBlock`, `AssessmentBlock`, `ExerciseBlock` — extracted from `TextbookEpisode.tsx` into shared exports (or imported inline)
- `ReasoningBlock`, `AssumptionsBlock`, `ConnectionsBlock`, `ApplicationBlock`, `ImplicationsBlock` — already separate component files
- `VisualAidBlock`, `BilingualConceptBlock`, `VocabularyCardBlock`, `GrammarPatternBlock`, `StoryReadingBlock` — already separate

**Layout**: 
- Remove the sidebar + paginated navigation. Replace with a single-column continuous scroll
- Each block gets the same header treatment as the interactive view: icon, label, subtitle, and colored badge (reuse `blockLabels`, `blockSubtitles`, `layerMeta` from TextbookEpisode)
- Add a floating "table of contents" pill at the top showing section names as clickable anchors
- Light separator between sections (thin line + spacing)

**Why this is elite UX**:
- Student sees the EXACT same rich UI (expandable assumptions, drag-drop activities, click-to-reveal answers, textareas) — just in a continuous flow instead of step-by-step
- No duplicate code means no data mapping bugs
- Matches what the screenshots show as the "original" quality

### File: `src/pages/TextbookEpisode.tsx` — Extract Block Components

Move `ConceptBlock`, `ActivityBlock`, `RecallBlock`, `ExplainBlock`, `AssessmentBlock`, `ExerciseBlock` into a shared file (`src/components/textbook/EpisodeBlocks.tsx`) so both the interactive view and reading mode can import them.

## Summary of Files
1. **New file**: `src/components/textbook/EpisodeBlocks.tsx` — shared block components extracted from TextbookEpisode
2. **Rewrite**: `src/components/textbook/FullTextbookView.tsx` — continuous scroll using real components
3. **Update**: `src/pages/TextbookEpisode.tsx` — import blocks from shared file instead of defining inline

