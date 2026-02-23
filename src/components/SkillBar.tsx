interface SkillBarProps {
  label: string;
  value: number;
  maxValue?: number;
  colorClass: string;
}

const SkillBar = ({ label, value, maxValue = 100, colorClass }: SkillBarProps) => {
  const percentage = Math.round((value / maxValue) * 100);
  
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm font-semibold text-muted-foreground">{percentage}%</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass} animate-progress-fill`}
          style={{ "--progress-width": `${percentage}%`, width: `${percentage}%` } as React.CSSProperties}
        />
      </div>
    </div>
  );
};

export default SkillBar;
