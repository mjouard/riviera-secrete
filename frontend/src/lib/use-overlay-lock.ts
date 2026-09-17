"use client";

import { useEffect } from "react";

/**
 * Bloque le défilement de la page derrière un panneau plein écran et le ferme au clavier
 * (Échap) tant qu'il est ouvert — même attente qu'une modale ailleurs sur le site. Partagé
 * entre la carte plein écran et le tiroir de filtres de l'Explorer mobile (→ audit UX 17/09,
 * 3.1/3.2).
 */
export function useOverlayLock(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);
}
