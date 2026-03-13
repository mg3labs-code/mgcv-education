

# Phase 1: Enterprise UX Foundation — Best User Experience

This implements the approved Phase 1 plan: breadcrumbs, empty states, help tooltips, and consistent loading skeletons across all pages. All changes are additive — no existing logic is modified.

## New Components

### 1. `src/components/Breadcrumbs.tsx`
Route-aware breadcrumb using existing `src/components/ui/breadcrumb.tsx` primitives. Accepts optional `items` array for custom labels (dynamic chapter/episode names). Auto-generates from current path when no items provided. Route segment map:
- `/student` → Dashboard
- `/student/textbook` → Textbook
- `/student/textbook/:chapterId` → Chapter Name
- `/student/textbook/:chapterId/:episodeId` → Episode Name
- `/student/calendar` → Calendar
- `/student/assignments` → Assignments
- `/teacher` → Dashboard
- `/teacher/schedule` → Schedule, etc.

Styling: subtle, premium — small text, muted separators, last item bold.

### 2. `src/components/EmptyState.tsx`
Reusable component with Lucide icon, title, description, optional CTA button. Clean gradient background, centered layout, generous whitespace. Props: `icon: LucideIcon`, `title: string`, `description: string`, `actionLabel?: string`, `onAction?: () => void`.

### 3. `src/components/HelpTooltip.tsx`
Small `?` circle (16px) that shows tooltip on hover using existing `Tooltip`/`TooltipContent`. Non-intrusive, muted color, placed inline next to labels. Props: `content: string`, optional `className`.

### 4. `src/components/PageSkeleton.tsx`
Three skeleton presets:
- `DashboardSkeleton` — header bar + 4 stat cards + 2-col content grid
- `ListSkeleton` — header + N rows (prop: `rows?: number`)
- `DetailSkeleton` — breadcrumb line + hero banner + content blocks

All use existing `Skeleton` component with consistent rounded corners and spacing.

## Integration Points (small insertions only)

### Layouts
- **`PageLayout.tsx`** — Add optional `breadcrumbItems` prop, render `<Breadcrumbs>` above children when provided
- **`DashboardLayout.tsx`** — Add optional `breadcrumbItems` prop, render `<Breadcrumbs>` at top of content area

### Student Pages
- **`StudentDashboard.tsx`** — Add `HelpTooltip` next to "Inner OS" heading ("Your mind's core operating metrics") and each dimension card label. Replace plain empty text for breakthroughs with `EmptyState`.
- **`StudentTextbook.tsx`** — Add breadcrumb: `Dashboard > Textbook`. Replace loading skeletons with `ListSkeleton`.
- **`TextbookChapter.tsx`** — Replace "← All Chapters" back button with breadcrumb: `Dashboard > Textbook > [Chapter Name]`. Replace loading with `DetailSkeleton`.
- **`TextbookEpisode.tsx`** — Add breadcrumb: `Dashboard > Textbook > [Chapter] > [Episode]` (no other changes to this file).
- **`StudentCalendar.tsx`** — Add breadcrumb: `Dashboard > Calendar`.
- **`StudentAssignments.tsx`** — Add breadcrumb: `Dashboard > Assignments`. Add `EmptyState` when no assignments.

### Teacher Pages
- **`TeacherDashboard.tsx`** — Add `HelpTooltip` next to each stat card label (explaining what Clarity/Reasoning/Attention/Character track). Replace plain empty alert text with `EmptyState`.
- **`TeacherSchedule.tsx`** — Add breadcrumb: `Dashboard > Schedule`.
- **`TeacherAnalytics.tsx`** — Add breadcrumb: `Dashboard > Analytics`.
- **`TeacherAssignments.tsx`** — Add breadcrumb: `Dashboard > Assignments`.
- **`TeacherInsights.tsx`** — Add breadcrumb: `Dashboard > Insights`.
- **`TeacherPerformance.tsx`** — Add breadcrumb: `Dashboard > Performance`.
- **`TeacherAttendance.tsx`** — Add breadcrumb: `Dashboard > Attendance`.
- **`TeacherDailyTodo.tsx`** — Add breadcrumb: `Dashboard > Daily Plan`. Add `EmptyState` when no todos.
- **`TeacherParentConnect.tsx`** — Add breadcrumb: `Dashboard > Parent Connect`.

## Files Summary

| File | Action |
|---|---|
| `src/components/Breadcrumbs.tsx` | Create |
| `src/components/EmptyState.tsx` | Create |
| `src/components/HelpTooltip.tsx` | Create |
| `src/components/PageSkeleton.tsx` | Create |
| `src/components/PageLayout.tsx` | Add breadcrumb slot |
| `src/components/DashboardLayout.tsx` | Add breadcrumb slot |
| 6 Student pages | Add breadcrumbs, help tooltips, empty states |
| 8 Teacher pages | Add breadcrumbs, help tooltips, empty states |

No database changes. No existing functionality modified. All additions are non-breaking.

