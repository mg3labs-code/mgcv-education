import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Square, Loader2, ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Turn = { role: "user" | "assistant"; content: string };
type Phase = "greeting" | "interest_capture" | "free_chat";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const INTEREST_PROMPTS = [
  "Hi! I'm Buddy, your study companion. Before we start, tell me — what do you love doing outside class? Cricket, drawing, gaming, anything!",
  "Awesome! One more thing — what's a subject or topic that genuinely excites you, or one that feels hard right now?",
  "Perfect. I'll remember that. Whenever you want to learn something, just tap the mic and talk to me. Ready?",
];

const StudentTalk = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [turns, setTurns] = useState<Turn[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [phase, setPhase] = useState<Phase>("greeting");
  const [interestStep, setInterestStep] = useState(0);
  const [capturedInterests, setCapturedInterests] = useState<string[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [needsTap, setNeedsTap] = useState(false);
  const pendingBlobRef = useRef<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const bootedRef = useRef(false);

  // Load or init phase from prefs
  useEffect(() => {
    if (!user || bootedRef.current) return;
    bootedRef.current = true;
    (async () => {
      const { data } = await supabase
        .from("student_preferences")
        .select("interests, onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();
      const hasInterests = (data?.interests?.length ?? 0) > 0;
      if (hasInterests) {
        setPhase("free_chat");
        await speakAndPush("assistant", "Hey, welcome back! What do you want to learn or talk about today?");
      } else {
        setPhase("interest_capture");
        await speakAndPush("assistant", INTEREST_PROMPTS[0]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, isThinking]);

  const playBlob = useCallback(async (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    const audio = new Audio(url);
    audio.preload = "auto";
    audioRef.current = audio;
    audio.onended = () => {
      setIsSpeaking(false);
      URL.revokeObjectURL(url);
    };
    audio.onerror = () => setIsSpeaking(false);
    try {
      await audio.play();
      setIsSpeaking(true);
      return true;
    } catch {
      // Autoplay blocked — needs a user gesture
      setIsSpeaking(false);
      pendingBlobRef.current = blob;
      setNeedsTap(true);
      return false;
    }
  }, []);

  const speak = useCallback(async (text: string) => {
    if (muted || !text.trim()) return;
    try {
      setIsSpeaking(true);
      const { data: sess } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-tts-stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          ...(sess?.session?.access_token
            ? { Authorization: `Bearer ${sess.session.access_token}` }
            : {}),
        },
        body: JSON.stringify({ text: text.slice(0, 900) }),
      });
      if (!res.ok) {
        console.error("TTS failed", res.status, await res.text().catch(() => ""));
        setIsSpeaking(false);
        return;
      }
      const raw = await res.blob();
      const blob = raw.type.startsWith("audio") ? raw : new Blob([raw], { type: "audio/mpeg" });
      await playBlob(blob);
    } catch (e) {
      console.error("speak error", e);
      setIsSpeaking(false);
    }
  }, [muted, playBlob]);

  const enableSound = useCallback(async () => {
    setNeedsTap(false);
    const blob = pendingBlobRef.current;
    pendingBlobRef.current = null;
    if (blob) await playBlob(blob);
  }, [playBlob]);


  const speakAndPush = useCallback(async (role: "assistant", content: string) => {
    setTurns((prev) => [...prev, { role, content }]);
    await speak(content);
  }, [speak]);

  const saveInterests = async (interests: string[]) => {
    if (!user) return;
    try {
      await supabase
        .from("student_preferences")
        .upsert(
          { user_id: user.id, interests, onboarding_completed: true },
          { onConflict: "user_id" }
        );
    } catch (e) {
      console.error("Save interests failed", e);
    }
  };

  const handleUserUtterance = async (text: string) => {
    setTurns((prev) => [...prev, { role: "user", content: text }]);

    if (phase === "interest_capture") {
      const nextInterests = [...capturedInterests, text.trim()];
      setCapturedInterests(nextInterests);
      const nextStep = interestStep + 1;
      if (nextStep < INTEREST_PROMPTS.length) {
        setInterestStep(nextStep);
        await speakAndPush("assistant", INTEREST_PROMPTS[nextStep]);
        if (nextStep === INTEREST_PROMPTS.length - 1) {
          await saveInterests(nextInterests);
        }
      } else {
        setPhase("free_chat");
        await saveInterests(nextInterests);
        await speakAndPush("assistant", "Great — go ahead, ask me anything!");
      }
      return;
    }

    // Free chat — call study-companion
    setIsThinking(true);
    try {
      const messages = [
        ...turns.map((t) => ({ role: t.role, content: t.content })),
        { role: "user" as const, content: text },
      ];
      const projectUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
      const { data: sess } = await supabase.auth.getSession();
      const authToken = sess.session?.access_token ?? anonKey;

      const resp = await fetch(`${projectUrl}/functions/v1/study-companion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          apikey: anonKey,
        },
        body: JSON.stringify({
          messages,
          role: "student",
          context: { page: "voice-talk" },
        }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error(`AI error ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const j = JSON.parse(payload);
            const delta = j.choices?.[0]?.delta?.content ?? "";
            if (delta) full += delta;
          } catch {
            /* ignore malformed chunk */
          }
        }
      }

      const clean = full.replace(/\[NAV:[^\]]+\]/g, "").trim() || "I'm not sure, can you say that again?";
      setIsThinking(false);
      await speakAndPush("assistant", clean);
    } catch (e) {
      setIsThinking(false);
      const msg = "Sorry, I couldn't reach the AI. Try again?";
      setTurns((prev) => [...prev, { role: "assistant", content: msg }]);
      toast.error(e instanceof Error ? e.message : "AI error");
    }
  };

  // Keep a live reference so the recorder's onstop callback (created once)
  // always invokes the CURRENT handler with fresh phase/turns state.
  const utteranceRef = useRef(handleUserUtterance);
  useEffect(() => {
    utteranceRef.current = handleUserUtterance;
  });

  const processAudio = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const r = reader.result as string;
          resolve(r.split(",")[1]);
        };
        reader.readAsDataURL(blob);
      });
      const { data, error } = await supabase.functions.invoke("transcribe-voice", {
        body: { audioBase64: base64, mimeType },
      });
      if (error) throw error;
      const transcript = (data?.transcript ?? "").trim();
      if (!transcript) {
        toast.error("Didn't catch that. Try again?");
        return;
      }
      await utteranceRef.current(transcript);
    } catch {
      toast.error("Couldn't transcribe. Try again.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = useCallback(async () => {
    // Stop any playing AI audio when user starts speaking
    setNeedsTap(false);
    pendingBlobRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
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
        if (blob.size < 1000) {
          toast.error("Too short. Hold and speak a bit longer.");
          return;
        }
        await processAudio(blob, mimeType);
      };
      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      toast.error("Please allow microphone access.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const busy = isTranscribing || isThinking;
  const micDisabled = busy;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <button
          onClick={() => navigate("/student")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </button>
        <div className="text-sm font-semibold text-foreground">Talk to Buddy</div>
        <button
          onClick={() => {
            setMuted((m) => !m);
            if (!muted && audioRef.current) {
              audioRef.current.pause();
              setIsSpeaking(false);
            }
          }}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
          title={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3 max-w-2xl w-full mx-auto">
        {turns.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            Getting ready...
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                t.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card border border-border rounded-bl-md text-foreground"
              }`}
            >
              {t.content}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-card border border-border px-4 py-2.5 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Buddy is thinking...
            </div>
          </div>
        )}
        <div ref={transcriptEndRef} />
      </div>

      {/* Mic bar */}
      <div className="border-t border-border/40 bg-card/60 backdrop-blur px-4 py-6 flex flex-col items-center gap-2">
        {needsTap && (
          <button
            onClick={enableSound}
            className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow"
          >
            <Volume2 className="h-4 w-4" /> Tap to hear Buddy
          </button>
        )}
        <div className="text-xs text-muted-foreground h-4">

          {isRecording
            ? `Listening... ${seconds}s (tap to send)`
            : isTranscribing
              ? "Transcribing..."
              : isSpeaking
                ? "Buddy is speaking..."
                : phase === "interest_capture"
                  ? `Getting to know you (${interestStep + 1}/${INTEREST_PROMPTS.length}) — tap to answer`
                  : "Tap the mic and speak"}
        </div>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={micDisabled}
          className={`h-20 w-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
            isRecording
              ? "bg-destructive text-destructive-foreground animate-pulse scale-110"
              : micDisabled
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:scale-105"
          }`}
          title={isRecording ? "Tap to stop & send" : "Tap to speak"}
        >
          {isTranscribing || isThinking ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : isRecording ? (
            <Square className="h-8 w-8" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </button>
      </div>
    </div>
  );
};

export default StudentTalk;
