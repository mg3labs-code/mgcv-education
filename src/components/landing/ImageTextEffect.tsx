import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import letterT from "@/assets/letter-t.jpg";
import letterH from "@/assets/letter-h.jpg";
import letterI from "@/assets/letter-i.jpg";
import letterN from "@/assets/letter-n.jpg";
import letterK from "@/assets/letter-k.jpg";
import letterI2 from "@/assets/letter-i2.jpg";
import letterG from "@/assets/letter-g.jpg";

const letters = [
  { char: "T", img: letterT, label: "Teamwork & Collaboration" },
  { char: "H", img: letterH, label: "Hands-on Discovery" },
  { char: "I", img: letterI, label: "Innovation & Curiosity" },
  { char: "N", img: letterN, label: "Neural Connections" },
  { char: "K", img: letterK, label: "Knowledge Building" },
  { char: "I", img: letterI2, label: "Insight & Clarity" },
  { char: "N", img: letterN, label: "New Perspectives" },
  { char: "G", img: letterG, label: "Global Understanding" },
];

const ImageTextEffect = () => {
  return (
    <TooltipProvider delayDuration={100}>
      <div className="relative flex flex-wrap items-baseline justify-start select-none" aria-label="World-Class THINKING">
        {/* World-Class — bold shimmer text, same baseline */}
        <motion.span
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: "easeOut" }}
          className="inline-block font-black leading-none hero-glow-text mr-[0.15em]"
          style={{
            fontSize: "clamp(2rem, 5.2vw, 5.5rem)",
            letterSpacing: "-0.02em",
          }}
        >
          World-Class
        </motion.span>

        {/* THINKING — image-filled letters */}
        {letters.map((l, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <motion.span
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.15 + i * 0.05, ease: "easeOut" }}
                whileHover={{ scale: 1.1, y: -5 }}
                className="inline-block font-black leading-none cursor-default relative"
                style={{
                  fontSize: "clamp(2rem, 5.2vw, 5.5rem)",
                  backgroundImage: `url(${l.img})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  letterSpacing: "-0.03em",
                  filter: "contrast(1.3) saturate(1.4)",
                  WebkitTextStroke: "1px rgba(0,0,0,0.15)",
                  transition: "filter 0.3s ease",
                }}
              >
                {l.char}
                <span
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage: `url(${l.img})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    mixBlendMode: "overlay",
                    maskImage: "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.7) 50%, transparent 70%)",
                    WebkitMaskImage: "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.7) 50%, transparent 70%)",
                    maskSize: "300% 100%",
                    WebkitMaskSize: "300% 100%",
                    animation: `shimmer-sweep 3s ease-in-out infinite ${i * 0.12}s`,
                  }}
                  aria-hidden="true"
                >
                  {l.char}
                </span>
              </motion.span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs font-medium z-[60]">
              {l.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default ImageTextEffect;
