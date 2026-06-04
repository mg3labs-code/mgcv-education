
## Goal

Make the demo feel like a real, shippable app: clean teacher dashboard, a 3-day curiosity arc that mirrors the activities used in Deep Dive, with hook-aligned questions, working back/next navigation, gated 7-layer flow, and consistent typography across desktop / laptop / tablet / mobile.

---

## Part 1 — Teacher Dashboard polish

Files: `src/pages/TeacherDashboard.tsx`, `src/index.css`

- Strip inline-style soup; move to Tailwind tokens so the page inherits the design system (no more random `fontSize: 13` mixed with `fontSize: 20`).
- One type scale: `text-2xl` page title, `text-lg` card titles, `text-sm` body, `text-xs` meta. Same scale used on student dashboard.
- Spacing: consistent `p-6`, `gap-4`, `space-y-5`. Cards: `rounded-2xl border border-border bg-card shadow-sm`.
- Class selector → segmented pill row with `bg-muted` track and `bg-primary text-primary-foreground` active.
- Header alignment: greeting + date + class on one row at ≥768px, stacked on mobile.
- Quick Actions grid: `grid-cols-1 sm:grid-cols-3` so laptop (1366) doesn't squash icons.

## Part 2 — Clarity icon + ThinkingNetwork

Files: `src/components/ThinkingNetwork.tsx`, `src/components/MetricCard.tsx`

- Redesign the Clarity ring: layered SVG (outer track + animated gradient arc + inner crisp number), `aria-label` with the percentage.
- Lock icon container to `h-10 w-10` (mobile) / `h-12 w-12` (≥md) using Tailwind classes, not inline px — fixes the laptop sizing drift.
- Same icon system applied to Thinking / Focus / Character so all four read as a set.

## Part 3 — /curiosity 3-day arc, rebuilt around Deep Dive activities

Files (new): `src/data/curiosityConcepts/realNumbers.ts` (expand), `src/components/curiosity/ArcNav.tsx`, `src/components/curiosity/LayerStepper.tsx`, `src/components/curiosity/activities/*` (one per activity type).
Files (edit): `src/pages/CuriosityArc.tsx`, `src/hooks/useArcProgress.ts`.

### Activity set (mirrors what Deep Dive uses)

Each Day exposes the same kind of blocks the student already sees in Textbook episodes, so the demo feels like one product:

1. Hook card (MCQ, 3 choices) — already exists, kept.
2. Believe / Doubt / Not sure — kept.
3. True / False with twist — kept, retitled "Spot the trap".
4. Drag-drop sort (tap-to-place bins) — kept.
5. Tricky MCQ (2–3 options, one trap distractor) — new, reused across days.
6. Reflect input (one-line write) — kept.
7. Aha visual reveal — kept.
8. Teach-a-friend mic/text — kept.

### Hook ↔ activity sync (the bug today)

In `realNumbers.ts`, each `HookVariant` (cricket / travel / movies / other) gets its own:
- `mcq` (already exists)
- `sortItems` + `sortPrompt` (already exists)
- `trap` claim (already exists)
- **new**: `trickyMcq` (Day 2)
- **new**: `miniCase` (Day 3, hook-flavoured: cricket → run-rate, travel → bill, movies → BPM)

`CuriosityArc.tsx` always reads activities from the resolved `hook` object — never from a global pool. This guarantees the cricket flow stays cricket end-to-end.

### Domain-flavoured examples (Uber / Zomato / etc, simple level)

New `domainExamples` field on each hook, surfaced in the Day-3 mini-case copy:
- Cricket → "Uber surge multiplier 1.333… — same maths as run-rate."
- Travel → "Zomato bill split for 3 friends — ₹83.33 forever."
- Movies → "Spotify tempo detector rounds 120.499… to 120.5."

Kept one-line, no engineering depth — just "you've seen this in apps you use".

### 3-day arc structure

Day 1 — Spark (5 min)
  Hook MCQ → First thought → Aha visual → Sort activity → Trap T/F → Day-1 done.

Day 2 — Build (6 min)
  Yesterday echo → Believe/Doubt → Concept unfold (3 steps) → **Tricky MCQ** (new) → Own words → Day-2 done.

Day 3 — Master (5 min)
  Domain mini-case (hook-flavoured) → Teach-a-friend → Loop close → Day-3 done.

### Navigation (back / next, gated)

New `ArcNav` footer pinned at bottom of every step:
- `← Back` — always enabled except on the first step of the arc.
- `Next →` — disabled until the step's required interaction is done (pick made, text typed, all items placed). Tooltip explains why it's locked.
- Steps that *require* completion (MCQs, sort, trap, reflect) block forward navigation; passive screens (aha, day-done) allow free next.
- Back uses an in-memory `historyStack` in `useArcProgress` so it walks the actual visited steps, not a hard-coded order.

### 7-layer gating

The "7 layers" referenced in the docs map onto: Interest → Hook → Reflect → Aha → Sort → Trap → Loop-close. Each layer renders a numbered chip in the new `LayerStepper` topbar with three states: locked (grey + lock icon), active (filled), done (check). The stepper is clickable only on done/active layers — locked ones show a toast: "Finish the current step to unlock."

## Part 4 — Responsive verification

After implementation:
- Use `browser--navigate_to_sandbox` then `browser--set_viewport_size` at 1920×1080, 1366×768, 834×1194, 390×844.
- Walk `/teacher` and `/curiosity` at each size, screenshot, confirm: no overflow, type scale steady, Clarity icon same visual weight, ArcNav reachable without scrolling on mobile.

## Technical notes

- Keep all colour values in HSL tokens; no new raw hex except inside `realNumbers.ts` data strings.
- `useArcProgress` gains: `historyStack: ArcStep[]`, `goBack()`, `canGoNext(step): boolean`.
- `LayerStepper` is a presentational component; gating logic lives in `useArcProgress`.
- No schema changes — `signals` jsonb already stores per-step completion flags.
- No new edge functions.

## Out of scope (will not touch this round)

- Other teacher subpages (analytics, assignments) beyond shared tokens.
- Voice / TTS layer on the arc.
- New concepts beyond Real Numbers.
