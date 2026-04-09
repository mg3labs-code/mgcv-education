import React, { useState, useEffect } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { X, ZoomIn, Play, BookOpen, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export interface VisualAidContent {
  type: "image" | "video";
  url: string;
  caption: string;
  explanation?: string;
  alt?: string;
  searchTerms?: string;
  source?: "web" | "generated";
}

interface VisualAidBlockProps {
  content: VisualAidContent;
}

const VisualAidBlock = ({ content }: VisualAidBlockProps) => {
  const [zoomed, setZoomed] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState(content.url || "");
  const [loading, setLoading] = useState(false);
  const [tried, setTried] = useState(false);

  // Auto-resolve if no valid URL
  useEffect(() => {
    if (!resolvedUrl && !tried && (content.caption || content.searchTerms)) {
      resolveVisual();
    }
  }, []);

  const resolveVisual = async () => {
    setLoading(true);
    setImgError(false);
    setTried(true);
    try {
      const { data, error } = await supabase.functions.invoke("resolve-visual-aid", {
        body: {
          query: content.searchTerms || content.caption || content.alt || "",
          topic: content.caption || "",
          type: content.type || "image",
        },
      });
      if (error) throw error;
      if (data?.url && !data?.fallback) {
        setResolvedUrl(data.url);
      }
    } catch (e) {
      console.error("Visual resolve failed:", e);
    }
    setLoading(false);
  };

  if (!resolvedUrl && !content?.explanation && !content?.caption) return null;

  const isVideo = content.type === "video";

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([^&?\s]+)/);
    return match?.[1] || url;
  };

  if (isVideo && resolvedUrl) {
    const videoId = getYouTubeId(resolvedUrl);
    return (
      <div className="space-y-3">
        <div className="rounded-xl overflow-hidden border border-border shadow-sm">
          <AspectRatio ratio={16 / 9}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
              title={content.caption || "Educational video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
              loading="lazy"
            />
          </AspectRatio>
        </div>
        {content.caption && (
          <p className="text-sm text-muted-foreground text-center italic flex items-center justify-center gap-1.5">
            <Play className="h-3.5 w-3.5" />
            {content.caption}
          </p>
        )}
      </div>
    );
  }

  const hasValidUrl = resolvedUrl && !imgError;

  return (
    <>
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center">
            <Loader2 className="h-8 w-8 text-primary mx-auto mb-3 animate-spin" />
            <p className="text-sm font-medium text-foreground">Generating visual...</p>
            <p className="text-xs text-muted-foreground mt-1">{content.caption}</p>
          </div>
        ) : hasValidUrl ? (
          <div
            className="relative rounded-xl overflow-hidden border border-border shadow-sm cursor-pointer group"
            onClick={() => setZoomed(true)}
          >
            <img
              src={resolvedUrl}
              alt={content.alt || content.caption || "Visual aid"}
              loading="lazy"
              className="w-full h-auto max-h-[400px] object-contain bg-muted/20 transition-transform duration-300 group-hover:scale-[1.02]"
              onError={() => setImgError(true)}
            />
            <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="h-4 w-4 text-foreground" />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-border bg-muted/10 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {content.caption || "Diagram Description"}
                </p>
                <p className="text-xs text-muted-foreground">Visual reference</p>
              </div>
              {!loading && (
                <Button variant="outline" size="sm" onClick={resolveVisual} className="shrink-0">
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Load Visual
                </Button>
              )}
            </div>
            {content.explanation && (
              <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-lg p-3">
                {content.explanation}
              </p>
            )}
          </div>
        )}

        {content.caption && hasValidUrl && (
          <p className="text-sm text-muted-foreground text-center italic flex items-center justify-center gap-1.5 flex-wrap">
            📷 {content.caption}
          </p>
        )}
        {content.explanation && hasValidUrl && (
          <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-lg p-3">
            {content.explanation}
          </p>
        )}
      </div>

      {/* Zoom modal */}
      {zoomed && hasValidUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomed(false)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors"
            onClick={() => setZoomed(false)}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={resolvedUrl}
            alt={content.alt || content.caption || "Visual aid"}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
          {content.caption && (
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm text-center bg-black/50 px-4 py-2 rounded-full">
              {content.caption}
            </p>
          )}
        </div>
      )}
    </>
  );
};

export default VisualAidBlock;
