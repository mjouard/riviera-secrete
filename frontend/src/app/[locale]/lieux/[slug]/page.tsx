import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { imgUrl, buildMapLinks, loc, alternatesPage } from "@/lib/utils";
import { BADGE_DEFS_BY_SLUG } from "@/lib/home-data";
import MapLieuWrapper from "@/components/MapLieuWrapper";
import HeroCarousel from "@/components/HeroCarousel";
import FavoriteButton from "@/components/FavoriteButton";
import ShareButton from "@/components/ShareButton";
import AddToItinButton from "@/components/AddToItinButton";
import FermeAujourdhui from "@/components/FermeAujourdhui";

export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://frontend-two-plum-92.vercel.app";

export async function generateStaticParams() {
  const lieux = await api.lieux.list();
  return lieux.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const lieu = await api.lieux.bySlug(slug).catch(() => null);
  if (!lieu) return {};
  const nom = loc(locale, lieu.nomEn, lieu.nom);
  const description = loc(locale, lieu.descriptionEn, lieu.description);
  return {
    title: nom,
    description,
    openGraph: {
      title: nom,
      description,
      images: lieu.heroImage ? [{ url: imgUrl(lieu.heroImage), width: 1200, height: 800 }] : [],
    },
    alternates: alternatesPage(SITE_URL, locale, `/lieux/${slug}`),
  };
}

export default async function LieuPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{ itin?: string }>;
}) {
  const { slug, locale } = await params;
  const { itin: itinSlug } = await searchParams;
  const lieu = await api.lieux.bySlug(slug).catch(() => null);
  if (!lieu) notFound();

  const [ville, itin, t, tCommon, tActivite, tBadges, tRegionFull] = await Promise.all([
    api.villes.bySlug(lieu.villeSlug).catch(() => null),
    itinSlug ? api.itineraires.bySlug(itinSlug).catch(() => null) : Promise.resolve(null),
    getTranslations("lieu"),
    getTranslations("common"),
    getTranslations("activite"),
    getTranslations("badges"),
    getTranslations("regionFull"),
  ]);

  const nom = loc(locale, lieu.nomEn, lieu.nom);
  const description = loc(locale, lieu.descriptionEn, lieu.description);
  const description2 = loc(locale, lieu.description2En, lieu.description2 ?? "") || undefined;

  const parentCrumb = itin
    ? { href: `/itineraires/${itin.slug}`, label: loc(locale, itin.titreEn, itin.titre) }
    : ville
      ? { href: `/villes/${ville.slug}`, label: loc(locale, ville.nomEn, ville.nom) }
      : { href: "/#lieux", label: tCommon("lieux") };

  return (
    <article className="max-w-4xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm mb-8 flex gap-2" style={{ color: "var(--text-muted)" }}>
        <Link href="/" className="hover:text-white transition-colors">{tCommon("accueil")}</Link>
        <span>/</span>
        <Link href={parentCrumb.href} className="hover:text-white transition-colors">
          {parentCrumb.label}
        </Link>
        <span>/</span>
        <span style={{ color: "var(--text)" }}>{nom}</span>
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
          {lieu.commune} · {tRegionFull(lieu.regionSlug as "menton-monaco" | "nice" | "arriere-pays" | "antibes-cannes" | "golfe-st-tropez")}
        </p>
        <h1 className="font-display text-3xl font-bold mb-4">{nom}</h1>

        {/* Badges */}
        {lieu.badges.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {lieu.badges.map((b) => {
              const def = BADGE_DEFS_BY_SLUG[b];
              const known = ["plage", "randonnee", "vtt", "plongee", "restaurant"] as const;
              const badgeLabel = (known as readonly string[]).includes(b)
                ? tBadges(b as (typeof known)[number])
                : def?.label;
              return (
                <span
                  key={b}
                  className="text-xs px-3 py-1 rounded-full border"
                  style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
                >
                  {def ? `${def.emoji} ${badgeLabel}` : b}
                </span>
              );
            })}
          </div>
        )}

        {/* MetaPills + GPS */}
        <div className="flex flex-wrap gap-3">
          {lieu.metaPills.map((pill, i) => (
            <span key={i} className="text-sm" style={{ color: "var(--text-muted)" }}>
              <span>{loc(locale, pill.labelEn, pill.label)}</span>{" "}
              <span style={{ color: "var(--text)" }}>{loc(locale, pill.valeurEn, pill.valeur)}</span>
            </span>
          ))}
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            <span>📍</span>{" "}
            <span style={{ color: "var(--text)" }}>{lieu.lat}°N, {lieu.lng}°E</span>
          </span>
        </div>

        {/* Liens Maps/Waze/Plans — quittent le site, traitement discret */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
          {buildMapLinks(lieu.lat, lieu.lng, nom, tCommon("plans")).map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs hover:underline transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              {link.icon} {link.label}
            </a>
          ))}
        </div>

        {/* Favori / Partager / Itinéraire — actions sur le site */}
        <div className="flex flex-wrap gap-2 mt-3">
          <FavoriteButton slug={lieu.slug} />
          <ShareButton title={nom} />
          <AddToItinButton lieuSlug={lieu.slug} />
        </div>
      </div>

      {/* Carte */}
      <div className="mb-10">
        <MapLieuWrapper lat={lieu.lat} lng={lieu.lng} nom={nom} />
      </div>

      {/* Description */}
      <div className="prose max-w-none mb-10">
        <p className="text-base leading-relaxed mb-4">{description}</p>
        {description2 && (
          <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {description2}
          </p>
        )}
      </div>

      {/* Tips */}
      {lieu.tips.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">{t("conseilsPratiques")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {lieu.tips.map((tip, i) => (
              <div
                key={i}
                className="rounded-lg p-4"
                style={{ background: "var(--surface)" }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--azure)" }}>
                  {loc(locale, tip.labelEn, tip.label)}
                </p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {loc(locale, tip.texteEn, tip.texte)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Activités */}
      {lieu.activites.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">{t("aFaireSurPlace")}</h2>
          <div className="hscroll flex gap-4 overflow-x-auto -mx-6 px-6 pb-2 snap-x snap-mandatory sm:grid sm:gap-4 sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible sm:grid-cols-2">
            {lieu.activites.map((act) => (
              <a
                key={act.activiteId}
                href={act.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl overflow-hidden flex flex-col flex-shrink-0 snap-start w-[70%] sm:w-auto transition-transform hover:-translate-y-0.5"
                style={{ background: "var(--surface)" }}
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={imgUrl(act.image)}
                    alt={loc(locale, act.altEn, act.alt)}
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
                      {act.badge === "gratuit" ? tActivite("gratuit") : tActivite("payant")}
                    </span>
                    <h3 className="font-semibold text-sm mt-1">{loc(locale, act.nomEn, act.nom)}</h3>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {loc(locale, act.dureeEn, act.duree)} · {loc(locale, act.prixEn, act.prix)}
                    </p>
                    {act.horaires && (
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                        🕒 {loc(locale, act.horairesEn, act.horaires)}
                      </p>
                    )}
                    <FermeAujourdhui fermeJours={act.fermeJours} />
                  </div>
                  <span
                    className="text-xs mt-3"
                    style={{ color: "var(--azure)" }}
                  >
                    {act.linkText === "Réserver →" ? tActivite("reserver") : tActivite("enSavoirPlus")}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Related — region reste un nom de commune (nom propre), jamais traduit */}
      {lieu.related.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">{t("aDecouvrirAussi")}</h2>
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
                    alt={loc(locale, r.altEn, r.alt)}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>
                    {r.region}
                  </p>
                  <p className="text-sm font-semibold line-clamp-2">{loc(locale, r.titreEn, r.titre)}</p>
                  <p className="text-xs line-clamp-1" style={{ color: "var(--text-muted)" }}>
                    {loc(locale, r.blurbEn, r.blurb)}
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
