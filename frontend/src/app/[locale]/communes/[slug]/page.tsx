import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { imgUrl, loc, alternatesPage } from "@/lib/utils";
import MapLieuWrapper from "@/components/MapLieuWrapper";
import ItineraireCard from "@/components/ItineraireCard";
import Photo from "@/components/Photo";

export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://frontend-two-plum-92.vercel.app";

/**
 * Refonte UI Lot 5 (03-architecture-routes-url.md § 4) — remplace villes/[slug]/page.tsx.
 * Seules les communes à ≥ 2 lieux ont une page ici : une commune à 1 seul lieu redirige
 * directement vers la fiche de ce lieu (next.config.ts, `redirects()`, calculé depuis l'API
 * de prod) — une page qui listerait un seul lieu qu'on vient de citer n'apporterait rien.
 * 7 communes sur 34 sont dans ce cas au 2026-09-16 (vérifier data/villes.json plutôt que ce
 * nombre, qui dérive avec le contenu).
 */
export async function generateStaticParams() {
  const villes = await api.villes.list();
  return villes.filter((v) => v.lieux.length >= 2).map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const ville = await api.villes.bySlug(slug).catch(() => null);
  if (!ville) return {};
  const nom = loc(locale, ville.nomEn, ville.nom);
  const description = loc(locale, ville.descriptionEn, ville.description);
  return {
    title: nom,
    description,
    openGraph: {
      title: nom,
      description,
      images: ville.thumbImage ? [{ url: imgUrl(ville.thumbImage), width: 500, height: 375 }] : [],
    },
    alternates: alternatesPage(SITE_URL, locale, `/communes/${slug}`),
  };
}

export default async function CommunePage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const [ville, itineraires, lieux, t, tCommon, tRegionFull] = await Promise.all([
    api.villes.bySlug(slug).catch(() => null),
    api.itineraires.list().catch(() => []),
    api.lieux.list().catch(() => []),
    getTranslations("communes"),
    getTranslations("common"),
    getTranslations("regionFull"),
  ]);
  // Une commune à 1 seul lieu n'a pas de page ici (redirigée vers la fiche du lieu par
  // next.config.ts) — si elle atterrit quand même là (donnée modifiée depuis le dernier
  // build, redirect pas encore à jour), pas de page à moitié vide : 404 plutôt que trompeur.
  if (!ville || ville.lieux.length < 2) notFound();

  const nom = loc(locale, ville.nomEn, ville.nom);
  const description = loc(locale, ville.descriptionEn, ville.description);

  const villeLieuSlugs = new Set(ville.lieux.map((l) => l.slug));
  const itinerairesIci = itineraires.filter((it) =>
    it.items.some((item) => item.type === "stop" && item.lieuSlug && villeLieuSlugs.has(item.lieuSlug))
  );
  const lieuBySlug = new Map(lieux.map((l) => [l.slug, l]));

  const localePrefix = locale === "en" ? "/en" : "";
  const heroImage = ville.lieux[0]?.heroImage ?? ville.thumbImage;
  const touristDestinationJsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: nom,
    description,
    image: `${SITE_URL}${imgUrl(heroImage)}`,
    geo: {
      "@type": "GeoCoordinates",
      latitude: ville.lat,
      longitude: ville.lng,
    },
    url: `${SITE_URL}${localePrefix}/communes/${ville.slug}`,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tCommon("accueil"), item: `${SITE_URL}${localePrefix}/` },
      { "@type": "ListItem", position: 2, name: tCommon("lieux"), item: `${SITE_URL}${localePrefix}/explorer` },
      { "@type": "ListItem", position: 3, name: nom },
    ],
  };

  return (
    <article className="max-w-4xl mx-auto px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(touristDestinationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Breadcrumb — pas de page de liste des communes (supprimée avec /villes), le parent
          générique est Explorer, comme sur les fiches lieu et itinéraire. */}
      <nav className="text-sm mb-8 flex gap-2" style={{ color: "var(--text-muted)" }}>
        <Link href="/" className="hover:text-white transition-colors">{tCommon("accueil")}</Link>
        <span>/</span>
        <Link href="/explorer" className="hover:text-white transition-colors">{tCommon("lieux")}</Link>
        <span>/</span>
        <span style={{ color: "var(--text)" }}>{nom}</span>
      </nav>

      {/* Hero */}
      <div className="rounded-2xl overflow-hidden mb-8 aspect-[4/3]">
        <Photo sizes="(max-width: 640px) 50vw, 25vw"
          src={ville.thumbImage}
          alt={nom}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Header */}
      <div className="mb-8">
        <p className="text-sm mb-2" style={{ color: "var(--azure)" }}>
          {tRegionFull(ville.regionSlug as "menton-monaco" | "nice" | "arriere-pays" | "antibes-cannes" | "golfe-st-tropez")}
        </p>
        <h1 className="font-display text-3xl font-bold mb-4">{nom}</h1>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {description}
        </p>
      </div>

      {/* Carte */}
      <div className="mb-10">
        <MapLieuWrapper lat={ville.lat} lng={ville.lng} nom={nom} />
      </div>

      {/* Lieux */}
      {ville.lieux.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">
            {ville.lieux.length} {ville.lieux.length > 1 ? t("lieuxADecouvrir") : t("lieuADecouvrir")}
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
                  <Photo sizes="(max-width: 640px) 50vw, 25vw"
                    src={lieu.thumbImage}
                    alt={lieu.heroAlt}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold line-clamp-2">{loc(locale, lieu.nomEn, lieu.nom)}</p>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-muted)" }}>
                    {loc(locale, lieu.descriptionEn, lieu.description)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Itinéraires qui passent par ici */}
      {itinerairesIci.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold mb-4">
            {itinerairesIci.length} {itinerairesIci.length > 1 ? t("itinerairesIci") : t("itineraireIci")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {itinerairesIci.map((it) => (
              <ItineraireCard key={it.id} itin={it} lieuBySlug={lieuBySlug} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
