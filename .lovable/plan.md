# Fix teacher schedule routing and add direct date editing

## Changes
1. Point the teacher navigation Schedule item to `/teacher/schedule`.
2. Replace the `/teacher/schedule-v2` page route with a protected redirect to `/teacher/schedule` using `Navigate` with `replace`; keep `TeacherScheduleV2.tsx` and all `m_calendar` data untouched.
3. Keep quick-search naming consistent as “Schedule”.
4. Add a date editor to the existing teaching calendar:
   - Clicking any in-month date opens the editor, including empty, free, practice, topic, test, assignment, and holiday dates.
   - The editor shows the selected date and lets the teacher choose a loaded chapter, enter a topic title, add optional notes, mark the date as a holiday, or clear the date.
   - Saving updates the existing schedule state and history so Undo, Redo, and Save & Publish continue to use the same data.
   - Existing Extend & Insert, Add Holiday, Reschedule, and Delete behavior remains unchanged.

## Technical details
- Extend `ScheduleItem` with optional notes so publishing sends them through the existing calendar sync path.
- Use the existing dialog, form controls, chapter list, history stack, and unsaved-change state.
- Stop click propagation from date content controls so one date click opens exactly one editor.
- Remove only the unused lazy import for the V2 page after the route becomes a redirect; do not delete its source file.

## Verification
- Confirm teacher navigation and direct `/teacher/schedule-v2` visits land on `/teacher/schedule`.
- Confirm an empty date, practice date, and holiday can be edited and undone/redone.
- Confirm Save & Publish still calls the existing handler and homework logic remains untouched.
