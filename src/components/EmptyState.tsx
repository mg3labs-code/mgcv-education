import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction, className }: EmptyStateProps) => (
  <div role="status" className={`flex flex-col items-center justify-center py-8 md:py-12 px-4 md:px-6 text-center rounded-2xl bg-gradient-to-br from-muted/30 via-muted/10 to-transparent border border-border/50 ${className ?? ""}`}>
    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 md:mb-4">
      <Icon className="h-6 w-6 md:h-7 md:w-7 text-primary/60" />
    </div>
    <h3 className="text-sm md:text-base font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-xs md:text-sm text-muted-foreground max-w-xs">{description}</p>
    {actionLabel && onAction && (
      <Button onClick={onAction} variant="outline" size="sm" className="mt-4 md:mt-5">
        {actionLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;
