"use client";
import { useEffect, useRef } from "react";
import { applyDarkTileFilter, MAP_TILE_ATTRIBUTION, MAP_TILE_URL } from "@/lib/map-tiles";

interface Props {
  lat: number;
  lng: number;
  nom: string;
}

export default function LeafletLieuMap({ lat, lng, nom }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;
    let map: import("leaflet").Map | undefined;

    import("leaflet").then((L) => {
      if (cancelled || !ref.current) return;

      // Fix default icon path broken by bundlers
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      map = L.map(ref.current, { zoomControl: true, scrollWheelZoom: false }).setView(
        [lat, lng],
        14
      );

      L.tileLayer(MAP_TILE_URL, {
        attribution: MAP_TILE_ATTRIBUTION,
        maxZoom: 19,
      }).addTo(map);
      applyDarkTileFilter(map);

      L.marker([lat, lng]).addTo(map).bindPopup(nom, { closeButton: false }).openPopup();
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lng, nom]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div ref={ref} style={{ height: "320px", borderRadius: "12px", overflow: "hidden" }} />
    </>
  );
}
