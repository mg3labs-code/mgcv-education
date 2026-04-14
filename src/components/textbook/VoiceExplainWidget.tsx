import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { AudioLines, MicOff, Loader2, Send, Volume2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VoiceFeedback {
  score: number;
  positives: string[];
  feedback: string;
  suggestion: string;
  emoji: string;
}

interface VoiceExplainProps {
  topic: string;
  prompt?: string;
  guidePoints?: string[];
  onTranscript?: (text: string) => void;
}

const VoiceExplainWidget = ({ topic, prompt, guidePoints, onTranscript }: VoiceExplainProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<VoiceFeedback | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        await processAudio(blob, mediaRecorder.mimeType);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingTime(0);
      setFeedback(null);
      setTranscript("");

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      toast.error("Microphone access denied. Please allow microphone access.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isRecording]);

  const processAudio = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);

    try {
      // Convert blob to base64
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const audioBase64 = btoa(binary);

      // Step 1: Transcribe
      const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke(
        "transcribe-voice",
        { body: { audioBase64, mimeType } }
      );

      if (transcribeError || !transcribeData?.transcript) {
        throw new Error(transcribeData?.error || "Transcription failed");
      }

      const text = transcribeData.transcript;
      setTranscript(text);
      onTranscript?.(text);
      setIsTranscribing(false);

      // Step 2: Get AI feedback
      setIsAnalyzing(true);
      const { data: feedbackData, error: feedbackError } = await supabase.functions.invoke(
        "voice-explain",
        { body: { transcript: text, topic, prompt, guidePoints } }
      );

      if (feedbackError) {
        throw new Error(feedbackData?.error || "Feedback generation failed");
      }

      setFeedback(feedbackData);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsTranscribing(false);
      setIsAnalyzing(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const scoreColor =
    feedback && feedback.score >= 8
      ? "text-green-600"
      : feedback && feedback.score >= 5
      ? "text-amber-600"
      : "text-red-500";

  return (
    <div className="space-y-4">
      {/* Recording controls */}
      <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
        <Button
          size="lg"
          variant={isRecording ? "destructive" : "default"}
          className="rounded-full h-14 w-14 p-0"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing || isAnalyzing}
        >
          {isRecording ? (
            <MicOff className="h-6 w-6" />
          ) : isTranscribing || isAnalyzing ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <AudioLines className="h-6 w-6" />
          )}
        </Button>

        <div className="flex-1">
          {isRecording ? (
            <div>
              <p className="text-sm font-medium text-destructive flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                Recording... {formatTime(recordingTime)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Speak your explanation clearly. Click stop when done.
              </p>
            </div>
          ) : isTranscribing ? (
            <div>
              <p className="text-sm font-medium text-primary">Transcribing your voice...</p>
              <p className="text-xs text-muted-foreground">Converting speech to text using AI</p>
            </div>
          ) : isAnalyzing ? (
            <div>
              <p className="text-sm font-medium text-primary">Analyzing your explanation...</p>
              <p className="text-xs text-muted-foreground">Getting personalized feedback</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-primary" /> Speak Your Explanation
              </p>
              <p className="text-xs text-muted-foreground">
                Tap the mic and explain what you understood. AI will give you feedback!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Transcript display */}
      {transcript && (
        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <Send className="h-3 w-3" /> What you said:
          </p>
          <p className="text-sm text-foreground leading-relaxed italic">"{transcript}"</p>
        </div>
      )}

      {/* AI Feedback */}
      {feedback && (
        <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> AI Feedback
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{feedback.emoji}</span>
              <span className={`text-lg font-bold ${scoreColor}`}>{feedback.score}/10</span>
            </div>
          </div>

          {/* Positives */}
          <div className="space-y-1.5">
            {feedback.positives.map((p, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-green-700 dark:text-green-400">
                <span className="mt-0.5">✅</span>
                <span>{p}</span>
              </div>
            ))}
          </div>

          {/* Overall feedback */}
          <p className="text-sm text-foreground leading-relaxed">{feedback.feedback}</p>

          {/* Suggestion */}
          <div className="rounded-lg bg-background border p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1">💡 To improve:</p>
            <p className="text-sm text-foreground">{feedback.suggestion}</p>
          </div>

          {/* Try again */}
          <Button variant="outline" size="sm" onClick={startRecording}>
            <AudioLines className="h-3.5 w-3.5 mr-1" /> Try Again
          </Button>
        </div>
      )}
    </div>
  );
};

export default VoiceExplainWidget;
