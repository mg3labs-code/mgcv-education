

# Visual Polish: LearnTab Browse Mode + TextbookEpisode Lesson Mode

## What Changes (UI only — no backend/DB changes)

### 1. `src/components/student/LearnTab.tsx` — Match provided JSX visual design

**Continue Where You Left Off card:**
- Add a `▶️` emoji prefix in the section title
- Add a numbered circle badge (episode number) on the left side of the card
- Change gradient from blue/purple to match provided JSX (`#F0FDFA` lighter feel)
- Add "Continue →" as a proper styled button (teal `#0D9488` background, white text, rounded 10)

**Recently Visited cards:**
- Add subject icon + subject name + time label in the top row of each card
- Add a mini progress bar with percentage below the chapter title
- Match the `minWidth: 210`, rounded 10, horizontal scroll layout from JSX

**My Textbook header:**
- Add `📚 My Textbook` header with "Class X • Telangana State Board" subtitle above subject tabs
- Add "Every chapter transformed into bite-sized lessons" tagline

**Chapter list styling:**
- Add chapter description text (`ch.subtitle`) below chapter title
- Add `⏱ {periods} periods` and `📄 Pages {pageRange}` info badges
- Show `🔒` icon + "Coming Soon" badge for chapters with 0 progress and no episodes
- Expanded lesson list: add `⏱ {duration}` + `• {blocks} blocks` + type tag badges per lesson
- Add explicit "Continue →" button on current lesson, "✓ Done" label on completed lessons

**Scholar Methods cards:**
- Add session count display (`{n} done`) using real `methodCounts` data (already wired)
- Match vertical card layout from provided JSX with icon left, text right

### 2. `src/pages/TextbookEpisode.tsx` — Adopt lesson navigation shell

**Phase-based sidebar (replace current sidebar):**
- Redesign the left sidebar to show 3 phases with headers: icon + label + completion fraction (e.g., "2/3")
- Each section shows: completion circle (✓ if done, 🔒 if locked, emoji if available) + title + type label
- Active section gets phase-color background tint
- Match provided JSX styling: cream/white bg, stone borders, `#F5F5F4` hover

**Lesson top bar (new, above content):**
- Add a bar with: `☰ Sections` toggle button + phase breadcrumb trail ("🔍 Discover & Explore › What's the big idea?")
- Right side: section counter `{n}/11` + mini progress bar + `⋯ Tools` toggle

**Collapsible Tools toolbar:**
- Replace current gradient pill action bar with a collapsible toolbar triggered by "⋯ Tools"
- 4 buttons: 🗺️ MINDMAP, ✏️ PRACTICE, 📚 Q BANK, 🔍 SEARCH — same functionality, new layout
- Match provided JSX inline styles (teal/purple/blue/amber borders, white bg, rounded 8)

**Section navigation (bottom of each section):**
- Add Previous/Next buttons at bottom matching provided design (stone border, rounded 12)
- Show "✓ Section complete" label between buttons when section is marked understood

**What stays unchanged:**
- All block renderers (ConceptBlock, ActivityBlock, RecallBlock, etc.)
- All Supabase data fetching and progress persistence
- Voice/AI integrations, drag-and-drop, language-aware rendering
- IntersectionObserver, scroll progress, understood blocks tracking

### Files Modified
1. `src/components/student/LearnTab.tsx` — Visual restyling of all 4 sections
2. `src/pages/TextbookEpisode.tsx` — Navigation shell upgrade (sidebar + top bar + tools toolbar + section nav)

