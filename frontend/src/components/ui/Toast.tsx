"use client";

import { useEffect } from "react";

/**
 * Refonte UI Lot 1 — toast (docs/design-refonte-2026-09-14.md § 1). Composant présentationnel
 * seul : pas de provider/file d'attente globale dans cette passe, zéro appelant pour l'instant
 * (net new — attendu). `variant="undo"` prolonge l'affichage à 7s et affiche une action
 * d'annulation, pour les flux de suppression.
 */
export function Toast({
  message,
  onDismiss,
  variant = "info",
  onUndo,
  undoLabel,
  raised = false,
}: {
  message: string;
  onDismiss: () => void;
  variant?: "info" | "undo";
  onUndo?: () => void;
  undoLabel?: string;
  /** Ajouté au Lot 4a : `true` remonte le toast au-dessus de `LieuMobileActionBar.tsx`
   * (barre fixe 52px + zone sûre iOS, sous 1024px) — sans ça, le toast serait masqué
   * derrière elle sur la fiche lieu. Sans effet ≥1024px, où cette barre n'existe pas. */
  raised?: boolean;
}) {
  useEffect(() => {
    const delay = variant === "undo" ? 7000 : 4000;
    const timer = setTimeout(onDismiss, delay);
    return () => clearTimeout(timer);
  }, [variant, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`text-body fixed left-1/2 -translate-x-1/2 flex items-center gap-4 px-5 py-3 z-50 ${raised ? "bottom-[104px] lg:bottom-6" : "bottom-6"}`}
      style={{
        background: "var(--nuit-haute)",
        color: "var(--calcaire)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-float)",
      }}
    >
      <span>{message}</span>
      {variant === "undo" && onUndo && (
        <button type="button" onClick={onUndo} className="focus-ring-aube font-semibold" style={{ color: "var(--aube)" }}>
          {undoLabel}
        </button>
      )}
    </div>
  );
}
