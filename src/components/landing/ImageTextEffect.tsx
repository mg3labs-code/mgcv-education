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
      <div className="flex items-center justify-start select-none" aria-label="THINKING">
        {letters.map((l, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <motion.span
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.06, ease: "easeOut" }}
                whileHover={{ scale: 1.12, y: -6 }}
                className="inline-block font-black leading-none cursor-default"
                style={{
                  fontSize: "clamp(3rem, 9vw, 8rem)",
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
