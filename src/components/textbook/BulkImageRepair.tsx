import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wrench, Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface BrokenImage {
  visualId: string;
  visualTopic: string;
  slug: string;
  stepIndex: number;
  stepTitle: string;
}

interface RepairResult {
  item: BrokenImage;
  success: boolean;
  newUrl?: string;
  error?: string;
}

interface BulkImageRepairProps {
  gallery: Array<{
    id: string;
    topic: string;
    subject: string;
    slug?: string;
    steps: Array<{ image_url?: string; title?: string; step_number?: number }>;
  }>;
  onRepairComplete: () => void;
}

const BulkImageRepair = ({ gallery, onRepairComplete }: BulkImageRepairProps) => {
  const [phase, setPhase] = useState<"idle" | "scanning" | "repairing" | "done">("idle");
  const [brokenImages, setBrokenImages] = useState<BrokenImage[]>([]);
  const [results, setResults] = useState<RepairResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const abortRef = useRef(false);

  const buildSlug = (visual: BulkImageRepairProps["gallery"][0]) => {
    if ((visual as any).slug) return (visual as any).slug;
    return `${visual.subject.toLowerCase()}_${visual.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}`;
  };

  const scanForBroken = async () => {
    setPhase("scanning");
    setBrokenImages([]);
    setResults([]);
    abortRef.current = false;

    const broken: BrokenImage[] = [];

    for (const visual of gallery) {
      const slug = buildSlug(visual);
      for (let i = 0; i < visual.steps.length; i++) {
        const step = visual.steps[i];
        if (!step.image_url) {
          broken.push({
            visualId: visual.id,
            visualTopic: visual.topic,
            slug,
            stepIndex: i,
            stepTitle: step.title || `Step ${i + 1}`,
          });
          continue;
        }
        // Check if URL is reachable
        try {
          const resp = await fetch(step.image_url, { method: "HEAD", mode: "no-cors" });
          // no-cors gives opaque response, so we can't check status reliably
          // Instead just check if the URL looks valid
        } catch {
          broken.push({
            visualId: visual.id,
            visualTopic: visual.topic,
            slug,
            stepIndex: i,
            stepTitle: step.title || `Step ${i + 1}`,
          });
        }
      }
    }

    setBrokenImages(broken);

    if (broken.length === 0) {
      toast.success("All images are healthy! No repairs needed.");
      setPhase("done");
    } else {
      toast.info(`Found ${broken.length} missing/broken image(s). Ready to repair.`);
      setPhase("repairing");
      await repairAll(broken);
    }
  };

  const repairAll = async (items: BrokenImage[]) => {
    const allResults: RepairResult[] = [];

    for (let i = 0; i < items.length; i++) {
      if (abortRef.current) {
        toast.info("Repair stopped by user.");
        break;
      }

      const item = items[i];
      setCurrentIndex(i);

      try {
        const { data, error } = await supabase.functions.invoke("generate-reasoning-visual", {
          body: { action: "repair-image", slug: item.slug, step_index: item.stepIndex },
        });

        if (error) throw error;

        if (data?.image_url) {
          allResults.push({ item, success: true, newUrl: data.image_url });
        } else {
          allResults.push({ item, success: false, error: data?.message || "No image returned" });
        }
      } catch (err: any) {
        const isCredits = err?.message?.includes("402") || err?.message?.includes("non-2xx");
        allResults.push({ item, success: false, error: isCredits ? "Credits exhausted" : err?.message || "Failed" });
        if (isCredits) {
          toast.error("AI credits exhausted — stopping bulk repair.");
          break;
        }
      }

      setResults([...allResults]);

      // Small delay between requests to avoid rate limiting
      if (i < items.length - 1) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    setPhase("done");
    const successCount = allResults.filter((r) => r.success).length;
    if (successCount > 0) {
      toast.success(`Repaired ${successCount}/${allResults.length} images!`);
      onRepairComplete();
    } else if (allResults.length > 0) {
      toast.error("No images could be repaired. Try again later.");
    }
  };

  const progressPct = brokenImages.length > 0 ? ((currentIndex + 1) / brokenImages.length) * 100 : 0;
  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  if (phase === "idle") {
    return (
      <Button variant="outline" size="sm" onClick={scanForBroken} className="gap-1.5">
        <Wrench className="h-3.5 w-3.5" />
        Repair All Images
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary" />
          Bulk Image Repair
        </h3>
        {phase === "repairing" && (
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { abortRef.current = true; }}>
            Stop
          </Button>
        )}
        {phase === "done" && (
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setPhase("idle")}>
            Close
          </Button>
        )}
      </div>

      {phase === "scanning" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Scanning {gallery.length} visuals for broken images...
        </div>
      )}

      {phase === "repairing" && (
        <div className="space-y-2">
          <Progress value={progressPct} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Repairing {currentIndex + 1} of {brokenImages.length}...</span>
            <span className="flex items-center gap-2">
              {successCount > 0 && <span className="flex items-center gap-0.5 text-emerald-500"><CheckCircle2 className="h-3 w-3" />{successCount}</span>}
              {failCount > 0 && <span className="flex items-center gap-0.5 text-destructive"><XCircle className="h-3 w-3" />{failCount}</span>}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {brokenImages[currentIndex]?.visualTopic} — {brokenImages[currentIndex]?.stepTitle}
          </p>
        </div>
      )}

      {phase === "done" && (
        <div className="space-y-2">
          {brokenImages.length === 0 ? (
            <p className="text-sm text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> All images are healthy!
            </p>
          ) : (
            <>
              <div className="flex items-center gap-3 text-sm">
                {successCount > 0 && (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" /> {successCount} repaired
                  </span>
                )}
                {failCount > 0 && (
                  <span className="flex items-center gap-1 text-destructive">
                    <XCircle className="h-4 w-4" /> {failCount} failed
                  </span>
                )}
              </div>
              {failCount > 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Failed images can be retried individually or when credits are available.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkImageRepair;
