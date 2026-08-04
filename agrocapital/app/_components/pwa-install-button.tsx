"use client";

import { useEffect, useState } from "react";
import { Smartphone, CheckCircle, Download } from "lucide-react";
import { useTranslations } from "next-intl";

export function PwaInstallButton({ className = "" }: { className?: string }) {
  const t = useTranslations("Pwa");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Vérifie si l'application est déjà lancée en mode standalone / PWA installée
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback d'information si le prompt natif du navigateur n'est pas prêt
      alert(t("installInstructionsAlert"));
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Choix d'installation utilisateur: ${outcome}`);

    setDeferredPrompt(null);
    setCanInstall(false);
  };

  if (isInstalled) {
    return (
      <div className={`inline-flex items-center gap-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 px-4 py-2 text-xs font-extrabold text-emerald-300 backdrop-blur-md ${className}`}>
        <CheckCircle size={15} className="text-emerald-400" />
        <span>{t("appInstalled")}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleInstallClick}
      className={`group relative inline-flex items-center justify-center gap-2.5 rounded-2xl border-2 border-emerald-400/80 bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-600 hover:shadow-emerald-500/40 active:scale-95 transition-all ${className}`}
    >
      <Smartphone size={18} className="text-yellow-300 animate-bounce" />
      <span>{t("installApp")}</span>
      <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
    </button>
  );
}
