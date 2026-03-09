import { ConnectionsContent } from "@/data/textbookData";
import { Link } from "lucide-react";

const ConnectionsBlock = ({ content }: { content: ConnectionsContent }) => {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-accent/30 border border-accent p-4">
        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Link className="h-4 w-4 text-primary" />
          Cross-domain connections for: {content.concept}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Great thinkers see patterns across different fields. Can you?
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {content.connections.map((c, i) => (
          <div
            key={i}
            className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{c.icon}</span>
              <span className="text-sm font-semibold text-foreground">{c.domain}</span>
            </div>
            <p className="text-sm text-foreground mb-2">{c.link}</p>
            <p className="text-xs text-muted-foreground italic">{c.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConnectionsBlock;
