import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface Props {
  echo: string;
  onContinue: () => void;
}

export default function YesterdayEcho({ echo, onContinue }: Props) {
  return (
    <Card className="p-6 sm:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
        <Clock className="h-3.5 w-3.5" />
        Day 2 · Picking up exactly where you stopped
      </div>
      <p className="text-lg sm:text-xl font-serif leading-relaxed text-foreground mb-6">
        {echo}
      </p>
      <Button onClick={onContinue}>That's me — keep going</Button>
    </Card>
  );
}
