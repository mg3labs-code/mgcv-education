import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// World-Class letter images
import letterW from "@/assets/letter-w.jpg";
import letterO from "@/assets/letter-o.jpg";
import letterR from "@/assets/letter-r.jpg";
import letterL from "@/assets/letter-l.jpg";
import letterD from "@/assets/letter-d.jpg";
import letterC from "@/assets/letter-c.jpg";
import letterA from "@/assets/letter-a.jpg";
import letterS from "@/assets/letter-s.jpg";

// THINKING letter images
import letterT from "@/assets/letter-t.jpg";
import letterH from "@/assets/letter-h.jpg";
import letterI from "@/assets/letter-i.jpg";
import letterN from "@/assets/letter-n.jpg";
import letterK from "@/assets/letter-k.jpg";
import letterI2 from "@/assets/letter-i2.jpg";
import letterG from "@/assets/letter-g.jpg";

type LetterDef = { char: string; img: string; label: string };

const worldClassLetters: LetterDef[] = [
  { char: "W", img: letterW, label: "World-Class Universities" },
  { char: "O", img: letterO, label: "Open Global Horizons" },
  { char: "R", img: letterR, label: "Reaching New Heights" },
  { char: "L", img: letterL, label: "Libraries of Wisdom" },
  { char: "D", img: letterD, label: "Diamond-Grade Excellence" },
  { char: "-", img: "", label: "" },
  { char: "C", img: letterC, label: "Championship Mindset" },
  { char: "L", img: letterL, label: "Lifelong Learning" },
  { char: "A", img: letterA, label: "Ambitious Vision" },
  { char: "S", img: letterS, label: "Stellar Standards" },
  { char: "S", img: letterS, label: "Sky's the Limit" },
];

const thinkingLetters: LetterDef[] = [
  { char: "T", img: letterT, label: "Teamwork & Collaboration" },
  { char: "H", img: letterH, label: "Hands-on Discovery" },
  { char: "I", img: letterI, label: "Innovation & Curiosity" },
  { char: "N", img: letterN, label: "Neural Connections" },
  { char: "K", img: letterK, label: "Knowledge Building" },
  { char: "I", img: letterI2, label: "Insight & Clarity" },
  { char: "N", img: letterN, label: "New Perspectives" },
  { char: "G", img: letterG, label: "Global Understanding" },
];

const ImageLetter = ({ l, i, size }: { l: LetterDef; i: number; size: string }) => {
  // Hyphen separator — no image, just styled text
  if (l.char === "-") {
    return (
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 0.3, delay: 0.15 + i * 0.04 }}
        className="inline-block font-black leading-none text-muted-foreground/40 select-none"
        style={{ fontSize: size, letterSpacing: "-0.03em" }}
      >
        -
      </motion.span>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.span
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 + i * 0.04, ease: "easeOut" }}
          whileHover={{ scale: 1.1, y: -5 }}
          className="inline-block font-black leading-none cursor-default relative"
          style={{
            fontSize: size,
            backgroundImage: `url(${l.img})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            WebkitTextStroke: "0.5px rgba(255,255,255,0.08)",
            letterSpacing: "-0.03em",
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
              animation: `shimmer-sweep 3s ease-in-out infinite ${i * 0.1}s`,
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
  );
};

const ImageTextEffect = () => {
  return (
    <TooltipProvider delayDuration={100}>
      <div className="relative flex flex-wrap items-baseline justify-start select-none gap-x-1" aria-label="World-Class THINKING">
        {/* World-Class — slightly smaller */}
        {worldClassLetters.map((l, i) => (
          <ImageLetter key={`wc-${i}`} l={l} i={i} size="clamp(2rem, 5.5vw, 5rem)" />
        ))}

        {/* Small gap between words */}
        <span className="inline-block" style={{ width: "clamp(0.4rem, 1vw, 0.8rem)" }} />

        {/* THINKING — larger, bolder */}
        {thinkingLetters.map((l, i) => (
          <ImageLetter key={`th-${i}`} l={l} i={worldClassLetters.length + i} size="clamp(2.5rem, 7vw, 6.5rem)" />
        ))}
      </div>
    </TooltipProvider>
  );
};

export default ImageTextEffect;
