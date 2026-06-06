import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { bridgeFromAnswer } from "@/lib/bridgeFromAnswer";
import { Loader2 } from "lucide-react";

interface Props {
  conceptKey: string;
  step: string;
  prompt: string;
  placeholder?: string;
  interestTag?: string;
  ctaLabel?: string;
  initial?: string;
  onContinue: (text: string, bridgeLine: string) => void;
}

export default function ReflectInput({
  conceptKey,
  step,
  prompt,
  placeholder,
  interestTag,
  ctaLabel = "Continue",
  initial,
  onContinue,
}: Props) {
  const [text, setText] = useState(initial ?? "");
  const [bridge, setBridge] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await bridgeFromAnswer({
        conceptKey,
        step,
        studentText: text,
        interestTag,
      });
      setBridge(res.line);
    } catch (e) {
      console.error("ReflectInput submit failed", e);
      setError("Couldn't read that just now. Try once more?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 sm:p-8 max-w-2xl mx-auto">
      <label htmlFor="reflect-input" className="block text-xl sm:text-2xl font-serif font-medium mb-4 text-foreground leading-snug">
        {prompt}
      </label>
      <textarea
        id="reflect-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder ?? "Type whatever comes to mind…"}
        rows={4}
        maxLength={600}
        disabled={!!bridge}
        aria-describedby="reflect-count"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-base leading-relaxed focus:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground resize-none disabled:opacity-70"
      />
      <div id="reflect-count" className="mt-2 text-xs text-muted-foreground text-right" aria-live="polite">
        {text.length}/600
      </div>

      {!bridge && !loading && (
        <Button onClick={submit} disabled={!text.trim()} className="mt-3 w-full sm:w-auto">
          Share this thought
        </Button>
      )}

      {loading && (
        <div className="mt-4 space-y-3" aria-live="polite" aria-busy="true">
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary/80 mb-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:hidden" aria-hidden="true" />
              <span>Reading what you wrote…</span>
            </div>
            <div className="space-y-2" aria-hidden="true">
              <div className="h-3 w-11/12 rounded bg-primary/10 animate-pulse" />
              <div className="h-3 w-9/12 rounded bg-primary/10 animate-pulse" />
              <div className="h-3 w-7/12 rounded bg-primary/10 animate-pulse" />
            </div>
            <p className="sr-only">Reflecting back to you in a moment.</p>
          </div>
          <p className="text-xs text-muted-foreground">
            This takes a few seconds — we're letting the system think before it replies.
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4" aria-live="polite">
          <p className="text-sm text-destructive">{error}</p>
          <Button onClick={submit} variant="outline" size="sm" className="mt-3">
            Try again
          </Button>
        </div>
      )}


      {bridge && (
        <div className="mt-4 space-y-4 animate-fade-in" aria-live="polite">
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
            <div className="text-xs uppercase tracking-wider text-primary/80 mb-1">
              The system reflects back
            </div>
            <p className="text-base text-foreground/90 leading-relaxed">{bridge}</p>
          </div>
          <Button onClick={() => onContinue(text, bridge)} className="w-full sm:w-auto">
            {ctaLabel}
          </Button>
        </div>
      )}

    </Card>
  );
}
