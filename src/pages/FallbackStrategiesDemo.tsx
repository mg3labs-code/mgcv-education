import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, Database, Sparkles, Clock, ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import DownloadCodeButton from "@/components/DownloadCodeButton";
// Raw source imports — bundled at build time, used by the Download button
import sourceSelf from "./FallbackStrategiesDemo.tsx?raw";
import sourceEdgeFn from "../../supabase/functions/simplify-block/index.ts?raw";
import sourceDownloadBtn from "@/components/DownloadCodeButton.tsx?raw";

/**
 * Fallback Strategies Demo — three ways to fill Explorer/Builder content for an existing block.
 *
 *  1) Client-side simplifier   — instant, mechanical (first sentence + emoji prefix). 0ms, no AI cost.
 *  2) AI on-demand + cache     — calls /functions/v1/simplify-block, caches into content_blocks. ~1-3s first time, instant after.
 *  3) Pre-generated cache      — assumes a batch job already ran; just reads content.simplified from DB. 0ms.
 *
 * Each card runs against a REAL content_block from the database so you can feel the
 * latency and quality differences.
 */

const FallbackStrategiesDemo = () => {
  const [blockId, setBlockId] = useState<string | null>(null);
  const [block, setBlock] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1 · Client simplifier
  const [clientResult, setClientResult] = useState<{ explorer: string; emoji: string; ms: number } | null>(null);

  // 2 · AI on-demand
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ explorer: string; emoji: string; builder: string; ms: number; source: string } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // 3 · Pre-generated
  const [cached, setCached] = useState<{ explorer: string; emoji: string; builder: string } | null>(null);

  useEffect(() => {
    void loadBlock();
  }, []);

  async function loadBlock() {
    setLoading(true);
    setClientResult(null);
    setAiResult(null);
    setCached(null);
    setAiError(null);

    const { data } = await supabase
      .from("content_blocks")
      .select("id, episode_id, block_type, title, content")
      .in("block_type", ["definition", "mechanism", "reasoning"])
      .limit(1)
      .single();

    if (!data) {
      setLoading(false);
      return;
    }
    setBlockId(data.id);
    setBlock(data);

    // 1 · Run client simplifier immediately (synchronous)
    const t0 = performance.now();
    const cs = clientSimplify(data);
    const t1 = performance.now();
    setClientResult({ ...cs, ms: Math.round(t1 - t0) });

    // 3 · Check pre-generated cache (just a DB read of content.simplified)
    const cachedSimplified = (data.content as any)?.simplified;
    if (cachedSimplified) setCached({ explorer: cachedSimplified.explorer?.oneLiner, emoji: cachedSimplified.explorer?.emoji, builder: cachedSimplified.builder?.story });

    setLoading(false);
  }

  async function runAi(force = false) {
    if (!blockId) return;
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    const t0 = performance.now();
    try {
      const { data, error } = await supabase.functions.invoke("simplify-block", { body: { blockId, force } });
      const t1 = performance.now();
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiResult({
        explorer: data.simplified.explorer.oneLiner,
        emoji: data.simplified.explorer.emoji,
        builder: data.simplified.builder.story,
        ms: Math.round(t1 - t0),
        source: data.source,
      });
      // Refresh cached card too — DB now has the fresh value
      setCached({
        explorer: data.simplified.explorer.oneLiner,
        emoji: data.simplified.explorer.emoji,
        builder: data.simplified.builder.story,
      });
    } catch (e: any) {
      setAiError(e?.message || "Failed");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/demo/explorer-mode"><Button variant="ghost" size="sm" className="gap-1.5"><ArrowLeft className="h-3.5 w-3.5" /> Back to render demo</Button></Link>
          </div>
          <div className="flex items-center gap-2">
            <DownloadCodeButton
              filename="fallback-strategies-demo.txt"
              files={[
                { path: "src/pages/FallbackStrategiesDemo.tsx", content: sourceSelf },
                { path: "supabase/functions/simplify-block/index.ts", content: sourceEdgeFn },
                { path: "src/components/DownloadCodeButton.tsx", content: sourceDownloadBtn },
              ]}
            />
            <Button variant="outline" size="sm" onClick={loadBlock} className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" /> Reload block</Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">Fallback Strategies — Same Block, 3 Sources</h1>
          <p className="text-xs text-muted-foreground mt-1">When Explorer mode opens a block that has no simplified version yet, where does the simplified text come from?</p>
        </div>

        {loading ? (
          <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
        ) : !block ? (
          <Card className="p-6 text-sm text-muted-foreground">No content blocks found in DB.</Card>
        ) : (
          <>
            {/* Source block */}
            <Card className="p-4 border-border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary" className="text-[10px]">{block.block_type}</Badge>
                <span className="text-xs font-semibold text-foreground">{block.title || "Untitled"}</span>
              </div>
              <pre className="text-[11px] text-muted-foreground bg-background/60 p-3 rounded-lg border border-border max-h-32 overflow-auto leading-relaxed">{JSON.stringify(block.content, null, 2).slice(0, 800)}{JSON.stringify(block.content).length > 800 ? "..." : ""}</pre>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
              {/* 1 · Client simplifier */}
              <StrategyCard
                title="1 · Client Simplifier"
                desc="Synchronous JS that grabs the first sentence and adds an emoji prefix. No network, no AI."
                pros={["0ms latency", "No AI cost", "Works offline"]}
                cons={["Mechanical quality", "No real analogy", "Same emoji per block-type"]}
                ms={clientResult?.ms}
                source="client"
                color="emerald"
              >
                {clientResult && (
                  <div className="space-y-3">
                    <SimplifiedCard emoji={clientResult.emoji} text={clientResult.explorer} variant="explorer" />
                    <p className="text-[11px] text-muted-foreground italic">No Builder version — client can't write a story.</p>
                  </div>
                )}
              </StrategyCard>

              {/* 2 · AI on-demand */}
              <StrategyCard
                title="2 · AI on-demand + Cache"
                desc="Calls simplify-block edge function. AI rewrites with a real analogy + builder story. Cached to DB on first call."
                pros={["High quality", "Real analogies", "Self-healing library"]}
                cons={["~1-3s first hit", "AI cost (~$0.0001)", "Needs network"]}
                ms={aiResult?.ms}
                source={aiResult?.source}
                color="purple"
              >
                {!aiResult && !aiLoading && (
                  <Button size="sm" className="w-full gap-1.5" onClick={() => runAi(false)}><Sparkles className="h-3.5 w-3.5" /> Generate with AI</Button>
                )}
                {aiLoading && (
                  <div className="p-6 rounded-xl bg-muted/40 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary mb-2" />
                    <p className="text-xs text-muted-foreground">AI thinking...</p>
                  </div>
                )}
                {aiError && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs">{aiError}</div>}
                {aiResult && (
                  <div className="space-y-3">
                    <SimplifiedCard emoji={aiResult.emoji} text={aiResult.explorer} variant="explorer" />
                    <SimplifiedCard text={aiResult.builder} variant="builder" />
                    <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={() => runAi(true)}><RefreshCw className="h-3.5 w-3.5" /> Re-generate (force)</Button>
                  </div>
                )}
              </StrategyCard>

              {/* 3 · Pre-generated */}
              <StrategyCard
                title="3 · Pre-generated Cache"
                desc="Reads content.simplified from DB. Assumes a batch script ran ahead of time on every block."
                pros={["0ms latency", "AI quality", "No first-viewer wait"]}
                cons={["Big upfront AI cost", "Stale if source changes", "Only works for known content"]}
                ms={cached ? 0 : undefined}
                source={cached ? "db" : undefined}
                color="blue"
              >
                {cached ? (
                  <div className="space-y-3">
                    <SimplifiedCard emoji={cached.emoji} text={cached.explorer} variant="explorer" />
                    <SimplifiedCard text={cached.builder} variant="builder" />
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-muted/40 text-center text-xs text-muted-foreground">
                    No cached version yet. <br /> Run strategy 2 first — it caches automatically.
                  </div>
                )}
              </StrategyCard>
            </div>

            {/* Recommendation */}
            <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🎯</div>
                <div>
                  <h3 className="font-bold text-foreground text-sm mb-1">Elite-design recommendation: Hybrid (1 + 2)</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Show the client simplifier <strong>instantly</strong> (no spinner ever). In the background, fire strategy 2 to upgrade the cache for the next viewer. Strategy 3 (pre-gen everything) is only worth it once you have proof students stay in Explorer mode — burning AI tokens for content nobody reads is the classic over-engineering trap.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ----- helpers ----- */

function clientSimplify(block: any): { explorer: string; emoji: string } {
  const emojiByType: Record<string, string> = {
    definition: "💡", mechanism: "⚙️", reasoning: "🔬", assumptions: "🤔",
    connections: "🔗", implications: "🌍", application: "🛠️",
  };
  const emoji = emojiByType[block.block_type] || "✨";
  // Walk the content blob, find the first reasonably long string, take first sentence
  const firstString = findFirstString(block.content) || block.title || "Tap to learn more.";
  const firstSentence = firstString.split(/[.!?]/)[0].trim();
  const trimmed = firstSentence.length > 90 ? firstSentence.slice(0, 87) + "..." : firstSentence;
  return { explorer: trimmed, emoji };
}

function findFirstString(node: any): string | null {
  if (typeof node === "string" && node.length > 25) return node;
  if (Array.isArray(node)) { for (const c of node) { const r = findFirstString(c); if (r) return r; } }
  else if (node && typeof node === "object") { for (const v of Object.values(node)) { const r = findFirstString(v); if (r) return r; } }
  return null;
}

const StrategyCard = ({ title, desc, pros, cons, ms, source, color, children }: { title: string; desc: string; pros: string[]; cons: string[]; ms?: number; source?: string; color: "emerald" | "purple" | "blue"; children: React.ReactNode }) => {
  const colorMap = {
    emerald: "from-emerald-400 to-teal-500",
    purple: "from-purple-400 to-pink-500",
    blue: "from-blue-400 to-indigo-500",
  };
  return (
    <Card className="overflow-hidden border-border bg-card flex flex-col">
      <div className={`h-1.5 bg-gradient-to-r ${colorMap[color]}`} />
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-sm text-foreground">{title}</h3>
          {ms !== undefined && (
            <Badge variant="secondary" className="text-[10px] gap-1 shrink-0"><Clock className="h-2.5 w-2.5" />{ms}ms{source === "cache" && " · cached"}{source === "ai" && " · fresh"}</Badge>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">{desc}</p>

        <div className="flex-1 mb-3">{children}</div>

        <div className="grid grid-cols-2 gap-2 text-[10px] mt-auto">
          <div>
            <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">+ Pros</div>
            <ul className="space-y-0.5 text-muted-foreground">{pros.map((p) => <li key={p}>· {p}</li>)}</ul>
          </div>
          <div>
            <div className="font-bold text-amber-600 dark:text-amber-400 mb-1">− Cons</div>
            <ul className="space-y-0.5 text-muted-foreground">{cons.map((c) => <li key={c}>· {c}</li>)}</ul>
          </div>
        </div>
      </div>
    </Card>
  );
};

const SimplifiedCard = ({ emoji, text, variant }: { emoji?: string; text: string; variant: "explorer" | "builder" }) => (
  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
    className={`p-3 rounded-xl border ${variant === "explorer" ? "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border-emerald-200/50 dark:border-emerald-800/40" : "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/40"}`}
  >
    <div className="text-[10px] uppercase tracking-wide font-bold mb-1.5 flex items-center gap-1 text-foreground/70">
      {variant === "explorer" ? <><Zap className="h-3 w-3" /> Explorer</> : <><Sparkles className="h-3 w-3" /> Builder Story</>}
    </div>
    <div className="flex items-start gap-2">
      {emoji && <span className="text-2xl shrink-0">{emoji}</span>}
      <p className="text-xs text-foreground leading-relaxed">{text}</p>
    </div>
  </motion.div>
);

export default FallbackStrategiesDemo;
