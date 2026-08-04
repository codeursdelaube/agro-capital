"use client";

import { useEffect, useState } from "react";
import { Sparkles, RefreshCw, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";

export function PwaUpdateBanner() {
  const t = useTranslations("Pwa");
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Écoute les changements de contrôleur (reload après mise à jour)
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;

      // 1. Vérifie si une mise à jour est déjà en attente
      if (reg.waiting) {
        setWaitingWorker(reg.waiting);
        setUpdateAvailable(true);
        return;
      }

      // 2. Écoute l'arrivée d'une nouvelle version pendant la navigation
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setUpdateAvailable(true);
          }
        });
      });
    });
  }, []);

  const handleUpdateNow = () => {
    if (!waitingWorker) {
      window.location.reload();
      return;
    }

    setUpdating(true);
    // Envoie l'instruction SKIP_WAITING au nouveau Service Worker
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  };

  return (
    <AnimatePresence>
      {updateAvailable && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-20 md:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-[9990] rounded-3xl bg-slate-950/90 text-white p-5 border border-emerald-500/40 shadow-2xl backdrop-blur-xl space-y-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-700 text-white shadow-md shadow-emerald-500/30">
                <Sparkles size={20} className="text-yellow-300 animate-spin-slow" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-extrabold text-white leading-tight">
                  {t("updateTitle")}
                </h4>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  {t("updateBody")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUpdateAvailable(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleUpdateNow}
              disabled={updating}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 active:scale-95 transition-all"
            >
              <RefreshCw size={15} className={updating ? "animate-spin" : ""} />
              <span>{updating ? "Mise à jour..." : t("updateNow")}</span>
            </button>
            <button
              type="button"
              onClick={() => setUpdateAvailable(false)}
              className="px-4 py-3 rounded-2xl border border-white/15 text-xs font-bold text-slate-300 hover:bg-white/10 transition-colors"
            >
              {t("updateLater")}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
