import Link from "next/link";
import { api } from "@/lib/api";
import type { Lieu, Itineraire } from "@/lib/types";

export const revalidate = 3600;

function LieuCard({ lieu }: { lieu: Lieu }) {
  return (
    <Link
      href={`/lieux/${lieu.slug}`}
      className="group block rounded-xl overflow-hidden transition-transform hover:-translate-y-1"
      style={{ background: "var(--surface)" }}
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={lieu.thumbImage.replace("../", "https://riviera-secrete.netlify.app/")}
          alt={lieu.heroAlt}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <p className="text-xs mb-1" style={{ color: "var(--azure)" }}>
          {lieu.commune}
        </p>
        <h3 className="font-semibold text-sm leading-snug mb-1">{lieu.nom}</h3>
        <p className="text-xs line-clamp-2" style={{ color: "var(--text-muted)" }}>
          {lieu.description}
        </p>
      </div>
    </Link>
  );
}

function ItineraireCard({ itin }: { itin: Itineraire }) {
  return (
    <Link
      href={`/itineraires/${itin.slug}`}
      className="group flex gap-4 rounded-xl p-4 transition-colors"
      style={{ background: "var(--surface)" }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs mb-1" style={{ color: "var(--terracotta)" }}>
          {itin.badge}
        </p>
        <h3 className="font-semibold text-sm leading-snug">{itin.titre}</h3>
        <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-muted)" }}>
          {itin.description}
        </p>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const [lieux, itineraires] = await Promise.all([
    api.lieux.list(),
    api.itineraires.list(),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            La Côte d&apos;Azur{" "}
            <em className="not-italic" style={{ color: "var(--terracotta)" }}>
              hors des sentiers battus
            </em>
          </h1>
          <p className="text-lg" style={{ color: "var(--text-muted)" }}>
            {lieux.length} lieux confidentiels de Menton à Saint-Tropez, groupés en{" "}
            {itineraires.length} itinéraires.
          </p>
          <div className="flex gap-4 justify-center mt-8">
            <Link
              href="/lieux"
              className="px-6 py-3 rounded-full text-sm font-medium transition-colors"
              style={{ background: "var(--azure)", color: "#0C1116" }}
            >
              Explorer les lieux
            </Link>
            <Link
              href="/itineraires"
              className="px-6 py-3 rounded-full text-sm font-medium border transition-colors hover:bg-white/5"
              style={{ borderColor: "var(--line)", color: "var(--text)" }}
            >
              Voir les itinéraires
            </Link>
          </div>
        </div>
      </section>

      {/* Itinéraires */}
      <section className="py-12 px-6 border-t" style={{ borderColor: "var(--line)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="text-2xl font-bold">Itinéraires</h2>
            <Link
              href="/itineraires"
              className="text-sm transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              Voir tous →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {itineraires.map((itin) => (
              <ItineraireCard key={itin.id} itin={itin} />
            ))}
          </div>
        </div>
      </section>

      {/* Lieux */}
      <section className="py-12 px-6 border-t" style={{ borderColor: "var(--line)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="text-2xl font-bold">Tous les lieux</h2>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              {lieux.length} spots
            </span>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {lieux.map((lieu) => (
              <LieuCard key={lieu.id} lieu={lieu} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
