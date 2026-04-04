

# Fix: Make My Growth Tab Always Visible + Verify It Renders

## Problem
The Growth tab is hidden behind a `phase >= 2` gate in both the navbar (TopNavbar line 37) and the render block (StudentDashboard line 579). If the student hasn't completed 3+ episodes, the tab never appears.

The current GrowthTab.tsx already matches the user's provided JSX design exactly — all 6 sections with identical styling — but wired to real Supabase data instead of static mock data. **No redesign needed.**

## Fix (2 small changes)

### 1. `src/components/TopNavbar.tsx` — Always show Growth tab
Line 37: Remove the `phase >= 2` condition from the Growth tab entry so it's always visible in the nav.

### 2. `src/pages/StudentDashboard.tsx` — Always render Growth content  
Line 579: Remove `phase >= 2` condition from the Growth tab render block. When there's no data yet, the GrowthTab already handles empty states gracefully (shows "No chapters started yet", empty heatmap, placeholder breakthrough).

## No other changes needed
The GrowthTab.tsx component is already the correct implementation of the user's JSX with all 6 sections:
1. Overall Inner OS Score banner (teal gradient)
2. Activity & Streaks + GitHub-style Heatmap (real `daily_activity` data)
3. Inner OS Trend Lines (SVG chart with dimension filters)
4. Breakthroughs timeline (real `student_breakthroughs` data)
5. Learning Stats (computed from real episode/method counts)
6. Chapter Progress (real `episode_progress` grouped by chapter)
7. Scholar Methods Performance (real `method_sessions` data)

