"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { Lieu } from "@/lib/types";
import { createBaseMap, estTactile, LEAFLET_CSS_HREF } from "@/lib/map-tiles";
import { regionToMerShade } from "@/lib/mer-colors";

const MARKERCLUSTER_CSS = [
  "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css",
  "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css",
];

function construireIcone(L: typeof import("leaflet"), lieu: Lieu, survole: boolean) {
  const taille = estTactile() ? 13 : 15;
  const couleur = survole ? "var(--aube)" : regionToMerShade(lieu.regionSlug);
  return L.divIcon({
    className: "",
    html: `<div style="width:${taille}px;height:${taille}px;border-radius:50%;background:${couleur};border:2px solid var(--nuit);box-shadow:0 1px 3px rgba(0,0,0,0.5)"></div>`,
    iconSize: [taille + 4, taille + 4],
    iconAnchor: [(taille + 4) / 2, (taille + 4) / 2],
  });
}

/**
 * Carte Explorer — un marqueur par LIEU, coloré par zone via mer-colors.ts (Lot 1), amas
 * obligatoires (13 paires de marqueurs se superposent autour de Nice/Monaco au zoom par
 * défaut → NF-03), clic → navigation directe vers la fiche (pas de carte d'info intermédiaire).
 * Composant partagé (Lot 4e) : utilisé par `/explorer` (ExplorerShell.tsx) et par l'aperçu
 * Explorer de l'accueil (HomeExplorerSection.tsx), qui a remplacé l'ancienne HomeMap.tsx
 * (un marqueur par ville, sans amas — supprimée).
 */
export default function ExplorerMap({
  lieux,
  hoveredSlug,
  onHoverMarker,
}: {
  lieux: Lieu[];
  hoveredSlug: string | null;
  onHoverMarker: (slug: string | null) => void;
}) {
  const router = useRouter();
  const indicationTactile = useTranslations("common")("carteDeuxDoigts");

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<import("leaflet").Map | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const clusterRef = useRef<import("leaflet").MarkerClusterGroup | null>(null);
  const markersRef = useRef<Map<string, import("leaflet").Marker>>(new Map());
  const [pret, setPret] = useState(false);
  // Toujours à jour, contrairement à une valeur capturée dans la fermeture du
  // ResizeObserver ci-dessous (qui n'est pas recréé à chaque changement de filtre).
  const lieuxRef = useRef(lieux);
  useEffect(() => {
    lieuxRef.current = lieux;
  }, [lieux]);

  // Création de la carte une seule fois — voir le commentaire plus bas sur le pont
  // `window.L` pour la raison du séquencement des deux imports.
  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;
    let map: import("leaflet").Map | undefined;

    import("leaflet").then(async (mod) => {
      if (cancelled || !mapRef.current) return;

      // leaflet.markercluster est un UMD ancien style qui lit la variable globale `L` et lui
      // ajoute directement `L.MarkerClusterGroup`/`L.markerClusterGroup` ("var
      // MarkerClusterGroup = L.MarkerClusterGroup = ...", sans import) plutôt que de recevoir
      // `leaflet` comme dépendance. Deux pièges : sans `window.L` posé avant, son IIFE ne
      // trouve rien à étendre ; et l'objet namespace que renvoie `import("leaflet")` est scellé
      // par la spec ES modules (non extensible), donc lui ajouter une propriété échoue —
      // d'où la copie superficielle mutable, seule utilisée ensuite dans ce composant.
      const L = { ...mod } as typeof mod;
      (window as unknown as { L: typeof mod }).L = L;
      await import("leaflet.markercluster");
      if (cancelled || !mapRef.current) return;

      const currentMap = createBaseMap(L, mapRef.current, {
        zoomControl: false,
        scrollWheelZoom: false,
        indicationTactile,
      });
      // Contrôle de zoom reconstruit à la main : createBaseMap n'expose pas de position
      // personnalisable pour celui par défaut, et Explorer est seul à en avoir besoin —
      // pas de raison d'étendre le socle partagé pour un seul appelant. Restylé en CSS
      // (globals.css cible .leaflet-control-zoom*), même technique que .rs-map-hint.
      L.control.zoom({ position: "bottomleft" }).addTo(currentMap);

      const cluster = L.markerClusterGroup({
        maxClusterRadius: 50,
        iconCreateFunction: (c: import("leaflet").MarkerCluster) =>
          L.divIcon({
            className: "",
            html: `<div style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--nuit-haute);border:1px solid color-mix(in srgb, var(--calcaire) 25%, transparent);color:var(--calcaire);font-family:var(--font-plex-mono);font-weight:700;font-size:14px">${c.getChildCount()}</div>`,
            iconSize: [34, 34],
          }),
      });
      currentMap.addLayer(cluster);

      map = currentMap;
      mapInstance.current = currentMap;
      leafletRef.current = L;
      clusterRef.current = cluster;
      setPret(true);
    });

    return () => {
      cancelled = true;
      map?.remove();
      mapInstance.current = null;
      leafletRef.current = null;
      clusterRef.current = null;
      markersRef.current = new Map();
      setPret(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- indicationTactile est stable pour une locale donnée
  }, []);

  // Reconstruit les marqueurs à chaque changement de la liste filtrée, et recadre la carte
  // dessus (→ "changement de filtre → fitBounds" du spec).
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstance.current;
    const cluster = clusterRef.current;
    if (!pret || !L || !map || !cluster) return;

    cluster.clearLayers();
    const markers = new Map<string, import("leaflet").Marker>();
    lieux.forEach((lieu) => {
      const marker = L.marker([lieu.lat, lieu.lng], { icon: construireIcone(L, lieu, false) });
      marker.on("click", () => router.push(`/lieux/${lieu.slug}`));
      marker.on("mouseover", () => onHoverMarker(lieu.slug));
      marker.on("mouseout", () => onHoverMarker(null));
      cluster.addLayer(marker);
      markers.set(lieu.slug, marker);
    });
    markersRef.current = markers;

    if (lieux.length > 0) {
      const bounds = L.latLngBounds(lieux.map((l) => [l.lat, l.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [pret, lieux, router, onHoverMarker]);

  // Sync liste → carte : la carte survolée depuis la colonne de droite met le marqueur en
  // évidence, sans reconstruire tous les autres.
  useEffect(() => {
    const L = leafletRef.current;
    if (!pret || !L) return;
    markersRef.current.forEach((marker, slug) => {
      const lieu = lieux.find((l) => l.slug === slug);
      if (!lieu) return;
      marker.setIcon(construireIcone(L, lieu, slug === hoveredSlug));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lieux ne pilote que la reconstruction ci-dessus
  }, [pret, hoveredSlug]);

  // Leaflet calcule sa taille une fois, au montage. Sur mobile, le conteneur est caché
  // (`display:none`, tant que la bascule liste/carte n'a pas été activée) — la taille lue
  // est alors 0×0 et Leaflet ne la recalcule jamais tout seul. `invalidateSize()` sur chaque
  // changement réel du conteneur (bascule mobile, ou passage sous/au-dessus du seuil `lg`)
  // via ResizeObserver plutôt qu'un prop de vue explicite : couvre aussi le redimensionnement
  // de fenêtre, pas seulement le clic sur le bouton.
  useEffect(() => {
    const conteneur = mapRef.current;
    const L = leafletRef.current;
    const map = mapInstance.current;
    if (!pret || !conteneur || !L || !map || typeof ResizeObserver === "undefined") return;
    let tailleDejaConnue = conteneur.offsetWidth > 0;
    const ro = new ResizeObserver(() => {
      if (conteneur.offsetWidth === 0) return;
      map.invalidateSize();
      // Un fitBounds lancé pendant que le conteneur faisait 0×0 (mobile, avant la bascule)
      // produit un centre/zoom dégénérés — invalidateSize seul ne les corrige pas, il faut
      // recadrer une fois la vraie taille connue. lieuxRef plutôt que `lieux` fermé : la
      // liste peut avoir changé (filtre) pendant que la carte était masquée.
      const lieuxActuels = lieuxRef.current;
      if (!tailleDejaConnue && lieuxActuels.length > 0) {
        map.fitBounds(L.latLngBounds(lieuxActuels.map((l) => [l.lat, l.lng] as [number, number])), {
          padding: [40, 40],
          maxZoom: 13,
        });
      }
      tailleDejaConnue = true;
    });
    ro.observe(conteneur);
    return () => ro.disconnect();
  }, [pret]);

  return (
    <div className="relative h-full">
      <link rel="stylesheet" href={LEAFLET_CSS_HREF} crossOrigin="" />
      {MARKERCLUSTER_CSS.map((href) => (
        <link key={href} rel="stylesheet" href={href} crossOrigin="" />
      ))}
      <div
        ref={mapRef}
        className="h-full"
        style={{ borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--line)" }}
      />
    </div>
  );
}
