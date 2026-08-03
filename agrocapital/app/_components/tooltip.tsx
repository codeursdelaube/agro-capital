"use client";

import { CircleHelp } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export function PedagogicTooltip({
  text,
  label = "En savoir plus",
}: {
  text: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
      >
        <CircleHelp size={16} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-9 left-1/2 z-40 w-60 -translate-x-1/2 rounded-2xl bg-gray-900 px-4 py-3 text-center text-xs leading-5 text-white shadow-xl"
          >
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}