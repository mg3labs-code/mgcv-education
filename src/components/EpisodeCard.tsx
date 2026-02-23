import { CheckCircle2, Circle, Clock, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EpisodeCardProps {
  id: string;
  number: number;
  title: string;
  duration: string;
  status: "locked" | "available" | "in-progress" | "completed";
  blocks: number;
  completedBlocks: number;
}

const statusConfig = {
  locked: { icon: Lock, label: "Locked", style: "opacity-50 cursor-not-allowed" },
  available: { icon: Circle, label: "Start", style: "cursor-pointer hover:border-accent hover:shadow-md transition-all" },
  "in-progress": { icon: Clock, label: "Continue", style: "cursor-pointer border-accent/50 hover:border-accent hover:shadow-md transition-all" },
  completed: { icon: CheckCircle2, label: "Review", style: "cursor-pointer border-success/30 hover:shadow-md transition-all" },
};

const EpisodeCard = ({ id, number, title, duration, status, blocks, completedBlocks }: EpisodeCardProps) => {
  const navigate = useNavigate();
  const config = statusConfig[status];
  const Icon = config.icon;

  const handleClick = () => {
    if (status !== "locked") {
      navigate(`/student/episode/${id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`rounded-lg border border-border bg-card p-5 ${config.style}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            {number}
          </span>
          <div>
            <h3 className="font-semibold text-card-foreground text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3" /> {duration}
            </p>
          </div>
        </div>
        <Icon className={`h-5 w-5 ${status === "completed" ? "text-success" : status === "in-progress" ? "text-accent" : "text-muted-foreground"}`} />
      </div>
      {status !== "locked" && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{completedBlocks}/{blocks} blocks</span>
            <span>{Math.round((completedBlocks / blocks) * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${(completedBlocks / blocks) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EpisodeCard;
