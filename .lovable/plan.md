

# Add Daily Quiz + Weekly Assignments Sections to GrowthTab

## What's happening
The old ProgressModal had 5 analytics categories. The new GrowthTab covers 3 of them well (Overall, Chapter-wise, Semester) but is missing **Daily Quiz Progress** and **Weekly Assignments Progress**.

## Comparison

| Old ProgressModal | New GrowthTab | Status |
|---|---|---|
| Daily Quiz Progress | — | **Missing** |
| Weekly Assignments Progress | — | **Missing** |
| Chapter-wise Progress | Chapter Progress section | ✅ Covered (better) |
| Semester Progress | Inner OS Trends (weekly chart) | ✅ Covered (better) |
| Overall Progress | Inner OS Score banner + Learning Stats | ✅ Covered (better) |

## Plan: Add 2 new sections to GrowthTab

### 1. Daily Quiz Progress section
- Show quiz streak (days in a row with quiz completed)
- Recent quiz scores (last 7 days) as small bar chart or score dots
- Data source: `daily_activity` table (`episodes_completed`, `methods_used` as proxy) — or if Pop Quiz results aren't persisted yet, show a "Start today's quiz" CTA linking to PopQuizModal
- Stats: Today's status (✅ Done / ⏳ Pending), Best score, Average score

### 2. Weekly Assignments Progress section  
- Summary: Total assigned / Submitted / Graded
- Per-assignment cards: title, subject, score (if graded), status badge
- Data source: `assignments` + `student_submissions` + `student_answers` (same queries already used in TasksTab)
- Visual: progress ring or bar showing submitted/total ratio

### Files modified

**`src/components/student/GrowthTab.tsx`**
- Add `DailyQuizProgress` sub-component after the Heatmap section
- Add `WeeklyAssignmentsProgress` sub-component after Learning Stats
- Both use the same Card + SectionTitle pattern and cream/stone inline styles
- Wire to existing Supabase tables via useQuery

### Props additions
- Pass `userId` (already available) — both new sections query their own data internally like the heatmap does

### Styling
Same as existing sections — white Card, stone border, Source Serif 4 headings, DM Sans body, teal/purple accent colors.

