import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface Props {
  line: string;
  onClose: () => void;
}

export default function TinyReveal({ line, onClose }: Props) {
  return (
    <Card className="p-6 sm:p-8 max-w-2xl mx-auto bg-gradient-to-br from-primary/5 to-accent/30 border-primary/20">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary/80 mb-3">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        A small reveal — just enough for today
      </div>
      <p className="text-xl sm:text-2xl font-serif leading-relaxed text-foreground mb-6">
        {line}
      </p>
      <p className="text-sm text-muted-foreground mb-5">
        That's all for today. Tomorrow we'll pick this up from exactly where your thought left off.
      </p>
      <Button onClick={onClose} variant="outline" className="w-full sm:w-auto">
        Continue tomorrow →
      </Button>
    </Card>
  );
}
