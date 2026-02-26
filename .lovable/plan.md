

# Make Buddy Auto-Open and Voice-First

## Issues Found
1. **Not automatic**: The chatbot requires clicking the floating button to open. It should auto-open on first visit to greet the student proactively.
2. **Voice not prominent**: The mic button is small and placed to the left of the text input, easy to miss. It should be more visible and encouraged.

## Changes

### 1. Auto-open on first student visit (`StudyCompanion.tsx`)
- Auto-open the chat panel the first time a student lands on any page (use `localStorage` flag `buddy_has_opened`)
- On subsequent visits, keep it closed but show a greeting tooltip/badge on the floating button
- Add a small bounce animation + "Hey! Need help?" tooltip on the floating button when closed

### 2. Make voice input more prominent (`StudyCompanion.tsx`)
- Move the mic button to be larger and more visible next to the send button
- Add a pulsing "Tap to speak" hint on the mic button when the chat first opens and the input is empty
- Show voice recording timer more visibly inside the input area

### 3. Proactive nudge after idle (`StudyCompanion.tsx`)
- After 30 seconds on a page with no interaction, show a subtle notification badge on the floating button with a contextual message like "Need help with Real Numbers?"

## Technical Details

### File: `src/components/student/StudyCompanion.tsx`
- Add `useEffect` to auto-open on first visit using `localStorage.getItem("buddy_has_opened")`
- Add a notification dot/tooltip on the floating button when closed
- Reorder the input area: text input first, then voice button (larger, with label), then send
- Add idle timer that shows a badge after 30s

### File: `src/components/student/CompanionVoiceInput.tsx`
- Increase button size from `h-8 w-8` to `h-9 w-9`
- Add a "Speak" label next to the mic icon when not recording
- Show seconds timer more prominently during recording

