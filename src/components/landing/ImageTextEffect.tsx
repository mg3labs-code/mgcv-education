import { motion } from "framer-motion";
import letterT from "@/assets/letter-t.jpg";
import letterH from "@/assets/letter-h.jpg";
import letterI from "@/assets/letter-i.jpg";
import letterN from "@/assets/letter-n.jpg";
import letterK from "@/assets/letter-k.jpg";
import letterI2 from "@/assets/letter-i2.jpg";
import letterG from "@/assets/letter-g.jpg";

const letters = [
  { char: "T", img: letterT },
  { char: "H", img: letterH },
  { char: "I", img: letterI },
  { char: "N", img: letterN },
  { char: "K", img: letterK },
  { char: "I", img: letterI2 },
  { char: "N", img: letterN },
  { char: "G", img: letterG },
];

const ImageTextEffect = () => {
  return (
    <div className="flex items-center justify-start select-none" aria-label="THINKING">
      {letters.map((l, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 + i * 0.06, ease: "easeOut" }}
          className="inline-block font-black leading-none"
          style={{
            fontSize: "clamp(3.5rem, 10vw, 9rem)",
            backgroundImage: `url(${l.img})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            WebkitTextStroke: "0.5px rgba(255,255,255,0.08)",
            letterSpacing: "-0.03em",
          }}
        >
          {l.char}
        </motion.span>
      ))}
    </div>
  );
};

export default ImageTextEffect;
