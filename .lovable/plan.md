

# Create Dedicated Voice Agent for Attraction Demo

## Problem
The Attraction Demo currently reuses `elevenlabs-buddy-session`, which creates a "Buddy" Study Companion agent with a completely different prompt (general study help). When a student starts a voice call in the Attraction Demo, they talk to Buddy instead of the 6-phase Sport-to-Syllabus tutor. The network logs also show a 404 from LiveKit, suggesting a session/agent mismatch.

## Solution
Create a **separate edge function** (`attraction-voice-session`) with a dedicated ElevenLabs Conversational AI agent that uses the Attraction System's 6-phase prompt. This keeps the two features fully independent.

## Changes

### 1. New Edge Function: `supabase/functions/attraction-voice-session/index.ts`
- Creates a dedicated ElevenLabs agent named "Sport-to-Syllabus Voice Tutor"
- Uses the same 6-phase system prompt from `attraction-flow` (Hook, Bridge, Ground, Branch, Apply, Advance)
- Stores agent ID in `app_config` table with key `attraction_agent_id` (separate from Buddy's `elevenlabs_agent_id`)
- Returns a conversation token for WebRTC
- Uses Tripti voice with `eleven_multilingual_v2` for Telugu + English support

### 2. Update `supabase/config.toml`
- Add `[functions.attraction-voice-session]` with `verify_jwt = false`

### 3. Update `src/pages/AttractionDemo.tsx`
- Change `BUDDY_SESSION_URL` to point to `attraction-voice-session` instead of `elevenlabs-buddy-session`
- Remove dependency on Study Companion's session entirely
- Keep all existing text chat + TTS + per-message speaker icon unchanged

### Files Changed

| File | Change |
|---|---|
| `supabase/functions/attraction-voice-session/index.ts` | New edge function with dedicated 6-phase voice agent |
| `supabase/config.toml` | Add function config entry |
| `src/pages/AttractionDemo.tsx` | Point voice call to new endpoint |

