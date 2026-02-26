

# AI Study Companion Chatbot with Persistent Chat History

## What You Get

A floating AI chatbot on every student page that:
- Answers doubts, explains concepts step-by-step, and motivates students
- Navigates to any page on command ("take me to assignments")
- Accepts voice input (speak your question or explanation)
- Remembers conversation history across sessions (stored in the database)
- Knows what page/topic you're on and adapts its responses
- Proactively greets you based on context ("I see you're studying Real Numbers!")
- Streams responses token-by-token for a real-time feel

## Architecture

```text
+---------------------------+
|  Floating Chat Button     |  (bottom-right corner, all student pages)
|  Click to expand panel    |
+---------------------------+
         |
  +------v---------+     +------------------+
  | StudyCompanion  |---->| study-companion  |  (backend function)
  | (React widget)  |<----| (streaming SSE)  |
  +----------------+      +------------------+
         |                        |
  +------v---------+     +-------v----------+
  | Voice Input     |     | Lovable AI       |
  | (reuse mic      |     | (Gemini Flash)   |
  |  recording)     |     +------------------+
  +----------------+
         |
  +------v---------+
  | chat_sessions & |  (database tables for persistence)
  | chat_messages    |
  +----------------+
```

## Database Tables

### `chat_sessions`
- `id` (uuid, PK)
- `user_id` (uuid, not null)
- `title` (text, default 'New Chat')
- `created_at`, `updated_at` (timestamps)

### `chat_messages`
- `id` (uuid, PK)
- `session_id` (uuid, FK to chat_sessions)
- `user_id` (uuid, not null)
- `role` (text: 'user' | 'assistant' | 'system')
- `content` (text)
- `context` (jsonb, nullable -- stores page, topic, subject info)
- `created_at` (timestamp)

RLS policies: users can only read/write their own sessions and messages.

## Files to Create

### 1. `supabase/functions/study-companion/index.ts`
- Streaming SSE edge function using Lovable AI gateway
- Model: `google/gemini-3-flash-preview`
- System prompt: friendly 10th-grade study companion, knows the app's page structure, breaks down complex concepts, motivates, can suggest navigation
- Accepts `{ messages, context }` where context = current page, topic, subject
- Navigation: when AI detects intent like "go to assignments", responds with `[NAV:/student/assignments]` tag that frontend parses
- Handles 429/402 rate limit errors

### 2. `src/components/student/StudyCompanion.tsx`
Main floating chatbot widget:
- Floating button (bottom-right) with gradient and pulse animation
- Expandable chat panel (~400px wide, ~550px tall)
- Message list with simple markdown-like rendering
- Text input + send button
- Voice input button (records audio, calls `transcribe-voice`, sends transcript as message)
- Quick action chips: "Explain this topic", "Quiz me", "Go to Assignments"
- Streams AI responses token-by-token
- On mount: loads most recent session from DB, or creates new one
- Every message sent/received is persisted to `chat_messages`
- Detects current route via `useLocation()` and passes as context
- Parses `[NAV:...]` in AI responses to trigger `navigate()`
- Proactive greeting on first open based on current page

### 3. `src/components/student/CompanionVoiceInput.tsx`
Lightweight voice recording component:
- Record button with timer display
- Uses MediaRecorder (same pattern as VoiceExplainWidget)
- Calls existing `transcribe-voice` edge function
- Returns transcript text to parent component
- No feedback analysis -- just transcription for chat input

## Files to Edit

### 4. `src/components/DashboardLayout.tsx`
- Import and render `<StudyCompanion />` for student role

### 5. `src/components/PageLayout.tsx`
- Import and render `<StudyCompanion />` for student role

### 6. `supabase/config.toml`
- Add `[functions.study-companion]` with `verify_jwt = false`

## Key Implementation Details

### Persistent Chat
- On companion open: `SELECT * FROM chat_sessions WHERE user_id = auth.uid() ORDER BY updated_at DESC LIMIT 1`
- If no session exists, create one
- Load last 50 messages for that session
- Every new user/assistant message is INSERTed immediately
- "New Chat" button creates a fresh session

### Context Awareness
The frontend sends context with each message:
- `/student` -> `{ page: "dashboard", todayTopics: [...] }`
- `/student/textbook/ch1/ch1-ep3` -> `{ page: "textbook", chapter: "Real Numbers", episode: "Euclid's Algorithm" }`
- `/student/assignments` -> `{ page: "assignments" }`

### Navigation via AI
System prompt includes available routes. When AI detects navigation intent, it includes `[NAV:/student/textbook]` in its response. Frontend regex-matches this and calls `navigate()`.

### Voice Input Flow
1. Student taps mic icon in chat
2. CompanionVoiceInput records audio
3. Audio sent to existing `transcribe-voice` edge function
4. Transcript becomes the chat message (sent to study-companion)
5. AI responds in text

### Streaming
- Frontend uses `fetch()` to the edge function URL with SSE parsing
- Token-by-token rendering into the last assistant message
- Handles `[DONE]`, CRLF, partial JSON correctly

### Future Expansion Path
- Store voice explanation transcripts linked to topics for spaced repetition
- Add "quiz me" mode where AI generates contextual MCQs
- Track conversation analytics (most asked topics, common misconceptions)
- Add teacher visibility into common student questions
- Integrate with assignment context to help with homework (without giving answers)

