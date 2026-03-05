

# Switch to a Better Voice for Telugu Pronunciation

## Current Issue
The "Tripti" voice (`1Z7Y8o9cvUeWq8oLKgMY`) is a community voice that may not be in your ElevenLabs account's "My Voices" library, which can cause `voice_not_found` errors. Additionally, it's likely English-primary, causing choppy Telugu output.

## Approach

ElevenLabs doesn't expose native Telugu voice IDs publicly -- they must be discovered through the [Voice Library](https://elevenlabs.io/voice-library). However, we can make two immediate improvements:

### 1. Switch to a reliable premade voice with strong multilingual support
Use **"Jessica"** (`cgSgspJ2msm6clMCkdW9`) -- a premade voice available on all accounts with warm, playful tone that works well with `eleven_multilingual_v2` for Indian languages. Alternatively, **"Alice"** (`Xb7hH8MSUJpSbSDYk0k2`) is described as a "Clear, Engaging Educator" which fits the tutor use case.

### 2. Set language to `"te"` (Telugu) instead of `"hi"` (Hindi)
ElevenLabs multilingual_v2 supports Telugu directly. Using `"te"` gives better phoneme selection than the Hindi approximation.

### Files Changed

| File | Change |
|---|---|
| `supabase/functions/attraction-voice-session/index.ts` | Switch voice_id to `cgSgspJ2msm6clMCkdW9` (Jessica), set language to `"te"`, clear cached agent |
| `supabase/functions/elevenlabs-tts-stream/index.ts` | Switch default voice_id to `cgSgspJ2msm6clMCkdW9` |

### Finding a Native Telugu Voice (Manual Step)
To get even better quality, you can browse the [ElevenLabs Voice Library](https://elevenlabs.io/voice-library), filter by **Telugu** language, find a voice you like, add it to "My Voices", copy its voice ID, and share it here so I can update the code.

