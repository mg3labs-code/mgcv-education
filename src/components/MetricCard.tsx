import { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  index?: number;
}

const MetricCard = ({ title, value, subtitle, icon: Icon, trend, index = 0 }: MetricCardProps) => {
  const numericValue = typeof value === "number" ? value : null;
  const animatedValue = useCountUp(numericValue ?? 0);

  return (
    <div
      className="rounded-lg border border-border bg-card p-5 space-y-3 animate-stagger-in card-hover-lift"
      style={{ "--stagger-delay": `${index * 0.08}s` } as React.CSSProperties}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-2xl font-bold font-serif text-card-foreground">
          {numericValue !== null ? animatedValue : value}
        </p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {trend && (
        <p className={`text-xs font-medium ${trend.positive ? "text-success" : "text-destructive"}`}>
          {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}% from last week
        </p>
      )}
    </div>
  );
};

export default MetricCard;
