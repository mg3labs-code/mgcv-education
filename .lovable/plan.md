

# Sport-to-Syllabus Attraction System — Standalone Implementation

## Overview
Build the 6-phase Joy-to-Curriculum flow as a **separate route** (`/attraction-demo`) with its own edge function (`attraction-flow`), completely isolated from the existing app. This lets you test and iterate safely before merging.

## What Gets Built

### 1. Edge Function: `supabase/functions/attraction-flow/index.ts`
A dedicated AI endpoint with a specialized system prompt implementing all 6 phases:

- **Phase 1 — Hook**: Discover student interests (cricket/football/etc), ask wonder questions
- **Phase 2 — Bridge**: Connect interest to physics/math concepts (e.g., LED stumps → circuits, spin → Magnus Effect)
- **Phase 3 — Ground**: Seamlessly reference NCERT textbook sections, read excerpts
- **Phase 4 — Branch**: Detect knowledge level → Oxford Tutorial Defense (challenge) OR 6-step CTA (guided decode)
- **Phase 5 — Apply**: Real-world problem solving, JEE-style questions
- **Phase 6 — Advance**: Competitive exam readiness, cross-domain connections

The system prompt will encode the branching logic, phase transitions, and pedagogical methods. The AI tracks which phase the student is in via conversation context and advances naturally.

### 2. Page: `src/pages/AttractionDemo.tsx`
A standalone chat interface at `/attraction-demo` with:
- Full-screen conversational UI (no sidebar/nav — clean test environment)
- Phase indicator bar showing current phase (Hook → Bridge → Ground → Branch → Apply → Advance)
- Text input + voice input (reusing existing speech recognition pattern)
- Streaming responses from the `attraction-flow` edge function
- Visual phase transitions (color/icon changes as AI progresses)
- Interest tags displayed as the AI discovers them
- "Reset Session" button for repeated testing

### 3. Route: Added to `src/App.tsx`
A single public route `/attraction-demo` — no auth required for easy testing.

### 4. Config: `supabase/config.toml` update
Add `[functions.attraction-flow]` with `verify_jwt = false`.

## Technical Approach

- **AI model**: `google/gemini-2.5-flash` via Lovable AI gateway (no API key needed)
- **Phase tracking**: The system prompt instructs the AI to prepend phase metadata tags (`[PHASE:1]`, `[PHASE:2]`, etc.) which the frontend parses to update the phase indicator — invisible to the student
- **Branching**: The AI autonomously detects student knowledge level from responses and chooses Tutorial Defense or CTA path
- **No database needed**: Conversation state lives in React state only (test environment)
- **Streaming**: Same SSE pattern as existing `study-companion`

## Files Changed/Created

| File | Action |
|---|---|
| `supabase/functions/attraction-flow/index.ts` | **Create** — Dedicated edge function with 6-phase system prompt |
| `src/pages/AttractionDemo.tsx` | **Create** — Standalone chat page with phase indicator |
| `src/App.tsx` | **Edit** — Add `/attraction-demo` route (public, no ProtectedRoute) |
| `supabase/config.toml` | **Auto-updated** — Add attraction-flow function config |

