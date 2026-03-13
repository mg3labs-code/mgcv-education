

# Phase 2: Premium UX Enhancements

Four additive features — no existing logic modified.

## 1. Welcome Banner Component
**New file: `src/components/WelcomeBanner.tsx`**

A personalized greeting banner showing:
- Time-based greeting ("Good morning, Ravi")
- Role-specific motivational message (student: streak/progress nudge, teacher: class summary)
- Subtle gradient background with dismiss capability (persisted via localStorage)
- Compact, non-intrusive — sits below breadcrumbs

**Integration**: Insert into `StudentDashboard.tsx` and `TeacherDashboard.tsx` below layout header.

## 2. Command Palette (Ctrl+K)
**New file: `src/components/CommandPalette.tsx`**

Uses existing `cmdk` library (already installed) and `src/components/ui/command.tsx` primitives:
- Global `Ctrl+K` / `Cmd+K` keyboard listener registered in `App.tsx`
- Role-aware: shows student routes for students, teacher routes for teachers
- Searchable list of pages + actions (open assignments modal, navigate to textbook, etc.)
- Groups: "Pages", "Actions", "Quick Links"
- Uses `useNavigate` for navigation, callbacks for modal actions

**Integration**: 
- Create `CommandPalette.tsx` with `open`/`onOpenChange` props
- Add to `App.tsx` inside `AuthProvider` as a new wrapper component that registers the keyboard shortcut
- Add a subtle "⌘K" hint badge in `TopNavbar.tsx` next to the avatar

## 3. Page Transition Animations
**CSS additions to `src/index.css`**:
- New `@keyframes pageEnter` animation (fade + slight translateY)
- `.animate-page-enter` utility class

**Integration**:
- Wrap `<main>` content in `PageLayout.tsx` and `DashboardLayout.tsx` children area with the animation class
- Uses CSS only — no React transition library needed, keeps bundle small

## 4. Accessibility Enhancements
**Across existing files** (small insertions):
- `TopNavbar.tsx`: Add `aria-label` to nav, `aria-current="page"` to active items, `role="navigation"`
- `Breadcrumbs.tsx`: Add `aria-label="Breadcrumb"` (already on `<Breadcrumb>` via Radix, verify)
- `HelpTooltip.tsx`: Add `aria-describedby` pattern
- `EmptyState.tsx`: Add `role="status"` 
- Add `skip-to-content` link at top of both layouts (hidden until focused)
- Focus-visible ring styling improvement in `index.css`

## Files Summary

| File | Action |
|---|---|
| `src/components/WelcomeBanner.tsx` | Create |
| `src/components/CommandPalette.tsx` | Create |
| `src/index.css` | Add page-enter animation + focus-visible + skip-link styles |
| `src/App.tsx` | Add CommandPalette wrapper |
| `src/components/TopNavbar.tsx` | Add ⌘K hint, aria attributes |
| `src/components/PageLayout.tsx` | Add page-enter animation, skip-link |
| `src/components/DashboardLayout.tsx` | Add page-enter animation, skip-link |
| `src/components/Breadcrumbs.tsx` | Verify/add aria-label |
| `src/components/HelpTooltip.tsx` | Add aria-describedby |
| `src/components/EmptyState.tsx` | Add role="status" |
| `src/pages/StudentDashboard.tsx` | Add WelcomeBanner |
| `src/pages/TeacherDashboard.tsx` | Add WelcomeBanner |

No database changes. All existing features untouched.

