import type { ReactNode } from "react";

/**
 * Refonte UI Lot 1 — badges gratuit/prix/fermé (docs/design-refonte-2026-09-14.md § 1).
 * Rayon 2px (badges/vignettes), police Plex Mono 12 (.text-data). La variante "ferme" reprend
 * la couleur exacte de FermeAujourdhui.tsx (rouge discret, hors palette — pas de token dédié) ;
 * elle ne remplace pas ce composant, qui garde sa propre logique jour-de-semaine côté client.
 */
export type BadgeVariant = "gratuit" | "prix" | "ferme";

const VARIANT_STYLE: Record<BadgeVariant, { color: string; background?: string }> = {
  gratuit: { color: "var(--pin)" },
  prix: { color: "var(--brume)" },
  ferme: { color: "#E8705A", background: "rgba(232,74,74,0.15)" },
};

export function Badge({ variant, children }: { variant: BadgeVariant; children: ReactNode }) {
  const style = VARIANT_STYLE[variant];
  return (
    <span
      className="text-data inline-block font-medium"
      style={{
        color: style.color,
        background: style.background,
        borderRadius: "var(--radius-sm)",
        padding: style.background ? "2px 6px" : undefined,
      }}
    >
      {children}
    </span>
  );
}
