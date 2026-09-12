import Link from "next/link";
import { api } from "@/lib/api";
import HomeMapWrapper from "@/components/HomeMapWrapper";
import HomeActivities from "@/components/HomeActivities";
import HomeLieuxGrid from "@/components/HomeLieuxGrid";
import HomeHero from "@/components/HomeHero";
import ItineraireCard from "@/components/ItineraireCard";

export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://frontend-two-plum-92.vercel.app";

export default async function HomePage() {
  const [lieux, itineraires, villes] = await Promise.all([
    api.lieux.list(),
    api.itineraires.list(),
    api.villes.list(),
  ]);
  const lieuBySlug = new Map(lieux.map((l) => [l.slug, l]));

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "27 lieux insolites de la Côte d'Azur",
    itemListElement: villes.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/villes/${v.slug}`,
      name: v.nom,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-6 text-center" style={{ minHeight: 540 }}>
        <HomeHero />
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(160deg, rgba(12,17,22,0.72) 0%, rgba(12,17,22,0.52) 50%, rgba(12,17,22,0.78) 100%)",
          }}
        />
        <div className="relative z-[2] max-w-2xl mx-auto">
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
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
              <ItineraireCard key={itin.id} itin={itin} lieuBySlug={lieuBySlug} />
            ))}
          </div>
        </div>
      </section>

      {/* Activités suggérées */}
      <section className="py-12 px-6 border-t" style={{ borderColor: "var(--line)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1">
              Activités, <em className="not-italic" style={{ color: "var(--terracotta)" }}>loin de l&apos;ordinaire</em>
            </h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Des idées pour chaque profil — à pied, en mer, à table ou en visite.
            </p>
          </div>
          <HomeActivities lieux={lieux} />
        </div>
      </section>

      {/* Carte */}
      <section className="py-12 px-6 border-t" style={{ borderColor: "var(--line)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1">La carte des {villes.length} villes</h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Clique sur un marqueur pour ouvrir la fiche. Filtre par zone :
            </p>
          </div>
          <HomeMapWrapper villes={villes} />
        </div>
      </section>

      {/* Lieux */}
      <section className="py-12 px-6 border-t" style={{ borderColor: "var(--line)" }}>
        <div className="max-w-6xl mx-auto">
          <HomeLieuxGrid lieux={lieux} />
        </div>
      </section>
    </>
  );
}
