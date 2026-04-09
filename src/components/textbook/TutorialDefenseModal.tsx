import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Send, Loader2, Lightbulb, Trophy, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface TutorialDefenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic: string;
  episodeTitle: string;
  subject?: string;
  chapterId?: string;
  episodeId?: string;
}

interface Message {
  role: "tutor" | "student";
  text: string;
}

const MAX_ROUNDS = 6;

const TutorialDefenseModal = ({ open, onOpenChange, topic, episodeTitle, subject, chapterId, episodeId }: TutorialDefenseModalProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [confidence, setConfidence] = useState(20);
  const [completed, setCompleted] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startTime = useRef<number>(0);

  useEffect(() => {
    if (started) startTime.current = Date.now();
  }, [started]);

  const callDefenseAPI = async (action: string, history: { role: string; content: string }[], count: number) => {
    const res = await supabase.functions.invoke("tutorial-defense", {
      body: { topic, episodeTitle, subject: subject || "General", action, history, exchangeCount: count },
    });
    if (res.error) throw res.error;
    return res.data?.reply || "Tell me what you learned! 🎯";
  };

  const startDefense = async () => {
    setStarted(true);
    setLoading(true);
    try {
      const reply = await callDefenseAPI("start", [], 0);
      setMessages([{ role: "tutor", text: reply }]);
    } catch {
      setMessages([{ role: "tutor", text: `Let's begin your Tutorial Defense! 🎯 Tell me what you understood about ${topic} — in your own words.` }]);
    }
    setLoading(false);
  };

  const requestHint = async () => {
    if (loading) return;
    setLoading(true);
    const history = messages.map(m => ({ role: m.role === "tutor" ? "assistant" : "user", content: m.text }));
    try {
      const reply = await callDefenseAPI("hint", history, exchangeCount);
      setMessages(prev => [...prev, { role: "tutor", text: `💡 ${reply}` }]);
    } catch {
      setMessages(prev => [...prev, { role: "tutor", text: "💡 Think about the most basic version of this concept. What's the simplest thing you know for sure?" }]);
    }
    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 100);
  };

  const trackSession = async () => {
    if (!user) return;
    try {
      await supabase.from("method_sessions").insert({
        user_id: user.id,
        method_type: "tutorial_defense",
        chapter_id: chapterId || null,
        episode_id: episodeId || null,
        duration_seconds: Math.round((Date.now() - startTime.current) / 1000),
        completed: true,
        score: Math.round(confidence),
      });
    } catch (e) {
      console.error("Failed to track session:", e);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const studentMsg = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "student" as const, text: studentMsg }];
    setMessages(newMessages);
    setLoading(true);
    const newCount = exchangeCount + 1;
    setExchangeCount(newCount);

    // Boost confidence based on answer length/effort
    const boost = Math.min(15, Math.max(5, studentMsg.split(" ").length));
    setConfidence(prev => Math.min(100, prev + boost));

    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 100);

    try {
      const history = newMessages.map(m => ({ role: m.role === "tutor" ? "assistant" : "user", content: m.text }));
      const reply = await callDefenseAPI("respond", history, newCount);
      setMessages([...newMessages, { role: "tutor", text: reply }]);

      // Check if this was the final round
      if (newCount >= MAX_ROUNDS) {
        setCompleted(true);
        setSummary(reply);
        await trackSession();
      }
    } catch {
      setMessages([...newMessages, { role: "tutor", text: "Interesting thinking! What evidence supports that? 🤔" }]);
    }
    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 100);
  };

  const handleClose = () => {
    onOpenChange(false);
    setMessages([]);
    setStarted(false);
    setInput("");
    setExchangeCount(0);
    setConfidence(20);
    setCompleted(false);
    setSummary(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Oxford Tutorial Defense
          </DialogTitle>
          <DialogDescription>
            Defend your understanding of <span className="font-medium text-foreground">{topic}</span>
          </DialogDescription>
        </DialogHeader>

        {!started ? (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-foreground">6 rounds, easy to challenging</p>
              <div className="flex items-center gap-1 justify-center">
                {[1,2,3,4,5].map(l => (
                  <div key={l} className={`h-2 rounded-full ${l <= 2 ? "bg-emerald-400 w-6" : l <= 4 ? "bg-amber-400 w-5" : "bg-red-400 w-4"}`} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Easy → Medium → Challenge</p>
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Your buddy will start with simple questions and gradually make them trickier. Think of it as a friendly chat — not a test! 🧠
            </p>
            <Button onClick={startDefense} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Shield className="h-4 w-4 mr-1" />}
              Let's Start! 💪
            </Button>
          </div>
        ) : (
          <>
            {/* Level indicator + Round counter */}
            <div className="flex items-center gap-3 px-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                  Round {Math.min(exchangeCount + 1, MAX_ROUNDS)}/{MAX_ROUNDS}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  exchangeCount < 2 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" :
                  exchangeCount < 4 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" :
                  "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                }`}>
                  {exchangeCount < 2 ? "Easy" : exchangeCount < 4 ? "Medium" : "Challenge"}
                </span>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <Star className="h-3.5 w-3.5 text-amber-500" />
                <Progress value={confidence} className="h-2 flex-1" />
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{Math.round(confidence)}%</span>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 py-3 min-h-[250px] max-h-[400px]">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "student" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-line ${
                    m.role === "student"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-xl px-4 py-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            {completed ? (
              <div className="border-t pt-3 space-y-3">
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 text-center">
                  <Trophy className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Defense Complete!</p>
                  <p className="text-xs text-muted-foreground mt-1">Confidence: {Math.round(confidence)}%</p>
                </div>
                <Button className="w-full" onClick={handleClose}>Done</Button>
              </div>
            ) : (
              <div className="flex gap-2 pt-2 border-t">
                <Button size="sm" variant="outline" onClick={requestHint} disabled={loading} title="Get a hint">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                </Button>
                <input
                  className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Defend your understanding..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  disabled={loading}
                />
                <Button size="sm" onClick={sendMessage} disabled={loading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TutorialDefenseModal;
