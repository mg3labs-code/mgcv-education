import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction, className }: EmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: "easeOut" as const }}
    role="status"
    className={`flex flex-col items-center justify-center py-10 md:py-14 px-4 md:px-6 text-center rounded-2xl glass-premium ${className ?? ""}`}
  >
    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center mb-4">
      <Icon className="h-7 w-7 text-primary/60" />
    </div>
    <h3 className="text-sm md:text-base font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-xs md:text-sm text-muted-foreground max-w-xs">{description}</p>
    {actionLabel && onAction && (
      <Button onClick={onAction} variant="outline" size="sm" className="mt-5 rounded-full">
        {actionLabel}
      </Button>
    )}
  </motion.div>
);

export default EmptyState;
