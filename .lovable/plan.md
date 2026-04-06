

# Fix FullTextbookView: Remove Deep Path, Fix Blank Sections, Restore UI Quality

## Problems Found

1. **"Deep Path" teaser** (lines 1090-1097 in TextbookEpisode.tsx) — shows "🔒 Deep Path / Complete Core Path to unlock" in the sections bottom sheet. Remove it.

2. **Blank sections** — The `convertBlock` function in `FullTextbookView.tsx` uses WRONG field names for almost every block type. It doesn't match the actual TypeScript interfaces, so content extraction fails silently and sections render as empty notes.

   | Block Type | `convertBlock` expects | Actual interface has |
   |---|---|---|
   | reasoning | `whyItWorks`, `proofSketch`, `commonMistakes` | `centralQuestion`, `whyQuestions[]` |
   | assumptions | `assumptions[].assumption/explanation` | `hiddenAssumptions[].assumption/whyItMatters/challenge` |
   | connections | `connections[].topic/relationship` | `connections[].domain/link/explanation` |
   | application | `realWorldExamples[].title/description` | `scenario`, `context`, `questions[]`, `realWorldWhy` |
   | implications | `implications[].title/description` | `whatIfQuestion`, `reflectionPrompts[]`, `essayPrompt` |
   | activity | `instructions` | `instruction` (singular) + `items[]` |
   | explain | `summary`, `teacherNotes` | `prompt`, `guidePoints[]` |
   | exercise | `problems[].question/hint/answer` | `problems[].number/text/answer` |

3. **UI quality downgrade** — The FullTextbookView uses plain generic cards (small text, minimal styling) instead of the rich color-coded blocks from the interactive view. The first 3-4 sections (concept, reasoning, assumptions) look particularly flat.

## Plan

### Step 1: Remove "Deep Path" teaser
Delete lines 1090-1097 in `TextbookEpisode.tsx` — the locked "Deep Path" section in the bottom sheet.

### Step 2: Fix ALL `convertBlock` mappings in `FullTextbookView.tsx`
Rewrite each case to match the actual content interfaces:

- **reasoning**: Extract `centralQuestion` + each `whyQuestions[].question` / `deeperInsight`
- **assumptions**: Extract `concept` + each `hiddenAssumptions[].assumption` / `whyItMatters` / `challenge`
- **connections**: Extract `concept` + each `connections[].domain` / `link` / `explanation`
- **application**: Extract `scenario` + `context` + `questions[]` + `realWorldWhy`
- **implications**: Extract `whatIfQuestion` + `reflectionPrompts` + `essayPrompt`
- **activity**: Use `instruction` (not `instructions`) + show `items[]`
- **explain**: Use `prompt` + `guidePoints`
- **exercise**: Use `problems[].number` / `text` / `answer`
- **concept**: Already works (sections/keyFormulas), but also handle `solvedExamples`
- **recall**: Fix to use `q.question` / `q.answer` / `q.hint`

### Step 3: Upgrade UI styling to match interactive view quality
Enhance `renderBlock` to use richer, color-coded cards matching the interactive view's visual language:
- **Concept text**: Use the serif font, larger text, proper spacing
- **Formulas**: Amber-themed with mono font (already decent)
- **Reasoning**: Use amber/orange tones matching the interactive "🤔 Think Deeper" phase
- **Assumptions**: Sky blue tones matching the interactive "🕵️ Investigate" badge
- **Connections**: Emerald tones matching the interactive "🌐 Connect" badge  
- **Application**: Orange tones matching "🚀 Apply"
- **Recall/Assessment**: Amber border-dashed style matching interactive Quick Check
- **Exercise**: Green-left-border matching interactive exercise blocks

### Step 4: Verify across subjects
The same `convertBlock` fixes apply to all subjects since the content block interfaces are shared. Language subjects may have additional block types (`bilingual_concept`, `vocabulary`, etc.) — add handlers for those too.

## Files Modified
- `src/pages/TextbookEpisode.tsx` — remove Deep Path teaser (lines 1090-1097)
- `src/components/textbook/FullTextbookView.tsx` — fix all convertBlock cases + upgrade renderBlock UI styling

