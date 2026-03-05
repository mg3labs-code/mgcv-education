

# Add Sarvam AI Voice Call Option (Separate from ElevenLabs)

## Architecture

Sarvam does not have a single full-duplex conversational agent like ElevenLabs. Instead, we build a live call experience by combining three pieces:

```text
User speaks into mic
  --> Sarvam STT (WebSocket: wss://api.sarvam.ai/speech-to-text/ws)
  --> Transcribed text sent to attraction-flow AI (existing edge function)
  --> AI response text streamed back
  --> Sarvam TTS (WebSocket: wss://api.sarvam.ai/text-to-speech/ws)
  --> Audio chunks played back in real-time
  --> Feels like a live call with Indian-accented voice
```

This runs entirely through a **new edge function** that acts as a WebSocket relay, keeping the `SARVAM_API_KEY` secure on the server side. The browser connects via a simple WebSocket to our edge function.

## What Gets Built

### 1. Secret: `SARVAM_API_KEY`
User needs to provide their Sarvam AI API key from [dashboard.sarvam.ai](https://dashboard.sarvam.ai).

### 2. New Edge Function: `sarvam-voice-session`
Acts as a relay between the browser and Sarvam's STT + TTS WebSocket APIs:
- Browser sends audio chunks (PCM from mic) to our edge function
- Edge function forwards to Sarvam STT WebSocket, gets transcription
- Sends transcription to the attraction-flow AI for a response
- Streams AI response text to Sarvam TTS WebSocket
- Returns TTS audio chunks back to browser for playback

**However**, Supabase Edge Functions do not support WebSocket servers. So we need a different approach.

### Revised Architecture (HTTP-based, practical for Edge Functions)

Since we cannot run a WebSocket server in edge functions, we use a **turn-based approach** that still feels like a call:

```text
[Browser]
1. Capture mic audio (MediaRecorder)
2. On silence detection (VAD), send audio to edge function
3. Edge function:
   a. Sarvam STT REST API → transcript
   b. Send transcript to attraction-flow AI → response text  
   c. Sarvam TTS REST API → audio bytes
   d. Return audio + transcript + AI text
4. Browser plays audio immediately
5. Loop: listen again after playback ends
```

This creates a hands-free "call" experience where the student speaks, AI responds with an Indian-accented voice, and it loops automatically.

### 3. New Edge Function: `sarvam-voice-relay`
Single HTTP endpoint that:
- Receives base64 audio from browser mic
- Calls Sarvam STT REST (`POST /speech-to-text`) to transcribe
- Sends transcript to AI (calls `attraction-flow` internally or uses same Lovable AI logic)
- Calls Sarvam TTS REST (`POST /text-to-speech`) with Bulbul v3 model
- Returns: `{ userTranscript, aiResponse, audioBase64 }`

### 4. UI Changes in `AttractionDemo.tsx`
- Add a **second call button** next to the existing ElevenLabs phone icon
- Use a different icon/color (e.g., orange with a globe icon) labeled "Sarvam" or "Indian Voice"
- When active, show a similar green overlay but with "Sarvam Voice" indicator
- Implements a simple voice loop:
  - Start mic recording
  - On silence (using simple volume-based VAD), stop recording
  - Send audio to `sarvam-voice-relay`
  - Play returned audio
  - Auto-restart mic after playback ends
- Transcripts appear in the same overlay format as ElevenLabs call

### 5. Voice Settings
- STT: Sarvam Saaras v2.5 model, language `en-IN` (handles code-mixed English/Telugu/Hindi)
- TTS: Bulbul v3, speaker `anushka` (warm female), language `en-IN`, pace 0.9

## Files to Create/Change

| File | Change |
|---|---|
| New: `supabase/functions/sarvam-voice-relay/index.ts` | Edge function: STT → AI → TTS pipeline |
| `src/pages/AttractionDemo.tsx` | Add second call button, Sarvam voice loop logic, VAD silence detection |
| `supabase/config.toml` | Add `verify_jwt = false` for new function |
| Secret | `SARVAM_API_KEY` needed |

## UI Layout

```text
Header: [... existing ...] [📞 ElevenLabs Call] [🌐 Sarvam Call] [🔊 Voice] [↻ Reset]
```

Both call buttons are independent — only one can be active at a time. Starting one auto-stops the other.

## Key Differences Between the Two Call Options

| Aspect | ElevenLabs Call | Sarvam Call |
|---|---|---|
| Connection | Full-duplex WebRTC | Turn-based HTTP relay |
| Latency | Very low (~200ms) | Medium (~1-2s per turn) |
| Voice accent | Western English | Indian English (natural) |
| Interruption | Yes (real-time) | No (wait for turn) |
| Telugu support | No | Yes (native) |
| Feel | Phone call | Walkie-talkie style |

