"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="mx-auto w-full max-w-2xl px-4 py-6 pb-28 md:pb-10 sm:px-6 md:px-8"
    >
      {children}
    </motion.main>
  );
}