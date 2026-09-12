import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { imgUrl, buildMapLinks } from "@/lib/utils";
import { BADGE_DEFS_BY_SLUG } from "@/lib/home-data";
import MapLieuWrapper from "@/components/MapLieuWrapper";
import HeroCarousel from "@/components/HeroCarousel";
import FavoriteButton from "@/components/FavoriteButton";
import ShareButton from "@/components/ShareButton";
import AddToItinButton from "@/components/AddToItinButton";

export const revalidate = 3600;

export async function generateStaticParams() {
  const lieux = await api.lieux.list();
  return lieux.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lieu = await api.lieux.bySlug(slug).catch(() => null);
  if (!lieu) return {};
  return {
    title: lieu.nom,
    description: lieu.description,
    openGraph: {
      title: lieu.nom,
      description: lieu.description,
      images: lieu.heroImage ? [{ url: imgUrl(lieu.heroImage), width: 1200, height: 800 }] : [],
    },
  };
}

export default async function LieuPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ itin?: string }>;
}) {
  const { slug } = await params;
  const { itin: itinSlug } = await searchParams;
  const lieu = await api.lieux.bySlug(slug).catch(() => null);
  if (!lieu) notFound();

  const [ville, itin] = await Promise.all([
    api.villes.bySlug(lieu.villeSlug).catch(() => null),
    itinSlug ? api.itineraires.bySlug(itinSlug).catch(() => null) : Promise.resolve(null),
  ]);

  const parentCrumb = itin
    ? { href: `/itineraires/${itin.slug}`, label: itin.titre }
    : ville
      ? { href: `/villes/${ville.slug}`, label: ville.nom }
      : { href: "/lieux", label: "Lieux" };

  return (
    <article className="max-w-4xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm mb-8 flex gap-2" style={{ color: "var(--text-muted)" }}>
        <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
        <span>/</span>
        <Link href={parentCrumb.href} className="hover:text-white transition-colors">
          {parentCrumb.label}
        </Link>
        <span>/</span>
        <span style={{ color: "var(--text)" }}>{lieu.nom}</span>
      </nav>

      {/* Hero */}
      <div className="rounded-2xl overflow-hidden mb-8 aspect-[3/2]">
        <HeroCarousel
          slides={Array.from({ length: lieu.heroSlides ?? 1 }, (_, i) => ({
            src: i === 0
              ? imgUrl(lieu.heroImage)
              : imgUrl(lieu.heroImage.replace(/hero\.jpg$/, `hero-${i + 1}.jpg`)),
            alt: lieu.heroAlt,
          }))}
        />
      </div>

      {/* Header */}
      <div className="mb-8">
        <p className="text-sm mb-2" style={{ color: "var(--azure)" }}>
          {lieu.commune} · {lieu.regionLabel}
        </p>
        <h1 className="text-3xl font-bold mb-4">{lieu.nom}</h1>

        {/* Badges */}
        {lieu.badges.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {lieu.badges.map((b) => {
              const def = BADGE_DEFS_BY_SLUG[b];
              return (
                <span
                  key={b}
                  className="text-xs px-3 py-1 rounded-full border"
                  style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
                >
                  {def ? `${def.emoji} ${def.label}` : b}
                </span>
              );
            })}
          </div>
        )}

        {/* MetaPills + GPS */}
        <div className="flex flex-wrap gap-3">
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            <span>📍</span>{" "}
            <span style={{ color: "var(--text)" }}>{lieu.lat}°N, {lieu.lng}°E</span>
          </span>
          {lieu.metaPills.map((pill, i) => (
            <span key={i} className="text-sm" style={{ color: "var(--text-muted)" }}>
              <span>{pill.label}</span>{" "}
              <span style={{ color: "var(--text)" }}>{pill.valeur}</span>
            </span>
          ))}
        </div>

        {/* Liens Maps/Waze/Plans + Favori */}
        <div className="flex flex-wrap gap-2 mt-3">
          {buildMapLinks(lieu.lat, lieu.lng, lieu.nom).map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-full border transition-colors hover:bg-white/5"
              style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
            >
              {link.icon} {link.label}
            </a>
          ))}
          <FavoriteButton slug={lieu.slug} />
          <ShareButton title={lieu.nom} />
          <AddToItinButton lieuSlug={lieu.slug} />
        </div>
      </div>

      {/* Carte */}
      <div className="mb-10">
        <MapLieuWrapper lat={lieu.lat} lng={lieu.lng} nom={lieu.nom} />
      </div>

      {/* Description */}
      <div className="prose max-w-none mb-10">
        <p className="text-base leading-relaxed mb-4">{lieu.description}</p>
        {lieu.description2 && (
          <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {lieu.description2}
          </p>
        )}
      </div>

      {/* Tips */}
      {lieu.tips.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Conseils pratiques</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {lieu.tips.map((tip, i) => (
              <div
                key={i}
                className="rounded-lg p-4"
                style={{ background: "var(--surface)" }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--azure)" }}>
                  {tip.label}
                </p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {tip.texte}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Activités */}
      {lieu.activites.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">À faire sur place</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {lieu.activites.map((act) => (
              <a
                key={act.activiteId}
                href={act.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl overflow-hidden flex flex-col transition-transform hover:-translate-y-0.5"
                style={{ background: "var(--surface)" }}
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={imgUrl(act.image)}
                    alt={act.alt}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color:
                          act.badge === "gratuit"
                            ? "var(--azure)"
                            : "var(--terracotta)",
                      }}
                    >
                      {act.badge}
                    </span>
                    <h3 className="font-semibold text-sm mt-1">{act.nom}</h3>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {act.duree} · {act.prix}
                    </p>
                  </div>
                  <span
                    className="text-xs mt-3"
                    style={{ color: "var(--azure)" }}
                  >
                    {act.linkText}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Related */}
      {lieu.related.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">À découvrir aussi</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {lieu.related.map((r, i) => (
              <Link
                key={i}
                href={`/lieux/${r.href.replace(".html", "")}`}
                className="group flex gap-4 rounded-xl overflow-hidden p-3 transition-colors"
                style={{ background: "var(--surface)" }}
              >
                <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={imgUrl(r.img)}
                    alt={r.alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>
                    {r.region}
                  </p>
                  <p className="text-sm font-semibold line-clamp-1">{r.titre}</p>
                  <p className="text-xs line-clamp-1" style={{ color: "var(--text-muted)" }}>
                    {r.blurb}
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
