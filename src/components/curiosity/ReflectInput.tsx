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

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const res = await bridgeFromAnswer({
      conceptKey,
      step,
      studentText: text,
      interestTag,
    });
    setBridge(res.line);
    setLoading(false);
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

      {!bridge ? (
        <Button onClick={submit} disabled={!text.trim() || loading} className="mt-3 w-full sm:w-auto">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
              <span>Listening…</span>
            </>
          ) : (
            "Share this thought"
          )}
        </Button>
      ) : (
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
