# MGCV Master Deck v3 — Build Plan

Single deliverable: `/mnt/documents/MGCV_Master_Deck_v3.html` — a print-ready, scroll-snap, 1920×1080 landscape deck. No code changes inside the app — this is a standalone artifact.

## Slide architecture (16)

**ACT I — Problem (3)**
1. Cover — "India's children are visible in marks, invisible in mind." Tricolor base bar, gold hairline, IBM Plex Serif title.
2. The mental-noise crisis — diagram of scattered thoughts vs. one captured thought.
3. The visibility collapse — what teachers/parents *can't* see today (table).

**ACT II — Founding Idea (2)**
4. NEP 2020 gap — what policy asks vs. what classrooms deliver.
5. Founding principle — "Start with what the student already noticed." Quote-slide treatment.

**ACT III — What We Build (5, new spine)**
6. **5-Layer Architecture** (from screenshot) — Engagement → Journey → Adaptive Brain → Teacher Intelligence → Human Wisdom. Hero diagram.
7. **USP at a glance** — 9-row Problem → Feature → Enables table.
8. **Curiosity Engine** — Day 1 Spark / Day 2 Build / Day 3 Master with the 7 invisible layers underneath + "Yesterday you thought…" return mechanic. Device mock.
9. **Inner OS — 5 signals from Day 1** — Attention, Thinking, Reflection (Communication), Momentum, Values. Radar + capture-signal table showing which 3-day step scores which dimension.
10. **Teacher Command Centre + Parent & Character lens** — split slide, two device mocks.

**ACT IV — Why It Survives (3)**
11. 4 moats (Behavioral data · Pedagogical IP · Teacher trust · Language depth).
12. 3 horizons (MVP pilot → district → national).
13. Competitive moat table vs. Byju's / Physics Wallah / Khan / generic GPT tutors — why no-code/AI clones can't replicate.

**ACT V — How It Reaches Schools (3)**
14. Pricing & tiers —
    - **Access** ₹199/child · ₹5,000/school (Tier-3)
    - **Core** ₹499/child · ₹7,500/school (Tier-2)
    - **Premium** ₹1,499/child · ₹14,999/school (Tier-1)
    Never label as "rural" on student surfaces.
15. Pilot honesty — what's live, what's seeded, what's next.
16. Team + ask — closing dark slide with gold hairline.

## Design system (locked)

- Type: IBM Plex Serif (titles 44–58px), IBM Plex Sans (body 13–14px), IBM Plex Mono (11px eyebrows/labels).
- Palette: ink `#0E0E0E`, cream `#F5F1E8`, gold `#C9A84C`, saffron `#FF7A1A`, deep green `#0F5132`. India tricolor base bar on every slide.
- Light/dark sandwich: dark for slides 1, 5, 13, 16; cream for the rest.
- Motion: scroll-snap between slides, 200ms ease fade-in on diagrams, slow gold underline draw on section eyebrows. Restrained — no parallax, no spin.
- Every slide carries a diagram / table / device mock — no pure-text slides.
- Gold hairline `1px` under every eyebrow. Side pip nav (16 dots).
- Print: `@page { size: 1920px 1080px landscape }` so it exports cleanly to PDF.

## QA loop (mandatory before delivery)

1. Render the HTML, screenshot each of the 16 slides as JPG.
2. Inspect every slide for: overflow, low contrast, missing diagrams, broken alignment, leftover lorem, pricing label slip ("rural"), dimension-name drift.
3. Fix → re-shoot affected slides → repeat until clean.
4. Deliver via `<presentation-artifact path="MGCV_Master_Deck_v3.html" mime_type="text/html">`.

No app code touched. Pure standalone HTML artifact.
