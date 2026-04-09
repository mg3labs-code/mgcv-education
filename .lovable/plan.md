

# Enhance Textbook Content Presentation

## What We're Doing
Adopting the rich visual content formatting from the reference HTML (definition boxes, formula cards, example boxes, step containers, important notes) across ALL textbook block types — not just ConceptBlock — using the app's existing teal/cream theme.

## Current State
- **ConceptBlock** already detects definitions, formulas, steps, notes — good foundation
- **Other blocks** (Reasoning, Connections, Application, Implications, Recall, Exercise) use basic card layouts without the rich formatting
- The reference HTML has 5 distinct visual patterns: `definition-box`, `formula-box`, `example-box`, `important-note`, `step-box` — all with gradient backgrounds, colored borders, and icons

## Plan

### 1. Add Reusable Content Card Components
Create a shared `ContentCards.tsx` with 5 themed card components matching the reference styles in the app's color palette:
- **DefinitionCard** — teal gradient header, bordered, 📖 icon
- **FormulaCard** — gradient teal-to-blue center-aligned, bold text, shadow
- **ExampleCard** — light emerald bg, teal border, 💡 icon, expandable steps
- **ImportantNote** — amber/warm bg, ⚠️ icon
- **StepContainer** — numbered blue circles, clean left-border steps

### 2. Enhance Block-Level Presentation
Apply these cards inside existing blocks:
- **ReasoningBlock** — wrap `deeperInsight` in ExampleCard, hints in ImportantNote
- **ConnectionsBlock** — each connection as a visually distinct card with subject-colored badges
- **ApplicationBlock** — real-world scenarios in ExampleCard style with DefinitionCard for context
- **ImplicationsBlock** — wrap implications in themed gradient cards
- **RecallBlock** — style revealed answers as ExampleCards instead of plain green divs
- **ExerciseBlock** — wrap answer reveals in styled cards, problems in cleaner containers

### 3. Improve FullTextbookView Wrapper
- Add subtle section background tints (like the reference's `h3` left-border style) to section headers
- Improve section separators with gradient lines instead of plain borders
- Better TOC pill styling with active state tracking on scroll

### 4. Add CSS Utility Classes
Add to `index.css`:
- `.definition-box`, `.formula-box`, `.example-box`, `.important-note`, `.step-box` utility classes matching the reference but in teal/cream theme
- Dark mode variants for all

## Files Modified
- `src/components/textbook/ContentCards.tsx` (new — shared visual cards)
- `src/components/textbook/EpisodeBlocks.tsx` (ConceptBlock, RecallBlock, ExerciseBlock)
- `src/components/textbook/ReasoningBlock.tsx`
- `src/components/textbook/ConnectionsBlock.tsx`
- `src/components/textbook/ApplicationBlock.tsx`
- `src/components/textbook/ImplicationsBlock.tsx`
- `src/components/textbook/FullTextbookView.tsx`
- `src/index.css` (utility classes)

No changes to data structures, tools, sections, or navigation.

