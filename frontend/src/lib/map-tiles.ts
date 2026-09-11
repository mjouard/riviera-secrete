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
