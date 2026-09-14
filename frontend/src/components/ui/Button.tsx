import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { Link } from "@/i18n/navigation";

/**
 * Refonte UI Lot 1 — 3 variantes, 2 tailles (docs/design-refonte-2026-09-14.md § 1).
 * Styles portés par les classes .btn/.btn-* (globals.css). Non consommé par une page
 * existante dans cette passe, hormis la migration de la modale de sauvegarde d'itinéraire.
 */
export type ButtonVariant = "primaire" | "secondaire" | "discret";

function variantClass(variant: ButtonVariant) {
  return variant === "primaire" ? "btn-primaire" : variant === "secondaire" ? "btn-secondaire" : "btn-discret";
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ variant = "primaire", className = "", ...props }: ButtonProps) {
  return <button className={`btn ${variantClass(variant)} focus-ring-aube ${className}`} {...props} />;
}

type LinkButtonProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
};

export function LinkButton({ variant = "primaire", className = "", ...props }: LinkButtonProps) {
  return <Link className={`btn ${variantClass(variant)} focus-ring-aube ${className}`} {...props} />;
}
