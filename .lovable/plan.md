

## Supercharge Buddy: Smart Tools, Smooth Voice, Telugu Support

### What We're Building

Right now Buddy can only talk and navigate. We're upgrading him to:
- **Do things**: open textbook chapters, start quizzes, know what you're studying
- **Sound better**: use a calm, warm, caring voice (not the current Sarah voice)
- **Speak Telugu too**: support bilingual conversation (English + Telugu)
- **Be smarter about context**: know what page you're on and help accordingly

---

### Voice Selection

Replacing **Sarah** (current) with a warmer, calmer voice better suited for young students:

| Voice | ID | Why |
|-------|----|-----|
| **Lily** (primary) | `pFZP5JQG7iQjIQuC4Bku` | Warm, gentle, nurturing tone -- perfect for guiding children |
| **Matilda** (fallback) | `XrExE9yKIg1WjnnlVkGX` | Calm, clear, friendly -- great for explanations |

For Telugu support, we'll set the agent language to `multi` (multilingual) using the `eleven_multilingual_v2` model so Buddy can seamlessly switch between English and Telugu when the student speaks in Telugu.

---

### 6 Client Tools Buddy Gets

| Tool | What It Does | Example Voice Command |
|------|-------------|----------------------|
| **navigateTo** | Go to any page | "Take me to assignments" |
| **openTextbook** | Open a specific chapter or episode | "Open chapter 1 episode 3" |
| **startQuiz** | Start a pop quiz | "Quiz me on Science" |
| **getCurrentPage** | Tells Buddy where you are | (Buddy uses this automatically) |
| **getChapterList** | Lists available chapters | "What chapters can I study?" |
| **explainCurrentTopic** | Reads current episode content | "Explain what's on this page" |

---

### New System Prompt (Kid-Friendly, Voice-First)

Key changes from current prompt:
- Written for **spoken delivery** -- short sentences, no markdown, no special characters
- Instructions for **when to use each tool** so Buddy actually uses them
- **Telugu support**: "If the student speaks in Telugu, reply in Telugu naturally"
- **Always positive**: never say "wrong" -- say "almost! let's try again"
- **Age-appropriate**: analogies from cricket, movies, games that 6-10th graders relate to
- **Proactive**: "When you know what page they're on, mention it and offer help"

---

### Contextual Page Updates

When the student navigates to a new page, Buddy automatically gets told:
- "Student is now on Chapter 1: Real Numbers, Episode 3: Euclid's Algorithm"
- This lets Buddy say things like "Oh nice, you're looking at Euclid's Algorithm! Want me to explain how it works?"

---

### Changes Summary

**File 1: `supabase/functions/elevenlabs-buddy-session/index.ts`**
- Rewrite system prompt for voice-first delivery with tool usage instructions and Telugu support
- Change voice from Sarah to Lily (`pFZP5JQG7iQjIQuC4Bku`)
- Set voice settings: stability 0.35, similarity_boost 0.7, style 0.25 (warm, expressive)
- Add `client_tools` array in agent creation body with all 6 tools (name, description, parameters)
- Set language to `multi` for bilingual support
- Update first message to be warmer: "Hey there! I'm Buddy, your study buddy. I can help you with anything you're learning. What's on your mind?"

**File 2: `src/components/student/StudyCompanion.tsx`**
- Expand `clientTools` in `useConversation` from 1 tool to 6 tools
- Add `openTextbook`: navigates to `/student/textbook/{chapterId}/{episodeId}`
- Add `startQuiz`: sets new state `voiceQuizSubject` + `voiceQuizOpen`, renders `PopQuizModal`
- Add `getCurrentPage`: returns current path + readable context
- Add `getChapterList`: returns chapter titles and episode counts from textbookData
- Add `explainCurrentTopic`: returns episode content blocks as readable text
- Add `useEffect` on `location.pathname` to call `conversation.sendContextualUpdate()` with page description
- Import `chapters` from textbookData, `PopQuizModal` component
- Add `voiceQuizSubject`/`voiceQuizOpen` state + `PopQuizModal` render

**Database: Delete old agent ID**
- SQL migration: `DELETE FROM app_config WHERE key = 'elevenlabs_agent_id'`
- This forces the edge function to create a fresh agent with new tools, voice, and prompt on next call

---

### What Students Will Experience

- Buddy sounds calm, warm, and caring -- like a friendly older sibling
- "Buddy, quiz me on Maths!" -- quiz modal opens, Buddy reads questions
- "Open chapter 1" -- textbook opens to the right chapter
- "Explain what's on this page" -- Buddy reads and explains the current content
- Speaking in Telugu works naturally -- Buddy responds in Telugu
- Buddy knows where you are: "I see you're studying Real Numbers. Want me to explain Euclid's Division?"

