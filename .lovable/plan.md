

# Curiosity-Driven Layers with Grouped Design & Visual Impact

## Problem
All 11 block types render as identical white cards stacked vertically with only a colored left border differentiating them. Labels are formal ("Definition", "Reasoning", "Assumptions"). The result feels like a long document, not an engaging learning journey.

## Solution: Three-Phase Grouped Layout + Curiosity Language

Merge the 11 layers into **3 visual phases** that tell a story. Each phase has a distinct visual container, making the episode feel like a journey with clear stages rather than a flat list.

```text
┌─────────────────────────────────────────┐
│  PHASE 1: "🔍 Discover & Explore"      │  ← Warm gradient container
│  ┌─────────┐ ┌─────────┐ ┌──────────┐  │
│  │ Concept  │ │Activity │ │ Exercise │  │  Cards inside the phase
│  └─────────┘ └─────────┘ └──────────┘  │
├─────────────────────────────────────────┤
│  PHASE 2: "🧩 Prove You Know It"       │  ← Cool-toned container
│  ┌──────────────────┐ ┌─────────────┐  │
│  │ Recall+Assessment│ │ Explain     │  │  Fewer, wider cards
│  └──────────────────┘ └─────────────┘  │
├─────────────────────────────────────────┤
│  PHASE 3: "🚀 Go Deeper — The Fun Part"│  ← Premium gradient container
│  ┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐  │
│  │Why? ││What ││Where││Real ││What │  │  Deep blocks with
│  │     ││if?  ││else?││life ││next?│  │  curiosity hooks
│  └─────┘└─────┘└─────┘└─────┘└─────┘  │
└─────────────────────────────────────────┘
```

## Key Changes

### 1. Group Blocks into 3 Visual Phases (`TextbookEpisode.tsx`)

Instead of `space-y-0` with identical cards, group blocks by category into styled phase containers:

- **Phase 1 — "Discover & Explore"**: `concept`, `activity`, `exercise` — wrapped in a subtle warm gradient border container with a phase header
- **Phase 2 — "Prove You Know It"**: `recall`, `assessment`, `explain` — wrapped in a cool-toned container
- **Phase 3 — "Go Deeper — The Fun Part"**: `reasoning`, `assumptions`, `connections`, `application`, `implications` — wrapped in a premium gradient container (replaces the current "Deep Mastery Layers" divider)

Each phase container gets: a colored top accent bar, an emoji + curiosity title, a subtitle teaser, and a progress indicator showing how many blocks in that phase are marked understood.

### 2. Curiosity-First Labels & Subtitles

Update `blockLabels` and `layerMeta`:

| Block | New Label | Badge | Subtitle |
|---|---|---|---|
| concept | What's the big idea? | 🔍 Discover | "The core idea, made simple" |
| activity | Try it yourself! | 🎮 Play | "Get your hands dirty" |
| exercise | Level up | 💪 Workout | "Practice makes permanent" |
| recall | Can you remember? | 🧩 Challenge | "No peeking allowed!" |
| assessment | Prove it! | 🏆 Quiz Time | "Show what you really know" |
| explain | Teach your friend | 🗣️ Your Turn | "If you can explain it, you own it" |
| reasoning | But WHY though? | 🤔 Think Deeper | "The reason behind the rule" |
| assumptions | What if we're wrong? | 🕵️ Investigate | "Challenge what everyone assumes" |
| connections | Where else does this hide? | 🌐 Connect | "Surprising links you didn't expect" |
| application | Use it in real life | 🚀 Apply | "How the real world uses this" |
| implications | What does this change? | 🔮 Imagine | "How this idea shapes tomorrow" |

Each block card renders the subtitle as a small italic line under the title, creating a "knowledge gap" that invites clicking.

### 3. Phase Container Styling (`index.css`)

Add 3 phase container classes:
- `.phase-discover` — warm cream/amber gradient border-top, light warm bg
- `.phase-prove` — cool blue/purple gradient border-top, light cool bg  
- `.phase-deeper` — teal-to-indigo gradient border-top, glass-premium bg

### 4. Micro-Interactions

- **Block expand**: CSS `@keyframes blockUnlock` — a 0.2s scale pulse (1.0 → 1.015 → 1.0) when a collapsed block opens
- **"Got it!" button**: Replace "Mark as Understood" → "Got it! ✓" with a brief green pulse on click
- **Phase completion**: When all blocks in a phase are understood, the phase header gets a celebratory checkmark

### 5. Completion Section Language

- "Episode Complete!" → "You crushed it! 🎉"
- "Tutorial Defense" → "Can you defend it?" + "Friendly debate, not a test"
- "First Principles" → "Break it to basics" + "Strip it down, rebuild smarter"
- "View Growth" → "See how far you've come"

### 6. Sidebar Update

Update sidebar to show phase groupings with small phase headers ("Discover", "Prove", "Deeper") and use the new curiosity labels.

## Files Modified

1. **`src/pages/TextbookEpisode.tsx`** — Phase grouping logic, new labels/badges/subtitles, completion language, sidebar phase headers, "Got it!" button text
2. **`src/index.css`** — Phase container classes, `blockUnlock` keyframe animation

## What Stays the Same
- 7-layer pedagogical framework intact
- All block renderers unchanged
- Data model unchanged
- DB persistence unchanged
- No new dependencies

