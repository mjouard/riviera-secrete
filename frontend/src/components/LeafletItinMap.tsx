"use client";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { createBaseMap, LEAFLET_CSS_HREF } from "@/lib/map-tiles";

interface Stop {
  lat: number;
  lng: number;
  nom: string;
}

interface Props {
  stops: Stop[];
  /** Refonte UI Lot 4d, "composition desktop" — tracé/pastilles restylés en Lot 1
   * (`--aube`, `stroke-dasharray: 10 8`, pastilles 26px) pour `/i/[id]` uniquement. Défauts
   * inchangés : `/itineraires/[slug]` (éditorial), seul autre appelant de ce composant
   * partagé, n'est pas concerné par ce lot et garde son apparence actuelle telle quelle. */
  lineColor?: string;
  dashArray?: string;
  pinSize?: number;
  /** Hauteur du conteneur — 380px par défaut (`/itineraires/[slug]`), `/i/[id]` en desktop
   * la remplit plutôt via `height: 100%` du conteneur collant parent. */
  height?: string;
}

export default function LeafletItinMap({
  stops,
  lineColor = "#4a9eca",
  dashArray = "6 4",
  pinSize = 24,
  height = "380px",
}: Props) {
  // Chaîne (et non la fonction `t`) dans les dépendances de l'effet : stable pour une
  // locale donnée, la carte n'est donc pas recréée à chaque rendu.
  const indicationTactile = useTranslations("common")("carteDeuxDoigts");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || stops.length === 0) return;
    let cancelled = false;
    let map: import("leaflet").Map | undefined;

    import("leaflet").then((L) => {
      if (cancelled || !ref.current) return;

      const currentMap = createBaseMap(L, ref.current, { scrollWheelZoom: false, indicationTactile });
      map = currentMap;

      const latlngs = stops.map((s) => [s.lat, s.lng] as [number, number]);

      // Polyline
      L.polyline(latlngs, { color: lineColor, weight: 2.5, opacity: 0.8, dashArray }).addTo(currentMap);

      // Numbered markers
      stops.forEach((stop, i) => {
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:${lineColor};color:#0c1116;width:${pinSize}px;height:${pinSize}px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid rgba(255,255,255,0.3)">${i + 1}</div>`,
          iconSize: [pinSize, pinSize],
          iconAnchor: [pinSize / 2, pinSize / 2],
        });
        L.marker([stop.lat, stop.lng], { icon })
          .addTo(currentMap)
          .bindPopup(stop.nom, { closeButton: false });
      });

      currentMap.fitBounds(latlngs, { padding: [32, 32] });
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [stops, indicationTactile, lineColor, dashArray, pinSize]);

  return (
    <>
      <link rel="stylesheet" href={LEAFLET_CSS_HREF} crossOrigin="" />
      <div ref={ref} style={{ height, borderRadius: "12px", overflow: "hidden" }} />
    </>
  );
}
