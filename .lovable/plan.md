

# Confirmation: Collapsible Textbook Status & Remaining Work

## Current State

| Feature | Status |
|---------|--------|
| Collapsible "📖 Your Textbook Says…" in interactive view | ✅ Already works (TextbookEpisode.tsx lines 511-570) |
| Reading mode slider toggle | Still present — needs to be REMOVED |
| FullTextbookView (full reading mode) | Still renders inside episode — needs to move to standalone route |
| Phase 3 locking (sections 8-12) | Not implemented yet |

## What Needs to Be Done

### 1. Remove the reading mode slider from TextbookEpisode.tsx
- Delete `readingMode` state and the toggle UI
- Delete the conditional `FullTextbookView` rendering
- Students see ONLY the interactive 11-section view with the existing collapsible textbook refs

### 2. Add Phase 3 locking
- Sections 8-12 (Reasoning, Assumptions, Connections, Application, Implications) locked until all Phase 1+2 sections marked "Got it!"
- Locked sections show 🔒 in the bottom sheet
- Toast message when trying to access locked sections

### 3. Standalone textbook reference route
- New route `/textbook-reference/:chapterId/:episodeId`
- New page `src/pages/TextbookReference.tsx` rendering `FullTextbookView`
- For schools/clients only — no student nav links

## Files
- `src/pages/TextbookEpisode.tsx` — remove slider, add phase lock
- `src/App.tsx` — add route
- `src/pages/TextbookReference.tsx` — new standalone page

