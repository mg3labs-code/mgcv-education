import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
}

const MetricCard = ({ title, value, subtitle, icon: Icon, trend }: MetricCardProps) => (
  <div className="rounded-lg border border-border bg-card p-5 space-y-3 animate-fade-in">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-muted-foreground">{title}</span>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
    <div>
      <p className="text-2xl font-bold font-serif text-card-foreground">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
    {trend && (
      <p className={`text-xs font-medium ${trend.positive ? "text-success" : "text-destructive"}`}>
        {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}% from last week
      </p>
    )}
  </div>
);

export default MetricCard;
