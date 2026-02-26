

# Upgrade Buddy to Streaming ElevenLabs TTS

## Problem
The current browser `speechSynthesis` API produces robotic, choppy speech. You want natural, continuous streaming voice like ElevenLabs, ChatGPT, Google AI Studio, or Wispr.

## Solution
Replace browser speechSynthesis with **ElevenLabs streaming TTS** via a backend function. This streams audio chunks back to the client as sentences arrive from the AI, giving a smooth, natural voice experience.

## How It Will Work

1. As AI text streams in sentence-by-sentence, each complete sentence is sent to ElevenLabs streaming TTS endpoint
2. Audio chunks stream back and are queued for seamless playback using Web Audio API
3. Result: Buddy starts speaking naturally within ~0.5s of each sentence completing, with no gaps between sentences

## Requirement
You will need to provide an **ElevenLabs API key**. You can get a free one at [elevenlabs.io](https://elevenlabs.io) (includes free usage tier). I will prompt you for it during implementation.

## Changes

### 1. New backend function: `elevenlabs-tts-stream`
- Accepts text + voice ID
- Calls ElevenLabs streaming TTS API (`/v1/text-to-speech/{voiceId}/stream`)
- Returns streaming audio (MP3 chunks) to the client
- Uses `eleven_turbo_v2_5` model for lowest latency

### 2. Update `StudyCompanion.tsx` - Replace `StreamingSpeaker` class
- Remove all `window.speechSynthesis` code
- New `StreamingSpeaker` class that:
  - Buffers incoming text deltas into complete sentences (same as now)
  - For each sentence, fetches streaming audio from the edge function
  - Uses Web Audio API (`AudioContext`) to decode and queue audio chunks for gapless playback
  - Manages an audio queue so sentences play back-to-back seamlessly
- Keep the same TTS toggle, speaking state, and waveform animation

### 3. Voice selection
- Default voice: "Sarah" (EXAVITQu4vr4xnSDxMaL) - natural, warm female voice that fits Buddy's personality
- Can be changed later to any ElevenLabs voice

## Technical Details

### Audio playback pipeline
```text
AI stream --> sentence buffer --> ElevenLabs TTS (streaming) --> AudioContext decode --> queue --> play
```

Each sentence is fetched as a complete MP3 blob, decoded, and queued. The next sentence starts playing immediately when the current one ends, creating continuous speech.

### Files changed
- `supabase/functions/elevenlabs-tts-stream/index.ts` (new)
- `src/components/student/StudyCompanion.tsx` (replace StreamingSpeaker)

