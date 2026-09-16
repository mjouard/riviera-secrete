import { cleLienType, communeActivite, relActivite } from "@/lib/activites-data";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { imgUrl, buildMapLinks, buildGoogleMapsRouteUrl, loc, alternatesPage, prixAffiche } from "@/lib/utils";
import { dureeKeyDepuisBadge } from "@/lib/itineraire-logic";
import MapItinWrapper from "@/components/MapItinWrapper";
import HeroCarousel from "@/components/HeroCarousel";
import FermeAujourdhui from "@/components/FermeAujourdhui";
import Photo from "@/components/Photo";

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

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://frontend-two-plum-92.vercel.app";

export async function generateStaticParams() {
  const itineraires = await api.itineraires.list();
  return itineraires.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
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
  const titre = loc(locale, itin.titreEn, itin.titre);
  const description = loc(locale, itin.descriptionEn, itin.description);
  return {
    title: titre,
    description,
    openGraph: {
      title: titre,
      description,
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 800 }] } : {}),
    },
    alternates: alternatesPage(SITE_URL, locale, `/itineraires/${slug}`),
  };
}

export default async function ItinerairePage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const [itin, lieux, t, tCommon, tActivite] = await Promise.all([
    api.itineraires.bySlug(slug).catch(() => null),
    api.lieux.list(),
    getTranslations("itineraire"),
    getTranslations("common"),
    getTranslations("activite"),
  ]);
  if (!itin) notFound();

  const titre = loc(locale, itin.titreEn, itin.titre);
  const badge = loc(locale, itin.badgeEn, itin.badge);
  const description = loc(locale, itin.descriptionEn, itin.description);

  const lieuBySlug = new Map(lieux.map((l) => [l.slug, l]));
  const stops = itin.items.filter((item) => item.type === "stop");

  // Seules les communes à ≥ 2 lieux ont une page (Lot 5, → /communes/[slug]) — une commune à
  // 1 seul lieu n'a nulle part où lier au-delà du lieu lui-même, déjà cité juste à côté.
  const villeLieuCount = new Map<string, number>();
  for (const l of lieux) villeLieuCount.set(l.villeSlug, (villeLieuCount.get(l.villeSlug) ?? 0) + 1);

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
        <Link href="/" className="hover:text-white transition-colors">{tCommon("accueil")}</Link>
        <span>/</span>
        <Link href="/itineraires" className="hover:text-white transition-colors">{tCommon("itineraires")}</Link>
        <span>/</span>
        <span style={{ color: "var(--text)" }}>{titre}</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <p className="text-sm font-semibold mb-2" style={{ color: "var(--terracotta)" }}>
          {badge}
        </p>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 leading-tight">{titre}</h1>
        <p className="text-lg" style={{ color: "var(--text-muted)" }}>
          {description}
        </p>

        {itin.metaPills.length > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-6 text-sm">
            {itin.metaPills.map((pill, i) => (
              <span key={i} style={{ color: "var(--text-muted)" }}>
                {pill.label} <span style={{ color: "var(--text)" }}>{loc(locale, pill.valeurEn, pill.valeur)}</span>
              </span>
            ))}
          </div>
        )}

        {routeStops.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            <a
              href={buildGoogleMapsRouteUrl(routeStops)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full border transition-colors hover:bg-white/5"
              style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
            >
              {t("ouvrirGoogleMaps")}
            </a>
            {/* Pont entre l'itinéraire éditorial et le créateur : on pré-coche les étapes et
                on devine la durée depuis le badge. `source` distingue ce cas d'un simple
                `?add=` (bouton "Ajouter à un itinéraire" d'une fiche lieu) : le créateur
                ouvre alors directement le résultat, conserve *toutes* les étapes même si la
                journée déborde, et affiche de quel itinéraire il part. */}
            <Link
              href={`/creer-itineraire?add=${routeStops.map((l) => l.slug).join(",")}&duree=${dureeKeyDepuisBadge(itin.badge)}&source=${itin.slug}`}
              title={t("partirDeCetItineraireTitre")}
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full border font-medium transition-colors hover:bg-white/5"
              style={{ borderColor: "var(--terracotta)", color: "var(--terracotta)" }}
            >
              {t("partirDeCetItineraire")}
            </Link>
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
        <h2 className="text-xl font-bold mb-6">{t("programmeDetaille")}</h2>
        <div className="space-y-2">
          {itin.items.map((item, i) => {
            if (item.type === "transit") {
              return (
                <div
                  key={i}
                  className="text-sm py-3 px-4 rounded-lg"
                  style={{ color: "var(--text-muted)", background: "var(--surface)" }}
                >
                  {loc(locale, item.descEn, item.desc ?? "")}
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
                    🌙 {loc(locale, item.dormirAEn, item.dormirA ?? "") || t("dormirA", { commune: item.commune ?? "" })}
                  </h3>
                  {item.desc && (
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      {loc(locale, item.descEn, item.desc)}
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
                    {item.lieuSlug &&
                    lieuBySlug.get(item.lieuSlug)?.villeSlug &&
                    (villeLieuCount.get(lieuBySlug.get(item.lieuSlug)!.villeSlug) ?? 0) >= 2 ? (
                      <Link
                        href={`/communes/${lieuBySlug.get(item.lieuSlug)!.villeSlug}`}
                        className="text-xs hover:underline"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {item.commune}
                      </Link>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {item.commune}
                      </span>
                    )}
                  </div>
                  {item.lieuSlug && (
                    <Link
                      href={`/lieux/${item.lieuSlug}?itin=${itin.slug}`}
                      className="text-xs hover:underline flex-shrink-0"
                      style={{ color: "var(--azure)" }}
                    >
                      {t("voirLeLieu")}
                    </Link>
                  )}
                </div>
                <h3 className="font-semibold mb-1">{loc(locale, item.nomEn, item.nom ?? "")}</h3>
                {item.desc && (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {loc(locale, item.descEn, item.desc)}
                  </p>
                )}
                {item.lieuSlug && lieuBySlug.get(item.lieuSlug) && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {buildMapLinks(
                      lieuBySlug.get(item.lieuSlug)!.lat,
                      lieuBySlug.get(item.lieuSlug)!.lng,
                      loc(locale, item.nomEn, item.nom ?? item.lieuSlug),
                      tCommon("plans")
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
                {/* Une page itinéraire se consulte le matin même : la pastille d'étape doit
                    dire si l'activité est fermée aujourd'hui, exactement comme la fiche lieu.
                    L'info est dérivée de l'activité référencée par {lieuSlug, activiteId} —
                    aucune donnée de fermeture n'est stockée côté itinéraire. */}
                {item.activites && item.activites.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {item.activites.map((act, j) => {
                      const ref =
                        act.lieuSlug && act.activiteId
                          ? lieuBySlug
                              .get(act.lieuSlug)
                              ?.activites.find((a) => a.activiteId === act.activiteId)
                          : undefined;
                      return (
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
                          {loc(locale, act.labelEn, act.label)}
                          <FermeAujourdhui fermeJours={ref?.fermeJours} compact />
                        </span>
                      );
                    })}
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
          <h2 className="text-xl font-bold mb-6">{t("aReserver")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {itin.booking.map((b, i) => {
              const lieuActivite = lieuBySlug.get(b.lieuSlug);
              const activite = lieuActivite?.activites.find((a) => a.activiteId === b.activiteId);
              const commune = activite && lieuActivite ? communeActivite(activite, lieuActivite) : null;

              return (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden flex flex-col"
                  style={{ background: "var(--surface)" }}
                >
                  {activite && (
                    <div className="aspect-[4/3] overflow-hidden">
                      <Photo
                        src={activite.image}
                        alt={loc(locale, activite.altEn, activite.alt)}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-5 flex flex-col gap-1 flex-1">
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {loc(locale, b.lieuLabelEn, b.lieuLabel)}
                    </p>
                    <p className="font-semibold mb-1">{loc(locale, b.nomLabelEn, b.nomLabel)}</p>
                    {/* Durée, prix, horaires et commune viennent de l'activité référencée,
                        jamais d'une copie figée côté itinéraire : `booking[].extraSpans`
                        affichait encore « Mardi & jeudi » pour la Chapelle du Rosaire quand
                        la fiche lieu dit « Fermée le dimanche et le lundi… ». Les deux
                        étaient incompatibles et rien ne permettait de trancher. */}
                    {commune && (
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        📍 {tActivite("aProximiteDe", { commune })}
                      </p>
                    )}
                    {activite && (
                      <div className="mb-3">
                        <div
                          className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <span>⏱ {loc(locale, activite.dureeEn, activite.duree)}</span>
                          <span>💶 {prixAffiche(locale, activite.prixEn, activite.prix)}</span>
                        </div>
                        {activite.horaires && (
                          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                            🕒 {loc(locale, activite.horairesEn, activite.horaires)}
                          </p>
                        )}
                        <FermeAujourdhui fermeJours={activite.fermeJours} />
                      </div>
                    )}
                    <a
                      href={activite?.url ?? `/lieux/${b.lieuSlug}`}
                      target="_blank"
                      rel={relActivite(activite?.partenaire ?? false)}
                      className="text-sm mt-auto self-start"
                      style={{ color: "var(--azure)" }}
                    >
                      {tActivite(cleLienType(activite?.lienType))}
                      {activite?.partenaire && (
                        <span className="ml-1" style={{ color: "var(--text-muted)" }}>
                          · {tActivite("lienPartenaire")}
                        </span>
                      )}
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
            {stops.length} {stops.length > 1 ? t("etapes") : t("etape")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {stops.map((s, i) => {
              const stopNom = s.lieuSlug
                ? loc(locale, lieuBySlug.get(s.lieuSlug)?.nomEn, s.nom ?? s.lieuSlug)
                : s.nom;
              return s.lieuSlug ? (
                <Link
                  key={i}
                  href={`/lieux/${s.lieuSlug}`}
                  className="text-sm px-3 py-1 rounded-full border transition-colors hover:bg-white/5"
                  style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
                >
                  {stopNom}
                </Link>
              ) : (
                <span
                  key={i}
                  className="text-sm px-3 py-1 rounded-full border"
                  style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
                >
                  {stopNom}
                </span>
              );
            })}
          </div>
        </section>
      )}

      {/* Autres itinéraires */}
      {itin.suggestions.length > 0 && (
        <section className="pt-12 mt-8 border-t" style={{ borderColor: "var(--line)" }}>
          <h2 className="text-xl font-bold mb-6">{t("autresItineraires")}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {itin.suggestions.map((s, i) => (
              <Link
                key={i}
                href={`/itineraires/${s.href.replace(".html", "")}`}
                className="group rounded-xl overflow-hidden transition-transform hover:-translate-y-1"
                style={{ background: "var(--surface)" }}
              >
                <div className="aspect-video overflow-hidden">
                  <Photo
                    src={s.img}
                    alt={loc(locale, s.altEn, s.alt)}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold mb-1" style={{ color: "var(--azure)" }}>
                    {loc(locale, s.badgeEn, s.badge)}
                  </p>
                  <h3 className="text-sm font-semibold leading-snug">{loc(locale, s.titreEn, s.titre)}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
