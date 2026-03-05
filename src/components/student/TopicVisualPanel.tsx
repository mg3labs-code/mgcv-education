import { useState, useEffect, useRef } from "react";
import { TopicVisual } from "@/data/topicVisuals";
import { ImageIcon } from "lucide-react";

interface Props {
  visuals: TopicVisual[];
}

const TopicVisualPanel = ({ visuals }: Props) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const prevVisualsRef = useRef<TopicVisual[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // When visuals list changes, reset index and fade in
  useEffect(() => {
    if (visuals.length === 0) {
      setIsVisible(false);
      return;
    }
    // Check if the set of visuals actually changed
    const changed =
      visuals.length !== prevVisualsRef.current.length ||
      visuals.some((v, i) => v.caption !== prevVisualsRef.current[i]?.caption);

    if (changed) {
      setImgLoaded(false);
      setActiveIndex(0);
      prevVisualsRef.current = visuals;
    }
    setIsVisible(true);
  }, [visuals]);

  // Rotate through visuals every 6 seconds
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (visuals.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setImgLoaded(false);
      setActiveIndex((prev) => (prev + 1) % visuals.length);
    }, 6000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visuals.length]);

  if (!isVisible || visuals.length === 0) return null;

  const current = visuals[activeIndex] || visuals[0];

  return (
    <div
      className="transition-all duration-500 ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(8px)",
      }}
    >
      {/* Desktop: side strip / Mobile: top strip */}
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        {/* Image */}
        <div className="relative aspect-video w-full overflow-hidden bg-black/20">
          {!imgLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-white/20 animate-pulse" />
            </div>
          )}
          <img
            key={current.imageUrl}
            src={current.imageUrl}
            alt={current.caption}
            onLoad={() => setImgLoaded(true)}
            className="w-full h-full object-cover transition-opacity duration-700 ease-in-out"
            style={{ opacity: imgLoaded ? 1 : 0 }}
            loading="eager"
          />
          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
        </div>

        {/* Caption */}
        <div className="absolute bottom-0 inset-x-0 px-3 py-2">
          <p className="text-xs font-medium text-white/90 truncate">{current.caption}</p>
          {visuals.length > 1 && (
            <div className="flex gap-1 mt-1.5">
              {visuals.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === activeIndex ? "w-4 bg-white/80" : "w-1.5 bg-white/25"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopicVisualPanel;
