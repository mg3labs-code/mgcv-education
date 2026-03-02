

# Fix Overlapping Voice Playback and Voice System Coordination

## Problem

When using voice input (transcribe button), each response triggers TTS playback via `speakResponse`. But if the user sends a new message before the previous TTS finishes, both audio streams play simultaneously -- voices overlap and it becomes chaotic. Additionally, if the live voice call (phone icon) is active, the TTS system can also fire, creating a third source of audio.

## Root Cause

1. **No cancellation of previous TTS**: `speakResponse` creates a new `Audio` object each time but never stops the one already playing via `ttsAudioRef`.
2. **No coordination between live call and TTS**: When the ElevenLabs agent call is active, the transcribe mic button can still trigger `sendMessage` + `speakResponse`, playing TTS on top of the live agent audio.

## Solution

### 1. Stop Previous TTS Before Starting New One

At the top of `speakResponse`, stop and clean up any currently playing audio before starting new playback:

```
if (ttsAudioRef.current) {
  ttsAudioRef.current.pause();
  ttsAudioRef.current.currentTime = 0;
  ttsAudioRef.current = null;
}
```

This ensures only the latest response is ever spoken -- older audio is immediately cancelled.

### 2. Skip TTS When Live Voice Call Is Active

If the ElevenLabs conversational agent is connected (`conversation.status === "connected"`), the agent itself handles speech output. The TTS system should NOT also play audio. Add a guard at the top of the `sendMessage` completion block:

```
// Only use TTS for voice-input responses when live call is NOT active
if (inputModeRef.current === "voice" && conversation.status !== "connected") {
  speakResponse(assistantContent);
}
```

### 3. Stop TTS When User Sends New Input

When the user sends any new message (text or voice), immediately stop any currently playing TTS so the new response takes priority:

Add at the top of `sendMessage`:
```
if (ttsAudioRef.current) {
  ttsAudioRef.current.pause();
  ttsAudioRef.current = null;
  setIsSpeakingTTS(false);
}
```

## Files to Modify

### `src/components/student/StudyCompanion.tsx`

Three targeted changes:

1. **`speakResponse` function (~line 332)**: Add audio cancellation at the start -- stop any existing `ttsAudioRef.current` before fetching and playing new audio.

2. **`sendMessage` function (~line 573)**: Add TTS stop at the beginning so any playing audio is cancelled when a new message is sent.

3. **TTS trigger after streaming (~line 685)**: Add `conversation.status !== "connected"` guard so TTS doesn't fire when the live voice call is already handling audio output.

## Behavior After Fix

- **New voice input while TTS is playing**: Old TTS stops immediately, new response plays when ready
- **Live call active + transcribe button used**: Text response only (agent handles voice separately)
- **Live call NOT active + transcribe button**: TTS plays response (one at a time, latest wins)
- **Text input**: No TTS, text-only response (unchanged)
- **User says "continue"**: Normal flow, latest response plays

