"use client";

import { useEffect } from "react";

export function SwRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registerSW = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("🟢 [PWA Agro-Capital] Service Worker enregistré (scope:", reg.scope, ")");
            reg.update();
          })
          .catch((err) => {
            console.warn("⚠️ [PWA Agro-Capital] Échec d'enregistrement du Service Worker:", err);
          });
      };

      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW);
        return () => window.removeEventListener("load", registerSW);
      }
    }
  }, []);

  return null;
}
