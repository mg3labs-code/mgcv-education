import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Props {
  onBack?: () => void;
  onNext?: () => void;
  canBack: boolean;
  canNext?: boolean; // kept for API compat; ignored — demo mode is always unlocked
  nextLabel?: string;
  lockReason?: string;
}

// Persistent back / next footer for every arc step.
// Demo mode: navigation is ALWAYS operable so presenters can walk back and
// forth freely. We never show a locked state.
export default function ArcNav({
  onBack,
  onNext,
  canBack,
  nextLabel = "Next",
}: Props) {
  return (
    <div className="sticky bottom-0 z-20 mt-6 -mx-4 px-4 py-3 bg-background/95 backdrop-blur border-t border-border">
      <div className="max-w-[480px] mx-auto flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          disabled={!canBack}
          onClick={onBack}
          className="gap-1"
          aria-label="Go back to previous step"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex-1" />
        <Button
          size="sm"
          onClick={onNext}
          className="gap-1 min-w-[120px] justify-center"
          aria-label={nextLabel}
        >
          {nextLabel}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
