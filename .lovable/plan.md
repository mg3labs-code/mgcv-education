

## Consolidated Plan: Everything Remaining + New Additions

### Status Check — What's DONE vs NOT DONE

**DONE (from previous steps):**
- RecallBlock "Got it ✓ / Not yet ✗" self-assessment buttons
- ReasoningBlock 10-second think-first countdown gate
- AssumptionsBlock believe/doubt toggle + reflection prompt
- WhyThisWorks landing section (School/Coaching/EduTech + 4 university cards)
- Micro-connection toasts after block completion in TextbookEpisode

**NOT DONE (from previous steps):**
- Growth Path Visualization in student dashboard
- Dedicated Board vs JEE comparison page
- "What Comes After" career timelines (JEE/NEET/Olympiad)
- Full university methods detailed mapping (IIT/Oxford/Harvard/Stanford)
- Stanford card missing from WhyThisWorks
- No navigation links to vision content from dashboards

---

### What We're Building Now — Full List

#### 1. Board vs JEE Adaptive Comparison Page
**New page:** `src/pages/AdaptiveComparison.tsx` (route: `/board-vs-jee`)
- Interactive tab selector across 4 block types (Concept, Recall, Assumptions, Debate)
- Side-by-side columns: Board Mode (calm, self-paced) vs JEE Mode (timed, trap alerts, previous year questions)
- Shows parents and students that the SAME content adapts to different needs
- Clean, content-heavy but well-spaced — not cluttered

#### 2. Homepage Section: "India's Only Research-Proven Learning Methods"
**Enhanced section on landing page** (before login, in `Index.tsx`)
Combines the "What Comes After" career content + University Methods into ONE clean section with two sub-parts:

**Part A — "What Qualifying Unlocks"**
- 3 expandable cards: JEE (IIT journey), NEET (Medical journey), Olympiad (MIT/Stanford path)
- Each expands to show: year-by-year timeline, salary ranges, top recruiters
- Shows HOW university learning connects back to what students practice on EduTech

**Part B — "Elite University Methods, Built In"**
- Tabbed selector: IIT, Oxford, Harvard/MIT, Stanford
- Each tab shows: the university's teaching method, a mapping table (EduTech feature → University equivalent), and a quote
- Add Stanford (Design Thinking) as the 4th university — currently missing

**Section naming:** "India's Only Research-Proven Learning Methods" or "Backed by the World's Best Teaching Methods"
- Not cluttered — clean cards, expandable details, tabs to avoid overwhelm

#### 3. Growth Path Visualization in Student Dashboard
**New component:** `src/components/student/GrowthPathVisualization.tsx`
- Added to `GrowthTab.tsx`
- Vertical timeline mapping 5 Inner OS dimensions to real career outcomes:
  - Clarity → Research, Medicine, Law
  - Thinking → JEE Advanced, PhDs, Innovation
  - Attention → Deep Work, Engineering
  - Momentum → Sports discipline, Entrepreneurship
  - Character → IIM interviews, Leadership
- Each node shows current score from existing `student_inner_os` data
- No new database queries needed

#### 4. Update WhyThisWorks with Stanford + CTA
- Add Stanford (Design Thinking) as 5th university method card
- Add CTA: "See Board vs JEE Mode →" linking to `/board-vs-jee`

#### 5. Navigation Links
- Student SideNav: link to `/board-vs-jee`
- Landing page: smooth scroll to the new research-methods section

---

### Files

**Created:**
- `src/pages/AdaptiveComparison.tsx` — Board vs JEE interactive comparison
- `src/components/student/GrowthPathVisualization.tsx` — Inner OS career mapping
- `src/components/landing/ResearchProvenMethods.tsx` — combined career timelines + university methods section

**Modified:**
- `src/components/landing/WhyThisWorks.tsx` — add Stanford card + CTA
- `src/pages/Index.tsx` — add ResearchProvenMethods section
- `src/components/student/GrowthTab.tsx` — add GrowthPathVisualization
- `src/App.tsx` — add `/board-vs-jee` route
- `src/components/SideNav.tsx` — add navigation link

### Design Principles
- Content-heavy but NOT clumsy: expandable cards, tabs, progressive disclosure
- Mobile-first (390px viewport), matching existing glassmorphism/teal design system
- framer-motion scroll-reveal animations consistent with landing page
- No inline styles — all Tailwind + shadcn components

