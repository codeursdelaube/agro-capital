"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";

export function SplashScreen({ children }: { children: ReactNode }) {
  const t = useTranslations("Splash");
  const [showSplash, setShowSplash] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Vérifie si le splash a déjà été affiché pendant la session actuelle
    const hasSeen = sessionStorage.getItem("agrocapital_splash_seen");
    if (!hasSeen) {
      setShowSplash(true);

      // Simulation de la barre de progression (0% à 100%)
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5;
        });
      }, 70);

      // Masque le splash après 2.2s et sauvegarde dans la session
      const timer = setTimeout(() => {
        sessionStorage.setItem("agrocapital_splash_seen", "true");
        setShowSplash(false);
      }, 2200);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <motion.div
            key="splash-screen"
            initial={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white select-none"
          >
            {/* Lueurs d'ambiance et cercles néon */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-40 -right-40 h-[36rem] w-[36rem] rounded-full bg-emerald-500/20 blur-[120px] animate-pulse"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-40 -left-40 h-[36rem] w-[36rem] rounded-full bg-yellow-500/15 blur-[120px] animate-pulse"
            />

            {/* Conteneur principal Logo & Slogan */}
            <div className="relative flex flex-col items-center space-y-6 text-center px-6 max-w-lg z-10">
              
              {/* Emblème Agro-Capital Animé */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
                className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-700 text-white shadow-2xl shadow-emerald-500/40 border border-emerald-300/30"
              >
                {/* Glow ring */}
                <div className="absolute -inset-1 rounded-3xl bg-emerald-400/30 blur-md animate-ping" />

                <svg width="56" height="56" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <path d="M16 6 C10 6 7 12 8 19 C10 17 13 15 16 15 C19 15 22 17 24 19 C25 12 22 6 16 6Z" fill="#dcfce7" />
                  <path d="M16 15 L16 26" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M16 20 L12 17" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
                  <path d="M16 22 L20 19" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </motion.div>

              {/* Titre Wordmark */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-1"
              >
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none">
                  Agro<span className="text-emerald-400">Capital</span>
                </h1>
                <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-300/80 pt-1">
                  TOGO 🇹🇬
                </p>
              </motion.div>

              {/* Slogan */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-md"
              >
                {t("tagline")}
              </motion.div>

              {/* Barre de progression & Pourcentage */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="w-full max-w-xs space-y-2 pt-4"
              >
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10 p-0.5 border border-white/10 shadow-inner">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-yellow-400 shadow-md shadow-emerald-400/50"
                    style={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span>{t("subtitle")}</span>
                  <span className="text-emerald-400">{progress}%</span>
                </div>
              </motion.div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
