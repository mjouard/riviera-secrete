"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Ville } from "@/lib/types";
import { imgUrl } from "@/lib/utils";
import { REGION_COLORS, REGION_LABELS, REGION_ORDER, truncate } from "@/lib/home-data";
import { createBaseMap, LEAFLET_CSS_HREF } from "@/lib/map-tiles";

interface Props {
  villes: Ville[];
}

export default function HomeMap({ villes }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<import("leaflet").Map | null>(null);
  const groupsRef = useRef<Record<string, import("leaflet").LayerGroup>>({});
  const [selected, setSelected] = useState<Ville | null>(null);
  const [activeRegions, setActiveRegions] = useState<Set<string>>(
    () => new Set(REGION_ORDER)
  );

  useEffect(() => {
    if (!mapRef.current || villes.length === 0) return;
    let cancelled = false;
    let map: import("leaflet").Map | undefined;

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current) return;

      const currentMap = createBaseMap(L, mapRef.current, { scrollWheelZoom: false });
      map = currentMap;
      mapInstance.current = currentMap;

      const bounds = L.latLngBounds(villes.map((v) => [v.lat, v.lng] as [number, number]));
      currentMap.fitBounds(bounds, { padding: [30, 30] });

      const groups: Record<string, import("leaflet").LayerGroup> = {};
      villes.forEach((v) => {
        const color = REGION_COLORS[v.regionSlug] ?? "#8B96A1";
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.55);box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        const marker = L.marker([v.lat, v.lng], { icon });
        marker.on("click", () => {
          currentMap.panTo([v.lat, v.lng]);
          setSelected(v);
        });
        if (!groups[v.regionSlug]) groups[v.regionSlug] = L.layerGroup();
        groups[v.regionSlug].addLayer(marker);
      });
      Object.values(groups).forEach((g) => g.addTo(currentMap));
      groupsRef.current = groups;

      currentMap.on("click", () => setSelected(null));
    });

    return () => {
      cancelled = true;
      map?.remove();
      mapInstance.current = null;
      groupsRef.current = {};
    };
  }, [villes]);

  function toggleRegion(region: string) {
    const map = mapInstance.current;
    const group = groupsRef.current[region];
    if (!map || !group) return;
    setActiveRegions((prev) => {
      const next = new Set(prev);
      if (next.has(region)) {
        next.delete(region);
        map.removeLayer(group);
      } else {
        next.add(region);
        group.addTo(map);
      }
      return next;
    });
  }

  return (
    <div>
      <link rel="stylesheet" href={LEAFLET_CSS_HREF} crossOrigin="" />
      <div className="flex flex-wrap gap-2 mb-4">
        {REGION_ORDER.map((region) => {
          const isActive = activeRegions.has(region);
          return (
            <button
              key={region}
              onClick={() => toggleRegion(region)}
              className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition-opacity"
              style={{
                borderColor: "var(--line)",
                color: isActive ? "var(--text)" : "var(--text-muted)",
                opacity: isActive ? 1 : 0.45,
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ background: REGION_COLORS[region] }}
              />
              {REGION_LABELS[region]}
            </button>
          );
        })}
      </div>
      <div className="relative">
        <div
          ref={mapRef}
          style={{
            height: "min(60vh, 600px)",
            minHeight: 380,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid var(--line)",
          }}
        />
        {selected && (
          <div
            className="absolute left-4 right-4 bottom-4 sm:right-auto sm:w-80 rounded-xl overflow-hidden shadow-xl"
            style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center text-sm"
              style={{ background: "rgba(12,17,22,0.7)", color: "#fff" }}
              aria-label="Fermer"
            >
              ×
            </button>
            <div className="aspect-[16/9] overflow-hidden">
              <img
                src={imgUrl(selected.thumbImage)}
                alt={selected.nom}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <p className="text-xs mb-1" style={{ color: "var(--azure)" }}>
                {selected.regionLabel}
              </p>
              <h3 className="font-semibold mb-1">{selected.nom}</h3>
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                {truncate(selected.description, 130)}
              </p>
              <Link
                href={`/villes/${selected.slug}`}
                className="text-xs"
                style={{ color: "var(--terracotta)" }}
              >
                Voir la fiche →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
