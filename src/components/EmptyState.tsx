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
  <div className={`flex flex-col items-center justify-center py-12 px-6 text-center rounded-2xl bg-gradient-to-br from-muted/30 via-muted/10 to-transparent border border-border/50 ${className ?? ""}`}>
    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
      <Icon className="h-7 w-7 text-primary/60" />
    </div>
    <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
    {actionLabel && onAction && (
      <Button onClick={onAction} variant="outline" size="sm" className="mt-5">
        {actionLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;
