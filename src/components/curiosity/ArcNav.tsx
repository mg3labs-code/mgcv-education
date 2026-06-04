import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Lock } from "lucide-react";

interface Props {
  onBack?: () => void;
  onNext?: () => void;
  canBack: boolean;
  canNext: boolean;
  nextLabel?: string;
  lockReason?: string;
}

// Persistent back / next footer for every arc step.
// Forward is gated by `canNext` (the step's required interaction is done).
export default function ArcNav({
  onBack,
  onNext,
  canBack,
  canNext,
  nextLabel = "Next",
  lockReason = "Finish this step to continue",
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
        <div className="flex flex-col items-end">
          <Button
            size="sm"
            disabled={!canNext}
            onClick={onNext}
            className="gap-1 min-w-[120px] justify-center"
            aria-label={canNext ? nextLabel : lockReason}
          >
            {!canNext && <Lock className="h-3.5 w-3.5" aria-hidden="true" />}
            {nextLabel}
            {canNext && <ArrowRight className="h-4 w-4" />}
          </Button>
          {!canNext && (
            <span className="text-[10px] text-muted-foreground mt-1">
              {lockReason}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
