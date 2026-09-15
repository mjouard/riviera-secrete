import { REGION_ORDER } from "./home-data";

/**
 * Refonte UI Lot 1 — mapping des 5 zones carte vers la palette "Mer" (docs/design-refonte-
 * 2026-09-14.md § 1). Utilisé par ExplorerMap.tsx et HomeExplorerSection.tsx (Lot 4e), qui
 * ont remplacé l'ancienne HomeMap.tsx et ses REGION_COLORS.
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
