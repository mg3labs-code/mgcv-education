import { useEffect, useRef } from "react";

const LAST_SPOKEN_KEY = "voice_guide_last_spoken_ts";
const SESSION_KEY_PREFIX = "voice_guide_session_";
const COOLDOWN_MS = 60_000; // 60s between any voice hints
const VOICE_ENABLED_KEY = "voice_guide_enabled";

/**
 * Speak a short contextual hint once per session per pageKey,
 * with a global 60s cooldown between any hints.
 * Uses Web Speech API (no network) — silent if browser doesn't support.
 *
 * Set localStorage.voice_guide_enabled = "0" to disable globally.
 */
export function useVoiceGuide(pageKey: string, message: string, enabled = true) {
  const spokenRef = useRef(false);

  useEffect(() => {
    if (!enabled || spokenRef.current) return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(VOICE_ENABLED_KEY) === "0") return;
    if (!("speechSynthesis" in window)) return;

    const sessionKey = `${SESSION_KEY_PREFIX}${pageKey}`;
    if (sessionStorage.getItem(sessionKey)) return;

    const lastTs = Number(sessionStorage.getItem(LAST_SPOKEN_KEY) || 0);
    if (Date.now() - lastTs < COOLDOWN_MS) return;

    const t = setTimeout(() => {
      try {
        const utter = new SpeechSynthesisUtterance(message);
        utter.rate = 1.05;
        utter.pitch = 1.0;
        utter.volume = 0.7;
        // Prefer a softer/female english voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => /female|samantha|karen|google.*english/i.test(v.name));
        if (preferred) utter.voice = preferred;
        window.speechSynthesis.speak(utter);
        sessionStorage.setItem(sessionKey, "1");
        sessionStorage.setItem(LAST_SPOKEN_KEY, String(Date.now()));
        spokenRef.current = true;
      } catch {
        // silent fail
      }
    }, 1200);

    return () => clearTimeout(t);
  }, [pageKey, message, enabled]);
}
