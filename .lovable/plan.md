## Goal
When `/teacher/schedule-v2` finishes loading `m_calendar.calendar_data` for the selected board/class/section/subject, automatically navigate the view to the earliest month that actually has at least one day entry. Today the view stays on the current month (June 2026) even when all data lives in October 2025, making it look empty.

## Scope
Single file: `src/pages/TeacherScheduleV2.tsx`. No schema, no API, no UI redesign.

## Behavior
- After `fetchCalendar` populates `calendarData`, look at the JSON keys (`YYYY-MM-DD`).
- Pick the **earliest** date present.
- If that date's month/year differs from the currently displayed month, set `monthIndex` and `year` to it.
- If `calendarData` is empty, leave the view on the current month (no jump).
- Only auto-jump **once per (className + subject) selection** so a teacher who manually navigates back to June isn't yanked away on every re-render. When the teacher switches class or subject, the auto-jump arms again and fires after the new data loads.

## Technical details
1. Add a ref (e.g. `autoJumpedKeyRef = useRef<string | null>(null)`) that stores the last `${className}|${subject}` key we already auto-jumped for.
2. Reset that ref to `null` inside the existing class/subject change effects (or whenever `fetchCalendar`'s dependencies change) so a new selection re-arms the jump.
3. After `setCalendarData(...)` in `fetchCalendar` (success branch with data), compute:
   ```ts
   const keys = Object.keys(data.calendar_data ?? {}).sort();
   if (keys.length > 0 && autoJumpedKeyRef.current !== `${className}|${subject}`) {
     const [y, m] = keys[0].split("-").map(Number);
     setYear(y);
     setMonthIndex(m - 1);
     autoJumpedKeyRef.current = `${className}|${subject}`;
   }
   ```
4. Leave `monthIndex` / `year` initial state as today's date — the jump only happens when data exists.

## Verification
- Load `/teacher/schedule-v2` as the seeded teacher (cbse / 9 / A / Physics). Expect the view to open on **October 2025** with the 6 seeded entries visible.
- Click Next/Prev to navigate to another month — view should stay where the teacher put it (no re-jump).
- Switch subject (or class) to one with no `m_calendar` row — view should stay on the current month and show empty cells.
- Switch back to Physics — view jumps to October 2025 again (new selection re-arms the jump).
