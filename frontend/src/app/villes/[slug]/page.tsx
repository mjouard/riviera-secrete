import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { imgUrl } from "@/lib/utils";
import MapLieuWrapper from "@/components/MapLieuWrapper";

export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://frontend-two-plum-92.vercel.app";

export async function generateStaticParams() {
  const villes = await api.villes.list();
  return villes.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ville = await api.villes.bySlug(slug).catch(() => null);
  if (!ville) return {};
  return {
    title: ville.nom,
    description: ville.description,
    openGraph: {
      title: ville.nom,
      description: ville.description,
      images: ville.thumbImage ? [{ url: imgUrl(ville.thumbImage), width: 500, height: 375 }] : [],
    },
  };
}

export default async function VillePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ville = await api.villes.bySlug(slug).catch(() => null);
  if (!ville) notFound();

  const heroImage = ville.lieux[0]?.heroImage ?? ville.thumbImage;
  const touristDestinationJsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: ville.nom,
    description: ville.description,
    image: `${SITE_URL}${imgUrl(heroImage)}`,
    geo: {
      "@type": "GeoCoordinates",
      latitude: ville.lat,
      longitude: ville.lng,
    },
    url: `${SITE_URL}/villes/${ville.slug}`,
  };

  return (
    <article className="max-w-4xl mx-auto px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(touristDestinationJsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="text-sm mb-8 flex gap-2" style={{ color: "var(--text-muted)" }}>
        <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
        <span>/</span>
        <Link href="/villes" className="hover:text-white transition-colors">Villes</Link>
        <span>/</span>
        <span style={{ color: "var(--text)" }}>{ville.nom}</span>
      </nav>

      {/* Hero */}
      <div className="rounded-2xl overflow-hidden mb-8 aspect-[4/3]">
        <img
          src={imgUrl(ville.thumbImage)}
          alt={ville.nom}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Header */}
      <div className="mb-8">
        <p className="text-sm mb-2" style={{ color: "var(--azure)" }}>
          {ville.regionLabel}
        </p>
        <h1 className="text-3xl font-bold mb-4">{ville.nom}</h1>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {ville.description}
        </p>
      </div>

      {/* Carte */}
      <div className="mb-10">
        <MapLieuWrapper lat={ville.lat} lng={ville.lng} nom={ville.nom} />
      </div>

      {/* Lieux */}
      {ville.lieux.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">
            {ville.lieux.length} lieu{ville.lieux.length > 1 ? "x" : ""} à découvrir
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {ville.lieux.map((lieu) => (
              <Link
                key={lieu.slug}
                href={`/lieux/${lieu.slug}`}
                className="group flex gap-4 rounded-xl overflow-hidden p-3 transition-colors hover:bg-white/5"
                style={{ background: "var(--surface)" }}
              >
                <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={imgUrl(lieu.thumbImage)}
                    alt={lieu.heroAlt}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold line-clamp-1">{lieu.nom}</p>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-muted)" }}>
                    {lieu.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
