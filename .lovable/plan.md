

# Plan: Add IconSelectionQuiz to Textbook Lessons (Alongside ComprehensionCheck)

## What exists today

- **ComprehensionCheck** — a free-text "explain in your own words" check shown after content blocks in `TextbookEpisode.tsx`. Students type/speak, AI evaluates understanding.
- **IconSelectionQuiz** — a tap-to-select icon grid game (PDF-style). Currently only used in `/demo/visual-reasoning`.
- The `reasoning_visuals` table already stores a `quiz` jsonb column with icon quiz data.

## Design: Two-Phase Comprehension Flow

**Neither component replaces the other.** Instead, the flow becomes:

1. **Phase 1 — Quick Quiz** (IconSelectionQuiz): Fast, gamified, visual check. Generated per-topic and cached globally in `reasoning_visuals`.
2. **Phase 2 — Explain Check** (ComprehensionCheck): The existing "What did you understand?" free-text input. Shown after the quiz is completed (or if no quiz data exists, shown directly as today).

This gives students a fun warm-up before the deeper comprehension task.

## Implementation Steps

### 1. Create a wrapper component `SectionQuizGate`
A new component (`src/components/textbook/SectionQuizGate.tsx`) that:
- Takes `sectionTitle`, `subject`, the existing `onPass`/`onSkip`/`onResult` props
- On mount, queries `reasoning_visuals` for cached quiz data matching the topic
- If quiz data exists: shows `IconSelectionQuiz` first, then reveals `ComprehensionCheck` after quiz completion
- If no quiz data: falls through to `ComprehensionCheck` immediately (no change from today)
- Includes a "Skip quiz" option so it never blocks progress

### 2. Update `TextbookEpisode.tsx`
- Import `SectionQuizGate` and wrap the existing `ComprehensionCheck` usage (lines 864-879)
- Pass the current block's title and subject context so the quiz lookup works
- No removal of `ComprehensionCheck` — it stays as the second phase inside the wrapper

### 3. Background quiz generation (edge function)
- When `generate-reasoning-visual` creates steps for a topic, it already generates a `quiz` object
- Add a lightweight edge function action (`fetch-quiz-only`) that generates just the quiz for topics that have no reasoning visual yet — so quizzes work for all block types, not just reasoning blocks
- Cache globally (no `user_id` filter) so one generation serves all students

### 4. Quiz data fallback
- For topics where no cached quiz exists and generation hasn't run, the component gracefully skips to the text check
- No blank screens, no loading spinners blocking lesson flow

## What does NOT change
- ComprehensionCheck component itself — untouched
- IconSelectionQuiz component itself — untouched
- Existing textbook block rendering — untouched
- The quiz is additive only

## File changes summary
| File | Action |
|------|--------|
| `src/components/textbook/SectionQuizGate.tsx` | **Create** — wrapper combining quiz + comprehension |
| `src/pages/TextbookEpisode.tsx` | **Edit** — swap `ComprehensionCheck` for `SectionQuizGate` (which contains ComprehensionCheck inside) |
| `supabase/functions/generate-reasoning-visual/index.ts` | **Edit** — add `fetch-quiz-only` action for standalone quiz generation |

