

# Add 7-Layer Elite Content to All Subjects — 10th Class Telangana Board

## Current State

- **Math Ch1 (Real Numbers)**: 7 episodes, but only Episode 1 has the elite layers (Reasoning/Assumptions/Connections/Application/Implications). Episodes 2-7 are missing them.
- **Math Ch2-14**: Empty — chapter metadata exists but `episodes: []`
- **Other subjects**: Not present at all
- **All content is hardcoded** in `textbookData.ts` (1,388 lines for just 1 chapter)

## The Problem

Hardcoding all content is not viable. With ~100+ chapters across all subjects, each with 5-7 episodes and 11 blocks per episode, we're looking at **5,000+ content blocks**. That's ~500,000 lines of TypeScript if done inline.

## Approach: Move Content to Database + AI-Assisted Generation

### Phase 1: Database-Driven Content Architecture

Create tables to store all textbook content in the database instead of `textbookData.ts`:

**Table: `subjects`**
- id, name (Mathematics, Physics, Chemistry, Biology, English, Telugu, Social Studies), board (Telangana), grade (10)

**Table: `chapters`** (replaces the hardcoded `chapters` array)
- id, subject_id, number, title, subtitle, color, periods, page_range, sort_order

**Table: `episodes`** (replaces hardcoded episode arrays)
- id, chapter_id, number, title, subtitle, duration, type, sort_order

**Table: `content_blocks`** (replaces hardcoded blocks with 7-layer content)
- id, episode_id, type (concept/activity/recall/explain/assessment/exercise/reasoning/assumptions/connections/application/implications), title, icon, content (jsonb), sort_order

### Phase 2: Migrate Existing Ch1 Data

Move all existing `textbookData.ts` content into the new tables so the app reads from the database. Update `StudentTextbook.tsx`, `TextbookChapter.tsx`, `TextbookEpisode.tsx` to fetch from DB.

### Phase 3: AI Content Generator Edge Function

Build a `generate-chapter-content` edge function that:
1. Takes a chapter title, subject, textbook page range, and topic list
2. Uses Gemini to generate all 7 layers for each episode following the framework from `docs/03-product/textbook-7-layer-framework.md`
3. Stores generated content in `content_blocks`
4. Teacher can review/edit before publishing

### Phase 4: Populate All Subjects

Add chapter metadata for all 10th class Telangana Board subjects:

| Subject | Chapters |
|---|---|
| Mathematics | 14 (Ch1 done, Ch2-14 need content) |
| Physics | ~14 chapters |
| Chemistry | ~14 chapters |
| Biology | ~14 chapters |
| English | ~15+ lessons |
| Telugu | ~15+ lessons |
| Social Studies | ~30+ chapters (History + Geography + Civics + Economics) |

Then use the AI generator to populate 7-layer content for each.

### Phase 5: Add Missing Elite Layers to Math Ch1 Eps 2-7

Before generating new content, complete Ch1 by adding Reasoning, Assumptions, Connections, Application, and Implications blocks to Episodes 2-7.

## Database Migration SQL

```sql
-- Subjects table
CREATE TABLE public.subjects (
  id uuid PK, name text, board text DEFAULT 'Telangana',
  grade int DEFAULT 10, created_at timestamptz
);

-- Chapters table (replaces hardcoded chapters array)
CREATE TABLE public.chapters (
  id uuid PK, subject_id uuid → subjects, number int,
  title text, subtitle text, color text, periods int,
  page_range text, sort_order int, created_at timestamptz
);

-- Episodes table
CREATE TABLE public.episodes (
  id uuid PK, chapter_id uuid → chapters, number int,
  title text, subtitle text, duration text,
  type text, sort_order int, created_at timestamptz
);

-- Content blocks (all 11 types including 7 layers)
CREATE TABLE public.content_blocks (
  id uuid PK, episode_id uuid → episodes,
  type text NOT NULL, -- concept/reasoning/assumptions/connections/application/implications/etc
  title text, icon text, content jsonb NOT NULL,
  sort_order int, created_at timestamptz
);
```

RLS: Public read (student content). Teacher/admin can insert/update.

## Code Changes

| File | Change |
|---|---|
| SQL Migration | Create `subjects`, `chapters`, `episodes`, `content_blocks` tables |
| SQL Migration | Seed subjects + migrate Ch1 data from hardcoded to DB |
| `supabase/functions/generate-chapter-content/index.ts` | New edge function: AI generates 7-layer content per episode |
| `src/data/textbookData.ts` | Keep interfaces, remove hardcoded data, add DB fetch hooks |
| `src/pages/StudentTextbook.tsx` | Fetch chapters from DB instead of import |
| `src/pages/TextbookChapter.tsx` | Fetch episodes from DB |
| `src/pages/TextbookEpisode.tsx` | Fetch content blocks from DB |

## Implementation Order

1. Create DB tables + RLS
2. Seed Math subject + migrate Ch1 episodes/blocks to DB
3. Update frontend pages to fetch from DB
4. Add 7-layer blocks to Ch1 Episodes 2-7 (in DB)
5. Build AI content generator edge function
6. Seed remaining Math chapters (Ch2-14) metadata
7. Generate content for Math Ch2-14 using AI
8. Add other subjects (Physics, Chemistry, Biology, English, Telugu, Social)
9. Generate content for all subjects

## What This Enables

- Teachers can review and edit AI-generated content before students see it
- Scales to any subject/board without code changes
- Every episode gets the full Oxford/Harvard/Feynman/MIT treatment
- Content stored once, curriculum mapping handled separately (Universal Concept Library pattern from docs)

