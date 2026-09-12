"use client";
import { useEffect, useRef } from "react";
import { createBaseMap, LEAFLET_CSS_HREF } from "@/lib/map-tiles";

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

      const currentMap = createBaseMap(L, ref.current, { scrollWheelZoom: false });
      map = currentMap;
      currentMap.setView([lat, lng], 14);

      L.marker([lat, lng]).addTo(currentMap).bindPopup(nom, { closeButton: false }).openPopup();
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lng, nom]);

  return (
    <>
      <link rel="stylesheet" href={LEAFLET_CSS_HREF} crossOrigin="" />
      <div ref={ref} style={{ height: "320px", borderRadius: "12px", overflow: "hidden" }} />
    </>
  );
}
