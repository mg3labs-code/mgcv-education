import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Lightweight game-SFX hook.
 *
 * - Preloads 3 short MP3s from /public/sounds (correct, wrong, victory).
 * - Plays via HTMLAudioElement (zero network on click).
 * - Mute preference persists in localStorage ("sfxMuted").
 * - On mobile, also fires a short navigator.vibrate() so muted users still get feedback.
 *
 * Default: SOUND ON. School users can mute once and it sticks.
 */

export type SfxName = "correct" | "wrong" | "victory";

const SOUND_FILES: Record<SfxName, string> = {
  correct: "/sounds/correct.mp3",
  wrong: "/sounds/wrong.mp3",
  victory: "/sounds/victory.mp3",
};

const VIBRATE_PATTERN: Record<SfxName, number | number[]> = {
  correct: 20,
  wrong: [30, 40, 30],
  victory: [40, 60, 40, 60, 80],
};

const STORAGE_KEY = "sfxMuted";

function readMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeMuted(muted: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function useSoundFx() {
  const [muted, setMutedState] = useState<boolean>(() => readMuted());
  const audioRef = useRef<Partial<Record<SfxName, HTMLAudioElement>>>({});

  // Preload once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    (Object.keys(SOUND_FILES) as SfxName[]).forEach((name) => {
      if (audioRef.current[name]) return;
      const a = new Audio(SOUND_FILES[name]);
      a.preload = "auto";
      a.volume = name === "victory" ? 0.7 : 0.55;
      audioRef.current[name] = a;
    });
  }, []);

  const play = useCallback(
    (name: SfxName) => {
      // Haptic feedback regardless of mute (silent + helpful)
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        try {
          navigator.vibrate(VIBRATE_PATTERN[name]);
        } catch {
          /* ignore */
        }
      }
      if (muted) return;
      const a = audioRef.current[name];
      if (!a) return;
      try {
        a.currentTime = 0;
        const p = a.play();
        if (p && typeof p.catch === "function") p.catch(() => undefined);
      } catch {
        /* autoplay policy — ignore */
      }
    },
    [muted],
  );

  const setMuted = useCallback((next: boolean) => {
    writeMuted(next);
    setMutedState(next);
  }, []);

  const toggleMuted = useCallback(() => {
    setMutedState((prev) => {
      const next = !prev;
      writeMuted(next);
      return next;
    });
  }, []);

  return { play, muted, setMuted, toggleMuted };
}
