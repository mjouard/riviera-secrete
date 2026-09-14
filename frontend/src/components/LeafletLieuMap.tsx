"use client";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { createBaseMap, LEAFLET_CSS_HREF } from "@/lib/map-tiles";

interface Props {
  lat: number;
  lng: number;
  nom: string;
}

export default function LeafletLieuMap({ lat, lng, nom }: Props) {
  // Chaîne (et non la fonction `t`) dans les dépendances de l'effet : stable pour une
  // locale donnée, la carte n'est donc pas recréée à chaque rendu.
  const indicationTactile = useTranslations("common")("carteDeuxDoigts");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;
    let map: import("leaflet").Map | undefined;

    import("leaflet").then((L) => {
      if (cancelled || !ref.current) return;

      const currentMap = createBaseMap(L, ref.current, { scrollWheelZoom: false, indicationTactile });
      map = currentMap;
      currentMap.setView([lat, lng], 14);

      L.marker([lat, lng]).addTo(currentMap).bindPopup(nom, { closeButton: false }).openPopup();
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lng, nom, indicationTactile]);

  return (
    <>
      <link rel="stylesheet" href={LEAFLET_CSS_HREF} crossOrigin="" />
      <div ref={ref} style={{ height: "320px", borderRadius: "12px", overflow: "hidden" }} />
    </>
  );
}
