"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { IconClose } from "./Icons";

/**
 * Refonte UI Lot 1 — modale native (docs/design-refonte-2026-09-14.md § 1).
 * <dialog> + showModal()/close() donnent Échap et le piège à focus gratuitement, contrairement
 * à l'overlay fait main qu'elle remplace dans creer-itineraire/page.tsx. `open` piloté en
 * impératif via useEffect : <dialog> n'a pas d'équivalent déclaratif de cette prop.
 */
export function Modal({
  open,
  onClose,
  titleId,
  children,
}: {
  open: boolean;
  onClose: () => void;
  titleId: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  // Écouteurs posés à la main plutôt que via les props JSX onCancel/onClose : plus sûr que
  // de dépendre du support React de ces événements sur <dialog>, et ça couvre aussi la
  // fermeture native par Échap (événement "cancel") sans repasser par un state React d'abord.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    const handleClose = () => onClose();
    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("close", handleClose);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("close", handleClose);
    };
  }, [onClose]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="p-0 m-auto backdrop:bg-black/60"
      style={{
        background: "var(--nuit-haute)",
        color: "var(--calcaire)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-float)",
        border: "none",
        width: "100%",
        maxWidth: "24rem",
        position: "relative" as const,
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="focus-ring-aube absolute top-3 right-3"
        style={{ color: "var(--brume)" }}
      >
        <IconClose className="w-5 h-5" />
      </button>
      <div className="p-6">{children}</div>
    </dialog>
  );
}
