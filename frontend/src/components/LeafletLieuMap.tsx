"use client";
import { useEffect, useRef } from "react";

interface Props {
  lat: number;
  lng: number;
  nom: string;
}

export default function LeafletLieuMap({ lat, lng, nom }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    let map: import("leaflet").Map;

    import("leaflet").then((L) => {
      // Fix default icon path broken by bundlers
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      map = L.map(ref.current!, { zoomControl: true, scrollWheelZoom: false }).setView(
        [lat, lng],
        14
      );

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      L.marker([lat, lng]).addTo(map).bindPopup(nom, { closeButton: false }).openPopup();
    });

    return () => {
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
