import React, { useState } from "react";
import { X, ZoomIn } from "lucide-react";

export interface InlineMediaItem {
  url: string;
  caption?: string;
  alt?: string;
}

interface InlineMediaProps {
  media: InlineMediaItem[];
}

const InlineMedia = ({ media }: InlineMediaProps) => {
  const [zoomed, setZoomed] = useState<string | null>(null);
  const [errors, setErrors] = useState<Set<number>>(new Set());

  if (!media || media.length === 0) return null;

  return (
    <>
      <div className="my-4 flex flex-col sm:float-right sm:ml-4 sm:mb-2 sm:w-56 gap-3">
        {media.map((item, i) => {
          if (errors.has(i)) return null;
          return (
            <div key={i} className="group">
              <div
                className="relative rounded-lg overflow-hidden border border-border shadow-sm cursor-pointer"
                onClick={() => setZoomed(item.url)}
              >
                <img
                  src={item.url}
                  alt={item.alt || item.caption || "Illustration"}
                  loading="lazy"
                  className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={() => setErrors(prev => new Set(prev).add(i))}
                />
                <div className="absolute bottom-1 right-1 bg-background/70 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="h-3 w-3 text-foreground" />
                </div>
              </div>
              {item.caption && (
                <p className="text-xs text-muted-foreground mt-1 text-center italic">{item.caption}</p>
              )}
            </div>
          );
        })}
      </div>

      {zoomed && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomed(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors"
            onClick={() => setZoomed(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={zoomed}
            alt="Zoomed view"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}
    </>
  );
};

export default InlineMedia;
