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
/**
 * Vrai sur un écran tactile (téléphone, tablette). Même condition que le
 * `@media (pointer: coarse)` de globals.css qui rend le défilement vertical au navigateur —
 * les deux doivent rester alignés, sinon on désactive le drag sans rendre le scroll, ou
 * l'inverse.
 */
function estTactile(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

/**
 * Sur écran tactile, un `touchmove` vertical démarré sur la carte était absorbé par Leaflet
 * (`touch-action: none` sur le conteneur + drag à un doigt) : la page ne défilait pas, et
 * comme la carte de l'accueil occupe ~60 % du viewport, on croyait la page terminée.
 *
 * On désactive donc le drag à un doigt ; globals.css rend en parallèle le défilement
 * vertical au navigateur. Déplacer la carte reste possible à deux doigts : le geste n'est
 * pas un `pan-y`, le navigateur le laisse donc à Leaflet, dont `touchZoom` déplace le
 * centre en même temps qu'il zoome. D'où l'indication affichée en bas à gauche.
 */
function limiterAuPanDeuxDoigts(
  L: typeof import("leaflet"),
  map: import("leaflet").Map,
  indication?: string
): void {
  map.dragging.disable();
  if (!indication) return;
  const Indication = L.Control.extend({
    onAdd() {
      const div = L.DomUtil.create("div", "rs-map-hint");
      div.textContent = indication;
      return div;
    },
  });
  new Indication({ position: "bottomleft" }).addTo(map);
}

export function createBaseMap(
  L: typeof import("leaflet"),
  container: HTMLElement,
  options: {
    zoomControl?: boolean;
    scrollWheelZoom?: boolean;
    /** Libellé traduit de l'indication « deux doigts » (écran tactile uniquement). */
    indicationTactile?: string;
  } = {}
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

  if (estTactile()) limiterAuPanDeuxDoigts(L, map, options.indicationTactile);

  return map;
}

/** Le `<link>` Leaflet CSS partagé par toutes les cartes — un seul endroit à mettre à jour si la version change. */
export const LEAFLET_CSS_HREF = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
