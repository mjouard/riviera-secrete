"use client";

import { useEffect } from "react";

/**
 * Enregistre public/sw.js (voir ce fichier pour la stratégie de cache).
 *
 * Volontairement désactivé en développement : un service worker actif sert d'anciens
 * bundles depuis son cache et rend le HMR trompeur — on croit que le code n'a pas pris
 * alors que c'est le SW qui répond.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;
    const register = () => {
      if (cancelled) return;
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service worker registration failed:", err);
      });
    };

    // Après `load` : l'enregistrement et le précache de la page hors ligne ne doivent pas
    // entrer en concurrence avec le chargement initial.
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register);

    return () => {
      cancelled = true;
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}
