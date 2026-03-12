

# Fine-Tune Voice Quality Across All TTS Systems

## Problems Found

| System | Voice | Issues |
|---|---|---|
| **ElevenLabs TTS Stream** (Buddy text replies) | Alice, stability 0.70, style 0.15 | Too flat/robotic. High stability kills expressiveness. Low style = monotone. |
| **ElevenLabs Buddy Agent** (live WebRTC) | Tripti, stability 0.35, style 0.25 | Better but Tripti voice quality is inconsistent for Indian English. |
| **ElevenLabs Attraction Agent** (live WebRTC) | Alice, stability 0.70, style 0.15 | Same flat issue as TTS stream. |
| **Sarvam Voice Relay** (Indian voice call) | Anushka (bulbul:**v2**), pace 0.95, pitch 0.0, loudness 1.5 | Using **old v2 model** instead of v3! Also `pitch` and `loudness` are v2-only params being passed. No `temperature` param (v3 feature for expressiveness). |

## Root Causes

1. **Sarvam is on bulbul:v2** — the old model. v3 has 30+ better voices and a `temperature` parameter for expressiveness
2. **ElevenLabs stability too high (0.70)** — makes voice flat and robotic. For conversational/narrative use, 0.4-0.5 is much better
3. **ElevenLabs style too low (0.15)** — needs 0.3-0.5 for warmth and expressiveness
4. **Wrong voice choices** — Jessica (playful, bright, warm) is better suited than Alice for this use case, as the user's uploaded sample suggests

## Plan

### 1. Upgrade Sarvam to Bulbul v3 with Best Voice

**File: `supabase/functions/sarvam-voice-relay/index.ts`**
- Change `model: "bulbul:v2"` → `model: "bulbul:v3"`
- Change `speaker: "anushka"` → `speaker: "kavya"` (warm, expressive female) or `"priya"` (natural, friendly)
- Remove `pitch` and `loudness` params (not supported in v3)
- Add `temperature: 0.8` for expressiveness (v3-only, range 0.01-2.0, default 0.6)
- Keep `pace: 0.95` (good for clarity)
- Set `sample_rate: 24000` (v3 supports higher quality)

### 2. Tune ElevenLabs TTS Stream (Buddy Text Replies)

**File: `supabase/functions/elevenlabs-tts-stream/index.ts`**
- Switch voice from Alice → Jessica (`cgSgspJ2msm6clMCkdW9`) — playful, bright, warm (matches user's uploaded sample)
- Change stability: `0.70` → `0.45` (more expressive, natural variation)
- Change style: `0.15` → `0.40` (warmer, more narrative)
- Change similarity_boost: `0.85` → `0.75` (slightly more natural)
- Keep speed at `0.92` and speaker_boost `true`

### 3. Tune ElevenLabs Buddy Agent (Live Voice Call)

**File: `supabase/functions/elevenlabs-buddy-session/index.ts`**
- Switch voice from Tripti → Jessica (`cgSgspJ2msm6clMCkdW9`)
- Change stability: `0.35` → `0.45`
- Change similarity_boost: `0.7` → `0.75`
- Change style: `0.25` → `0.40`
- **Important**: Must delete existing agent from `app_config` so new agent is created with updated settings

### 4. Tune ElevenLabs Attraction Agent (Live Voice Call)

**File: `supabase/functions/attraction-voice-session/index.ts`**
- Switch voice from Alice → Jessica
- Change stability: `0.70` → `0.45`
- Change style: `0.15` → `0.40`
- Change similarity_boost: `0.85` → `0.75`
- **Important**: Must delete existing agent from `app_config` so new agent is created with updated settings

### 5. Force Agent Regeneration (SQL)

Delete cached agent IDs so the edge functions create new agents with the updated voice settings:
```sql
DELETE FROM app_config WHERE key IN ('elevenlabs_agent_id', 'attraction_agent_id');
```

## Voice Settings Summary (After Changes)

| System | Voice | Stability | Style | Similarity | Temperature | Model |
|---|---|---|---|---|---|---|
| ElevenLabs TTS Stream | Jessica | 0.45 | 0.40 | 0.75 | — | eleven_multilingual_v2 |
| ElevenLabs Buddy Agent | Jessica | 0.45 | 0.40 | 0.75 | — | eleven_multilingual_v2 |
| ElevenLabs Attraction Agent | Jessica | 0.45 | 0.40 | 0.75 | — | eleven_multilingual_v2 |
| Sarvam Voice Relay | Kavya | — | — | — | 0.8 | bulbul:v3 |

## Files Changed

| File | Change |
|---|---|
| `supabase/functions/elevenlabs-tts-stream/index.ts` | Voice → Jessica, tune stability/style/similarity |
| `supabase/functions/elevenlabs-buddy-session/index.ts` | Voice → Jessica, tune settings |
| `supabase/functions/attraction-voice-session/index.ts` | Voice → Jessica, tune settings |
| `supabase/functions/sarvam-voice-relay/index.ts` | Upgrade to bulbul:v3, switch to Kavya, add temperature, remove v2-only params |
| SQL migration | Delete cached agent IDs to force regeneration |

