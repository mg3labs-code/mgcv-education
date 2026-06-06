
# Final Audit Report + Rework Plan

You asked me to stop polishing and **rethink**: re-read the R&D docs, compare them honestly with what is actually shipped, and write a real report on what is wrong, missing, fake-feeling, and confusing — then propose a focused fix. Here it is.

---

## 1. What the docs promise

Pulled from `foundational-charter.md`, `textbook-7-layer-framework.md`, `attraction-system-design.md`, `sport-to-syllabus-system.md`, `teacher-dashboard-design.md`.

**Student promise — "Inner OS":** reduce mental noise, build thinking infrastructure (clarity, reasoning, attention, momentum), grow inner guidance (self-trust, value compass, reflection). Not marks, not streaks, not gamified dopamine.

**Pedagogy promise — 7-Layer Treatment per concept:** Definition → Mechanism → Reasoning → Assumptions → Connections → Applications → Implications. Plus elite methods: Oxford tutorial defense, First Principles, Harvard cases, cross-domain synthesis.

**Hook promise — Sport/Interest → Syllabus:** every concept opens through the student's real-life interest (cricket, food, music…) as a *bridge into the textbook*, not decoration.

**Teacher promise — Command Centre:** curriculum WHY, character growth, pedagogy guidance ("use Tutorial Defense for reasoning"), behavioural insights (hesitation, avoidance), community wisdom, smart per-student alerts.

---

## 2. What is actually shipped (honest read)

### Student dashboard (screenshot you sent)
- Header: `Hi, hari! · bright minds shine brighter`
- "Your week with Cricket Lens" → 4 KPI tiles: **Episodes 0 · vs 2 · −2**, **First-try 60% · vs 98% · −38%**, **Avg time 0m**, **High-risk concepts 0**
- Today's Classes strip
- Below the fold: tabs (Learn / Tasks / Calendar / My Growth) + Inner OS analytics + Thinking Network + Weekly Interest Summary

### Teacher dashboard
- Live Intelligence Hub (hero + 4 tabs: Signals / Misconceptions / Depth / Hooks) with demo-data fallbacks
- Class Cognitive Profile (radar chart, deterministic mock deltas)
- Plus ~8 separate teacher pages (Analytics, Insights, Performance, Daily Todo, Schedule, Attendance, Assignments, Parent Connect)

---

## 3. Honest issues — what is wrong

### A. The data feels fake, and a student will *see* it instantly
The very first card a student sees says **"Episodes 0, First-try 60% vs 98%, −38%, Avg time 0m"**. The numbers contradict themselves (0 episodes but 60% accuracy), the deltas are negative on day 1, and units are zero. This is the opposite of authentic — it tells the student "this product is broken or judging me before I started."

Root cause: KPI tiles render before the student has any history, and use placeholder math (`vs 98%`) that does not exist.

### B. The student view violates the charter
Charter says: reduce mental noise, no fear, no comparison, no scoreboard. What we render: percentages, deltas, ↓ arrows, "high-risk concepts", "vs 2". That is exactly the scoreboard-anxiety pattern the charter forbids. **A 13-year-old does not need a stock-ticker about themselves.**

### C. The 7-Layer pedagogy is invisible
The whole product thesis is the 7 layers (Definition → … → Implications). Nowhere on the student dashboard, episode card, or progress view does the student see *which layer they are on, which they have mastered, which is next*. The depth ladder we built (`current_rung`) is generic 1–5 numbers, not the 7 named layers from the doc. So the differentiator the doc sells to schools (`"this is just a digital textbook" → no, it is Oxford 7-layer`) is not visible in the UI.

### D. The interest/sport bridge is decorative, not load-bearing
"Your week with Cricket Lens" is a label on a KPI box. The doc describes interest as the *opening move of every concept* — a 30-second hook that re-frames Pythagoras as a cricket pitch diagonal, then dissolves into the real concept. In UI today, "Cricket Lens" never bridges into a concept; it just colors a stats card.

### E. Teacher dashboard is impressive on the surface, hollow underneath
- Live Intelligence Hub looks premium, but the headline numbers ("Live now 7, Signals 184") fall back to demo data the moment a real class is loaded. Teachers will catch this in their first session.
- 8 sibling teacher pages duplicate concepts (Analytics vs Insights vs Performance). A teacher has to guess where to click.
- The charter's actual teacher value — *"which student is stuck on which Layer, and what should I do tomorrow?"* — is not the primary surface. The primary surface is generic stats.

### F. ParentWeeklyNote (the thing you said: just kill it)
Still exists as a file and a parent-channel concept. You said pitch it. Removing the file and any remaining import is part of this plan.

### G. UI craft, on a second look
- Mixed styling systems: most cards use inline styles with hard-coded hex (`#E7E5E4`, `#0D9488`) instead of the design tokens defined in `index.css` / `tailwind.config.ts`. This is why "everything looks slightly off" on mobile and dark mode — tokens are not flowing.
- Two fonts ("Source Serif 4" + "DM Sans") are inlined per component, fighting the global typography.
- Emoji-as-icons (📐🔬📖🌍) on what is sold as a Harvard/Oxford-grade product reads as a primary-school app, not a thinking platform.

### H. Real-data plumbing is partial
The data does not feel authentic because most surfaces query real tables but silently fall back to demo arrays when empty. That hides whether the underlying signals (`episode_interactions`, `student_rung_state`, `curiosity_arc_progress`) are actually being written. A 20-student simulation script exists (`scripts/simulate-class.sh`) but its output is not visibly connected to the dashboards in any verifiable way.

---

## 4. What the docs say should exist that does not (the real gap list)

From a clean read of the 7-layer and teacher-dashboard docs vs. the codebase:

| Doc commitment | In product? |
|---|---|
| 7 named layers visible to student | No — replaced by generic 1–5 rung |
| Tutorial Defense (defend an assumption) | Hooked into one edge function, no UI prompt for students |
| First Principles breakdown view | Edge function exists, no student-facing surface |
| Harvard case / Apply Mini Cases | Component exists (`ApplyMiniCases`) but not on any dashboard journey |
| Cross-domain Connections (Layer 5) | Not surfaced |
| Assumptions exercise (Layer 4) | Not surfaced |
| Curriculum WHY card for teacher | Not present |
| Per-student behavioural alert ("Priya — Attention −40%") | Not present, replaced by generic signals feed |
| Pedagogy guidance ("try Layer 5 here") | Not present |
| Community/peer-teacher tips | Not present |
| Parent channel: warm, private, weekly | Present, you've asked to remove |

---

## 5. The reframe (what we should build instead)

Three big moves. Nothing else until these are right.

### Move 1 — Student dashboard: from "scoreboard" to "today's one thought"
Replace the 4 KPI tiles + Cricket-Lens stats with a **single hero card**:

```text
Today, you're meeting:  Pythagoras Theorem
Through your lens:       🏏 a cricket pitch is a perfect rectangle
Your next layer:         ② Mechanism — how the rule actually works
                         [ Begin · 6 min ]
Yesterday you wondered:  "does this work for any triangle?"  ← echoed back
```

- No percentages. No deltas. No "vs 2".
- One progress visual: the 7 layers as a vertical spine on the right, lit up to where the student is, with the next layer pulsing.
- "My Growth" tab keeps numbers — but framed as *reflection*, not judgement ("you asked 4 new questions this week").

### Move 2 — Teacher dashboard: collapse to one screen that answers "what do I do tomorrow?"
- Kill the 8-page sprawl into 3 tabs: **Today · Class Mind · Each Student**.
- **Today** = ranked action list: "Aanya is stuck on Layer 4 of Real Numbers — run the Assumptions prompt", "Arjun ready for Layer 7 essay", "5 students avoided Tutorial Defense — try Mr. Gupta's worked example".
- **Class Mind** = the radar + 7-layer heatmap across the class (which layer the class is weakest on for each chapter). One chart, not four widgets.
- **Each Student** = per-student card with the 7-layer spine, their last thought, last misconception, and one suggested next move.
- All numbers come from real tables; if a class has zero data, show an *empty state with a "seed demo class" button* instead of silent demo-data fallback. This restores trust.

### Move 3 — Make the 7 layers the spine of the whole app
- Rename `current_rung` UI everywhere to the 7 named layers.
- Episode flow renders the active layer's name + a one-line "what you are doing here" caption.
- Misconception map groups by layer, not by block type.
- Hook bridge (cricket → Pythagoras) becomes the *first 30 seconds of Layer 1*, not a separate dashboard tile.

### Plus the cleanups
- Delete `src/components/student/ParentWeeklyNote.tsx`.
- Replace inline-style cards with token-based components from `src/components/ui/*` so dark mode + mobile become consistent.
- Replace emoji-as-icon with `lucide-react` icons everywhere on adult-facing surfaces (teacher, parent). Keep emojis only inside playful student micro-moments.
- Remove all demo-data fallbacks; show real empty states. Wire the 20-student simulation script's output to a visible "demo class" the teacher can toggle on, so authenticity is preserved.

---

## 6. Suggested order of work (if you approve)

1. **Demolition pass** (small, fast)
   - Delete `ParentWeeklyNote.tsx` + any remaining import.
   - Strip the 4 KPI tiles from `StudentDashboard.tsx`.
   - Remove silent demo-data fallbacks from the four teacher widgets; introduce a single `useDemoMode()` toggle.

2. **Student "Today's one thought" hero** (one new component)
   - `TodayThoughtCard.tsx` — hero with concept · interest lens · next layer · echo of yesterday.
   - Right-rail `SevenLayerSpine.tsx` — vertical, themed, no numbers.

3. **7-layer rename + plumbing**
   - Map `current_rung 1..5` → 7-layer names with a single helper; ship a migration only if we need to widen the column.

4. **Teacher dashboard collapse**
   - New `TeacherDashboard.tsx` with `Today · Class Mind · Each Student` tabs.
   - `ClassLayerHeatmap.tsx` (chapter × layer) replaces the four-widget tab strip.
   - `StudentMindCard.tsx` per student.
   - Quietly retire (don't delete yet) `TeacherAnalytics / Insights / Performance / DailyTodo` and link them under "More" for now.

5. **Hook bridge becomes Layer 1's first beat**
   - Move the cricket/food/music lens out of dashboard tiles into the first screen of every episode.

6. **Authenticity pass**
   - Run `scripts/simulate-class.sh` against a real demo class; verify every widget shows the simulated data with **no fallback**.

7. **Visual unification pass**
   - Replace inline styles with `Card` from `ui/card`, design tokens, lucide icons, one font pair.

---

## 7. What I am NOT changing (guardrails)
- No new backend tables unless step 3 forces it.
- No change to auth, episodes content, or the simulation script logic.
- Parent channel: removed from product surface entirely as you asked. We can revisit later as an *email-only* artifact, not a dashboard component.

---

## 8. One question before I start

If you approve this direction, do you want me to **start with Moves 1+3 (student-facing 7-layer reframe)**, or with **Move 2 (teacher dashboard collapse)** first? They are independent and either can ship without the other.
