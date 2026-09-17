"use client";

import type { ReactNode } from "react";
import { useOverlayLock } from "@/lib/use-overlay-lock";
import { IconClose } from "./Icons";

/**
 * Tiroir plein écran pour les filtres secondaires sur mobile (→ audit UX 17/09, 3.1 : "mur de
 * 21 filtres avant le premier lieu"). Générique — pas propre à l'Explorer — pour être réutilisé
 * par un futur tiroir de filtres du composeur (Mois 1, M1) sans dupliquer ce marqueup.
 */
export function FilterDrawer({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useOverlayLock(open, onClose);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col lg:hidden" style={{ background: "var(--nuit)" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: "var(--line)" }}>
        <h2 className="text-card-title" style={{ color: "var(--calcaire)" }}>{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="focus-ring-aube w-11 h-11 flex items-center justify-center rounded-full"
          style={{ color: "var(--brume)" }}
        >
          <IconClose className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
      {footer && (
        <div
          className="border-t px-4 pt-3 flex-shrink-0"
          style={{ borderColor: "var(--line)", paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
