import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2, RotateCcw, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ComprehensionCheckProps {
  sectionTitle: string;
  onPass: () => void;
  onSkip: () => void;
  isFirstVisit: boolean;
  onResult?: (result: "pass" | "revise" | "skip", attempts: number) => void;
}

const ComprehensionCheck = ({ sectionTitle, onPass, onSkip, isFirstVisit, onResult }: ComprehensionCheckProps) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<"pass" | "revise" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [attempts, setAttempts] = useState(0);

  if (!isFirstVisit) return null;

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  const handleSubmit = async () => {
    if (wordCount < 3) return;
    setLoading(true);
    const newAttempts = attempts + 1;
    try {
      const { data } = await supabase.functions.invoke("inline-evaluate", {
        body: {
          topic: sectionTitle,
          prompt: `The student just read a section about "${sectionTitle}". Evaluate if they understood the core idea. Reply with JSON: { "understood": true/false, "feedback": "brief encouraging feedback" }. Be lenient — if they show any understanding, mark as understood.`,
          answer: text,
        },
      });
      const fb = data?.feedback || "";
      try {
        const parsed = JSON.parse(fb);
        if (parsed.understood === false) {
          setResult("revise");
          setFeedback(parsed.feedback || "Try reading through once more and then explain again!");
          onResult?.("revise", newAttempts);
        } else {
          setResult("pass");
          setFeedback(parsed.feedback || "Great understanding! 🎉");
          onResult?.("pass", newAttempts);
        }
      } catch {
        setResult("pass");
        setFeedback(fb || "Good understanding! Keep it up! 🎉");
        onResult?.("pass", newAttempts);
      }
    } catch {
      setResult("pass");
      setFeedback("Nice effort! Moving on. 💪");
      onResult?.("pass", newAttempts);
    }
    setAttempts(newAttempts);
    setLoading(false);
  };

  const handleSkip = () => {
    onResult?.("skip", attempts);
    onSkip();
  };

  if (result === "pass") {
    return (
      <div style={{
        marginTop: 16, padding: "16px 20px",
        background: "linear-gradient(135deg, #F0FDFA, #ECFDF5)",
        borderRadius: 14, border: "1.5px solid #99F6E4",
      }}>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#059669" }}>Great understanding!</span>
        </div>
        <p style={{ fontSize: 13, color: "#44403C", lineHeight: 1.6 }}>{feedback}</p>
        <Button size="sm" onClick={onPass} className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white">
          Continue →
        </Button>
      </div>
    );
  }

  if (result === "revise") {
    return (
      <div style={{
        marginTop: 16, padding: "16px 20px",
        background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
        borderRadius: 14, border: "1.5px solid #FCD34D",
      }}>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#D97706" }}>Let's review once more</span>
        </div>
        <p style={{ fontSize: 13, color: "#44403C", lineHeight: 1.6, marginBottom: 12 }}>{feedback}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setResult(null); setText(""); }}>
            <RotateCcw className="h-3 w-3 mr-1" /> Try again
          </Button>
          {attempts >= 1 && (
            <Button size="sm" variant="ghost" onClick={handleSkip} className="text-muted-foreground">
              Skip for now →
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      marginTop: 16, padding: "16px 20px",
      background: "linear-gradient(135deg, #F0FDFA, #EFF6FF)",
      borderRadius: 14, border: "1.5px solid #99F6E4",
    }}>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#1C1917", marginBottom: 4 }}>
        What did you understand? 🤔
      </p>
      <p style={{ fontSize: 12, color: "#78716C", marginBottom: 12 }}>
        Say it in a few lines — this helps you learn better!
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="In my own words, I understood that..."
        style={{
          width: "100%", borderRadius: 10, border: "1.5px solid #E7E5E4",
          background: "white", padding: "10px 14px", fontSize: 14,
          resize: "none", outline: "none", fontFamily: "'DM Sans', sans-serif",
        }}
      />
      <div className="flex items-center justify-between mt-2">
        <span style={{ fontSize: 11, color: "#A8A29E" }}>{wordCount} words</span>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={handleSkip} className="text-muted-foreground text-xs">
            Skip
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={wordCount < 3 || loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            {loading ? "Checking..." : "Check"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ComprehensionCheck;
