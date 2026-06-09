
# MGCV Executive Pitch — In-App Slide Route

A private, link-only route inside the existing app (`/pitch`) that presents MGCV to school principals & management. Built like a product homepage — full-bleed, designed slides — not a generic PPT. Every feature slide pairs a **polished mock visual** (so the busy principal "gets it" in 3 seconds) with an **"Explore this live →"** button that jumps to the real working screen in the app.

## What gets built

### 1. New route `/pitch` (unlisted, no nav link)
- Single-page deck, vertical scroll-snap between slides (also ←/→ keyboard + dot nav).
- Fixed-resolution 1920×1080 design system using the slides-app scaling pattern (semantic typography tokens: `.slide-title`, `.slide-body`, etc.).
- Cream / dark-slate enterprise theme + teal accents (matches existing brand memory).
- Top-right utility chip: "Present mode" (fullscreen), "Download PDF" (print stylesheet), language toggle stub.
- Bottom-right persistent CTA on every slide: **"Explore this in the live product →"** linking to the relevant in-app route.

### 2. The 13 slides (executive-tight, principal-first)

```text
01  Cover            Who we are — one line + school logo lockup placeholder
02  The real problem 3 columns: Student / Teacher / School pain (in their words)
03  Why current      Why videos + quizzes + LMS + AI chat aren't moving the needle
    edtech fails
04  Our thesis       "Curiosity before content. Thinking before testing."
                     One sentence + NEP 2020 alignment ribbon (5 pillars mapped)
05  The 7-Layer      The IP slide. Visual spine: Definition → Mechanism → Reasoning
    Concept Engine   → Assumptions → Connections → Applications → Implications
                     Each layer = 1 line of what student does + 1 line of signal captured
                     CTA: Explore a live 7-layer episode →
06  Student          5-min daily arc mock. Hook → Guess → First Thought → Build → Teach
    experience       "Yesterday you thought…" memory card. Three depth bands (silent).
                     CTA: Open student dashboard →
07  The 5 Inner OS   Pentagon visual: Clarity · Thinking · Attention · Momentum · Values
    Dimensions      Per dimension table: what we capture (micro-signals) → how it rolls up
                     Example row: "Re-reads same line 3×" → Attention −2
                     CTA: See a student's growth profile →
08  How growth is    Misconception → Detection → Remediation → Re-test → Growth loop.
    actually         Sample misconception map screenshot. "We don't just track marks;
    measured         we track the breaks in thinking."
                     CTA: Open teacher misconception map →
09  Teacher          Class cognitive profile mock + suggested hooks + lesson plan card.
    co-pilot         "Reduces invisible workload, surfaces who understood vs. who clicked."
                     CTA: Open teacher dashboard →
10  School OS        Principal dashboard mock: engagement, weak-area heatmap, parent
    & parent         report sample. White-label / branded app callout.
    visibility       CTA: Open admin dashboard →
11  NEP 2020 fit     Side-by-side: NEP pillar (Competency / Critical thinking / Experiential
                     / Multilingual / Holistic report card) ↔ MGCV feature that delivers it.
12  Phased rollout   Pilot (6 wks) → Full Class 6–10 → School OS. Success metrics per phase.
13  The ask /        What we want from this school (pilot class, 1 teacher champion,
    next step        parent comms slot). Contact card.
```

### 3. Per-feature visuals — the key craft point

For each feature slide (05–10), we render a **polished in-deck visual** (not a screenshot) so it looks intentional even before the principal clicks anything:

- Built as real React components inside `src/components/pitch/visuals/` — same design tokens as the app — so they stay crisp at any zoom and never look like stale PNGs.
- Each visual is a **stylized, simplified version** of the real feature: fewer rows, larger type, annotated callouts ("← signal captured here", "← rolls into Thinking dimension").
- Hover/scroll reveals a subtle highlight on the captured-signal annotations.
- Underneath: pill button **"Explore this in the live product →"** that deep-links to the real route (e.g. `/textbook/.../episode/...?mode=seven-layer`, `/teacher`, `/admin`).

### 4. Linking strategy
- Links target the **current preview** routes (per your answer), opening in a new tab so the deck stays in place.
- A small "Demo account auto-login" hint chip on slides whose target requires auth, so principals viewing on their own device land on a populated screen, not a login wall. (We'll wire actual auto-login only if you confirm; otherwise the chip just says "Login: demo / demo".)

### 5. Print / share
- `@media print` stylesheet → each slide one landscape page → `Cmd+P → Save as PDF` produces a clean handout matching the on-screen design (per the slides-app skill guidance).
- `/pitch?print` route forces all slides stacked for the PDF export.

## Files to be created / touched

```text
src/pages/Pitch.tsx                          # route shell, scroll-snap, keyboard nav
src/components/pitch/SlideFrame.tsx          # 1920×1080 scaled slide wrapper
src/components/pitch/ExploreLiveButton.tsx   # persistent CTA → opens app route
src/components/pitch/slides/
  01_Cover.tsx
  02_Problem.tsx
  03_WhyEdtechFails.tsx
  04_Thesis.tsx
  05_SevenLayer.tsx
  06_StudentExperience.tsx
  07_FiveDimensions.tsx
  08_GrowthMeasurement.tsx
  09_TeacherCopilot.tsx
  10_SchoolOS.tsx
  11_NEP2020.tsx
  12_Rollout.tsx
  13_Ask.tsx
src/components/pitch/visuals/
  SevenLayerSpine.tsx
  DailyArcMock.tsx
  YesterdayThoughtCard.tsx
  DimensionPentagon.tsx
  SignalCaptureTable.tsx
  MisconceptionLoop.tsx
  TeacherClassProfileMock.tsx
  PrincipalDashboardMock.tsx
  NEPMappingGrid.tsx
src/index.css                                # add .slide-* semantic typography tokens
src/App.tsx                                  # register /pitch route (unlisted)
```

No backend, no DB, no auth changes. Pure presentation layer.

## Out of scope (call out so we don't drift)
- Real white-label theming engine (slide just shows the *capability*).
- Multilingual deck (English first; structure ready for i18n later).
- Auto-login for demo accounts (only if you say yes — adds risk).
- Real analytics in the dashboard mocks (visuals are designed, not data-driven).

## Open question I'll need answered before building slide 13
Who's the signatory / contact on the "Ask" slide — your name, email, phone, and the school logo (or "Your School Logo" placeholder)? I can ship with placeholders and you swap later.

---

If this plan looks right, hit **Implement plan** and I'll build it end-to-end. If you want fewer/more slides, a different slide order, or any visual swapped, tell me and I'll revise.
