import { useState, useEffect } from "react";
import { Eye, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const ThinkFirstGate = ({ onReveal }: { onReveal: () => void }) => {
  const [countdown, setCountdown] = useState(10);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started || countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [started, countdown]);

  if (!started) {
    return (
      <div className="rounded-xl border-2 border-dashed border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/10 p-4 text-center">
        <p className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-2">🧠 Think about this first...</p>
        <p className="text-xs text-muted-foreground mb-3">The best learning happens when you struggle a bit before seeing the answer.</p>
        <Button variant="outline" size="sm" onClick={() => setStarted(true)} className="border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-400">
          I'm thinking... Start timer ⏱️
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onReveal}
      disabled={countdown > 0}
      className={`w-full border-dashed transition-all ${countdown > 0 ? "opacity-60" : "border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"}`}
    >
      <Eye className="h-3.5 w-3.5 mr-2" />
      {countdown > 0 ? `Keep thinking... ${countdown}s ⏱️` : "Reveal the insight! 👀"}
      <ChevronDown className="h-3.5 w-3.5 ml-2" />
    </Button>
  );
};

export default ThinkFirstGate;
