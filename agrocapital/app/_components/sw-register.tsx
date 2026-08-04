"use client";

import { useEffect } from "react";

export function SwRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("🟢 [PWA Agro-Capital] Service Worker enregistré avec succès:", reg.scope);
          })
          .catch((err) => {
            console.warn("⚠️ [PWA Agro-Capital] Échec d'enregistrement du Service Worker:", err);
          });
      });
    }
  }, []);

  return null;
}
