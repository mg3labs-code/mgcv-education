

## Why Hardcoded Data Exists (And Why You're Right to Remove It)

### The Problem

`src/data/textbookData.ts` is **1,637 lines** containing two things mixed together:

1. **Type definitions** (interfaces like `ContentBlock`, `ConceptContent`, `ReasoningContent`, etc.) — used by 14 files across the project
2. **Hardcoded chapter/episode/block data** (the actual `chapters` array with Math Ch1 content) — used as a **fallback** in only 3 files

The hardcoded data was originally added **before the database existed**. When the DB-driven system (`tb_chapters`, `tb_episodes`, `content_blocks`) was built, the hardcoded data was kept as a "safety net" fallback. But now that the AI pipeline generates real content into the database, this fallback is unnecessary and causes confusion — like the JEE toggle showing no difference because the fallback ignores the `depth` filter.

### What We Should Do

**Keep:** All type/interface definitions (`ContentBlock`, `Chapter`, `Episode`, `ConceptContent`, etc.) — these are used everywhere as TypeScript types.

**Remove:** The hardcoded `chapters` array (the actual content data ~1,200 lines of Math Ch1 episodes and blocks).

**Update:** The 3 files that import `chapters`:
- `src/hooks/useTextbookData.ts` — Remove all fallback/merge logic. If DB returns nothing, return empty arrays.
- `src/components/student/StudyCompanion.tsx` — Replace hardcoded chapter lookup with a DB query.
- `src/pages/StudentDeepDive.tsx` — Replace hardcoded chapter lookup with a DB query.

### Files Changed

| File | Change |
|------|--------|
| `src/data/textbookData.ts` | Remove the `chapters` array (~1,200 lines). Keep all interfaces/types. |
| `src/hooks/useTextbookData.ts` | Remove `hardcodedChapters` import and all fallback/merge logic. Pure DB queries only. |
| `src/components/student/StudyCompanion.tsx` | Replace `chapters` import with DB query via hook. |
| `src/pages/StudentDeepDive.tsx` | Replace `chapters` import with DB query via hook. |

### Why This Fixes JEE Toggle Too

The current fallback logic returns hardcoded blocks **without checking `depth`**, so toggling JEE mode has no effect when using fallback data. Removing the fallback means the `depth` filter in `useEpisodeBlocks` always works correctly against the database.

### Risk

If a chapter has no content in the DB yet, it will show as empty instead of showing hardcoded content. This is actually **correct behavior** — it tells you which chapters still need AI-generated content, rather than silently masking the gap.

