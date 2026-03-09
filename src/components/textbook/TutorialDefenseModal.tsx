import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Send, Loader2, Mic, MicOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TutorialDefenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic: string;
  episodeTitle: string;
}

interface Message {
  role: "tutor" | "student";
  text: string;
}

const TutorialDefenseModal = ({ open, onOpenChange, topic, episodeTitle }: TutorialDefenseModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const startDefense = async () => {
    setStarted(true);
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("tutorial-defense", {
        body: { topic, episodeTitle, action: "start", history: [] },
      });
      const tutorMsg = res.data?.reply || "Let's begin. Tell me what you understood about this topic.";
      setMessages([{ role: "tutor", text: tutorMsg }]);
    } catch {
      setMessages([{ role: "tutor", text: "Let's begin your Tutorial Defense. Explain what you learned about " + topic + " in your own words." }]);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const studentMsg = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "student" as const, text: studentMsg }];
    setMessages(newMessages);
    setLoading(true);

    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 100);

    try {
      const res = await supabase.functions.invoke("tutorial-defense", {
        body: {
          topic,
          episodeTitle,
          action: "respond",
          history: newMessages.map(m => ({ role: m.role === "tutor" ? "assistant" : "user", content: m.text })),
        },
      });
      const tutorReply = res.data?.reply || "Good point. Can you go deeper?";
      setMessages([...newMessages, { role: "tutor", text: tutorReply }]);
    } catch {
      setMessages([...newMessages, { role: "tutor", text: "Interesting perspective. What evidence supports your claim?" }]);
    }
    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 100);
  };

  const handleClose = () => {
    onOpenChange(false);
    setMessages([]);
    setStarted(false);
    setInput("");
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
            Defend your understanding of <span className="font-medium text-foreground">{topic}</span>. The AI tutor will challenge your reasoning.
          </DialogDescription>
        </DialogHeader>

        {!started ? (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              In an Oxford Tutorial, you must defend what you've learned. The tutor will question your reasoning and push you to think deeper.
            </p>
            <Button onClick={startDefense} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Shield className="h-4 w-4 mr-1" />}
              Begin Defense
            </Button>
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 py-3 min-h-[250px] max-h-[400px]">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "student" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
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

            <div className="flex gap-2 pt-2 border-t">
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TutorialDefenseModal;
