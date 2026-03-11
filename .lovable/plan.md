

# Integrating HTML Reference Features — Best Flow Plan

## What the 5 HTML files contain vs what exists

| HTML Reference | Key Features | Current App Status |
|---|---|---|
| **Master Navigation** | 5-step learning journey, flow diagram, chapter cards | Missing — no guided onboarding flow |
| **Student Dashboard (Inner OS)** | Inner OS score circle, 5 dimensions (Clarity/Thinking/Attention/Momentum/Character), streak badge, Oxford Methods grid, Today's Focus, Recent Breakthroughs | Current StudentDashboard is a **schedule-based daily planner** — no Inner OS metrics |
| **Teacher Dashboard App** | Class selector, 4 stat cards (Clarity/Reasoning/Attention/Character), student table with Inner OS scores, alerts sidebar, AI Behavioral Insights | Current TeacherDashboard is a **generic school dashboard** — no Inner OS data |
| **Teacher Enhanced** | Curriculum Intelligence (why 7-layer works), pedagogy methods grid, student alerts, community insights, Command Centre modal | Missing entirely |
| **Textbook 7-Layer** | Clean layer-by-layer rendering with colored backgrounds, completion actions grid | Already implemented in TextbookEpisode — mostly covered |

## The Best Flow — Where Each Feature Goes

The user experience should follow the **Master Navigation's 5-step journey** naturally through existing routes:

```text
Step 1: Student Dashboard → Inner OS Overview (see where you are)
Step 2: Textbook → Learn episodes (already built)
Step 3: Post-episode → Oxford Methods (already built)
Step 4: Dashboard → Growth tracking (breakthroughs, streaks)
Step 5: Next chapter (already built)
```

## Plan — 3 Major Upgrades

### 1. Rebuild Student Dashboard with Inner OS (`src/pages/StudentDashboard.tsx`)

**Keep** the existing schedule/planner as a tab or section. **Add** the Inner OS overview as the hero section at the top.

New sections (top to bottom):
- **Header**: "Hi {name}" + streak badge (mock: "7 Day Streak")
- **Inner OS Overview**: Purple gradient card with score circle (73%), growth indicator, description text, and 5 dimension cards (Clarity, Thinking, Attention, Momentum, Character) each with score, progress bar, trend
- **Continue Learning**: Current chapter card with progress bar + "Continue Episode" button linking to textbook
- **Elite University Methods**: 4-card grid (Tutorial Defense, First Principles, Case Study, Peer Teaching) with availability status
- **Right sidebar**: Today's Focus card + Recent Breakthroughs list
- **Existing schedule**: Moved below or into a "Today's Schedule" tab

All data is **mock/static** for now — no database changes needed. The structure is ready for future behavioral tracking integration.

### 2. Rebuild Teacher Dashboard with Pedagogy Intelligence (`src/pages/TeacherDashboard.tsx`)

Replace the generic dashboard with the reference's pedagogy-focused layout:

New sections (top to bottom):
- **Header**: Welcome + class selector chips (Class 8-A, 8-B, 9-A)
- **Pedagogy Badge**: "Oxford & Harvard Pedagogy Active" gradient pill
- **Stats Grid**: 4 stat cards — Avg Clarity, Reasoning, Attention, Character with colored left borders and trend arrows
- **Main Grid** (2-column):
  - **Left — Curriculum Intelligence**: "Why This Curriculum Develops Thinking" insight box, "How It Builds Character" insight box, "What's Working Best" insight box, Elite Methods Performance grid (4 method cards with usage %)
  - **Right — Alerts**: "Needs Attention" cards (urgent/warning/info) with action buttons
- **AI Behavioral Insights**: Purple gradient card with 4 insight items (Class Strength, Needs Work, Behavioral Patterns, Time Saved)
- **Quick Actions Grid**: Grade Assignments, Create Quiz, Announcements, Teacher Community, Custom Cases, Exam Strategies

All mock data. Existing routes (attendance, assignments, performance) stay linked from Quick Actions.

### 3. Add Learning Journey Welcome for New Students (`src/pages/StudentOnboarding.tsx` or new component)

Add a "Learning Journey" section to the student textbook page (`StudentTextbook.tsx`) as a hero banner at the top:

- **Flow Diagram**: 5 connected boxes showing the learning loop: Dashboard → Learn Episode → Apply Method → Track Growth → Next Episode
- Visual arrows between steps
- This replaces the plain header and gives students context for the whole system

This is a lightweight addition — just a visual flow diagram component at the top of the textbook index page.

### Files Changed

| File | Change |
|---|---|
| `src/pages/StudentDashboard.tsx` | Full rebuild — Inner OS overview, 5 dimensions, methods grid, breakthroughs, keep schedule as secondary section |
| `src/pages/TeacherDashboard.tsx` | Full rebuild — Curriculum Intelligence, stats grid, student alerts, AI insights, pedagogy methods |
| `src/pages/StudentTextbook.tsx` | Add learning flow diagram banner at top |

### What stays untouched
- TextbookEpisode (already has 7-layer rendering, drag-drop, action bar)
- All existing routes, auth, navigation
- No database changes — all mock data for now

