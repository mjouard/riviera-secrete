"use client";
import { useEffect, useRef } from "react";
import { createBaseMap, LEAFLET_CSS_HREF } from "@/lib/map-tiles";

interface Stop {
  lat: number;
  lng: number;
  nom: string;
}

interface Props {
  stops: Stop[];
}

export default function LeafletItinMap({ stops }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || stops.length === 0) return;
    let cancelled = false;
    let map: import("leaflet").Map | undefined;

    import("leaflet").then((L) => {
      if (cancelled || !ref.current) return;

      const currentMap = createBaseMap(L, ref.current, { scrollWheelZoom: false });
      map = currentMap;

      const latlngs = stops.map((s) => [s.lat, s.lng] as [number, number]);

      // Polyline
      L.polyline(latlngs, { color: "#4a9eca", weight: 2.5, opacity: 0.8, dashArray: "6 4" }).addTo(currentMap);

      // Numbered markers
      stops.forEach((stop, i) => {
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:#4a9eca;color:#0c1116;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid rgba(255,255,255,0.3)">${i + 1}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
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
  }, [stops]);

  return (
    <>
      <link rel="stylesheet" href={LEAFLET_CSS_HREF} crossOrigin="" />
      <div ref={ref} style={{ height: "380px", borderRadius: "12px", overflow: "hidden" }} />
    </>
  );
}
