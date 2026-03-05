

# Add Browser TTS Fallback for ElevenLabs Failures

## What Changes

When ElevenLabs TTS returns any error (401, quota exceeded, network failure), automatically fall back to the browser's built-in `speechSynthesis` API so students always hear voice responses.

## How It Works

```text
Voice input detected
  --> speakResponse(text)
    --> Try ElevenLabs TTS stream
      --> Success? Play audio (current behavior)
      --> Failed (401/quota/network)?
        --> Fall back to browser speechSynthesis
        --> Pick best available voice (prefer Google/Microsoft natural voices)
        --> Speak the cleaned text
        --> Student hears response either way
```

## Changes in `src/components/student/StudyCompanion.tsx`

### 1. Add a `browserTTSFallback` helper function

A small helper that uses `window.speechSynthesis` to speak text:
- Cancels any ongoing browser speech first
- Selects the best available voice (prefers English voices from Google/Microsoft for quality, falls back to any English voice, then default)
- Sets natural rate (0.95) and pitch (1.0)
- Hooks into `onend`/`onerror` to reset `isSpeakingTTS` state
- Tracks the utterance so it can be cancelled if user sends a new message

### 2. Update `speakResponse` to use fallback on error

Currently at line 359-362, the code just logs and returns on error. Change this to:
- If ElevenLabs returns non-OK (401, 402, 429, 500, etc.), call `browserTTSFallback(cleaned)` instead of silently returning
- If the fetch throws (network error), also call `browserTTSFallback(cleaned)` in the catch block

### 3. Cancel browser speech on new input

Update the TTS cancellation logic (already at top of `speakResponse` and `sendMessage`) to also call `window.speechSynthesis.cancel()` so browser fallback speech is also interrupted when:
- A new message is sent
- A new TTS playback starts

### 4. No new dependencies needed

`speechSynthesis` is built into all modern browsers -- no packages or edge functions required.

## Result

- **ElevenLabs working**: High-quality voice (no change from current behavior)
- **ElevenLabs down/quota exceeded**: Browser voice kicks in seamlessly -- student still hears the response
- **Interruption behavior preserved**: Both ElevenLabs audio AND browser speech are cancelled when new input arrives (latest-wins rule intact)

