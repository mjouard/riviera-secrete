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

