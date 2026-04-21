import { useEffect } from "react";

/**
 * Disabled: this hook used the browser SpeechSynthesis female voice which clashed
 * with the ElevenLabs greeting. The single voice channel is now VoiceGreeting only.
 * Kept as a no-op so existing call sites compile.
 */
export function useVoiceGuide(_pageKey: string, _message: string, _enabled = true) {
  useEffect(() => {
    return;
  }, []);
}
