"use client";
import { useState } from "react";
import Link from "next/link";
import type { Itineraire, Lieu } from "@/lib/types";
import ItineraireCard from "./ItineraireCard";

/** Nombre de cartes visibles sur mobile avant de replier le reste derrière "Voir plus". */
const VISIBLE_COUNT_MOBILE = 3;

export default function HomeItineraires({
  itineraires,
  lieuBySlug,
}: {
  itineraires: Itineraire[];
  lieuBySlug: Map<string, Lieu>;
}) {
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = itineraires.length - VISIBLE_COUNT_MOBILE;

  return (
    <div>
      <div
        className={`home-itin-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${expanded ? "expanded" : ""}`}
      >
        {itineraires.map((itin, i) => (
          <div key={itin.id} className={i >= VISIBLE_COUNT_MOBILE ? "home-itin-extra" : ""}>
            <ItineraireCard itin={itin} lieuBySlug={lieuBySlug} />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-6">
        {hiddenCount > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="sm:hidden text-sm px-4 py-2 rounded-lg border transition-colors hover:bg-white/5"
            style={{ borderColor: "var(--line)", color: "var(--text)" }}
          >
            {expanded ? "Voir moins ↑" : `Voir les ${hiddenCount} autres →`}
          </button>
        )}
        <Link
          href="/creer-itineraire"
          className="text-sm px-4 py-2 rounded-lg font-semibold transition-colors"
          style={{ background: "var(--azure)", color: "#0c1116" }}
        >
          ✨ Créer mon itinéraire
        </Link>
      </div>
    </div>
  );
}
