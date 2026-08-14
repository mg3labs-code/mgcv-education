import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface DocChatProps {
  docName: string;
  pageText: string;
  pageNumber: number;
  targetLang?: string;
}

const SUGGESTIONS = ["Explain this page simply", "Give me 3 key points", "Make a quick question from this"];

const DocChat = ({ docName, pageText, pageNumber, targetLang }: DocChatProps) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || loading) return;
    const history = messages.slice(-8);
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("doc-chat", {
        body: { question: q, pageText, docName, targetLang, history },
      });
      if (error) throw new Error(error.message);
      const payload = data as { answer?: string; error?: string };
      if (payload?.error) throw new Error(payload.error);
      setMessages((m) => [...m, { role: "assistant", content: payload?.answer || "No answer." }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: e instanceof Error ? e.message : "Something went wrong. Try again." },
      ]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    }
  };

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-24 right-5 z-40 h-12 w-12 rounded-full shadow-lg"
        aria-label="Ask about this document"
      >
        <MessageCircle className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-5 right-4 z-40 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-border bg-card shadow-xl flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 h-12 border-b border-border">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium">Ask about page {pageNumber}</p>
        <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={() => setOpen(false)} aria-label="Close chat">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="max-h-[50vh] min-h-[9rem] overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Ask anything about what you are reading.</p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="block w-full text-left text-xs rounded-lg border border-border px-3 py-2 hover:bg-muted/60 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto max-w-[85%] rounded-2xl bg-primary text-primary-foreground px-3 py-2 text-sm"
                : "max-w-[92%] rounded-2xl bg-muted px-3 py-2 text-sm leading-6 whitespace-pre-wrap"
            }
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex items-center gap-2 border-t border-border p-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question…"
          className="h-9 border-0 shadow-none focus-visible:ring-0"
        />
        <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default DocChat;
