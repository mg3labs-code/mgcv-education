

# Plan: Textbook Episode — Template Consistency, Reasoning Input, Mobile Cleanup & Subject Dedup

## Issues Identified

### 1. Reasoning Steps 2-4 have no voice/text input
**Current**: Steps 2-4 in `ReasoningBlock` (`StepContent`) only show question + hint + ThinkFirstGate reveal. Only Step 1 (`Step1ThinkBox`) has a textarea + voice input.
**Fix**: Add a textarea + `CompanionVoiceInput` to `StepContent` (steps 2-4) so students can type/speak their thinking before revealing the insight — same pattern as Step 1.

### 2. Remove "What did you understand?" ComprehensionCheck
**Current**: `ComprehensionCheck` ("What did you understand? 🤔") appears after concept/reasoning/connections/implications blocks via `SectionQuizGate`. This is redundant since multiple interactive checks already exist within blocks.
**Fix**: Remove `ComprehensionCheck` entirely from the flow. In `SectionQuizGate`, after the icon quiz (blocks 5+), just call `onPass()` directly. For blocks 0-4, no gate at all — just the block content.

### 3. Science & Chemistry are duplicates
**Current**: Database has both "Science" (10 chapters) and separate "Chemistry" (6), "Physics" (6) subjects. The Science chapters duplicate Chemistry/Physics/Biology chapters exactly (e.g., "Chemical Reactions and Equations" appears in both).
**Fix**: Remove or hide the "Science" subject from the textbook listing. The dedicated Chemistry/Physics/Biology subjects already cover everything. This is a data cleanup — either delete Science subject or filter it out in the UI query.

### 4. Activity block "puzzle" is not properly developed
**Current**: `FallbackActivityBlock` renders text items with plain textareas ("Work it out here...") when no `classify` type + categories exist. For Social Science (e.g., "Identify Himalayan Features"), it shows textareas per item instead of a matching/selection interface.
**Fix**: Add a "match" activity type to `ActivityBlock` that presents items with selectable description options (radio/chip selection), not just free-text. When `type === "match"`, render a matching interface where students tap to pair terms with descriptions.

### 5. Social Science template is bland compared to other subjects
**Current**: Social Science uses the same generic template as all subjects but lacks engaging visuals, hooks, or creative formatting that STEM subjects have (containment chains, formula boxes, etc.).
**Fix**: Add geography-specific enhancements to `ConceptBlock`: detect Social Science topics (relief features, rivers, climate) and render map-style visual indicators, location badges, and comparison tables instead of plain text definitions.

### 6. Mobile: top bar has redundant info
**Current**: On mobile (363px viewport), the top area shows: close button + progress dots + counter (top bar) + phase badge + label + done count + JEE toggle (second row). That's two rows of metadata taking ~80px.
**Fix**: Merge the phase badge row into the top bar on mobile. Show phase label inline with the counter. Remove the second row entirely on small screens — the phase color can be shown as a tint on the progress dots instead.

### 7. Icon Quiz appearing in wrong sections / too frequently
**Current**: Already gated to blocks 5+ (`blockIndex >= 4`) but quiz questions can be confusing or appear too often.
**Fix**: Increase gate to blocks 6+ (`blockIndex >= 5`) and ensure `shownSlugs` dedup is working. Also add a max quiz count per episode (e.g., max 2 icon quizzes per episode).

## Files to Change

| File | Changes |
|------|--------|
| `src/components/textbook/reasoning/StepContent` (in ReasoningBlock.tsx) | Add textarea + voice input to steps 2-4 |
| `src/components/textbook/SectionQuizGate.tsx` | Remove ComprehensionCheck — after quiz pass call `onPass()` directly; increase gate to block 6+; add max quiz count |
| `src/pages/TextbookEpisode.tsx` | Remove CONTENT_TYPES gate for ComprehensionCheck; merge mobile top bar; filter out "Science" subject if needed |
| `src/components/textbook/EpisodeBlocks.tsx` | Add "match" activity type for proper matching interface |
| `src/pages/StudentTextbook.tsx` | Filter out "Science" subject from listing (duplication with Chemistry/Physics/Biology) |

## Not changing
- Content generation pipeline (text complexity) — separate task
- Progress persistence — already fixed in previous iteration
- FlipRevealCard — already moved and has auto-flip timer

