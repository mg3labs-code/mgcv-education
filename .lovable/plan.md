

# Buddy Companion: Telugu Voice Agent + Teacher Access

## Two Changes

### 1. Telugu-Optimized ElevenLabs Voice Agent

**Problem**: The Buddy voice agent is created with English-default TTS settings (stability 0.45, style 0.40). When a student is on a Telugu chapter page, the live WebRTC voice call still uses these English settings — unlike the TTS stream which already uses expressive Telugu settings.

**Solution**: Accept a `language` hint from the client. When `language === "telugu"`, use session-level overrides to apply the expressive Telugu settings (stability 0.3, similarity_boost 0.8, style 0.5, speed 0.9) on the conversation token request. The client will detect Telugu pages from the URL path (`/tel-`) and pass the hint.

**Changes**:
- **`supabase/functions/elevenlabs-buddy-session/index.ts`** — Accept `{ language }` from request body. When Telugu, pass `conversation_config_override` with TTS voice settings (stability 0.3, similarity_boost 0.8, style 0.5) to the agent token generation. Add Telugu-aware instructions to agent prompt about speaking expressively in Telugu.
- **`src/components/student/StudyCompanion.tsx`** — In `startVoiceAgent()`, detect if current path contains `tel-` subject prefix and pass `language: "telugu"` to the buddy session endpoint.

### 2. Add Buddy Chatbot for Teachers

**Problem**: Only students get the floating Buddy companion (gated by `role === "student"` in App.tsx). Teachers have no AI assistant for navigating their dashboard features.

**Solution**: Make StudyCompanion role-aware — render for both students and teachers with role-specific behavior.

**Changes**:
- **`src/App.tsx`** — Rename `StudentCompanionWrapper` to `CompanionWrapper`, allow both `student` and `teacher` roles, pass `role` prop to `StudyCompanion`.
- **`src/components/student/StudyCompanion.tsx`** — Accept optional `role` prop. When role is `teacher`:
  - **Navigation routes**: Add teacher routes (dashboard → `/teacher`, assignments → `/teacher/assignments`, analytics → `/teacher/analytics`, attendance → `/teacher/attendance`, schedule → `/teacher/schedule`, insights → `/teacher/insights`, daily plan → `/teacher/daily-todo`, performance → `/teacher/performance`, exam room → `/teacher/exam-room`)
  - **Page context**: Add teacher page context detection (`/teacher/*` paths)
  - **Quick actions**: Show teacher-specific quick actions (Go to Assignments, Take Attendance, View Analytics, Daily Plan)
  - **Greeting**: Teacher-specific greetings ("Hey! I'm Buddy, your teaching assistant...")
  - **System prompt context**: Send `role: "teacher"` to the study-companion edge function so AI knows to help with teacher tasks
- **`supabase/functions/study-companion/index.ts`** — Accept `role` field. When teacher, prepend teacher-specific system instructions ("You are helping a teacher manage their classroom...navigate to teacher pages...help with grading, attendance, analytics")

## Files Modified
1. `supabase/functions/elevenlabs-buddy-session/index.ts` — Telugu override support
2. `src/components/student/StudyCompanion.tsx` — Role-aware companion with teacher routes/context
3. `src/App.tsx` — Mount companion for teachers too
4. `supabase/functions/study-companion/index.ts` — Teacher-aware system prompt

