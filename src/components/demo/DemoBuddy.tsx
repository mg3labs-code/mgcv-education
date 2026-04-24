import { useCallback, useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Mic, Square, Loader2, Volume2, Send } from "lucide-react";
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

type Phase = "idle" | "narrating" | "listening" | "recording" | "transcribing" | "thinking" | "speaking";

const DemoBuddy = ({ context }: DemoBuddyProps) => {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [seconds, setSeconds] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastNarratedKey = useRef<string | null>(null);

  // ─── helpers ──────────────────────────────────────────────────
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
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
      console.error("speak error", e);
    }
  }, []);

  const narrateQuestion = useCallback(
    async (ctx: BuddyContext) => {
      setPhase("narrating");
      setTranscript("");
      setFeedback("");
      try {
        const { data, error } = await supabase.functions.invoke("demo-buddy-feedback", {
          body: {
            mode: "narrate",
            subject: ctx.subject,
            questionText: ctx.question,
            language: "bilingual",
          },
        });
        if (error) throw error;
        const text = data?.text || "Okay, take a look at this one. What do you think?";
        await speak(text);
        setPhase("listening");
      } catch (e) {
        console.error("narrate error", e);
        setPhase("listening");
      }
    },
    [speak],
  );

  // Auto-narrate when context changes (only while open)
  useEffect(() => {
    if (!open || !context) return;
    if (lastNarratedKey.current === context.key) return;
    lastNarratedKey.current = context.key;
    narrateQuestion(context);
  }, [open, context, narrateQuestion]);

  // ─── recording flow ───────────────────────────────────────────
  const startRecording = useCallback(async () => {
    stopAudio();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        setSeconds(0);
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size < 1500) {
          toast.error("Too short — try speaking a sentence.");
          setPhase("listening");
          return;
        }
        await processAudio(blob, mimeType);
      };
      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setPhase("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      toast.error("Mic access denied.");
      setPhase("listening");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const processAudio = async (blob: Blob, mimeType: string) => {
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
      if (!text) {
        toast.error("Couldn't hear that — try again.");
        setPhase("listening");
        return;
      }
      setTranscript(text);
      await getFeedback(text);
    } catch (e) {
      console.error("processAudio error", e);
      toast.error("Voice failed. Tap mic to retry.");
      setPhase("listening");
    }
  };

  const getFeedback = async (answer: string) => {
    if (!context) return;
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
      setPhase("listening");
    } catch (e) {
      console.error("feedback error", e);
      setPhase("listening");
    }
  };

  // ─── lifecycle ────────────────────────────────────────────────
  const handleEndCall = () => {
    stopAudio();
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setOpen(false);
    setPhase("idle");
    setTranscript("");
    setFeedback("");
    lastNarratedKey.current = null;
  };

  const handleReplayQuestion = () => {
    if (!context) return;
    lastNarratedKey.current = null;
    narrateQuestion(context);
  };

  useEffect(() => {
    return () => {
      stopAudio();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ─── UI ───────────────────────────────────────────────────────
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform animate-pulse-soft group"
        aria-label="Call Buddy"
      >
        <Phone className="h-6 w-6" />
        <span className="absolute -top-2 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
          AI
        </span>
        <span className="absolute right-full mr-3 whitespace-nowrap rounded-lg bg-foreground/90 text-background text-xs font-medium px-2.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Call Buddy 📞
        </span>
      </button>
    );
  }

  const phaseLabel: Record<Phase, string> = {
    idle: "Ready",
    narrating: "Buddy is reading the question…",
    listening: "Tap mic to answer",
    recording: `Listening… ${seconds}s`,
    transcribing: "Got it — writing it down…",
    thinking: "Thinking about your answer…",
    speaking: "Buddy is speaking…",
  };

  const isBuddyBusy = phase === "narrating" || phase === "speaking" || phase === "thinking" || phase === "transcribing";

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[min(92vw,360px)] rounded-2xl border-2 border-primary/30 bg-card shadow-2xl overflow-hidden animate-scale-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-3 flex items-center gap-3">
        <div className="relative">
          <div className="h-9 w-9 rounded-full bg-background/20 flex items-center justify-center">
            <Volume2 className="h-4 w-4" />
          </div>
          {isBuddyBusy && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 animate-pulse border-2 border-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight">Buddy · Live Call</p>
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
      <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
        {context && (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-0.5">
              On screen
            </p>
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

        {!transcript && !feedback && phase === "listening" && (
          <p className="text-xs text-muted-foreground text-center py-2">
            🎙️ Tap the mic and answer in your own words — English or Telugu both fine.
          </p>
        )}
      </div>

      {/* Mic controls */}
      <div className="border-t border-border bg-background/60 px-4 py-3 flex items-center gap-2">
        <button
          onClick={handleReplayQuestion}
          disabled={isBuddyBusy || !context}
          className="h-10 px-3 rounded-lg border border-border text-xs font-medium hover:bg-accent disabled:opacity-40 transition-colors"
          title="Replay question"
        >
          🔁 Replay
        </button>
        <div className="flex-1" />
        {phase === "recording" ? (
          <button
            onClick={stopRecording}
            className="h-12 px-5 rounded-full bg-red-500 text-white font-bold text-sm flex items-center gap-2 animate-pulse hover:bg-red-600"
          >
            <Square className="h-4 w-4" /> Stop · {seconds}s
          </button>
        ) : phase === "transcribing" || phase === "thinking" ? (
          <button
            disabled
            className="h-12 w-12 rounded-full bg-muted flex items-center justify-center"
          >
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </button>
        ) : (
          <button
            onClick={startRecording}
            disabled={isBuddyBusy}
            className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform disabled:opacity-40"
            aria-label="Start recording"
          >
            <Mic className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default DemoBuddy;
