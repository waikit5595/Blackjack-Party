'use client';

import { motion, AnimatePresence } from "framer-motion";

export default function FloatingResult({
  delta,
  label,
}: {
  delta?: number;
  label?: string;
}) {
  const value = Number(delta || 0);
  const hasLabel = !!label;
  const show = value !== 0 || (label && label === "TIE");

  if (!show) return null;

  let text = "";
  let toneClass = "";

  if (label === "TIE") {
    text = "TIE";
    toneClass = "text-slate-200";
  } else {
    text = `${value > 0 ? "+" : ""}RM${value}`;
    if (value > 0) toneClass = "text-emerald-300";
    else if (value < 0) toneClass = "text-red-300";
    else toneClass = "text-slate-200";
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${delta}-${label}`}
        initial={{ opacity: 0, y: 24, scale: 0.9 }}
        animate={{ opacity: 1, y: -8, scale: 1 }}
        exit={{ opacity: 0, y: -28, scale: 1.05 }}
        transition={{ duration: 0.55 }}
        className="absolute right-4 top-4 z-20 pointer-events-none"
      >
        <div className="flex flex-col items-end gap-1">
          <div
            className={`text-lg md:text-2xl font-black drop-shadow-[0_0_10px_rgba(255,255,255,0.15)] ${toneClass}`}
          >
            {text}
          </div>

          {hasLabel && label !== "WIN" && label !== "LOSE" && (
            <div className="text-xs md:text-sm font-bold px-2 py-1 rounded-full bg-white/10 border border-white/15 text-yellow-200">
              {label}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}