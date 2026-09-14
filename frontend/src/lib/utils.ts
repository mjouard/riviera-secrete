const HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/** Retombe sur le français quand la traduction anglaise d'un champ n'existe pas encore (colonne `*En` nullable côté backend, voir project_version_anglaise.md) — jamais de champ vide côté /en. */
export function loc(locale: string, en: string | null | undefined, fr: string): string {
  return locale === "en" && en ? en : fr;
}

/**
 * Minuscule + sans accents, pour comparer une saisie utilisateur à du contenu français
 * ("eze" doit matcher "Èze", "luceram" → "Lucéram"). La plage ̀-ͯ (combining
 * diacritical marks) est utilisée plutôt que \p{Diacritic} : la cible TS est ES2017, les
 * property escapes Unicode sont ES2018.
 */
export function normalizeSearch(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Décode les entités HTML restées littérales dans les données (ex. "&amp;" venu du site statique). Ne touche jamais document/DOM — utilisable côté serveur. */
export function decodeEntities(str: string): string {
  if (!str || !str.includes("&")) return str;
  return str.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity[0] === "#") {
      const code =
        entity[1] === "x" || entity[1] === "X"
          ? parseInt(entity.slice(2), 16)
          : parseInt(entity.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    return HTML_ENTITIES[entity] ?? match;
  });
}

/**
 * Distance à vol d'oiseau entre deux points GPS, en kilomètres (formule de haversine).
 *
 * À vol d'oiseau et non par la route, volontairement : calculer un trajet réel demanderait
 * une API de routage, alors que sur la Côte d'Azur l'intérêt ici est de répondre à « qu'est-ce
 * qu'il y a près de moi », pas « en combien de temps j'y suis ». À afficher comme un ordre
 * de grandeur — en montagne ou sur la corniche, la route est toujours plus longue.
 */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // rayon moyen de la Terre, km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Arrondi lisible : sous 10 km on garde une décimale, au-delà elle n'apporte rien. */
export function formatDistanceKm(km: number): string {
  return km < 10 ? `${km.toFixed(1).replace(".", ",")} km` : `${Math.round(km)} km`;
}

/**
 * Normalise un chemin d'image du jeu de données en URL servable.
 *
 * **Idempotent** : un chemin déjà absolu ressort inchangé. Sans ça, le repasser une seconde
 * fois produisait `//assets/...` — piège rencontré en introduisant le composant `Photo`, qui
 * reçoit tantôt un chemin brut du JSON, tantôt un chemin déjà résolu par l'appelant.
 */
export function imgUrl(path: string): string {
  if (!path) return "";
  if (/^https?:\/\/|^data:|^\//.test(path)) return path;
  return "/" + path.replace(/^(\.\.\/)+/, "");
}

export function buildMapLinks(lat: number, lng: number, nom: string, plansLabel = "Plans") {
  const coords = `${lat},${lng}`;
  return [
    { label: "Google Maps", icon: "🗺️", url: `https://www.google.com/maps/search/?api=1&query=${coords}` },
    { label: "Waze",        icon: "🚗", url: `https://waze.com/ul?ll=${coords}&navigate=yes` },
    { label: plansLabel,    icon: "📍", url: `https://maps.apple.com/?ll=${coords}&q=${encodeURIComponent(nom)}` },
  ];
}

/** Redirige vers /connexion en conservant l'URL courante comme callbackUrl. Client uniquement. */
export function redirectToConnexion(): void {
  window.location.href = "/connexion?callbackUrl=" + encodeURIComponent(window.location.href);
}

export function buildGoogleMapsRouteUrl(stops: Array<{ lat: number; lng: number }>): string {
  if (stops.length === 0) return "#";
  const coords = stops.map((s) => `${s.lat},${s.lng}`);
  const origin = coords[0];
  const destination = coords[coords.length - 1];
  const waypoints = coords.slice(1, -1);
  const params = new URLSearchParams({ api: "1", origin, destination });
  if (waypoints.length) params.set("waypoints", waypoints.join("|"));
  return `https://www.google.com/maps/dir/?${params}`;
}

/**
 * Bloc `alternates` complet d'une page : les hreflang fr/en/x-default **et** le `canonical`
 * de la locale courante.
 *
 * Le site declarait ses hreflang partout, mais aucune page ne declarait de canonical. Toute
 * variante d'URL etait donc, pour un moteur, une page distincte au contenu identique — au
 * premier chef `?itin=` sur les fiches lieu : chaque itineraire citant un lieu ajoute le
 * parametre a son lien, ce qui produit une vingtaine d'URL dupliquees.
 *
 * `chemin` est le chemin sans prefixe de langue ("" pour l'accueil, "/villes/nice"...) ; le
 * francais est la locale par defaut non prefixee, l'anglais vit sous /en.
 */
export function alternatesPage(siteUrl: string, locale: string, chemin: string) {
  const fr = chemin ? `${siteUrl}${chemin}` : `${siteUrl}/`;
  const en = `${siteUrl}/en${chemin}`;
  return {
    canonical: locale === "en" ? en : fr,
    languages: { fr, en, "x-default": fr },
  };
}

/**
 * « 20 € / adult » → « €20 / adult ».
 *
 * Les prix anglais de `data/lieux.json` ont été traduits sans changer la place du symbole :
 * ils gardaient la convention française (montant puis €), là où les pastilles d'étape des
 * itinéraires — écrites à la main — affichent déjà « €7 » sur la même page. Deux
 * conventions typographiques coexistaient donc à quelques centimètres l'une de l'autre.
 *
 * Correction à l'affichage plutôt que dans les données : le seeder est idempotent, une
 * édition du JSON ne se propage pas à la base de prod (voir CLAUDE.md). La fonction est
 * idempotente elle aussi — « from €60 / person », déjà à l'anglaise, n'a pas de € suffixe
 * et ressort inchangée — donc normaliser un jour les données ne la rendra pas nuisible.
 */
const EURO_SUFFIXE = /(\d[\d.,]*(?:\s*[–—-]\s*\d[\d.,]*)?)\s*€/g;

export function formatEuroAnglais(prix: string): string {
  return prix.replace(EURO_SUFFIXE, (_, montant: string) =>
    `€${montant.replace(/\s*([–—-])\s*/g, "$1")}`
  );
}

/** Prix d'une activité dans la locale affichée, symbole euro placé selon la convention. */
export function prixAffiche(
  locale: string,
  prixEn: string | null | undefined,
  prix: string
): string {
  if (locale === "en" && prixEn) return formatEuroAnglais(prixEn);
  return loc(locale, prixEn, prix);
}
