

## Expert Analysis: Board vs JEE Content Integration

### The Core Confusion — Clarified

Your 7-layer framework already covers **deep understanding** (reasoning, assumptions, connections, implications). The question is: **Does JEE need something DIFFERENT from what the 7 layers provide?**

**Answer: Yes, but NOT a completely separate textbook. JEE needs 3 things your layers DON'T currently provide:**

```text
┌─────────────────────────────────────────────────────────────┐
│  WHAT YOUR 7 LAYERS ALREADY DO (Board + Deep Understanding) │
│  ✓ Concept explanation (Layer 1)                             │
│  ✓ Step-by-step mechanism (Layer 2)                          │
│  ✓ "Why" reasoning (Layer 3 - Cambridge)                     │
│  ✓ Hidden assumptions (Layer 4 - Oxford)                     │
│  ✓ Cross-domain connections (Layer 5 - MIT)                  │
│  ✓ Real-world application (Layer 6 - Harvard)                │
│  ✓ Big-picture implications (Layer 7 - Oxford Essay)         │
├─────────────────────────────────────────────────────────────┤
│  WHAT JEE ADDITIONALLY NEEDS (Gap)                           │
│  ✗ Competitive problem-solving patterns & shortcuts          │
│  ✗ Previous year JEE/NEET questions with trap analysis       │
│  ✗ Timed practice with negative marking simulation           │
│  ✗ Extended syllabus topics beyond state board               │
│  ✗ Multi-concept integration problems                        │
└─────────────────────────────────────────────────────────────┘
```

### Expert Recommendation: "JEE Boost" Blocks (Not a Separate Textbook)

For Class 10, JEE prep is about **strengthening foundations + exam awareness**. The best approach is to ADD 2-3 specialized JEE blocks PER EPISODE that appear when a student toggles "JEE Mode" — not a parallel textbook.

### What Gets Added Per Episode (When JEE Mode is ON)

1. **JEE Problem Bank** (block_type: `jee_problems`) — 3-5 competitive-level MCQs with negative marking, traps, and previous year references
2. **JEE Concept Extension** (block_type: `jee_extension`) — Any extra depth/topics JEE expects beyond board syllabus for that concept
3. **Speed Drill** (block_type: `jee_speed_drill`) — 5 rapid-fire questions with a countdown timer, testing the same episode concept under pressure

### Implementation Plan

**Step 1: Database — Add `depth` column to `content_blocks`**
- Add `depth TEXT NOT NULL DEFAULT 'board'` column to `content_blocks` table
- Values: `'board'` (existing blocks) or `'jee'` (new JEE blocks)
- No migration of existing data needed — all current blocks default to `'board'`

**Step 2: Extend AI generation pipeline**
- Update `generate-chapter-content` edge function to accept an optional `depth: "jee"` parameter
- When `depth: "jee"`, generate only the 3 JEE-specific block types (jee_problems, jee_extension, jee_speed_drill)
- These get inserted with `depth = 'jee'` into the same `content_blocks` table

**Step 3: Frontend — Episode reader toggle**
- Add a "Board ↔ JEE" toggle switch at the top of the episode reader (`TextbookEpisode` page)
- When Board mode: show only blocks where `depth = 'board'` (current behavior)
- When JEE mode: show ALL blocks (board + jee), with JEE blocks visually distinguished (orange/amber accent, ⚡ icon)

**Step 4: New block renderers**
- `JeeProblemsBlock.tsx` — MCQ with negative marking (-1), timer per question, trap alerts, previous year tags
- `JeeExtensionBlock.tsx` — Collapsible "Beyond Board" content with advanced formulas/proofs
- `JeeSpeedDrillBlock.tsx` — Countdown timer + rapid-fire questions with score tracker

**Step 5: Update `useEpisodeBlocks` hook**
- Accept a `depth` filter parameter
- When `depth = 'all'` (JEE mode), fetch all blocks
- When `depth = 'board'` (default), fetch only board blocks

**Step 6: Update the existing `/board-vs-jee` comparison page**
- Link it from the textbook as a "See how JEE Mode works" preview
- Add a CTA to enable JEE mode on actual episodes

### Files to Create/Modify

| File | Action |
|------|--------|
| Migration: add `depth` column to `content_blocks` | Create |
| `supabase/functions/generate-chapter-content/index.ts` | Modify — add JEE prompt path |
| `src/components/textbook/JeeProblemsBlock.tsx` | Create |
| `src/components/textbook/JeeExtensionBlock.tsx` | Create |
| `src/components/textbook/JeeSpeedDrillBlock.tsx` | Create |
| `src/components/textbook/EpisodeBlocks.tsx` | Modify — render new block types |
| `src/hooks/useTextbookData.ts` | Modify — depth filter |
| `src/pages/TextbookEpisode.tsx` | Modify — add toggle |
| `src/data/textbookData.ts` | Modify — add new ContentBlock types |

### Why This Is the Right Approach

- **No content duplication** — Board content stays, JEE adds on top
- **Same episode structure** — Student reads Episode 1.1 in Board mode, toggles JEE to see competitive extensions
- **AI-generatable** — The JEE blocks can be auto-generated per episode using the existing pipeline
- **Class 10 appropriate** — Focuses on foundation strengthening + exam awareness, not full JEE syllabus (that's for Class 11-12)

