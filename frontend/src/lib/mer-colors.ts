import { REGION_ORDER } from "./home-data";

/**
 * Refonte UI Lot 1 — mapping des 5 zones carte vers la palette "Mer" (docs/design-refonte-
 * 2026-09-14.md § 1). Pas branché sur HomeMap.tsx dans cette passe : REGION_COLORS continue
 * de piloter la carte telle quelle (changer ses couleurs est un changement visuel, hors
 * périmètre). Ce fichier existe pour que le Lot 4 n'ait pas à refaire cette décision.
 */
export const MER_SHADES = [
  "var(--mer-1)",
  "var(--mer-2)",
  "var(--mer-3)",
  "var(--mer-4)",
  "var(--mer-5)",
] as const;

const REGION_TO_MER: Record<string, string> = Object.fromEntries(
  REGION_ORDER.map((slug, i) => [slug, MER_SHADES[i]])
);

export function regionToMerShade(regionSlug: string): string {
  return REGION_TO_MER[regionSlug] ?? MER_SHADES[0];
}
