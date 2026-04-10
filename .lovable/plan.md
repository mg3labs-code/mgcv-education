

## Plan: Add Parallax Scroll Effect to Hero Section

### What changes
Add a smooth parallax scroll effect to the existing hero section where text and images move at different speeds as the user scrolls, creating depth. No existing features or layout will be modified — this is purely an enhancement layer.

### Implementation

**1. Add a `useParallax` hook or inline scroll listener in `Index.tsx`**
- Track `window.scrollY` using a `useEffect` + `requestAnimationFrame` for performance
- Apply `transform: translateY(scrollY * factor)` to different elements with different speed factors:
  - Hero text content: slower (factor ~0.3) — moves up gently
  - Hero image carousel: faster (factor ~0.5) — creates depth separation
  - Gradient mesh background: very slow (factor ~0.1) — subtle drift
  - Floating badge: medium (factor ~0.4)
  - "AI-Powered Learning" pill badge: slight float effect

**2. Apply parallax transforms via inline `style` on existing elements**
- Wrap scroll-driven `translateY` values on the text block `div`, image container, and background
- All existing animations (shimmer, carousel crossfade, hover tooltips on THINKING) remain untouched

**3. Add subtle opacity fade-out as user scrolls past hero**
- Hero content fades slightly (opacity tied to scroll position) for a polished transition into the TrustBadges section

### Files modified
- `src/pages/Index.tsx` — add scroll state + parallax transforms on existing elements

### What stays the same
- THINKING image-text effect, shimmer, tooltips
- Hero carousel auto-rotate + crossfade
- All modals, auth, navigation
- Mobile layout (parallax disabled on mobile for performance)

