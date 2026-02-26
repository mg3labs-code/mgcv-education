import { useState, useRef, useCallback } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompanionVoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  showLabel?: boolean;
}

const CompanionVoiceInput = ({ onTranscript, disabled, showLabel }: CompanionVoiceInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async () => {
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
          toast.error("Recording too short. Please try again.");
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
      toast.error("Microphone access denied.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const processAudio = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.readAsDataURL(blob);
      });

      const { data, error } = await supabase.functions.invoke("transcribe-voice", {
        body: { audioBase64: base64, mimeType },
      });

      if (error) throw error;
      if (data?.transcript) {
        onTranscript(data.transcript);
      } else {
        toast.error("Couldn't understand the audio. Try again.");
      }
    } catch {
      toast.error("Transcription failed. Please type instead.");
    } finally {
      setIsTranscribing(false);
    }
  };

  if (isTranscribing) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <Button size="icon" variant="ghost" disabled className="h-9 w-9">
          <Loader2 className="h-4 w-4 animate-spin" />
        </Button>
        <span className="text-[10px] text-muted-foreground">Transcribing...</span>
      </div>
    );
  }

  if (isRecording) {
    return (
      <button
        onClick={stopRecording}
        className="flex items-center gap-1.5 shrink-0 h-9 px-3 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium animate-pulse"
      >
        <Square className="h-3.5 w-3.5" />
        <span>{seconds}s</span>
      </button>
    );
  }

  return (
    <button
      onClick={startRecording}
      disabled={disabled}
      className="flex items-center gap-1 shrink-0 h-9 px-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
      title="Voice input"
    >
      <Mic className="h-4.5 w-4.5" />
      {showLabel && <span className="text-xs">Speak</span>}
    </button>
  );
};

export default CompanionVoiceInput;
