import { useState, useRef, useCallback } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompanionVoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

const CompanionVoiceInput = ({ onTranscript, disabled }: CompanionVoiceInputProps) => {
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
      <Button size="icon" variant="ghost" disabled className="h-8 w-8 shrink-0">
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      size="icon"
      variant={isRecording ? "destructive" : "ghost"}
      className="h-8 w-8 shrink-0"
      onClick={isRecording ? stopRecording : startRecording}
      disabled={disabled}
      title={isRecording ? `Recording... ${seconds}s` : "Voice input"}
    >
      {isRecording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
};

export default CompanionVoiceInput;
