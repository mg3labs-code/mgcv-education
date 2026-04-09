import { ConnectionsContent } from "@/data/textbookData";
import { Link } from "lucide-react";
import { DefinitionCard, SubjectBadge } from "@/components/textbook/ContentCards";

const domainColors: Record<string, string> = {
  Physics: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  Chemistry: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
  Biology: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  Mathematics: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400",
  "Real Life": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  Sports: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400",
  Music: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400",
  Technology: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400",
};

const ConnectionsBlock = ({ content }: { content: ConnectionsContent }) => {
  return (
    <div className="space-y-5">
      <DefinitionCard title={`Where else does ${content.concept} hide?`}>
        <div className="flex items-center gap-2">
          <Link className="h-4 w-4 text-primary" />
          <p className="text-sm text-muted-foreground italic">
            This idea shows up in surprising places. Can you spot it?
          </p>
        </div>
      </DefinitionCard>

      <div className="grid gap-4 sm:grid-cols-2">
        {content.connections.map((c, i) => (
          <div
            key={i}
            className="rounded-xl border-2 border-border/60 bg-card p-5 hover:shadow-md hover:border-primary/30 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{c.icon}</span>
              <SubjectBadge
                label={c.domain}
                color={domainColors[c.domain] || "bg-muted text-muted-foreground"}
              />
            </div>
            <p className="text-[0.95rem] font-medium text-foreground mb-2 leading-relaxed">{c.link}</p>
            <div className="rounded-lg bg-muted/40 p-3 border border-border/30">
              <p className="text-sm text-muted-foreground italic leading-relaxed">{c.explanation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConnectionsBlock;
