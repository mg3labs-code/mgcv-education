import { useState } from "react";
import { ConnectionsContent } from "@/data/textbookData";
import { Link, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
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
  "Science (Physics & Engineering)": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  "Finance & Economics": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  "Computer Science & Programming": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400",
  "Art & Architecture": "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400",
};

/* Detect if a string is a URL */
const isUrl = (s: string) => /^https?:\/\//i.test(s);

/* Extract a readable domain label from a URL */
const domainLabel = (url: string) => {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    return h;
  } catch {
    return url;
  }
};

const ConnectionCard = ({ connection, index }: { connection: { domain: string; link: string; explanation: string; icon: string; reference?: string }; index: number }) => {
  const [expanded, setExpanded] = useState(false);

  // Determine what's the title vs URL. Some AI-generated data puts URLs in `link`.
  const linkIsUrl = isUrl(connection.link);
  const title = linkIsUrl ? connection.domain : connection.link;
  const refUrl = connection.reference || (linkIsUrl ? connection.link : undefined);

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300 group">
      {/* Card header */}
      <div className="px-5 py-4 flex items-center gap-3 border-b border-border/30">
        <span className="text-2xl shrink-0">{connection.icon}</span>
        <div className="flex-1 min-w-0">
          <SubjectBadge
            label={connection.domain}
            color={domainColors[connection.domain] || "bg-muted text-muted-foreground"}
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4 space-y-3">
        {!linkIsUrl && (
          <p className="text-[0.95rem] font-medium text-foreground leading-relaxed">
            {connection.link}
          </p>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left"
        >
          <div className={`rounded-xl bg-muted/40 p-3.5 border border-border/30 transition-all ${expanded ? "" : "line-clamp-3"}`}>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {connection.explanation}
            </p>
          </div>
          {connection.explanation.length > 120 && (
            <div className="flex items-center justify-center gap-1 mt-1.5 text-xs text-primary">
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              <span>{expanded ? "Show less" : "Read more"}</span>
            </div>
          )}
        </button>

        {refUrl && (
          <a
            href={refUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1"
          >
            <ExternalLink className="h-3 w-3" />
            <span>{domainLabel(refUrl)}</span>
          </a>
        )}
      </div>
    </div>
  );
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
          <ConnectionCard key={i} connection={c as any} index={i} />
        ))}
      </div>
    </div>
  );
};

export default ConnectionsBlock;
