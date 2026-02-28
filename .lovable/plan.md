

## Comprehensive Voice System Overhaul: Smooth, Interactive Student Experience

### Current Issues Found

1. **ElevenLabs TTS quota exhausted** -- Only 3 credits remain out of 2000. Every TTS call fails with `quota_exceeded`. This is why voice output is completely broken right now.
2. **Voice input (CompanionVoiceInput)** uses MediaRecorder + server-side transcription via Gemini, adding 3-5 second latency per input.
3. **Onboarding voice** uses `webkitSpeechRecognition` in a non-continuous, fire-and-forget pattern that breaks after one use.
4. **StudyCompanion voice mode** has race conditions: recognition restarts overlap with speaking state, causing echo loops and dropped transcripts.
5. **No fallback TTS** -- when ElevenLabs fails, there's no fallback, so Buddy goes completely silent with no error shown to the user.
6. **Navigation from voice** works but has no audio/visual confirmation.

---

### Plan (5 Tasks)

**Task 1: Fix TTS with Fallback to Browser Speech**

Since ElevenLabs quota is exhausted, add a graceful fallback:
- In `StreamingSpeaker`, catch TTS API errors (401/quota) and automatically switch to browser `SpeechSynthesis` API
- Show a small toast once: "Using built-in voice (premium voice unavailable)"
- Browser TTS is free, instant, and works on all devices
- When ElevenLabs quota resets or is topped up, it auto-recovers

**Task 2: Fix Voice Input Bugs in StudyCompanion**

- Fix the race condition in voice mode: stop recognition BEFORE sending message, restart AFTER TTS completes
- Add proper cleanup when switching between voice mode and text mode
- Fix `onend` handler that causes duplicate restarts
- Add a 1-second debounce after speech ends before sending to prevent partial transcript submission
- Pause recognition while loading AND speaking (currently has timing gaps)

**Task 3: Fix Onboarding Voice Input**

- Replace the broken one-shot `webkitSpeechRecognition` with the same robust pattern used in StudyCompanion
- Make the recognition instance persistent (stored in ref) instead of creating a new one each click
- Add proper error handling and visual feedback (pulsing mic, "Listening..." text)
- Clean up recognition on component unmount

**Task 4: Add Smooth UI Feedback for Voice Interactions**

- Add animated waveform visualization when Buddy is speaking (already partially exists, make it smoother)
- Add a "tap to interrupt" feature: clicking while Buddy speaks stops TTS and starts listening
- Show real-time transcript preview as user speaks (already exists for StudyCompanion, ensure it works reliably)
- Add subtle sound effect or haptic feedback on mic activation
- Add visual pulse animation on the Buddy floating button when voice mode is active

**Task 5: Improve Error Handling and User Feedback**

- Show inline errors in the companion chat when TTS/transcription fails instead of just toasts
- Add retry button for failed messages
- Show connection status indicator (online/offline/degraded)
- When ElevenLabs quota is exceeded, inform user clearly: "Voice output temporarily using built-in voice"

---

### Technical Details

```text
StudyCompanion.tsx (StreamingSpeaker class):
  - processQueue(): catch 401/quota errors from TTS_URL
  - Fallback: use window.speechSynthesis.speak() with best available voice
  - Add error count tracking - after 2 failures, switch to fallback permanently for session

StudyCompanion.tsx (voice mode):
  - startListening(): add guard against double-start
  - sendMessage(): stop recognition first, set isLoading, resume after TTS ends
  - useEffect for isSpeaking: increase delay from 500ms to 800ms before restarting mic
  - Add finalTranscript debounce: collect for 1s before sending

CompanionVoiceInput.tsx:
  - No changes needed (works correctly for tap-to-record pattern)

StudentOnboarding.tsx:
  - handleVoiceToggle(): store recognition in ref, reuse across clicks
  - Add proper onend cleanup
  - Show interim results while speaking

Files to change:
  - src/components/student/StudyCompanion.tsx
  - src/pages/StudentOnboarding.tsx
```

### What This Achieves
- Voice always works (ElevenLabs when available, browser TTS as fallback)
- No more race conditions or echo loops in voice mode
- Smooth, responsive mic interactions across all pages
- Students get clear feedback on what's happening at every step
- Onboarding voice input actually works reliably

