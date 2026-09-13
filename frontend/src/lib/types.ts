export interface MetaPill {
  label: string;
  valeur: string;
  labelEn?: string | null;
  valeurEn?: string | null;
}

export interface Tip {
  label: string;
  texte: string;
  labelEn?: string | null;
  texteEn?: string | null;
}

export interface RelatedCard {
  href: string;
  img: string;
  alt: string;
  stamp: string;
  region: string;
  titre: string;
  blurb: string;
  titreEn?: string | null;
  blurbEn?: string | null;
  altEn?: string | null;
}

export interface Activite {
  id: number;
  activiteId: string;
  nom: string;
  nomEn?: string | null;
  badge: "gratuit" | "payant";
  duree: string;
  dureeEn?: string | null;
  prix: string;
  prixEn?: string | null;
  url: string;
  image: string;
  alt: string;
  altEn?: string | null;
  linkText: string;
  lieuId: number;
}

export interface Lieu {
  id: number;
  slug: string;
  nom: string;
  nomEn?: string | null;
  description: string;
  descriptionEn?: string | null;
  description2?: string;
  description2En?: string | null;
  commune: string;
  regionSlug: string;
  regionLabel: string;
  villeSlug: string;
  lat: number;
  lng: number;
  heroImage: string;
  heroAlt: string;
  heroSlides?: number;
  thumbImage: string;
  ogImage: string;
  badges: string[];
  metaPills: MetaPill[];
  tips: Tip[];
  related: RelatedCard[];
  activites: Activite[];
}

export interface Ville {
  id: number;
  slug: string;
  nom: string;
  nomEn?: string | null;
  regionSlug: string;
  regionLabel: string;
  lat: number;
  lng: number;
  description: string;
  descriptionEn?: string | null;
  thumbImage: string;
  lieux: Lieu[];
}

export interface StopActivite {
  label: string;
  cls: string;
  lieuSlug?: string;
  activiteId?: string;
  url?: string;
  labelEn?: string | null;
}

export interface ItineraireItem {
  type: "stop" | "transit" | "sleep";
  heure?: string;
  lieuSlug?: string;
  nom?: string;
  commune?: string;
  desc?: string;
  activites?: StopActivite[];
  dormirA?: string;
  nomEn?: string | null;
  descEn?: string | null;
  dormirAEn?: string | null;
}

export interface BookingRef {
  lieuLabel: string;
  nomLabel: string;
  linkText: string;
  extraSpans: string[];
  lieuSlug: string;
  activiteId: string;
  lieuLabelEn?: string | null;
  nomLabelEn?: string | null;
  extraSpansEn?: string[] | null;
}

export interface SuggestCard {
  href: string;
  img: string;
  alt: string;
  badge: string;
  titre: string;
  titreEn?: string | null;
  badgeEn?: string | null;
  altEn?: string | null;
}

export interface Itineraire {
  id: number;
  slug: string;
  titre: string;
  titreEn?: string | null;
  badge: string;
  badgeEn?: string | null;
  description: string;
  descriptionEn?: string | null;
  intro: string;
  introEn?: string | null;
  heroImgTag: string;
  mapLabel: string;
  mapLabelEn?: string | null;
  metaPills: MetaPill[];
  items: ItineraireItem[];
  booking: BookingRef[];
  suggestions: SuggestCard[];
}

/** Itinéraire custom sauvegardé par un utilisateur (table UserItineraire côté backend) — à ne pas confondre avec `Itineraire`, l'itinéraire éditorial. */
export interface UserItineraire {
  id: string;
  nom: string;
  dureeKey: string;
  days: string[][];
  createdAt: string;
}
