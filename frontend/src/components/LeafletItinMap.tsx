"use client";
import { useEffect, useRef } from "react";

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
    let map: import("leaflet").Map;

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;

      map = L.map(ref.current!, { zoomControl: true, scrollWheelZoom: false });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      const latlngs = stops.map((s) => [s.lat, s.lng] as [number, number]);

      // Polyline
      L.polyline(latlngs, { color: "#4a9eca", weight: 2.5, opacity: 0.8, dashArray: "6 4" }).addTo(map);

      // Numbered markers
      stops.forEach((stop, i) => {
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:#4a9eca;color:#0c1116;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid rgba(255,255,255,0.3)">${i + 1}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        L.marker([stop.lat, stop.lng], { icon })
          .addTo(map)
          .bindPopup(stop.nom, { closeButton: false });
      });

      map.fitBounds(latlngs, { padding: [32, 32] });
    });

    return () => {
      map?.remove();
    };
  }, [stops]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div ref={ref} style={{ height: "380px", borderRadius: "12px", overflow: "hidden" }} />
    </>
  );
}
