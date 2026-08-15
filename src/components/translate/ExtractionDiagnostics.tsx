import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, ScanLine } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { PageDiagnostic } from "@/lib/docStructure";

const LOW = 0.6;

function tone(c: number) {
  if (c >= 0.8) return { label: "Clean", className: "bg-primary/10 text-primary border-primary/20" };
  if (c >= LOW) return { label: "Fair", className: "bg-muted text-muted-foreground border-border" };
  return { label: "Low", className: "bg-destructive/10 text-destructive border-destructive/20" };
}

export default function ExtractionDiagnostics({ diagnostics }: { diagnostics: PageDiagnostic[] }) {
  const [open, setOpen] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const { low, avg, questions } = useMemo(() => {
    const low = diagnostics.filter((d) => d.confidence < LOW);
    const avg = diagnostics.length
      ? diagnostics.reduce((n, d) => n + d.confidence, 0) / diagnostics.length
      : 0;
    const questions = diagnostics.reduce((n, d) => n + d.questions, 0);
    return { low, avg, questions };
  }, [diagnostics]);

  if (!diagnostics.length) return null;
  const list = showAll ? diagnostics : low;

  return (
    <Card className="p-4 space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <ScanLine className="h-4 w-4 text-primary" />
          Extraction diagnostics
          <Badge variant="outline" className={tone(avg).className}>
            {Math.round(avg * 100)}% avg confidence
          </Badge>
          {low.length > 0 && (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
              {low.length} low-confidence page{low.length > 1 ? "s" : ""}
            </Badge>
          )}
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {diagnostics.length} page(s) read · {questions} question(s) reconstructed.
            {low.length === 0
              ? " Every page reconstructed cleanly."
              : " Pages below reconstructed poorly — re-run those pages, or they may need OCR."}
          </p>

          {low.length === 0 && !showAll && (
            <div className="flex items-center gap-2 text-xs text-primary">
              <CheckCircle2 className="h-4 w-4" /> No problem pages detected.
            </div>
          )}

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {list.map((d) => {
              const t = tone(d.confidence);
              return (
                <div key={d.page} className="rounded-md border border-border p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">Book page {d.page}</span>
                    <Badge variant="outline" className={t.className}>
                      {t.label} · {Math.round(d.confidence * 100)}%
                    </Badge>
                  </div>
                  <Progress value={d.confidence * 100} className="h-1" />
                  <p className="text-[11px] text-muted-foreground">
                    {d.questions} questions · {d.options} options · {d.lines} lines ·{" "}
                    {Math.round(d.fragmentRatio * 100)}% fragments
                  </p>
                  {d.issues.length > 0 && (
                    <ul className="space-y-1">
                      {d.issues.map((issue) => (
                        <li key={issue} className="flex items-start gap-1.5 text-[11px] text-destructive">
                          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          <Button variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Show only problem pages" : "Show all pages"}
          </Button>
        </div>
      )}
    </Card>
  );
}
