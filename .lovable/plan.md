

# Fix Voice Persistence and Smart Response Mode

## Problems Identified

1. **Voice disconnects unexpectedly**: When navigating pages or closing the chat panel, the ElevenLabs voice session drops. The `onDisconnect` handler blindly resets `voiceMode = false` without distinguishing between user-initiated stops and unexpected disconnects.

2. **Response mode doesn't match input mode**: The `CompanionVoiceInput` transcribes speech and feeds it into `sendMessage()` as plain text. The response always comes back as text only, even when the student spoke their question. Students expect: voice in = voice out, text in = text out.

---

## Solution

### 1. Voice Persistence Fix

**Problem root cause**: The `onDisconnect` callback (line 168-171) unconditionally sets `voiceMode = false`. Any transient WebRTC hiccup or unexpected disconnect kills the voice session permanently.

**Fix**:
- Add a `userStoppedVoiceRef` flag (a ref, not state, to avoid re-renders)
- Only reset `voiceMode` in `onDisconnect` if the user explicitly stopped it
- In `stopVoiceAgent`, set the flag to `true` before calling `endSession()`
- In `onDisconnect`, check the flag: if `false`, attempt auto-reconnect (with a retry limit of 2)
- Ensure `handleClose` (closing panel) never touches the voice session (already correct, but reinforce)

### 2. Smart Response Mode (Voice In = Voice Out)

**Approach**: Track whether the last user input came from voice (CompanionVoiceInput) or text (keyboard). When a voice-transcribed message gets a response, play that response aloud using the existing `elevenlabs-tts-stream` edge function.

**Changes**:
- Add an `inputModeRef` (`"text"` or `"voice"`) to `StudyCompanion`
- When `CompanionVoiceInput.onTranscript` fires, set `inputModeRef.current = "voice"` before calling `sendMessage()`
- When the text input/send button is used, set `inputModeRef.current = "text"`
- After `sendMessage` finishes streaming the assistant response, if `inputModeRef.current === "voice"`, call a `speakResponse(text)` helper
- `speakResponse` will use `fetch()` to call `elevenlabs-tts-stream` with the response text (cleaned via `cleanForSpeech`), then play the audio blob
- Add a small speaker icon on voice-generated responses to indicate they were spoken

### 3. Simplify the Flow

- Remove unnecessary complexity: the `CompanionVoiceInput` "Speak" label and the voice input button will remain as-is
- Add a subtle visual indicator (small speaker icon) on messages that were spoken aloud
- If TTS fails (quota, network), fall back gracefully to text-only with no error toast (silent fallback)

---

## Files to Modify

### `src/components/student/StudyCompanion.tsx`
- Add `userStoppedVoiceRef = useRef(false)` and `reconnectAttemptsRef = useRef(0)`
- Update `onDisconnect`: check flag, attempt reconnect if unexpected
- Update `stopVoiceAgent`: set `userStoppedVoiceRef.current = true`
- Update `startVoiceAgent`: reset `userStoppedVoiceRef.current = false` and `reconnectAttemptsRef.current = 0`
- Add `inputModeRef = useRef<"text" | "voice">("text")`
- Add `speakResponse(text: string)` helper that calls `elevenlabs-tts-stream`
- Update `CompanionVoiceInput.onTranscript` handler to set mode to `"voice"`
- Update `sendMessage` to call `speakResponse` after streaming completes when mode is `"voice"`
- Update send button / Enter key handler to set mode to `"text"`

### No other files need changes
- `elevenlabs-tts-stream` edge function already exists and works
- `CompanionVoiceInput` component doesn't need changes (callback interface is sufficient)

---

## Technical Details

```text
Input Flow:
  Keyboard/Send --> inputModeRef = "text"  --> sendMessage() --> text response only
  Mic/Transcribe --> inputModeRef = "voice" --> sendMessage() --> text response + TTS playback

Voice Persistence:
  User clicks "End Call" --> userStoppedVoiceRef = true --> endSession() --> onDisconnect resets state
  Unexpected disconnect --> userStoppedVoiceRef = false --> onDisconnect tries reconnect (max 2x)
  Close panel (X) --> no voice changes, session stays active
  Navigate pages --> no effect (component at App level, never unmounts)
```

