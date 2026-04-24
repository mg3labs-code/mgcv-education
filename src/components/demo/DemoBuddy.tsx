import { useCallback, useEffect, useRef, useState } from "react";
import { PhoneOff, Mic, Volume2, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ────────────────────────────────────────────────────────────────
// Buddy context — describes the current on-screen question/prompt
// so Buddy can narrate it and grade the student's spoken answer.
// ────────────────────────────────────────────────────────────────
export interface BuddyContext {
  /** A unique key for the current question — when this changes, Buddy
   *  auto-narrates the new question. Use e.g. `"day1-hook"` */
  key: string;
  /** Human-friendly subject for tone (e.g. "Mathematics") */
  subject: string;
  /** The exact question/prompt shown on screen */
  question: string;
  /** Optional: expected key idea so feedback is accurate */
  expectedHint?: string;
}

interface DemoBuddyProps {
  context: BuddyContext | null;
}

type Phase =
  | "idle"
  | "starting"
  | "narrating"
  | "listening"
  | "transcribing"
  | "thinking"
  | "speaking"
  | "blocked";

const SILENCE_THRESHOLD = 0.018; // RMS level — below this counts as silence
const SILENCE_HANG_MS = 1400; // wait this long of silence before sending
const MIN_SPEECH_MS = 600; // require this much actual speech before submitting
const MAX_UTTERANCE_MS = 15000; // hard cap per utterance

const DemoBuddy = ({ context }: DemoBuddyProps) => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [liveLevel, setLiveLevel] = useState(0);
  const [hidden, setHidden] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const speechStartRef = useRef<number | null>(null);
  const utteranceStartRef = useRef<number | null>(null);
  const phaseRef = useRef<Phase>("idle");
  const lastNarratedKey = useRef<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // ─── audio playback helpers ───────────────────────────────────
  const stopAudio = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch {
        /* noop */
      }
      audioRef.current.src = "";
      audioRef.current = null;
    }
  };

  const speak = useCallback(async (text: string): Promise<void> => {
    stopAudio();
    setPhase("speaking");
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts-stream`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text, voiceId: "pFZP5JQG7iQjIQuC4Bku" }), // Lily — warm
      });
      if (!resp.ok) throw new Error(`TTS failed: ${resp.status}`);
      const blob = await resp.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      await new Promise<void>((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
      });
    } catch (e) {
      console.error("[Buddy] speak error", e);
    }
  }, []);

  // ─── VAD-based continuous listening ───────────────────────────
  const stopVadLoop = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const teardownMic = () => {
    stopVadLoop();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        /* noop */
      }
    }
    mediaRecorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {
        /* noop */
      }
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    silenceStartRef.current = null;
    speechStartRef.current = null;
    utteranceStartRef.current = null;
  };

  const finalizeUtterance = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    // Capture the chunks we have so far, then keep listening.
    recorder.requestData?.();
    setTimeout(() => {
      try {
        recorder.stop();
      } catch {
        /* noop */
      }
    }, 60);
  }, []);

  const runVadLoop = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const buffer = new Float32Array(analyser.fftSize);
    const tick = () => {
      if (!analyserRef.current) return;
      analyser.getFloatTimeDomainData(buffer);
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
      const rms = Math.sqrt(sum / buffer.length);
      setLiveLevel(rms);

      const now = performance.now();
      if (utteranceStartRef.current == null) utteranceStartRef.current = now;

      if (rms > SILENCE_THRESHOLD) {
        if (speechStartRef.current == null) speechStartRef.current = now;
        silenceStartRef.current = null;
      } else {
        if (silenceStartRef.current == null) silenceStartRef.current = now;
        const silenceFor = now - silenceStartRef.current;
        const spoke = speechStartRef.current != null && now - speechStartRef.current >= MIN_SPEECH_MS;
        if (spoke && silenceFor > SILENCE_HANG_MS) {
          // student paused → submit
          stopVadLoop();
          finalizeUtterance();
          return;
        }
      }

      if (utteranceStartRef.current && now - utteranceStartRef.current > MAX_UTTERANCE_MS) {
        stopVadLoop();
        finalizeUtterance();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [finalizeUtterance]);

  const processAudio = useCallback(
    async (blob: Blob, mimeType: string) => {
      if (blob.size < 2000) {
        // too small — just keep listening
        startListeningRef.current?.();
        return;
      }
      setPhase("transcribing");
      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
          reader.readAsDataURL(blob);
        });
        const { data, error } = await supabase.functions.invoke("transcribe-voice", {
          body: { audioBase64: base64, mimeType },
        });
        if (error) throw error;
        const text = data?.transcript?.trim() || "";
        if (!text || text.length < 2) {
          // didn't catch anything — keep listening
          startListeningRef.current?.();
          return;
        }
        setTranscript(text);
        await getFeedbackRef.current?.(text);
      } catch (e) {
        console.error("[Buddy] processAudio error", e);
        startListeningRef.current?.();
      }
    },
    [],
  );

  // We need refs because callbacks are interdependent
  const startListeningRef = useRef<() => Promise<void>>();
  const getFeedbackRef = useRef<(answer: string) => Promise<void>>();
  const processAudioRef = useRef<typeof processAudio>(processAudio);
  useEffect(() => {
    processAudioRef.current = processAudio;
  }, [processAudio]);

  const startListening = useCallback(async () => {
    if (cancelledRef.current) return;
    // Reuse the existing stream if we have one
    try {
      let stream = streamRef.current;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        streamRef.current = stream;
      }
      // Set up analyser once
      if (!audioCtxRef.current) {
        const Ctx =
          (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
        const ctx = new Ctx();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);
        analyserRef.current = analyser;
      }

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        // schedule next listen after we process
        processAudioRef.current(blob, mimeType);
      };
      mediaRecorderRef.current = recorder;
      silenceStartRef.current = null;
      speechStartRef.current = null;
      utteranceStartRef.current = null;
      recorder.start(250);
      setPhase("listening");
      runVadLoop();
    } catch (e) {
      console.error("[Buddy] mic error", e);
      setPhase("blocked");
      toast.error("Mic blocked. Tap the banner to enable Buddy.");
    }
  }, [runVadLoop]);
  startListeningRef.current = startListening;

  const getFeedback = useCallback(
    async (answer: string) => {
      if (!context) {
        startListeningRef.current?.();
        return;
      }
      setPhase("thinking");
      try {
        const { data, error } = await supabase.functions.invoke("demo-buddy-feedback", {
          body: {
            mode: "feedback",
            subject: context.subject,
            questionText: context.question,
            expectedHint: context.expectedHint,
            studentAnswer: answer,
            language: "bilingual",
          },
        });
        if (error) throw error;
        const text = data?.text || "Nice try! Keep going.";
        setFeedback(text);
        await speak(text);
      } catch (e) {
        console.error("[Buddy] feedback error", e);
      } finally {
        // Loop back to listening so student can keep talking
        startListeningRef.current?.();
      }
    },
    [context, speak],
  );
  getFeedbackRef.current = getFeedback;

  const narrateQuestion = useCallback(
    async (ctx: BuddyContext) => {
      setPhase("narrating");
      setTranscript("");
      setFeedback("");
      try {
        // Speak the EXACT on-screen question (no LLM paraphrase / hallucination).
        // Add a short warm hook + invitation so it feels like a real tutor.
        const hooks = ["Okay, look at this one.", "Chinna question.", "Try this one with me."];
        const invites = ["What do you think? Cheppu.", "Tell me your guess.", "Ardham aindha? Cheppu nee answer."];
        const hook = hooks[Math.floor(Math.random() * hooks.length)];
        const invite = invites[Math.floor(Math.random() * invites.length)];
        const cleanQuestion = ctx.question.replace(/\s+/g, " ").trim();
        const text = `${hook} ${cleanQuestion} ${invite}`;
        await speak(text);
      } catch (e) {
        console.error("[Buddy] narrate error", e);
      } finally {
        startListeningRef.current?.();
      }
    },
    [speak],
  );

  // ─── Auto-start on mount ──────────────────────────────────────
  useEffect(() => {
    cancelledRef.current = false;
    let started = false;
    const boot = async () => {
      setPhase("starting");
      try {
        // Permissions API check (best effort)
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        streamRef.current = stream;
        if (cancelledRef.current) return;
        started = true;
        // Greet warmly, then narrate first question (if available)
        await speak("Hi! I'm Buddy. I'm here with you — just talk naturally, sare?");
        if (cancelledRef.current) return;
        if (context) {
          lastNarratedKey.current = context.key;
          await narrateQuestion(context);
        } else {
          await startListening();
        }
      } catch (e) {
        console.warn("[Buddy] auto-start blocked", e);
        setPhase("blocked");
      }
    };
    boot();
    return () => {
      cancelledRef.current = true;
      stopAudio();
      teardownMic();
      if (!started) setPhase("idle");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-narrate when the on-screen question changes
  useEffect(() => {
    if (!context) return;
    if (phase === "idle" || phase === "starting" || phase === "blocked") return;
    if (lastNarratedKey.current === context.key) return;
    lastNarratedKey.current = context.key;
    // Stop current activity then narrate
    stopAudio();
    stopVadLoop();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        /* noop */
      }
    }
    narrateQuestion(context);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context?.key]);

  const handleEnable = async () => {
    cancelledRef.current = false;
    setPhase("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      await speak("Okay, I'm here. Let's go!");
      if (context) {
        lastNarratedKey.current = context.key;
        await narrateQuestion(context);
      } else {
        await startListening();
      }
    } catch {
      setPhase("blocked");
      toast.error("Please allow microphone access in your browser.");
    }
  };

  const handleEndCall = () => {
    cancelledRef.current = true;
    stopAudio();
    teardownMic();
    setHidden(true);
  };

  if (hidden) return null;

  // ─── UI ───────────────────────────────────────────────────────
  const phaseLabel: Record<Phase, string> = {
    idle: "Connecting…",
    starting: "Connecting…",
    narrating: "Reading the question…",
    listening: "Listening — just talk",
    transcribing: "Got it…",
    thinking: "Thinking…",
    speaking: "Buddy is speaking…",
    blocked: "Tap to enable mic",
  };

  const isBuddyBusy =
    phase === "narrating" || phase === "speaking" || phase === "thinking" || phase === "transcribing" || phase === "starting";
  const levelPct = Math.min(100, Math.round((liveLevel / 0.15) * 100));

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[min(92vw,360px)] rounded-2xl border-2 border-primary/30 bg-card shadow-2xl overflow-hidden animate-scale-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-3 flex items-center gap-3">
        <div className="relative">
          <div className="h-9 w-9 rounded-full bg-background/20 flex items-center justify-center">
            <Volume2 className="h-4 w-4" />
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-primary ${
              phase === "listening"
                ? "bg-emerald-400 animate-pulse"
                : isBuddyBusy
                  ? "bg-amber-400 animate-pulse"
                  : "bg-muted"
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight">Buddy · Live</p>
          <p className="text-[11px] text-primary-foreground/80 leading-tight truncate">{phaseLabel[phase]}</p>
        </div>
        <button
          onClick={handleEndCall}
          className="h-9 w-9 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
          aria-label="End call"
        >
          <PhoneOff className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 max-h-[55vh] overflow-y-auto">
        {phase === "blocked" && (
          <button
            onClick={handleEnable}
            className="w-full rounded-lg bg-primary text-primary-foreground py-3 px-4 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            🎙️ Tap to enable Buddy
          </button>
        )}

        {context && phase !== "blocked" && (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-0.5">On screen</p>
            <p className="text-xs text-foreground leading-snug line-clamp-3">{context.question}</p>
          </div>
        )}

        {transcript && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:text-blue-400 mb-0.5 flex items-center gap-1">
              <Send className="h-2.5 w-2.5" /> You said
            </p>
            <p className="text-xs text-foreground italic leading-snug">"{transcript}"</p>
          </div>
        )}

        {feedback && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-0.5">
              Buddy
            </p>
            <p className="text-xs text-foreground leading-snug">{feedback}</p>
          </div>
        )}
      </div>

      {/* Live mic indicator */}
      <div className="border-t border-border bg-background/60 px-4 py-3 flex items-center gap-3">
        <div
          className={`h-10 w-10 rounded-full flex items-center justify-center ${
            phase === "listening" ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"
          }`}
        >
          {phase === "transcribing" || phase === "thinking" || phase === "starting" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full transition-[width] duration-75 ${
                phase === "listening" ? "bg-emerald-500" : "bg-primary/40"
              }`}
              style={{ width: `${phase === "listening" ? levelPct : 0}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
            {phase === "listening"
              ? "Pause when you're done — I'll respond automatically."
              : phase === "speaking" || phase === "narrating"
                ? "Buddy is talking — I'll listen right after."
                : phase === "blocked"
                  ? "Microphone access needed."
                  : "Hold on…"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DemoBuddy;
