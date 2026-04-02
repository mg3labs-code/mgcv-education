

# Generate Bilingual 3-Phase Content for Telugu & Hindi

## Problem
Telugu and Hindi Chapter 1 episodes currently have 22 content blocks each, but they were generated using the STEM 7-layer prompt. The content structure (e.g., `concept` blocks with `sections: [{heading, body}]`) doesn't match what the language-specific components expect (e.g., `BilingualConceptBlock` expects `sections: [{native, english, transliteration}]`). This causes empty/broken rendering.

## Solution

### Step 1: Create a language-specific content generation edge function

New edge function `generate-language-content/index.ts` that produces blocks matching the bilingual 3-phase framework:

**Phase 1 — "Read & Discover":**
- `bilingual_concept` → `{sections: [{native, english, transliteration}], heading}` — split-screen native/English text
- `story_reading` → `{title, sentences: [{native, english}], questions: [{question, answer}]}` — tap-to-reveal passage

**Phase 2 — "Practice & Pattern":**
- `vocabulary` → `{words: [{word, transliteration, meaning, example, exampleTranslation, memoryTrick}], heading}` — flashcards
- `grammar_pattern` → `{patternName, rule, examples: [{sentence, translation, highlights: [{text, role}]}], challenge: {question, answer}}` — color-coded syntax
- `recall` → standard recall format (Q&A pairs in target language)
- `assessment` → standard MCQ format (language-focused questions)

**Phase 3 — "Express Yourself":**
- `explain` → writing prompt in target language
- `application` → cultural/real-world language usage scenario
- `connections` → cross-domain connections (literature, film, history)

The AI prompt will instruct Gemini to generate content in the actual target language (Telugu script / Hindi Devanagari) with English translations, transliterations, and culturally relevant examples.

### Step 2: Delete existing STEM blocks for Telugu & Hindi episodes

Use a script to:
1. Query `tb_episodes` joined with `tb_chapters` and `subjects` where subject name is "Telugu" or "Hindi"
2. Delete all `content_blocks` for those episode IDs
3. This clears the way for fresh language-appropriate content

### Step 3: Generate new content via the edge function

Call the new function for each Telugu and Hindi Chapter 1 episode, generating 9 blocks per episode (instead of 11 STEM blocks):
1. `bilingual_concept`
2. `story_reading`
3. `vocabulary`
4. `grammar_pattern`
5. `recall`
6. `assessment`
7. `explain`
8. `application`
9. `connections`

### Step 4: Update TextbookEpisode.tsx rendering

Update `renderBlock` to handle the new block types natively instead of awkwardly mapping STEM types to language components:

```text
block.type === "bilingual_concept" → <BilingualConceptBlock />
block.type === "vocabulary"        → <VocabularyCardBlock />
block.type === "grammar_pattern"   → <GrammarPatternBlock />
block.type === "story_reading"     → <StoryReadingBlock />
```

Update `langPhases` to reference the new block type names. Keep the existing STEM block type rendering for non-language subjects untouched.

### Step 5: Update ContentBlock type definition

Add the new language block types to `textbookData.ts`:
- Add `"bilingual_concept" | "vocabulary" | "grammar_pattern" | "story_reading"` to the `ContentBlock.type` union
- Add corresponding content interfaces (already exist in the component files)

## Files Modified
1. `supabase/functions/generate-language-content/index.ts` — **new** edge function with bilingual prompt
2. `src/pages/TextbookEpisode.tsx` — updated `renderBlock` and `langPhases` for new block types
3. `src/data/textbookData.ts` — extended `ContentBlock.type` union with language types
4. Script execution to delete old blocks and generate new ones via the edge function

## Content Generation Approach
The edge function will be called via script (`code--exec`) to generate content for all Telugu and Hindi Ch1 episodes in sequence, with rate-limit handling between calls.

