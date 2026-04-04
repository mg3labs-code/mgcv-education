

# Add Learn Tab + Tasks Tab to Student Dashboard

## Summary
Add two new tab views (Learn and Tasks) to the student dashboard, using the exact JSX/inline styles from the provided code. The Home tab keeps the current phased dashboard. Tab switching happens within `StudentDashboard` via state — no new routes.

## Data Mapping (old feature → new section)

### Learn Tab
| New Section | Data Source | Existing Code |
|---|---|---|
| **Continue Learning** card | `episode_progress` table (latest incomplete episode by `user_id`, ordered by `started_at desc`) | Already in StudentDashboard as `ContinueLearning` component |
| **Recently Visited** | `episode_progress` ordered by `started_at desc limit 3`, joined with `tb_chapters`/`tb_episodes` for titles | New query — maps episode_id/chapter_id to chapter title via `tb_chapters.slug` + `tb_episodes.slug` |
| **Subject → Chapter Browser** | `subjects` table + `tb_chapters` + `tb_episodes` (counts) | Reuses `useSubjects()` and `useChapters()` from `src/hooks/useTextbookData.ts` |
| **Chapter progress** (X/Y episodes done) | `episode_progress` grouped by `chapter_id` for current user | New aggregation query |
| **Scholar Methods** | `method_sessions` table grouped by `method_type` | Already fetched in StudentDashboard as `methodCounts` query |

### Tasks Tab
| New Section | Data Source | Existing Code |
|---|---|---|
| **Summary strip** (To Do / Urgent / Submitted) | Computed from `assignments` + `student_submissions` | `StudentAssignments.tsx` lines 39-51 (assignments query), lines 54-100 (submissions query) |
| **Teacher Assignments** list | `assignments` + `assignment_questions` + `student_submissions` + `student_answers` | Same queries from `StudentAssignments.tsx` |
| **Incomplete Sections** | `episode_progress` where `completion_pct < 100` | New query filtering incomplete episodes |
| **Daily Challenges** | Static for now (Pop Quiz links to existing `PopQuizModal`) | Already has `PopQuizModal` in StudentDashboard |

## Files to Create/Modify

### 1. `src/components/student/LearnTab.tsx` — NEW
- Port user's `LearnTab` JSX with inline styles exactly as provided
- Wire **Continue Learning**: query `episode_progress` for latest incomplete, resolve chapter/episode names from `tb_chapters`/`tb_episodes`
- Wire **Recently Visited**: query `episode_progress` ordered by `started_at desc limit 3`
- Wire **Subject tabs**: use `useSubjects()` hook, display subject icon/label/color from DB
- Wire **Chapter list**: use `useChapters(selectedSubject)`, show progress from `episode_progress` count per chapter
- Wire **Scholar Methods**: accept `methodCounts` as prop (already fetched in parent)
- Chapter/episode clicks → `navigate("/student/textbook/{chapterId}/{episodeId}")`

### 2. `src/components/student/TasksTab.tsx` — NEW
- Port user's `TasksTab` JSX with inline styles exactly as provided
- Wire **Assignments**: query `assignments` + `assignment_questions` + `student_submissions` + `student_answers` (same pattern as `StudentAssignments.tsx`)
- Wire **Summary counts**: computed from assignments data (pending/urgent/submitted)
- Wire **Incomplete Sections**: query `episode_progress` where `completion_pct < 100`, resolve episode names
- Wire **Daily Challenges**: static data, Start button opens `PopQuizModal`
- Assignment click → `navigate("/student/assignments")` or open inline

### 3. `src/pages/StudentDashboard.tsx` — Modify
- Add `activeTab` state (synced from TopNavbar)
- Home tab renders current phased content (unchanged)
- Learn tab renders `<LearnTab />`
- Tasks tab renders `<TasksTab />`
- Calendar tab → `navigate("/student/calendar")`
- Growth tab → open ProgressModal
- Pass `activeTab`/`setActiveTab` to DashboardLayout → TopNavbar

### 4. `src/components/TopNavbar.tsx` — Modify
- Student nav: replace current items with 5 pill-style tabs: Home, Learn, Tasks, Calendar, My Growth
- Accept `activeTab`/`onTabChange` props for student role
- Tasks tab shows pending count badge (red dot with number)
- Streak badge (🔥 N Days) next to avatar at phase >= 3
- Tab click for Home/Learn/Tasks → call `onTabChange`
- Tab click for Calendar → navigate to `/student/calendar`
- Tab click for My Growth → open progress modal

### 5. `src/components/DashboardLayout.tsx` — Modify
- Forward `activeTab`/`onTabChange` props to TopNavbar

## Key Decisions
- Tab state lives in `StudentDashboard`, not URL — keeps single `/student` route
- All DB queries use existing hooks/patterns with `maybeSingle()` for safety
- No new DB tables needed — all data comes from existing `episode_progress`, `assignments`, `student_submissions`, `method_sessions`, `subjects`, `tb_chapters`, `tb_episodes`
- Inline styles match user's provided JSX exactly (cream bg, stone borders, Source Serif 4 headings, DM Sans body)

