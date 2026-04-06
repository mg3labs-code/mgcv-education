

# Update Buddy Edge Function for V3 (Dashboard-Published)

You published the v3 upgrade on the ElevenLabs dashboard. Now the code needs to stop overriding back to v2.

## Changes needed

### 1. Remove TTS override in Telugu session (lines 214-219)
The Telugu session override currently forces `model_id: "eleven_multilingual_v2"` with manual stability/similarity settings. Since the dashboard agent is now v3 with expressive mode, these overrides would **downgrade it back to v2**. Remove the entire `tts` block from the Telugu override — only keep the prompt and language override.

### 2. Remove TTS from agent creation fallback (lines 148-153)
The `getOrCreateAgent` function creates a new agent with `model_id: "eleven_multilingual_v2"` if no cached agent exists. Update this to `eleven_v3_conversational` (matching what the dashboard now uses) and remove the manual `stability`/`similarity_boost` settings since v3 expressive mode doesn't use them.

### 3. Update response metadata (line 251)
Change the returned `model` field from `"eleven_multilingual_v2"` to `"eleven_v3_conversational"`.

### 4. Clear cached agent ID (SQL migration)
Delete the old `elevenlabs_agent_id` from `app_config` so the function picks up the dashboard-published agent on next call.

## Files modified
- `supabase/functions/elevenlabs-buddy-session/index.ts` — remove v2 TTS overrides
- New SQL migration — clear stale agent cache

