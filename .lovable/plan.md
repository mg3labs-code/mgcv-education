

# Language Learning System for Telugu & Hindi

## Current State
- Telugu: 6 chapters in DB, Ch1 has 2 episodes with 22 content blocks (all in Telugu script)
- Hindi: Not yet in the `subjects` table
- Content blocks use the same STEM-oriented 7-layer framework -- works for concepts but doesn't leverage language-specific pedagogy (comparison, vocabulary building, pattern-based grammar)
- No bilingual side-by-side rendering, no daily vocabulary tracker, no compound progress visualization

## What We'll Build

### 1. Language-Aware Block Renderers
Extend `TextbookEpisode.tsx` to detect when the subject is Telugu/Hindi and render blocks differently:

- **Bilingual Concept Block**: Split-screen layout -- target language on left (larger font, native script), English meaning on right. Tap any sentence to hear pronunciation (Sarvam AI for Telugu, browser TTS for Hindi)
- **Vocabulary Card Block**: Flashcard-style word cards showing the word in native script, transliteration, English meaning, example sentence, and a "Use in a sentence" prompt
- **Grammar Pattern Block**: Instead of rules, show 3-4 example sentences highlighting the pattern with color-coded grammar elements, then a "spot the pattern" interactive challenge
- **Story Reading Block**: Short engaging passage in the target language with tap-to-reveal English translation per sentence, comprehension questions at the end

### 2. Daily Compound Progress Widget
A new component shown at the top of language episodes:

```text
┌─────────────────────────────────────────┐
│  📈 Your Telugu Journey                  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │Day 1 │→│Day 5 │→│Day 15│→│Day 30│   │
│  │5 wds │ │25wds │ │75wds │ │150+  │   │
│  └──────┘ └──────┘ └──────┘ └──────┘   │
│  Today: 3 new words learned  🔥 streak  │
│  Total: 47 words mastered               │
└─────────────────────────────────────────┘
```

Tracks words learned, sentences written, and reading passages completed. Shows how small daily effort compounds.

### 3. Comparison Learning Mode
For each concept block, add a "Compare" toggle that shows:
- Telugu ↔ English sentence structure differences
- Hindi ↔ English word order comparison
- Color-coded grammatical elements (subject=blue, verb=green, object=orange) in both languages side by side

### 4. New DB Table: `language_progress`
Track daily vocabulary and language skill progress per student per subject:
- `user_id`, `subject_name`, `date`, `words_learned`, `sentences_written`, `passages_read`, `grammar_patterns_mastered`

### 5. Add Hindi to Subjects Table
Insert Hindi as a subject with initial chapter structure (mirroring Telugu's 6-chapter setup).

## Files to Create/Edit

| File | Change |
|---|---|
| `src/components/textbook/BilingualConceptBlock.tsx` | **New** - Side-by-side native + English rendering |
| `src/components/textbook/VocabularyCardBlock.tsx` | **New** - Flashcard word learning with transliteration |
| `src/components/textbook/GrammarPatternBlock.tsx` | **New** - Pattern-based grammar with color-coded examples |
| `src/components/textbook/StoryReadingBlock.tsx` | **New** - Tap-to-translate story passages |
| `src/components/textbook/LanguageProgressWidget.tsx` | **New** - Daily compound progress tracker |
| `src/pages/TextbookEpisode.tsx` | Detect language subjects, use language-specific renderers |
| `src/hooks/useTextbookData.ts` | Map new language block types to components |
| DB migration | Create `language_progress` table + seed Hindi subject & chapters |

## Language-Specific Phase Grouping

For Telugu/Hindi episodes, the 3 phases become:

- **Phase 1: "📖 Read & Discover"** -- Bilingual concept + story reading + vocabulary cards
- **Phase 2: "🧩 Practice & Pattern"** -- Grammar patterns + recall + explain in target language
- **Phase 3: "✍️ Express Yourself"** -- Writing prompts + creative expression + connections to culture

## Compound Progress Logic
- Each episode completion adds words to the student's vocabulary count
- Daily streak multiplier: Day 1 = 5 words, Day 7 = 5 words + review of 10 past words, Day 30 = compound review
- Visual "growth tree" or "word garden" metaphor showing vocabulary expanding over time

