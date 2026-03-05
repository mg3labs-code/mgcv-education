

# Fix TTS 400 Error + Add Per-Message Speaker Icon + Telugu/Simple English Support

## Root Cause of 400 Error

The edge function uses `eleven_turbo_v2_5` model which is English-only and doesn't handle multilingual text well. The text being sent may also still contain problematic characters after sanitization. Additionally, long AI responses can exceed ElevenLabs' character limits.

## Changes

### 1. Edge Function: `supabase/functions/elevenlabs-tts-stream/index.ts`
- Switch model from `eleven_turbo_v2_5` to `eleven_multilingual_v2` (supports Telugu + English)
- Truncate text to 4500 chars max (ElevenLabs limit is 5000)
- Add more aggressive sanitization (strip all non-BMP chars, control chars)
- Log the sanitized text length for debugging
- Use Tripti voice (`1Z7Y8o9cvUeWq8oLKgMY`) as default — child-friendly Indian voice per existing memory

### 2. Edge Function: `supabase/functions/attraction-flow/index.ts`
- Update system prompt to instruct AI to:
  - Use very simple English (Grade 6-8 level)
  - Mix Telugu words naturally where helpful ("idi chaala interesting!")
  - Keep sentences short (2-3 sentences per paragraph)
  - Avoid jargon — explain every science term in plain words
  - Be warm, slow-paced, like a friendly elder sibling

### 3. Frontend: `src/pages/AttractionDemo.tsx`
- Add a small 🔊 speaker icon on each **assistant** message bubble (like ChatGPT's read-aloud button)
- Clicking it calls `speakText(msg.content)` for that specific message
- Icon shows as animated/pulsing when that message is currently being spoken
- Track `speakingMsgIndex` state to know which message is playing
- Remove auto-speak on every response (user controls when to listen via icon)
- Keep the global Voice On/Muted toggle as master override

### Files Changed

| File | Change |
|---|---|
| `supabase/functions/elevenlabs-tts-stream/index.ts` | Switch to `eleven_multilingual_v2`, Tripti voice default, truncate text, better sanitization |
| `supabase/functions/attraction-flow/index.ts` | Update system prompt for simple English + Telugu support |
| `src/pages/AttractionDemo.tsx` | Add per-message speaker icon, track speaking state per message |

