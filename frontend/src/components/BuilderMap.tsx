"use client";
import { useEffect, useRef, useState } from "react";

interface Stop { lat: number; lng: number; nom: string; }

interface MapState {
  L: typeof import("leaflet");
  map: import("leaflet").Map;
  layer: import("leaflet").LayerGroup;
}

function applyStops(state: MapState, stops: Stop[]) {
  const { L, map, layer } = state;
  layer.clearLayers();
  if (!stops.length) return;
  const latlngs = stops.map((s) => [s.lat, s.lng] as [number, number]);
  L.polyline(latlngs, { color: "#E8A33D", weight: 2.5, opacity: 0.8, dashArray: "6 4" }).addTo(layer);
  stops.forEach((s, i) => {
    const icon = L.divIcon({
      className: "",
      html: `<div style="background:#E8A33D;color:#0c1116;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid rgba(255,255,255,0.2)">${i + 1}</div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
    L.marker([s.lat, s.lng], { icon }).bindPopup(`${i + 1}. ${s.nom}`, { closeButton: false }).addTo(layer);
  });
  map.invalidateSize();
  if (latlngs.length === 1) map.setView(latlngs[0], 13);
  else map.fitBounds(latlngs, { padding: [24, 24] });
}

export default function BuilderMap({ stops }: { stops: Stop[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const stateRef = useRef<MapState | null>(null);
  const stopsRef = useRef(stops);
  const [ready, setReady] = useState(false);

  stopsRef.current = stops;

  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !ref.current) return;
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      const map = L.map(ref.current, { scrollWheelZoom: false, zoomControl: true });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);
      const layer = L.layerGroup().addTo(map);
      stateRef.current = { L, map, layer };
      applyStops(stateRef.current, stopsRef.current);
      setReady(true);
    });
    return () => {
      cancelled = true;
      stateRef.current?.map.remove();
      stateRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || !stateRef.current) return;
    applyStops(stateRef.current, stops);
  }, [ready, stops]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossOrigin="" />
      <div ref={ref} style={{ height: "320px", borderRadius: "12px", overflow: "hidden" }} />
    </>
  );
}
