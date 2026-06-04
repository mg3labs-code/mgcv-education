import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { HookVariant } from "@/data/curiosityConcepts/realNumbers";
import { Eye } from "lucide-react";

interface Props {
  hook: HookVariant;
  onReady: () => void;
}

export default function HookCard({ hook, onReady }: Props) {
  return (
    <Card className="p-6 sm:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
        Day 1 · Something you've already seen
      </div>
      <h2 className="text-2xl sm:text-3xl font-serif font-semibold mb-3 leading-tight">
        {hook.headline}
      </h2>
      <p className="text-base sm:text-lg text-foreground/80 mb-4 leading-relaxed">
        {hook.scene}
      </p>
      <p className="text-sm text-muted-foreground italic mb-6">{hook.noticed}</p>
      <Button onClick={onReady} className="w-full sm:w-auto">
        I've seen this — what's next?
      </Button>
    </Card>
  );
}
