

# Improve Telugu Voice Quality in ElevenLabs TTS

## Problem
The current voice settings (stability 0.35, similarity_boost 0.7, style 0.25) are tuned for expressiveness in English but cause choppy/unnatural Telugu output. Low stability + high style = too much variation for non-English languages where the model needs more guidance.

## Root Cause
ElevenLabs `eleven_multilingual_v2` handles non-English languages better with **higher stability** and **lower style**. The current low stability (0.35) makes Telugu sound jittery because the model has less training data for Telugu prosody patterns. The "Tripti" voice (1Z7Y8o9cvUeWq8oLKgMY) may also not be optimized for Telugu — it's labeled as a child-friendly Indian voice but may be English-primary.

## Solution: Tune Voice Parameters + Set Language Hint

### Parameter Changes (all 3 files)

| Parameter | Current | New | Why |
|---|---|---|---|
| `stability` | 0.35 | 0.60 | Higher stability = smoother, more consistent Telugu pronunciation |
| `similarity_boost` | 0.7 | 0.80 | Stronger voice anchoring reduces drift in non-English |
| `style` | 0.25 | 0.10 | Lower style = less English-biased expressiveness that disrupts Telugu flow |
| `use_speaker_boost` | true | true | Keep — helps clarity |
| `speed` (TTS stream only) | 0.95 | 0.90 | Slightly slower for clearer Telugu word boundaries |

### Language Hint for Conversational Agent
Set `language: "hi"` (Hindi — closest supported language to Telugu in ElevenLabs' language list) on the attraction-voice-session agent config. This nudges the model's phoneme selection toward Indic patterns even when mixing English. Currently set to `"en"` which biases toward English phonemes.

### Files Changed

| File | Change |
|---|---|
| `supabase/functions/attraction-voice-session/index.ts` | Update TTS voice_settings (stability 0.60, similarity 0.80, style 0.10), set language to `"hi"` |
| `supabase/functions/elevenlabs-tts-stream/index.ts` | Update voice_settings (stability 0.60, similarity 0.80, style 0.10, speed 0.90) |

### Important Note
Since the attraction voice agent is already created and cached in `app_config` as `attraction_agent_id`, the parameter changes to the agent creation code won't take effect until the old agent is replaced. The plan will also clear the cached `attraction_agent_id` so a new agent is created with the updated settings on next call.

