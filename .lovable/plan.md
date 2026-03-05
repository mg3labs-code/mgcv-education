

# Switch to English-Only with Best Child-Friendly Voice

## Problem
The language hint is set to `"hi"` (Hindi), but the user only wants English. Need the smoothest, warmest, most child-friendly voice and settings.

## Changes

### 1. `supabase/functions/attraction-voice-session/index.ts`
- Change `language: "hi"` → `language: "en"`
- Switch voice to **"Alice"** (`Xb7hH8MSUJpSbSDYk0k2`) — described as "Clear, Engaging Educator", warmer and more suitable for children than Jessica
- Tune voice settings for maximum smoothness and warmth:
  - `stability: 0.70` (very smooth, consistent)
  - `similarity_boost: 0.85` (strong voice anchoring)
  - `style: 0.15` (gentle expressiveness, not robotic but not choppy)
  - `speed` not available in agent config but prompt already says short sentences
- Update system prompt: remove Telugu mixing instructions, keep simple English only with Indian context
- Clear cached agent ID so new agent is created

### 2. `supabase/functions/elevenlabs-tts-stream/index.ts`
- Switch default voice to Alice (`Xb7hH8MSUJpSbSDYk0k2`)
- Update settings: `stability: 0.70`, `similarity_boost: 0.85`, `style: 0.15`, `speed: 0.92`

### 3. System Prompt Update (in attraction-voice-session)
Replace the Telugu mixing voice rules with English-only rules:
- Remove: "Mix Telugu naturally" lines
- Keep: Simple English, short sentences, Indian context (cricket, Dhoni, etc.), warm/encouraging tone
- Add: "Speak only in simple, clear English"

### 4. Database
- Delete `attraction_agent_id` from `app_config` to force new agent creation

