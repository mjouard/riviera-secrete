import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";

export const metadata: Metadata = {
  title: "Itinéraires — Riviera Secrète",
  description: "6 itinéraires clé-en-main sur la Côte d'Azur.",
};

export const revalidate = 3600;

export default async function ItinerairesPage() {
  const itineraires = await api.itineraires.list();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Itinéraires</h1>
      <p className="mb-12" style={{ color: "var(--text-muted)" }}>
        {itineraires.length} journées clé-en-main, de Menton à Saint-Tropez.
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        {itineraires.map((itin) => (
          <Link
            key={itin.id}
            href={`/itineraires/${itin.slug}`}
            className="group block rounded-2xl overflow-hidden transition-transform hover:-translate-y-1"
            style={{ background: "var(--surface)" }}
          >
            <div className="p-6">
              <p
                className="text-xs font-semibold mb-2"
                style={{ color: "var(--terracotta)" }}
              >
                {itin.badge}
              </p>
              <h2 className="text-lg font-bold mb-2 leading-snug">{itin.titre}</h2>
              <p className="text-sm line-clamp-3" style={{ color: "var(--text-muted)" }}>
                {itin.description}
              </p>

              {itin.metaPills.length > 0 && (
                <div
                  className="flex flex-wrap gap-x-4 gap-y-1 mt-4 pt-4 border-t text-xs"
                  style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
                >
                  {itin.metaPills.map((pill, i) => (
                    <span key={i}>
                      {pill.label} {pill.valeur}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
