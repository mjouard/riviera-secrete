export interface MetaPill {
  label: string;
  valeur: string;
}

export interface Tip {
  label: string;
  texte: string;
}

export interface RelatedCard {
  href: string;
  img: string;
  alt: string;
  stamp: string;
  region: string;
  titre: string;
  blurb: string;
}

export interface Activite {
  id: number;
  activiteId: string;
  nom: string;
  badge: "gratuit" | "payant";
  duree: string;
  prix: string;
  url: string;
  image: string;
  alt: string;
  linkText: string;
  lieuId: number;
}

export interface Lieu {
  id: number;
  slug: string;
  nom: string;
  description: string;
  description2?: string;
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
  regionSlug: string;
  regionLabel: string;
  lat: number;
  lng: number;
  description: string;
  thumbImage: string;
  lieux: Lieu[];
}

export interface StopActivite {
  label: string;
  cls: string;
  lieuSlug?: string;
  activiteId?: string;
  url?: string;
}

export interface ItineraireItem {
  type: "stop" | "transit";
  heure?: string;
  lieuSlug?: string;
  nom?: string;
  commune?: string;
  desc?: string;
  activites?: StopActivite[];
}

export interface BookingRef {
  lieuLabel: string;
  nomLabel: string;
  linkText: string;
  extraSpans: string[];
  lieuSlug: string;
  activiteId: string;
}

export interface SuggestCard {
  href: string;
  img: string;
  alt: string;
  badge: string;
  titre: string;
}

export interface Itineraire {
  id: number;
  slug: string;
  titre: string;
  badge: string;
  description: string;
  intro: string;
  heroImgTag: string;
  mapLabel: string;
  metaPills: MetaPill[];
  items: ItineraireItem[];
  booking: BookingRef[];
  suggestions: SuggestCard[];
}
