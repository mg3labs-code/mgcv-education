import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface Props {
  interestEmoji: string;
  onContinue: () => void;
}

const colors = ["#22C55E", "#F59E0B", "#3B82F6", "#8B5CF6", "#EF4444"];

export default function Day1Done({ interestEmoji, onContinue }: Props) {
  const [pieces, setPieces] = useState<number[]>([]);
  useEffect(() => {
    setPieces(Array.from({ length: 18 }, (_, i) => i));
  }, []);

  return (
    <div className="arc-shell max-w-[480px] mx-auto space-y-4">
      <Card className="p-5 sm:p-6 text-center relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-20 pointer-events-none overflow-hidden" aria-hidden="true">
          {pieces.map((i) => (
            <span
              key={i}
              className="arc-confetti-piece motion-reduce:hidden"
              style={{
                left: `${(i * 53) % 100}%`,
                background: colors[i % colors.length],
                animationDelay: `${(i % 6) * 0.1}s`,
              }}
            />
          ))}
        </div>
        <Sparkles className="h-9 w-9 mx-auto text-amber-500 mb-2" aria-hidden="true" />
        <h2 className="arc-display text-[20px] font-extrabold mb-1">
          Day 1 done. Real learning in 5 minutes.
        </h2>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Here's what just happened in your brain:
        </p>

        <ol className="text-left mt-4 space-y-2">
          <li className="flex gap-3 p-2.5 rounded-lg bg-emerald-50">
            <span className="text-[15px] font-bold text-emerald-700">1</span>
            <p className="text-[12.5px] text-foreground leading-relaxed">
              <strong>You got confused first.</strong> The number that wouldn't end felt strange. That confusion is what made the concept stick.
            </p>
          </li>
          <li className="flex gap-3 p-2.5 rounded-lg bg-sky-50">
            <span className="text-[15px] font-bold text-sky-700">2</span>
            <p className="text-[12.5px] text-foreground leading-relaxed">
              <strong>You sorted real examples.</strong> Not textbook numbers. You built the concept in your own mind.
            </p>
          </li>
          <li className="flex gap-3 p-2.5 rounded-lg bg-violet-50">
            <span className="text-[15px] font-bold text-violet-700">3</span>
            <p className="text-[12.5px] text-foreground leading-relaxed">
              <strong>You caught a trap</strong> — a statement that sounds true but isn't. Hardest skill in maths, and you used it.
            </p>
          </li>
        </ol>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="rounded-lg p-2.5 bg-emerald-50">
            <div className="text-[18px] font-extrabold text-emerald-700">+1%</div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Clarity</div>
          </div>
          <div className="rounded-lg p-2.5 bg-sky-50">
            <div className="text-[18px] font-extrabold text-sky-700">+1%</div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Thinking</div>
          </div>
          <div className="rounded-lg p-2.5 bg-amber-50">
            <div className="text-[15px] font-extrabold text-amber-700">Day 1</div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Streak</div>
          </div>
        </div>

        <div className="mt-4 text-left rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5">
          <div className="text-[9px] uppercase tracking-[2px] font-bold text-amber-700">Tomorrow · Day 2 · Build</div>
          <div className="text-[12px] text-amber-900 mt-1 leading-relaxed">
            We'll reflect your own words back. Then go one layer deeper — why these number families had to be invented and what breaks without them.
          </div>
        </div>

        <div className="mt-3 text-left rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-[12px] text-emerald-900 leading-relaxed">
          <span aria-hidden="true">{interestEmoji}</span> <strong>One fact to take with you:</strong> next time a decimal won't stop on your screen, you'll know exactly which family it belongs to.
        </div>
      </Card>

      <Button className="w-full" onClick={onContinue}>
        Continue to Day 2 →
      </Button>
    </div>
  );
}
