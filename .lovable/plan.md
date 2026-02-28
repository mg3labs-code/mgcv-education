

## Fix Desktop/Laptop Layout and Show Detailed Errors

### Root Causes Found

1. **TopNavbar has NO responsive design** -- all 7-8 navigation buttons are in a single horizontal row with no wrapping, overflow handling, or hamburger menu. On laptops and tablets, buttons overflow off-screen.

2. **StudentDashboard uses fixed-width sidebar** (`w-[350px]`) in a flex layout with no responsive breakpoints. On smaller laptops, the sidebar and main content fight for space.

3. **Error messages are generic** -- the login form only shows `err.message` (e.g., "Failed to fetch") with no error codes, no debugging info, and no actionable guidance.

---

### Plan

**1. Make TopNavbar responsive**
- Add a hamburger menu toggle for mobile/tablet (below `lg` breakpoint)
- Hide the horizontal button row on smaller screens, show it in a dropdown/sheet
- Keep the logo and avatar/logout always visible
- Ensure teacher nav buttons (Dashboard, Schedule, Metrics, Message Bar) and student nav buttons all fit properly

**2. Make StudentDashboard responsive**
- Change the fixed `w-[350px]` sidebar to stack vertically on mobile/tablet (`flex-col` on small screens, `flex-row` on `lg+`)
- Use `lg:w-[350px] w-full` so the sidebar takes full width on smaller screens
- Ensure the schedule grid cards don't overflow

**3. Make TeacherDashboard responsive**
- The grid already uses `auto-fit` which is decent, but ensure padding and font sizes scale properly on smaller viewports

**4. Show detailed errors with codes on screen**
- In the login form (`Index.tsx`), catch errors and display:
  - The error message
  - The error code (if available from the backend response)
  - A human-readable reason/suggestion (e.g., "Check your email and password", "Network error - try opening in a new tab")
- Show the error inline below the submit button (not just as a toast) so users can see it clearly
- Add a small debug panel that appears when errors occur, showing the technical details

**5. Improve AuthContext error handling**
- In `signIn` and `signUp`, pass through the full error object (including `status`, `code`, `message`) so the UI can display meaningful details

---

### Technical Details

```text
TopNavbar.tsx
  - Wrap nav buttons in a container hidden below lg: "hidden lg:flex"
  - Add hamburger button visible below lg: "lg:hidden"
  - Add mobile dropdown with all nav items
  - Keep avatar + logout always visible

StudentDashboard.tsx
  Line 166: Change "flex gap-[30px]" to "flex flex-col lg:flex-row gap-6 lg:gap-[30px]"
  Line 168: Change "w-[350px] flex-shrink-0" to "w-full lg:w-[350px] lg:flex-shrink-0"

Index.tsx (login form)
  - Add inline error display below submit button
  - Show error code + message + suggestion
  - Parse different error types:
    - "Failed to fetch" -> show network/iframe guidance
    - "Invalid login credentials" -> show wrong email/password
    - Other errors -> show raw message + code

AuthContext.tsx
  - Enhance error throwing to include status codes
```

### Files to Change
- `src/components/TopNavbar.tsx` -- add responsive hamburger menu
- `src/pages/StudentDashboard.tsx` -- responsive sidebar layout
- `src/pages/Index.tsx` -- inline error display with codes and reasons
- `src/contexts/AuthContext.tsx` -- pass full error details

