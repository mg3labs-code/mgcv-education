

# Fix: Empty Textbook Pages — Populate DB + Fix Fallback Logic

## Root Cause

The `subjects` and `tb_chapters` tables in the database are **completely empty** (0 rows each). Both `StudentTextbook` and `LearnTab` query these tables via `useSubjects()` and `useChapters()`. When the DB returns nothing:

- **StudentTextbook page** (`/student/textbook`): Shows the header but zero chapters — exactly what your screenshot shows
- **LearnTab** (in dashboard): Also gets empty chapters, but has hardcoded fallbacks for "continue learning" (`ch1`) that partially work — explaining why you see Math Ch1 content there
- **Other subjects** (Science, English, etc.): Never appear because there are no subject rows in DB at all

The merge logic in `useChapters()` iterates over DB chapters and tries to match hardcoded data — but if DB returns zero rows, the loop produces nothing.

## Fix Plan (2 parts)

### 1. Database Migration — Seed all subjects and chapters

Insert all 8 subjects and their 71 chapters into `subjects` and `tb_chapters` tables so the entire curriculum is browsable.

**Subjects** (8 rows): Mathematics, Science, English, Social Science, Telugu, Hindi, Physics, Chemistry — with icons, colors, board = "Telangana State Board", grade = 10.

**Chapters** (~71 rows): All chapters for each subject with title, subtitle/description, periods, page ranges, color codes, sort order. Only Math Ch1 will have episodes (already hardcoded); the rest show as "Coming Soon" with a lock icon.

### 2. Fix `useChapters()` fallback logic

Currently: merges only DB results. If DB returns 0 rows for a subject, returns empty array even though hardcoded data exists.

**Fix**: After the merge loop, append any hardcoded chapters that weren't matched by a DB chapter (so `ch1` always appears for Mathematics even if `tb_chapters` is empty). This makes the system resilient — DB data takes priority when present, hardcoded fills gaps.

```
// Pseudo-logic change:
const dbSlugs = new Set(dbChapters.map(c => c.id));
const unmatchedHardcoded = hardcodedChapters.filter(h => !dbSlugs.has(h.id));
return [...mergedChapters, ...unmatchedHardcoded];
```

### Files Modified
1. **Database migration** — INSERT into `subjects` (8 rows) and `tb_chapters` (~71 rows) with all curriculum metadata
2. **`src/hooks/useTextbookData.ts`** — Add hardcoded fallback append after merge loop

### What This Fixes
- `/student/textbook` page shows all subjects (tabs) and all chapters per subject
- LearnTab browse mode shows full chapter list with proper metadata
- Chapters without episodes display "Coming Soon" with 🔒 icon (existing UI logic handles this)
- Math Ch1 episodes work via hardcoded data; future chapters get content via AI generation pipeline

