import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HelpTooltipProps {
  content: string;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
}

const HelpTooltip = ({ content, className, side = "top" }: HelpTooltipProps) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center justify-center w-5 h-5 min-w-[20px] rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-help focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className ?? ""}`}
          tabIndex={0}
          aria-label="More info"
        >
          <HelpCircle className="h-3 w-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-[260px] text-xs leading-relaxed z-[60]">
        {content}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default HelpTooltip;
