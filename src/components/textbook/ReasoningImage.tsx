import { useState, useCallback } from "react";
import { Loader2, RefreshCw, ImageOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReasoningImageProps {
  src: string | undefined;
  alt: string;
  stepIndex: number;
  slug?: string;
  className?: string;
  onImageFixed?: (stepIndex: number, newUrl: string) => void;
}

const MAX_RETRIES = 2;
const RETRY_DELAY = 3000;

const ReasoningImage = ({ src, alt, stepIndex, slug, className = "", onImageFixed }: ReasoningImageProps) => {
  const [status, setStatus] = useState<"loading" | "loaded" | "error" | "retrying" | "regenerating">(
    src ? "loading" : "error"
  );
  const [retryCount, setRetryCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = useCallback(() => {
    setStatus("loaded");
  }, []);

  const handleError = useCallback(() => {
    if (retryCount < MAX_RETRIES) {
      setStatus("retrying");
      setRetryCount((prev) => prev + 1);
      // Add cache-buster and retry after delay
      setTimeout(() => {
        const bustUrl = `${src}${src?.includes("?") ? "&" : "?"}retry=${retryCount + 1}&t=${Date.now()}`;
        setCurrentSrc(bustUrl);
        setStatus("loading");
      }, RETRY_DELAY);
    } else {
      setStatus("error");
    }
  }, [retryCount, src]);

  const handleRegenerate = async () => {
    if (!slug) return;
    setStatus("regenerating");
    try {
      const { data, error } = await supabase.functions.invoke("generate-reasoning-visual", {
        body: { action: "repair-image", slug, step_index: stepIndex },
      });
      if (error) throw error;
      if (data?.fallback) {
        setStatus("error");
        toast.error(data.message || "Image generation temporarily unavailable — try again later.");
        return;
      }
      if (data?.image_url) {
        setCurrentSrc(data.image_url);
        setRetryCount(0);
        setStatus("loading");
        onImageFixed?.(stepIndex, data.image_url);
        toast.success(`Image for Step ${stepIndex + 1} regenerated!`);
      } else {
        setStatus("error");
        toast.error("Could not regenerate image. Try again later.");
      }
    } catch (err) {
      console.error("Regenerate failed:", err);
      setStatus("error");
      toast.error("Regeneration failed — AI credits may be exhausted.");
    }
  };

  if (!src && status !== "regenerating") {
    return (
      <div className={`rounded-lg border border-dashed border-border h-48 flex flex-col items-center justify-center bg-muted/50 gap-2 ${className}`}>
        <ImageOff className="h-6 w-6 text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground">Image not generated yet</p>
        {slug && (
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={handleRegenerate}>
            <RefreshCw className="h-3 w-3 mr-1" /> Generate Image
          </Button>
        )}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={`rounded-lg border border-destructive/30 border-dashed h-48 flex flex-col items-center justify-center bg-destructive/5 gap-2 ${className}`}>
        <ImageOff className="h-6 w-6 text-destructive/50" />
        <p className="text-xs text-destructive/70">Image failed to load</p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7"
            onClick={() => {
              setRetryCount(0);
              setCurrentSrc(`${src}?t=${Date.now()}`);
              setStatus("loading");
            }}
          >
            <RefreshCw className="h-3 w-3 mr-1" /> Retry
          </Button>
          {slug && (
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={handleRegenerate}>
              <RefreshCw className="h-3 w-3 mr-1" /> Regenerate
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (status === "regenerating") {
    return (
      <div className={`rounded-lg border border-primary/20 h-48 flex flex-col items-center justify-center bg-primary/5 gap-2 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-primary">Regenerating image...</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden border border-border bg-muted relative ${className}`}>
      {(status === "loading" || status === "retrying") && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      <img
        src={currentSrc}
        alt={alt}
        className="w-full h-48 object-contain bg-background"
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
      />
      {status === "loaded" && (
        <div className="absolute top-1 right-1">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 drop-shadow" />
        </div>
      )}
    </div>
  );
};

export default ReasoningImage;

/** Utility: check how many images in a steps array are valid */
export function getImageHealthStats(steps: any[]): { total: number; withUrl: number; healthy: boolean } {
  const total = steps.length;
  const withUrl = steps.filter((s) => !!s.image_url).length;
  return { total, withUrl, healthy: withUrl === total && total > 0 };
}
