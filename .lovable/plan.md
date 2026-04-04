

# Redesign "Today's Classes" Widget to Match Screenshot

## What changes

The current `ScheduleWidget` shows all classes in a vertical stack with left-colored borders. The screenshot shows a different layout:

1. **Current/NOW class** — prominent card with purple icon badge, "NOW" label, time, subject name, topic subtitle, and a green "Open →" button
2. **Remaining classes** — compact horizontal row of small cards showing just time + subject name (color-coded text), no topic
3. **"View Full Schedule →"** link in the header pointing to `/student/calendar`
4. **All 6 subjects shown** (not just 3-5 based on phase)

## File modified

### `src/pages/StudentDashboard.tsx` — Rewrite `ScheduleWidget`

**NOW card (first non-break class):**
- Left: purple rounded-square icon badge (subject icon)
- Center: "● NOW {time}" in red/green, bold subject name, topic as subtitle in muted text
- Right: green "Open →" button (teal `#0D9488` or purple `#7C3AED`)
- Background: `#F5F3FF` light purple tint, rounded 14, subtle border

**Remaining classes row:**
- Horizontal flex row with small cards (border `#E7E5E4`, rounded 10, padding 10-14)
- Each card: time in small muted text on top, subject name in subject color below
- No topic text, no icon — just time + colored subject name
- Overflow scroll on mobile

**Header:**
- "📅 Today's Classes" left, "View Full Schedule →" link right (teal colored, navigates to `/student/calendar`)

**Data:** Remove `compact` prop gating — always show all subjects from `todayScheduleItems`

**No backend changes** — same `todayScheduleItems` data, just visual restructure.

