

# Add Full "My Growth" Tab with All 6 Sections

## Summary
Replace the current minimal Growth tab (just header + InnerOS hero + StatsRow) with the full 6-section Growth page from the user's provided JSX — Activity Heatmap, Inner OS Trend Lines, Breakthroughs, Learning Stats, Chapter Progress, and Scholar Methods Performance.

## New File

### `src/components/student/GrowthTab.tsx`
A new component containing all 6 sections ported from the user's JSX, wired to real data:

1. **Overall Inner OS Score banner** — teal gradient banner showing avg score, "+X% since start", "+Y% this week". Data from `student_inner_os` (same `dimensionScores` already computed in parent).

2. **Activity & Streaks + GitHub-style Heatmap** — 3 stat cards (Current Streak, Longest Streak, Active Days) + 90-day heatmap grid. Data: `streak_days` from `student_inner_os`, heatmap from `episode_progress` (query `started_at` for last 90 days, group by date to get intensity).

3. **Your Growth Over Time (Inner OS Trends)** — SVG line chart with dimension filter chips (All / Clarity / Thinking / Focus / Momentum / Character) + 5 growth summary cards showing current score + change since start. Data: Currently no weekly snapshots table exists, so use mock `INNER_OS_WEEKS` data (same as user's JSX) with the latest week replaced by real `dimensionScores`.

4. **Your Breakthroughs** — Timeline with icon, title, dimension badge, description, date. Data from `student_breakthroughs` table (already queried in the parent dashboard).

5. **Learning Stats** — 4-card grid (Episodes Completed, Total Study Time, Methods Used, Gems Earned). Data: `episodeCount` + `methodCounts` sum from existing queries.

6. **Chapter Progress** — List of chapters with progress bars, episode counts, subject badges. Data: query `episode_progress` grouped by chapter, joined with `tb_chapters` for titles.

7. **Scholar Methods Performance** — Method name, avg score, session count, best topic. Data from `method_sessions` (already queried). Includes "Teach It unlocks after 5 Debate Challenges" footer.

### Props accepted
`GrowthTab` receives: `dimensionScores`, `streakDays`, `episodeCount`, `methodCounts`, `breakthroughs` — all already available in `StudentDashboard`.

## Modified File

### `src/pages/StudentDashboard.tsx`
- Import `GrowthTab`
- Replace the current minimal Growth tab block (lines 567-583) with `<GrowthTab>` component, passing existing data as props
- Add a query for chapter-level progress (group `episode_progress` by chapter) to pass to GrowthTab

## Styling
All inline styles from user's provided JSX — cream bg `#FFFBF5`, white cards with `border: 1px solid #E7E5E4`, Source Serif 4 headings, DM Sans body, teal `#0D9488` accents, dimension colors matching existing `dimensionScores`.

## Data Notes
- Heatmap: query `episode_progress` for last 90 days, count entries per date for intensity (0-3)
- Trend chart: mock weekly data with real current values spliced in (no weekly snapshot table exists yet)
- Breakthroughs: already fetched in parent from `student_breakthroughs`
- Chapter progress: new lightweight query grouping `episode_progress` by chapter_id

