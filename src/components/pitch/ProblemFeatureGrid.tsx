import { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Sparkles } from "lucide-react";

/**
 * Problem → Feature → Screen → Effectiveness card grid.
 * Used by the /pitch deck for Student / Teacher / School slides.
 *
 * Each card answers, in this order, the only question a school principal asks:
 *   "What problem? What solves it? Where can I see it? How well does it work?"
 *
 * Visual:  HD picture from /src/assets/pitch/*.asset.json when status is "live",
 *          clean React mock when status is "next".
 */

export type PFEStatus = "live" | "next";

export interface PFECard {
  problem: string;
  feature: string;
  /** Image URL from `.asset.json.url`. Optional; when omitted a mock block renders. */
  image?: string;
  /** One-line outcome the school will see. */
  outcome: string;
  /** Supporting stat: ASER / NEP / pilot. Optional. */
  evidence?: string;
  /** "live" = built today (green dot). "next" = building next (amber dot). */
  status?: PFEStatus;
  /** Optional deep-link to the live feature in the app. */
  exploreHref?: string;
}

const tokens = {
  ink: "#0F172A",
  cream: "#FAF6EE",
  paper: "#FFFBF2",
  teal: "#0E9F7E",
  tealDark: "#0B7C63",
  gold: "#D4A24C",
  rose: "#C24A6A",
  line: "rgba(15,23,42,0.10)",
};

function StatusPill({ status }: { status: PFEStatus }) {
  const live = status === "live";
  const color = live ? tokens.teal : tokens.gold;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"
      style={{ background: `${color}18`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {live ? "Live today" : "Building next"}
    </span>
  );
}

function MockScreen({ label }: { label: string }) {
  return (
    <div
      className="aspect-[4/3] w-full rounded-xl flex flex-col items-center justify-center text-center gap-2 p-4"
      style={{
        background: `repeating-linear-gradient(135deg, ${tokens.paper} 0 8px, rgba(15,23,42,0.03) 8px 16px)`,
        border: `1px dashed ${tokens.line}`,
      }}
    >
      <Sparkles className="w-5 h-5" style={{ color: tokens.gold }} />
      <div className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: tokens.tealDark }}>
        Screen in design
      </div>
      <div className="text-[12px] opacity-70 max-w-[18ch]">{label}</div>
    </div>
  );
}

function Card({ card }: { card: PFECard }) {
  const status: PFEStatus = card.status ?? (card.image ? "live" : "next");
  return (
    <article
      className="rounded-2xl overflow-hidden flex flex-col h-full"
      style={{ background: tokens.paper, border: `1px solid ${tokens.line}` }}
    >
      {/* Screen */}
      <div className="p-4 pb-0">
        {card.image ? (
          <div
            className="aspect-[4/3] w-full rounded-xl overflow-hidden"
            style={{ background: tokens.ink, border: `1px solid ${tokens.line}` }}
          >
            <img
              src={card.image}
              alt={card.feature}
              loading="lazy"
              className="w-full h-full object-cover object-top"
            />
          </div>
        ) : (
          <MockScreen label={card.feature} />
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: tokens.rose }} />
            <div className="text-[13px] font-semibold leading-snug" style={{ color: tokens.ink }}>
              {card.problem}
            </div>
          </div>
          <StatusPill status={status} />
        </div>

        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: tokens.teal }} />
          <div className="text-[13px] leading-snug" style={{ color: "rgba(15,23,42,.82)" }}>
            <span className="font-semibold" style={{ color: tokens.tealDark }}>In the app · </span>
            {card.feature}
          </div>
        </div>

        <div
          className="mt-auto rounded-lg px-3 py-2 text-[12px] leading-snug"
          style={{ background: `${tokens.teal}10`, color: tokens.tealDark, fontWeight: 600 }}
        >
          → {card.outcome}
        </div>

        {card.evidence && (
          <div className="text-[10.5px] tracking-wide opacity-70 leading-snug">
            {card.evidence}
          </div>
        )}

        {card.exploreHref && status === "live" && (
          <a
            href={card.exploreHref}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-semibold tracking-wide uppercase opacity-80 hover:opacity-100"
            style={{ color: tokens.ink }}
          >
            Explore live →
          </a>
        )}
      </div>
    </article>
  );
}

export default function ProblemFeatureGrid({
  cards,
  columns = 3,
  caption,
}: {
  cards: PFECard[];
  columns?: 2 | 3 | 4;
  caption?: ReactNode;
}) {
  const grid = columns === 2 ? "lg:grid-cols-2" : columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";
  return (
    <div className="space-y-5">
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${grid} gap-5`}>
        {cards.map((c, i) => (
          <Card key={i} card={c} />
        ))}
      </div>
      {caption && <div className="text-[12px] opacity-65 leading-snug max-w-[80ch]">{caption}</div>}
    </div>
  );
}
