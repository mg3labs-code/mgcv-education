

# Replace Dashboards with User-Provided Phased Design

## Summary
Replace the current StudentDashboard and TeacherDashboard with the exact JSX design provided by the user — warm cream/stone palette, inline styles, Source Serif 4 + DM Sans fonts, phased progressive unlock (1-4), and the teacher layout from the mockups. No existing Tailwind theme tokens — use the exact inline styles from the provided code.

## What Changes

### 1. `src/pages/StudentDashboard.tsx` — Full rewrite
Port the user's provided JSX directly into the existing component structure:
- Keep existing Supabase queries (innerOS, breakthroughs, methodCounts, schedules) but map their data into the new widget components
- **Phase computation**: Use `episode_progress` count + `student_inner_os.created_at` age to determine phase 1-4
- **Phase 1**: Greeting + `ScheduleWidget` (horizontal timeline with colored left borders, "HAPPENING NOW" badge) + `ContinueLearning` card (chapter progress bar) + locked placeholders for Inner OS and Scholar Methods
- **Phase 2**: Same + `InnerOS` normal card (5 dimension circles with mini progress bars)
- **Phase 3**: Same + `ScholarMethods` grid (Debate Challenge, Break It Down, Case Study, Teach It)
- **Phase 4**: `InnerOS` hero mode (teal gradient `#0D9488` to `#134E4A`, circular SVG score ring, "+5% this week" badge) + `StatsRow` (Episodes, Study Time, Streak, Gems as horizontal cards)
- **`FadeSlide` wrapper** for progressive reveal animations
- All styling uses inline styles from the provided code: `background: "#FFFBF5"`, `color: "#1C1917"`, `borderRadius: 16`, `border: "1px solid #E7E5E4"`, `fontFamily: "'DM Sans', sans-serif"`
- Wrap in `DashboardLayout` and keep navigation/auth integration

### 2. `src/pages/TeacherDashboard.tsx` — Full rewrite
Port the user's `TeacherDashboard` JSX:
- Class-wide Inner OS as 4 horizontal stat cards (emoji icon, percentage, label, student count) with colored left borders
- Today's Classes as vertical cards with time, subject, class section, "● LIVE" indicator on current class
- "Needs Your Attention" section with action items (Grade Now, View buttons) — pull from existing `teacher_alerts` query
- Quick action cards at bottom (Create Assignment, Class Analytics, Edit Schedule) in pastel backgrounds
- Same warm cream/stone inline style system
- Keep existing Supabase queries (classAvg, alerts)

### 3. `src/components/TopNavbar.tsx` — Accept phase prop
- Add optional `phase` prop
- Student nav tabs: Home, Learn, Tasks, Calendar always visible; "My Growth" tab appears only at phase >= 2
- Show streak badge (🔥 + day count) at phase >= 3
- Use existing nav styling (no changes to colors)

### 4. `src/components/DashboardLayout.tsx` — Forward phase prop
- Accept optional `phase` prop, pass to `TopNavbar`

### 5. `index.html` — Add Google Fonts
- Add Source Serif 4 + DM Sans font imports (from the user's provided `<style>` block)

## Design System (from user's code — used exactly)
- Background: `#FFFBF5` (warm cream)
- Card: `background: "white"`, `border: "1px solid #E7E5E4"`, `borderRadius: 16`, `boxShadow: "0 1px 3px rgba(0,0,0,0.04)"`
- Text primary: `#1C1917` (stone-900), secondary: `#78716C` (stone-500)
- Teal accent: `#0D9488` for active states, buttons, hero gradient
- Subject colors: Math `#7C3AED`, Science `#059669`, English `#2563EB`, Social `#F59E0B`
- Locked sections: centered emoji + `#78716C` text + 🔒 unlock condition
- Fonts: `'Source Serif 4'` for headings, `'DM Sans'` for body

## Files Modified
1. `src/pages/StudentDashboard.tsx` — Full rewrite with phased inline-styled widgets
2. `src/pages/TeacherDashboard.tsx` — Full rewrite with inline-styled teacher layout
3. `src/components/TopNavbar.tsx` — Phase-aware tabs + streak badge
4. `src/components/DashboardLayout.tsx` — Forward phase prop
5. `index.html` — Google Fonts link for Source Serif 4 + DM Sans

