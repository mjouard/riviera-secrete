import type { ComponentType } from "react";
import { IconBeach, IconHike, IconBike, IconDiving, IconFork } from "@/components/ui/Icons";

export const REGION_ORDER = [
  "menton-monaco",
  "nice",
  "arriere-pays",
  "antibes-cannes",
  "golfe-st-tropez",
] as const;

export const BADGE_DEFS: { slug: string; label: string; emoji: string }[] = [
  { slug: "plage", label: "Plage", emoji: "🏖️" },
  { slug: "randonnee", label: "Randonnée", emoji: "🥾" },
  { slug: "vtt", label: "VTT", emoji: "🚵" },
  { slug: "plongee", label: "Plongée", emoji: "🤿" },
  { slug: "restaurant", label: "Restaurant", emoji: "🍽️" },
];

/** BADGE_DEFS indexé par slug, pour un lookup direct (ex. badges d'un lieu donné). */
export const BADGE_DEFS_BY_SLUG: Record<string, { slug: string; label: string; emoji: string }> =
  Object.fromEntries(BADGE_DEFS.map((b) => [b.slug, b]));

/**
 * Icônes vectorielles des badges (→ audit UX 17/09, 3.3 : « les émojis remplacent icônes et
 * libellés... rendu variable selon l'appareil, lecture d'écran peu fiable »). Séparé de
 * BADGE_DEFS plutôt que d'y ajouter un champ `icon` : ce fichier reste consommable par du code
 * qui n'a pas besoin de React (BADGE_DEFS sert aussi de simple table slug→emoji/label).
 */
export const BADGE_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  plage: IconBeach,
  randonnee: IconHike,
  vtt: IconBike,
  plongee: IconDiving,
  restaurant: IconFork,
};

