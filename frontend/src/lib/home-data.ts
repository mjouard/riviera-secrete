export const REGION_ORDER = [
  "menton-monaco",
  "nice",
  "arriere-pays",
  "antibes-cannes",
  "golfe-st-tropez",
] as const;

export const REGION_LABELS: Record<string, string> = {
  "menton-monaco": "Menton · Monaco",
  nice: "Nice",
  "arriere-pays": "Arrière-pays",
  "antibes-cannes": "Antibes · Cannes",
  "golfe-st-tropez": "Grasse · Saint-Tropez",
};

export const REGION_COLORS: Record<string, string> = {
  "menton-monaco": "#E8A33D",
  nice: "#4FC3C9",
  "arriere-pays": "#8FBF6B",
  "antibes-cannes": "#E88B4F",
  "golfe-st-tropez": "#C97FA0",
};

export const BADGE_DEFS: { slug: string; label: string; emoji: string }[] = [
  { slug: "plage", label: "Plage", emoji: "🏖️" },
  { slug: "randonnee", label: "Randonnée", emoji: "🥾" },
  { slug: "vtt", label: "VTT", emoji: "🚵" },
  { slug: "plongee", label: "Plongée", emoji: "🤿" },
  { slug: "restaurant", label: "Restaurant", emoji: "🍽️" },
];

export const ACTIVITY_CATEGORIES = [
  { slug: "outdoor", label: "🥾 Outdoor" },
  { slug: "culture", label: "🏛 Culture & Visites" },
  { slug: "gastronomie", label: "🍽️ Gastronomie" },
  { slug: "loisirs", label: "⛵ Loisirs & Mer" },
] as const;

/** Curation : activiteId → catégorie homepage. Copié depuis index.html (site statique) — garder en synchro si l'un des deux change. */
export const FEATURED_ACTIVITIES: Record<string, string> = {
  // Outdoor
  "sortie-kayak-de-mer": "outdoor",
  "plongee-snorkeling": "outdoor",
  "randonnee-village-cotier": "outdoor",
  "sentier-du-littoral-tour-complet": "outdoor",
  "randonnee-pic-du-cap-roux": "outdoor",
  "sentier-le-corbusier": "outdoor",
  "sentier-du-littoral-tirepoil": "outdoor",
  "randonnee-gorges-du-loup": "outdoor",
  "randonnee-cotiere-calanques": "outdoor",
  // Culture & Visites
  "villa-ephrussi-de-rothschild": "culture",
  "le-jardin-exotique": "culture",
  "visite-du-trophee-d-auguste": "culture",
  "visite-du-chateau-medieval": "culture",
  "citadelle-saint-elme": "culture",
  "jardin-exotique-de-monaco": "culture",
  "musee-oceanographique": "culture",
  "visite-villa-kerylos": "culture",
  "fondation-maeght": "culture",
  "chateau-musee-grimaldi": "culture",
  // Gastronomie
  "marche-du-cours-saleya": "gastronomie",
  "tour-gastronomique-vieux-nice": "gastronomie",
  "cours-de-cuisine-nicoise": "gastronomie",
  "visite-parfumerie-fragonard": "gastronomie",
  "atelier-creation-de-parfum": "gastronomie",
  "atelier-soufflage-de-verre": "gastronomie",
  "confiserie-florian-visite-gratuite": "gastronomie",
  "degustation-vins-du-golfe": "gastronomie",
  "atelier-ceramique-artisanale": "gastronomie",
  // Loisirs & Mer
  "festival-jazz-a-juan": "loisirs",
  "location-paddle-sup": "loisirs",
  "traversee-en-bateau-depuis-cannes": "loisirs",
  "randonnee-ile-sainte-marguerite": "loisirs",
  "location-de-bateau": "loisirs",
  "snorkeling-calanques-rouges": "loisirs",
  "vtt-dans-l-esterel": "loisirs",
  "kayak-de-mer-calanques": "loisirs",
};

export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + "…" : str;
}
