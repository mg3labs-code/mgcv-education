

# Upgrade Telugu TTS to Match Demo Quality

## What's Wrong Now
The current edge function uses `eleven_multilingual_v2` model with stability 0.3. The demo audio you liked was generated with the **v3 model** and higher stability (~0.5). That's the entire difference.

## The Fix

### File: `supabase/functions/elevenlabs-tts-stream/index.ts`

**Telugu TTS block (line 112-121)** — change 3 values:

| Setting | Current | New |
|---------|---------|-----|
| `model_id` | `eleven_multilingual_v2` | `eleven_v3` |
| `stability` | 0.3 | 0.5 |
| `similarity_boost` | 0.8 | 0.75 |
| `speed` | 0.9 | 1.0 |
| `style` | 0.5 | 0 (not used in v3) |

**English/default TTS block (line 160-170)** — same upgrade for English narration consistency:

| Setting | Current | New |
|---------|---------|-----|
| `model_id` | `eleven_multilingual_v2` | `eleven_v3` |
| `stability` | 0.45 | 0.5 |
| `similarity_boost` | 0.75 | 0.75 |
| `speed` | 0.92 | 1.0 |

Voice ID stays the same: `cgSgspJ2msm6clMCkdW9` (Jessica — same voice used in your demo).

### No other files change
- All client-side components (`StoryReadingBlock`, `VocabularyCardBlock`, `VoiceExplainWidget`, etc.) already call this edge function correctly
- Hindi routing through Sarvam AI is untouched

### Why this matches the demo
The demo audio from the ElevenLabs homepage used the default Jessica voice with the v3 model. The v3 model produces cleaner, more natural Telugu pronunciation with better prosody. Higher stability (0.5) gives consistent, non-wobbly delivery. The current 0.3 stability makes the voice too variable and unpredictable.

