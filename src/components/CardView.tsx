import { motion } from "framer-motion";
import { Card } from "@/lib/types";
import { cardLabel } from "@/lib/cards";

export default function CardView({
  card,
  hidden = false,
  delay = 0,
  emphasize = false,
}: {
  card?: Card;
  hidden?: boolean;
  delay?: number;
  emphasize?: boolean;
}) {
  return (
    <motion.div
      initial={{ rotateY: 180, opacity: 0, y: -12, scale: 0.94 }}
      animate={{ rotateY: 0, opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay }}
      className={`w-16 h-24 rounded-xl border shadow-lg flex items-center justify-center font-bold ${
        hidden || !card
          ? "card-back border-white/20 text-white"
          : "bg-white text-black border-black/10"
      } ${emphasize ? "ring-2 ring-yellow-400" : ""}`}
    >
      {hidden || !card ? <span className="text-2xl">🂠</span> : <span>{cardLabel(card)}</span>}
    </motion.div>
  );
}
