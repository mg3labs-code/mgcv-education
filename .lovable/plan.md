

# Textbook Learning Experience Enhancement Plan

## Overview
This is a large, multi-faceted enhancement touching engagement tracking, bug fixes, interaction gating, voice guidance, and JEE UI improvements across the textbook episode system.

---

## What Gets Built

### 1. Fix True/False Feedback Bug (EpisodeBlocks.tsx)
**Problem**: When a student selects the wrong True/False answer, the revealed answer still shows a green `✓` checkmark — misleading.
**Fix**: After T/F submission, show whether student was correct/wrong with distinct feedback (green "Correct!" vs red "Incorrect — the answer is...") instead of just revealing the answer with a green checkmark.

### 2. Gate "Continue" Button with Minimum Engagement (TextbookEpisode.tsx)
- **Reading sections** (concept, reasoning, connections, implications): Disable "Continue" for the first 90 seconds (not full 3-4 min, which would frustrate — 90s is the sweet spot). Show a subtle countdown: "Read for 1:12 more..."
- **MCQ/Assessment sections**: Disable "Continue" until ALL questions are attempted (submitted, not just selected).
- **All other interactive sections** (activity, exercise, explain, recall): Require `blockCompleted` before enabling Continue.
- The button shows a disabled state with a hint explaining why it's locked.

### 3. Pre-Reasoning Excitement Gate (TextbookEpisode.tsx)
Before entering the Master/Deep Reasoning phase (layer 6+), show a one-time interstitial:
- "Ready to think like a scholar? 🧠"
- Brief hook: "This is how Oxford students and JEE toppers approach problems — by questioning WHY."
- Two buttons: "Let's go!" (proceeds) and "Not yet" (stays on current block).
- Only shows once per episode (tracked in localStorage).

### 4. Voice Companion Integration — Section-Aware Guide
**New component**: `SectionVoiceGuide` — a persistent voice companion that:
- Knows which section the student is on and what content they're reading
- Auto-offers guidance on section entry: "This section is about [topic]. Let me explain the key idea..."
- Detects idle time (>60s no scroll/interaction): "Need help? Tap me to hear an explanation"
- On wrong MCQ answers: "Think about it differently — what if you consider..."
- Uses the existing `elevenlabs-tts-stream` edge function for Telugu/English voice
- Lives as a floating pill at the bottom of the content area (above the bottom bar)
- Same voice system as Buddy (reuses existing infrastructure)

### 5. Voice Input for ComprehensionCheck (ComprehensionCheck.tsx)
Add `CompanionVoiceInput` to the comprehension check textarea, so students can speak their understanding instead of typing. The component already exists — just wire it in.

### 6. JEE Questions — Card-by-Card Navigation (JeeProblemsBlock.tsx)
**Current**: Already implements one-at-a-time with Next/Previous — this is working correctly.
**Enhancement**: Add a collapsible card wrapper with excitement hook:
- Before showing the first question, show a teaser: "⚡ These are actual JEE-level problems. Top 2% of students solve these. Ready?"
- Add a progress bar showing question index.
- After completion, show comparison: "You scored X/Y — that puts you in the top Z% for this topic!"

### 7. Section Excitement Hooks (TextbookEpisode.tsx)
Add contextual micro-copy before each phase that connects to student interests:
- **Understand**: "This is the foundation — like learning the rules of your favorite game before playing"
- **Prove**: "Time to test yourself — just like how cricket players practice in nets before a match"
- **Master**: "Only elite thinkers reach this level — like how Sundar Pichai or APJ Abdul Kalam approached problems"
- These are subtle one-line hooks shown below the section title, replacing the current static `blockSubtitles`.

### 8. Track MCQ Answer Changes (EpisodeBlocks.tsx)
In `AssessmentBlock`, track how many times a student changes their selected answer before submitting. Pass this count to `onWrongAttempt` or a new callback. Persist in `episode_interactions`.

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/textbook/EpisodeBlocks.tsx` | T/F bug fix, MCQ answer change tracking, completion gating |
| `src/pages/TextbookEpisode.tsx` | Continue button gating (time + completion), pre-reasoning gate, section hooks, voice guide integration |
| `src/components/textbook/ComprehensionCheck.tsx` | Add voice input option |
| `src/components/textbook/JeeProblemsBlock.tsx` | Excitement teaser, completion comparison |
| New: `src/components/textbook/SectionVoiceGuide.tsx` | Section-aware voice companion pill |

## Database Changes
- Add `answer_changes` integer column to `episode_interactions` table (migration)

## Priority Order
1. True/False bug fix (immediate quality fix)
2. Continue button gating (biggest learning impact)
3. Voice input in ComprehensionCheck (quick win)
4. Pre-reasoning excitement gate
5. MCQ answer change tracking
6. JEE card excitement hooks
7. Section voice guide (most complex, biggest engagement boost)

