import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { imgUrl, buildMapLinks, buildGoogleMapsRouteUrl } from "@/lib/utils";
import MapItinWrapper from "@/components/MapItinWrapper";
import HeroCarousel from "@/components/HeroCarousel";

function parseHeroImgTag(tag: string): { srcs: string[]; alt: string } {
  const srcMatch = tag.match(/src="([^"]+)"/);
  const altMatch = tag.match(/alt="([^"]+)"/);
  const srcsMatch = tag.match(/data-carousel-srcs="([^"]+)"/);
  const src = srcMatch?.[1] ?? "";
  const alt = altMatch?.[1] ?? "";
  const srcs = srcsMatch ? srcsMatch[1].split(",").map((s) => s.trim()) : src ? [src] : [];
  return { srcs, alt };
}

export const revalidate = 3600;

export async function generateStaticParams() {
  const itineraires = await api.itineraires.list();
  return itineraires.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [itin, lieux] = await Promise.all([
    api.itineraires.bySlug(slug).catch(() => null),
    api.lieux.list().catch(() => []),
  ]);
  if (!itin) return {};
  const firstStop = itin.items.find((item) => item.type === "stop" && item.lieuSlug);
  const firstLieu = firstStop?.lieuSlug
    ? lieux.find((l) => l.slug === firstStop.lieuSlug)
    : undefined;
  const ogImage = firstLieu?.heroImage ? imgUrl(firstLieu.heroImage) : undefined;
  return {
    title: itin.titre,
    description: itin.description,
    openGraph: {
      title: itin.titre,
      description: itin.description,
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 800 }] } : {}),
    },
  };
}

export default async function ItinerairePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [itin, lieux] = await Promise.all([
    api.itineraires.bySlug(slug).catch(() => null),
    api.lieux.list(),
  ]);
  if (!itin) notFound();

  const lieuBySlug = new Map(lieux.map((l) => [l.slug, l]));
  const stops = itin.items.filter((item) => item.type === "stop");

  const routeStops = stops
    .map((s) => s.lieuSlug ? lieuBySlug.get(s.lieuSlug) : null)
    .filter((l): l is NonNullable<typeof l> => l != null);

  const hero = itin.heroImgTag ? parseHeroImgTag(itin.heroImgTag) : null;
  const heroSlides = hero?.srcs.map((src) => ({ src: imgUrl(src), alt: hero.alt })) ?? [];

  return (
    <article className="max-w-4xl mx-auto px-6 py-12">
      {/* Hero */}
      {heroSlides.length > 0 && (
        <div className="rounded-2xl overflow-hidden mb-8 aspect-[3/2]">
          <HeroCarousel slides={heroSlides} />
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="text-sm mb-8 flex gap-2" style={{ color: "var(--text-muted)" }}>
        <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
        <span>/</span>
        <Link href="/itineraires" className="hover:text-white transition-colors">Itinéraires</Link>
        <span>/</span>
        <span style={{ color: "var(--text)" }}>{itin.titre}</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <p className="text-sm font-semibold mb-2" style={{ color: "var(--terracotta)" }}>
          {itin.badge}
        </p>
        <h1 className="text-3xl font-bold mb-4 leading-tight">{itin.titre}</h1>
        <p className="text-lg" style={{ color: "var(--text-muted)" }}>
          {itin.description}
        </p>

        {itin.metaPills.length > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-6 text-sm">
            {itin.metaPills.map((pill, i) => (
              <span key={i} style={{ color: "var(--text-muted)" }}>
                {pill.label} <span style={{ color: "var(--text)" }}>{pill.valeur}</span>
              </span>
            ))}
          </div>
        )}

        {routeStops.length > 0 && (
          <div className="mt-6">
            <a
              href={buildGoogleMapsRouteUrl(routeStops)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full border transition-colors hover:bg-white/5"
              style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
            >
              🗺️ Ouvrir l&apos;itinéraire dans Google Maps
            </a>
          </div>
        )}
      </div>

      {/* Carte */}
      {routeStops.length > 0 && (
        <div className="mb-12">
          <MapItinWrapper
            stops={routeStops.map((l) => ({ lat: l.lat, lng: l.lng, nom: l.nom }))}
          />
        </div>
      )}

      {/* Programme */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-6">Programme détaillé</h2>
        <div className="space-y-2">
          {itin.items.map((item, i) => {
            if (item.type === "transit") {
              return (
                <div
                  key={i}
                  className="text-sm py-3 px-4 rounded-lg"
                  style={{ color: "var(--text-muted)", background: "var(--surface)" }}
                >
                  {item.desc}
                </div>
              );
            }
            if (item.type === "sleep") {
              return (
                <div
                  key={i}
                  className="rounded-xl p-5 border"
                  style={{ background: "var(--surface)", borderColor: "var(--line)" }}
                >
                  <h3 className="font-semibold mb-1">
                    🌙 {item.dormirA ?? `Dormir à ${item.commune ?? ""}`}
                  </h3>
                  {item.desc && (
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      {item.desc}
                    </p>
                  )}
                </div>
              );
            }
            return (
              <div
                key={i}
                className="rounded-xl p-5"
                style={{ background: "var(--surface)" }}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    {item.heure && (
                      <span
                        className="text-xs font-mono mr-2"
                        style={{ color: "var(--azure)" }}
                      >
                        {item.heure}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {item.commune}
                    </span>
                  </div>
                  {item.lieuSlug && (
                    <Link
                      href={`/lieux/${item.lieuSlug}?itin=${itin.slug}`}
                      className="text-xs hover:underline flex-shrink-0"
                      style={{ color: "var(--azure)" }}
                    >
                      Voir le lieu →
                    </Link>
                  )}
                </div>
                <h3 className="font-semibold mb-1">{item.nom}</h3>
                {item.desc && (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {item.desc}
                  </p>
                )}
                {item.lieuSlug && lieuBySlug.get(item.lieuSlug) && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {buildMapLinks(
                      lieuBySlug.get(item.lieuSlug)!.lat,
                      lieuBySlug.get(item.lieuSlug)!.lng,
                      item.nom ?? item.lieuSlug
                    ).map((link) => (
                      <a
                        key={link.label}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-2.5 py-1 rounded-full border transition-colors hover:bg-white/5"
                        style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
                      >
                        {link.icon} {link.label}
                      </a>
                    ))}
                  </div>
                )}
                {item.activites && item.activites.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {item.activites.map((act, j) => (
                      <span
                        key={j}
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          background: "var(--surface-hover)",
                          color:
                            act.cls?.includes("free")
                              ? "var(--azure)"
                              : "var(--terracotta)",
                        }}
                      >
                        {act.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* À réserver */}
      {itin.booking.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6">À réserver</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {itin.booking.map((b, i) => {
              const activite = lieuBySlug
                .get(b.lieuSlug)
                ?.activites.find((a) => a.activiteId === b.activiteId);

              return (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden flex flex-col"
                  style={{ background: "var(--surface)" }}
                >
                  {activite && (
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={imgUrl(activite.image)}
                        alt={activite.alt}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-5 flex flex-col gap-1 flex-1">
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {b.lieuLabel}
                    </p>
                    <p className="font-semibold mb-1">{b.nomLabel}</p>
                    {activite && (
                      <div
                        className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm mb-3"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <span>⏱ {activite.duree}</span>
                        <span>💶 {activite.prix}</span>
                        {b.extraSpans.map((s, j) => (
                          <span key={j}>{s}</span>
                        ))}
                      </div>
                    )}
                    <a
                      href={activite?.url ?? `/lieux/${b.lieuSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm mt-auto self-start"
                      style={{ color: "var(--azure)" }}
                    >
                      {b.linkText}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Étapes en bref */}
      {stops.length > 0 && (
        <section
          className="pt-8 border-t"
          style={{ borderColor: "var(--line)" }}
        >
          <h2 className="text-lg font-semibold mb-4">
            {stops.length} étapes
          </h2>
          <div className="flex flex-wrap gap-2">
            {stops.map((s, i) => (
              s.lieuSlug ? (
                <Link
                  key={i}
                  href={`/lieux/${s.lieuSlug}`}
                  className="text-sm px-3 py-1 rounded-full border transition-colors hover:bg-white/5"
                  style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
                >
                  {s.nom ?? s.lieuSlug}
                </Link>
              ) : (
                <span
                  key={i}
                  className="text-sm px-3 py-1 rounded-full border"
                  style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
                >
                  {s.nom}
                </span>
              )
            ))}
          </div>
        </section>
      )}

      {/* Autres itinéraires */}
      {itin.suggestions.length > 0 && (
        <section className="pt-12 mt-8 border-t" style={{ borderColor: "var(--line)" }}>
          <h2 className="text-xl font-bold mb-6">Autres itinéraires</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {itin.suggestions.map((s, i) => (
              <Link
                key={i}
                href={`/itineraires/${s.href.replace(".html", "")}`}
                className="group rounded-xl overflow-hidden transition-transform hover:-translate-y-1"
                style={{ background: "var(--surface)" }}
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={imgUrl(s.img)}
                    alt={s.alt}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold mb-1" style={{ color: "var(--azure)" }}>
                    {s.badge}
                  </p>
                  <h3 className="text-sm font-semibold leading-snug">{s.titre}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
