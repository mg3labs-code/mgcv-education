

# Unified Schedule-Calendar-Textbook Flow

## Problem
Three disconnected systems: Dashboard has a full schedule tab with Class/DeepDive/PopQuiz buttons, Calendar page is a standalone monthly-only subject picker, and Deep Dive is a separate page that often breaks. No cohesive daily planner.

## What Changes

### 1. Dashboard — Compact Schedule Only
- Remove the "Overview / Schedule" tab toggle
- Keep Inner OS hero + dimensions as the main view
- Replace the schedule tab with a **compact "Today's Classes"** card showing: current class (highlighted with "NOW" + "Open" button that deep-links to the episode) + next 3-4 classes as small pills (time + subject name only, no action buttons)
- Add "View Full Schedule →" link that navigates to `/student/calendar`
- Keep Continue Learning and Elite Methods sections

### 2. Calendar Page — Daily Plan + Monthly View
- Replace the current subject-picker-first monthly calendar with a **two-view** page: "Today's Plan" (default) and "Monthly"
- **Today's Plan**: Full daily timeline with all classes + breaks, each class card has 3 action buttons:
  - **Class** → navigates to `/student/textbook/{chapterId}/{episodeId}` (Layer 1-2)
  - **Deep Dive** → navigates to `/student/textbook/{chapterId}/{episodeId}?layer=deep` (Layer 3)
  - **Pop Quiz** → opens PopQuiz modal for that subject
- Each button uses `topicTextbookMap` to resolve the correct episode; if no match, show "Coming Soon"
- **Monthly**: Subject filter tabs + monthly grid calendar (existing logic, moved here as second tab)
- Tapping a date in Monthly opens the matching episode

### 3. Deep-Link Support in TextbookEpisode
- Accept `?layer=deep` or `?layer=quiz` query params to auto-scroll/focus on the appropriate layer when opened from Calendar

### 4. Remove StudentDeepDive Page
- The standalone `/student/deep-dive` page becomes unnecessary — all deep-dive actions now link directly to the textbook episode with a layer param

## Files Modified
1. `src/pages/StudentDashboard.tsx` — Remove schedule tab, add compact Today's Classes card with NOW highlight + "View Full Schedule" link
2. `src/pages/StudentCalendar.tsx` — Full rewrite: Today's Plan (daily timeline with action buttons) + Monthly view (subject tabs + grid)
3. `src/pages/TextbookEpisode.tsx` — Accept `?layer=deep|quiz` query param for auto-scrolling
4. `src/data/topicTextbookMap.ts` — Add mappings for Science, English, Social Science, Hindi, Sanskrit subjects
5. `src/App.tsx` — Remove `/student/deep-dive` route (optional, can keep as redirect)

## Design Reference
Follows the uploaded mockups: cream/white cards, teal accents, timeline with colored dots, action buttons as outlined pills (Class in teal, Deep Dive in purple, Pop Quiz in amber).

