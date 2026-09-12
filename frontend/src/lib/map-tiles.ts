/**
 * CARTO a coupé l'accès anonyme à ses tuiles basemaps.cartocdn.com/dark_all (renvoie une
 * tuile "API KEY REQUIRED" depuis leur dépréciation de l'offre gratuite sans compte) — on
 * utilise donc les tuiles OpenStreetMap standard (gratuites, sans clé) et on approxime le
 * rendu sombre du site avec un filtre CSS appliqué au tile pane.
 */
export const MAP_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const MAP_TILE_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
export const MAP_DARK_FILTER =
  "invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9) saturate(0.3)";

/** Applique le rendu sombre au tile pane d'une carte Leaflet déjà initialisée. */
export function applyDarkTileFilter(map: import("leaflet").Map): void {
  const pane = map.getPane("tilePane");
  if (pane) pane.style.filter = MAP_DARK_FILTER;
}

/**
 * Crée une carte Leaflet avec le socle commun à toutes les cartes du site : fix de l'icône
 * par défaut (cassée par les bundlers, nécessaire pour tout `L.marker()` sans icône custom),
 * tuiles OpenStreetMap + filtre sombre. À appeler depuis le `.then((L) => ...)` d'un
 * `import("leaflet")` — ne fait aucun import du module `leaflet` elle-même (types uniquement),
 * donc reste sans effet sur le bundle SSR.
 */
export function createBaseMap(
  L: typeof import("leaflet"),
  container: HTMLElement,
  options: { zoomControl?: boolean; scrollWheelZoom?: boolean } = {}
): import("leaflet").Map {
  delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });

  const map = L.map(container, {
    zoomControl: options.zoomControl ?? true,
    scrollWheelZoom: options.scrollWheelZoom ?? false,
  });

  L.tileLayer(MAP_TILE_URL, { attribution: MAP_TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);
  applyDarkTileFilter(map);

  return map;
}

/** Le `<link>` Leaflet CSS partagé par toutes les cartes — un seul endroit à mettre à jour si la version change. */
export const LEAFLET_CSS_HREF = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
