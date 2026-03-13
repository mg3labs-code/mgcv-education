

# Phase 3: Micro-Animations, Dark Mode & Visual Polish

Building on Phase 1 (structure) and Phase 2 (personalization), Phase 3 adds the "feel" — subtle motion, dark mode, and card-level polish that makes the platform feel alive.

## 1. Dark Mode Toggle
**Edit: `src/index.css`** — Add `.dark` variant CSS variables (dark background, card, border, muted tones).

**Edit: `src/components/TopNavbar.tsx`** — Add a Sun/Moon toggle button next to the ⌘K badge. Uses `localStorage` + `document.documentElement.classList.toggle("dark")`.

The existing CSS variable system (`--background`, `--foreground`, `--card`, etc.) makes this straightforward — just define dark overrides under `.dark` class in `:root`.

## 2. Micro-Animations (CSS keyframes + utility classes)
**Edit: `src/index.css`** — Add new keyframes and utility classes:
- `@keyframes staggerFadeIn` — for list items entering with delay
- `@keyframes shimmer` — subtle loading shimmer effect
- `@keyframes progressFill` — skill bars animate width on mount
- `@keyframes cardHover` — subtle lift + shadow on hover
- `@keyframes countUp` — number counting effect class
- `.animate-stagger-in` — with `--stagger-delay` CSS variable
- `.card-hover-lift` — replaces manual hover classes on cards

**Edit: `src/components/MetricCard.tsx`** — Add `card-hover-lift` class and stagger animation via `style={{ animationDelay }}` prop.

**Edit: `src/components/EpisodeCard.tsx`** — Add `card-hover-lift` class for consistent hover effect.

**Edit: `src/components/SkillBar.tsx`** — Use `progressFill` keyframe so bars animate from 0 to value on mount.

## 3. Staggered List Animations on Dashboards
**Edit: `src/pages/StudentDashboard.tsx`** — Add `animate-stagger-in` with incremental `--stagger-delay` to Inner OS dimension cards and schedule items.

**Edit: `src/pages/TeacherDashboard.tsx`** — Add stagger to stat cards and alert items.

## 4. Smooth Number Transitions
**New: `src/hooks/useCountUp.ts`** — A small hook that animates a number from 0 to target over ~600ms using `requestAnimationFrame`. Used in MetricCard and dashboard stat displays for a premium "counting up" effect.

**Integration**: `MetricCard.tsx` and `StudentDashboard.tsx` overall score use `useCountUp(value)` instead of raw number.

## 5. Card Interaction Feedback
**Edit: `src/index.css`** — Add `.card-interactive` class with:
- `transition: transform 0.2s, box-shadow 0.2s`
- `hover: translateY(-2px)` + elevated shadow
- `active: translateY(0px)` for press feedback

Replace scattered hover classes in `glass-card` and card components with this consistent class.

## Files Summary

| File | Action |
|---|---|
| `src/index.css` | Add dark mode variables, micro-animation keyframes, utility classes |
| `src/hooks/useCountUp.ts` | Create — animated number hook |
| `src/components/TopNavbar.tsx` | Add dark mode toggle button |
| `src/components/MetricCard.tsx` | Add hover-lift + stagger + countUp |
| `src/components/EpisodeCard.tsx` | Add hover-lift class |
| `src/components/SkillBar.tsx` | Add progressFill animation |
| `src/pages/StudentDashboard.tsx` | Stagger animations on cards |
| `src/pages/TeacherDashboard.tsx` | Stagger animations on cards |

No database changes. No existing logic modified. All additions are CSS/animation enhancements.

