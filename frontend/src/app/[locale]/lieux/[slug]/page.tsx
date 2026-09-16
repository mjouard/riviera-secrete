import { cleLienType, communeActivite, relActivite } from "@/lib/activites-data";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { imgUrl, buildMapLinks, distanceKm, loc, alternatesPage, prixAffiche } from "@/lib/utils";
import { BADGE_DEFS_BY_SLUG } from "@/lib/home-data";
import { regionToMerShade } from "@/lib/mer-colors";
import { IconClock } from "@/components/ui/Icons";
import MapLieuWrapper from "@/components/MapLieuWrapper";
import HeroCarousel from "@/components/HeroCarousel";
import FavoriteButton from "@/components/FavoriteButton";
import ShareButton from "@/components/ShareButton";
import AddToItinButton from "@/components/AddToItinButton";
import FermeAujourdhui from "@/components/FermeAujourdhui";
import LieuMobileActionBar from "@/components/LieuMobileActionBar";
import Photo from "@/components/Photo";

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

  const [ville, itin, tousItineraires, tousLieux, t, tCommon, tActivite, tBadges, tRegionFull] =
    await Promise.all([
      api.villes.bySlug(lieu.villeSlug).catch(() => null),
      itinSlug ? api.itineraires.bySlug(itinSlug).catch(() => null) : Promise.resolve(null),
      // Rebonds de bas de page (→ PA-03) : deux lectures déjà étiquetées et mises en cache
      // (ISR 3600), donc sans coût par visite.
      api.itineraires.list().catch(() => []),
      api.lieux.list().catch(() => []),
      getTranslations("lieu"),
      getTranslations("common"),
      getTranslations("activite"),
      getTranslations("badges"),
      getTranslations("regionFull"),
    ]);

  const nom = loc(locale, lieu.nomEn, lieu.nom);
  const description = loc(locale, lieu.descriptionEn, lieu.description);
  const description2 = loc(locale, lieu.description2En, lieu.description2 ?? "") || undefined;

  // Une commune à 1 seul lieu n'a pas de page dédiée (Lot 5, → /communes/[slug]) : ce lieu
  // EST son seul contenu, un aller-retour vers une page qui le liste à nouveau n'apporterait
  // rien — repli sur le fil générique, comme pour un lieu sans commune connue.
  const parentCrumb = itin
    ? { href: `/itineraires/${itin.slug}`, label: loc(locale, itin.titreEn, itin.titre) }
    : ville && ville.lieux.length >= 2
      ? { href: `/communes/${ville.slug}`, label: loc(locale, ville.nomEn, ville.nom) }
      : { href: "/#explorer", label: tCommon("lieux") };

  // Fil d'Ariane (Lot 4a, composition desktop) : quand le nom du lieu commence par « {nom de
  // la commune}, » et que le fil d'Ariane affiche déjà cette commune juste avant (donc
  // uniquement le cas ville.lieux.length >= 2 ci-dessus — le repli générique "Lieux" ne répète
  // rien), le dernier maillon droppe ce préfixe redondant : "Tourrettes-sur-Loup /
  // Tourrettes-sur-Loup, la cité des violettes" devenait "Tourrettes-sur-Loup / la cité des
  // violettes". Ne s'applique pas à une égalité stricte nom === commune (ex. Lucéram) : il n'y
  // a alors aucun résidu à afficher à la place, et répéter le nom du lieu en dernier maillon
  // est un usage de fil d'Ariane parfaitement normal.
  const nomBreadcrumb =
    !itin && ville && ville.lieux.length >= 2 && nom.startsWith(`${lieu.commune}, `)
      ? nom.slice(lieu.commune.length + 2)
      : nom;

  // ─── Rebonds de bas de fiche (→ PA-03) ─────────────────────────────────────
  //
  // C'est la page qui reçoit l'essentiel du trafic entrant depuis Google, et c'était celle
  // qui offrait le moins de suites : la liste « À découvrir aussi » est un instantané figé,
  // sans rapport avec l'endroit où l'on se trouve. L'information existait déjà ailleurs
  // (/villes/eze annonce « 1 itinéraire qui passe par ici ») mais pas sur la fiche elle-même.

  /** Itinéraires éditoriaux citant ce lieu, avec le rang de l'étape et son heure. */
  const itinerairesQuiPassent = tousItineraires
    .map((it) => {
      const etapes = it.items.filter((i) => i.type === "stop");
      const index = etapes.findIndex((e) => e.lieuSlug === lieu.slug);
      return index === -1 ? null : { itineraire: it, rang: index + 1, total: etapes.length, heure: etapes[index].heure };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  /**
   * Lieux atteignables rapidement. Même conversion distance → temps que le générateur
   * d'itinéraire (35 km/h de moyenne sur ces routes, plus 10 min de marge stationnement),
   * pour que les deux ne racontent pas deux histoires différentes du même trajet.
   */
  const aProximite = tousLieux
    .filter((l) => l.slug !== lieu.slug)
    .map((l) => {
      const km = distanceKm(lieu.lat, lieu.lng, l.lat, l.lng);
      return { lieu: l, km, minutes: Math.round((km / 35) * 60 + 10) };
    })
    .filter((x) => x.minutes <= 20)
    .sort((a, b) => a.minutes - b.minutes)
    .slice(0, 3);

  /**
   * JSON-LD. Même forme que le `TouristDestination` de /villes/[slug], mais en
   * `TouristAttraction` — les fiches lieu n'en portaient aucun alors qu'elles reçoivent
   * l'essentiel du trafic de recherche.
   *
   * `isAccessibleForFree` n'est déclaré que si toutes les activités payantes sont absentes :
   * un lieu dont l'accès est libre mais qui compte une visite payante n'est pas « gratuit »
   * au sens de Google, et l'annoncer ainsi serait faux.
   */
  const activitesPayantes = (lieu.activites ?? []).filter((a) => a.badge === "payant");
  const attractionJsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: nom,
    description,
    image: `${SITE_URL}${imgUrl(lieu.heroImage)}`,
    geo: { "@type": "GeoCoordinates", latitude: lieu.lat, longitude: lieu.lng },
    address: {
      "@type": "PostalAddress",
      addressLocality: lieu.commune,
      addressRegion: loc(locale, null, lieu.regionLabel),
      addressCountry: "FR",
    },
    isAccessibleForFree: activitesPayantes.length === 0,
    url: `${SITE_URL}${locale === "en" ? "/en" : ""}/lieux/${lieu.slug}`,
  };

  return (
    <article className="max-w-6xl mx-auto px-6 pt-12 pb-28 lg:pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(attractionJsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="text-meta mb-8 flex gap-2" style={{ color: "var(--brume)" }}>
        <Link href="/" className="hover:text-white transition-colors">{tCommon("accueil")}</Link>
        <span>/</span>
        <Link href={parentCrumb.href} className="hover:text-white transition-colors">
          {parentCrumb.label}
        </Link>
        <span>/</span>
        <span style={{ color: "var(--calcaire)" }}>{nomBreadcrumb}</span>
      </nav>

      {/* Composition desktop (≥1024px, → 06 § 3) : colonne gauche 62% galerie/identité/récit,
          colonne droite 38% collante carte/rebonds. Les actions (liens Maps/Waze/Plans,
          favori/partager/ajouter) restent avec l'identité à gauche plutôt que de suivre la
          carte à droite comme le nomme le spec au mot près — sur mobile (colonnes empilées),
          ces boutons doivent rester juste sous le titre, pas atterrir après le récit et la
          carte une fois la grille repliée en une colonne ; les regrouper avec l'identité
          règle les deux mises en page à la fois sans dupliquer le bloc. */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.63fr_1fr] lg:gap-10">
        <div className="min-w-0">
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

          {/* Identité */}
          <div className="mb-8">
            <p className="text-meta mb-2" style={{ color: regionToMerShade(lieu.regionSlug) }}>
              {lieu.commune} · {tRegionFull(lieu.regionSlug as "menton-monaco" | "nice" | "arriere-pays" | "antibes-cannes" | "golfe-st-tropez")}
            </p>
            <h1 className="text-display mb-4" style={{ color: "var(--calcaire)" }}>{nom}</h1>

            {/* Badges — informatifs sur cette page (pas des filtres), même forme visuelle que
                les puces Chip du Lot 1 mais sans le comportement interactif. */}
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
                      className="text-meta px-3 py-1 rounded-full border"
                      style={{ borderColor: "var(--line)", color: "var(--brume)" }}
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
                <span key={i} className="text-meta" style={{ color: "var(--brume)" }}>
                  <span>{loc(locale, pill.labelEn, pill.label)}</span>{" "}
                  <span style={{ color: "var(--calcaire)" }}>{loc(locale, pill.valeurEn, pill.valeur)}</span>
                </span>
              ))}
              <span className="text-meta" style={{ color: "var(--brume)" }}>
                <span>📍</span>{" "}
                <span className="text-data" style={{ color: "var(--calcaire)" }}>{lieu.lat}°N, {lieu.lng}°E</span>
              </span>
            </div>

            {/* Liens Maps/Waze/Plans.
                Ils étaient en texte de 12 px, la plus petite cible de la page — alors que c'est
                l'action principale d'un site de destination consulté sur place, une fois sur la
                route (→ MO-01). Vrais boutons de 44 px, espacés de 8 px. */}
            <div className="flex flex-wrap gap-2 mt-4">
              {buildMapLinks(lieu.lat, lieu.lng, nom, tCommon("plans")).map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring-aube inline-flex items-center gap-2 h-11 px-4 rounded-lg border text-body transition-colors hover:bg-white/5"
                  style={{ borderColor: "var(--line)", color: "var(--calcaire)" }}
                >
                  <span aria-hidden="true">{link.icon}</span>
                  {link.label}
                </a>
              ))}
            </div>

            {/* Favori / Partager / Itinéraire — actions sur le site */}
            <div className="flex flex-wrap gap-2 mt-3">
              <FavoriteButton slug={lieu.slug} />
              <ShareButton title={nom} />
              <AddToItinButton lieuSlug={lieu.slug} nom={nom} />
            </div>
          </div>

          {/* Récit — largeur de lecture bornée à 66 caractères (→ 06 § 3), pas la pleine
              largeur de la colonne gauche. */}
          <div className="prose max-w-none mb-10" style={{ maxWidth: "66ch" }}>
            <p className="text-body mb-4" style={{ color: "var(--calcaire)" }}>{description}</p>
            {description2 && (
              <p className="text-body" style={{ color: "var(--brume)" }}>
                {description2}
              </p>
            )}
          </div>
        </div>

        {/* Colonne droite (38%, collante ≥1024px) — carte + rebonds. */}
        <div className="flex flex-col gap-6 mb-10 lg:mb-0 lg:sticky lg:top-[92px] lg:self-start">
          <MapLieuWrapper lat={lieu.lat} lng={lieu.lng} nom={nom} />

          {/* Rebond ① — l'itinéraire qui passe par ici (→ PA-03) */}
          {itinerairesQuiPassent.length > 0 && (
            <section>
              <h2 className="text-card-title mb-4" style={{ color: "var(--calcaire)" }}>{t("itineraireQuiPasse")}</h2>
              <div className="flex flex-col gap-3">
                {itinerairesQuiPassent.map(({ itineraire, rang, total, heure }) => (
                  <Link
                    key={itineraire.slug}
                    href={`/itineraires/${itineraire.slug}`}
                    className="focus-ring-aube block rounded-lg p-4 transition-colors hover:bg-white/5"
                    style={{ background: "var(--nuit-haute)" }}
                  >
                    <p className="text-data mb-1" style={{ color: "var(--aube)" }}>
                      {t("nbEtapes", { n: total })}
                      {heure ? ` · ${t("etapeNumero", { n: rang })} · ${heure}` : ` · ${t("etapeNumero", { n: rang })}`}
                    </p>
                    <p className="text-card-title" style={{ color: "var(--calcaire)" }}>
                      {loc(locale, itineraire.titreEn, itineraire.titre)}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Rebond ② — ce qu'on peut enchaîner sans reprendre la route longtemps (→ PA-03) */}
          {aProximite.length > 0 && (
            <section>
              <h2 className="text-card-title mb-4" style={{ color: "var(--calcaire)" }}>{t("aProximite")}</h2>
              <ul className="flex flex-col gap-2 list-none p-0">
                {aProximite.map(({ lieu: voisin, minutes }) => (
                  <li key={voisin.slug}>
                    <Link
                      href={`/lieux/${voisin.slug}`}
                      className="focus-ring-aube flex items-center justify-between gap-4 h-11 px-4 rounded-lg transition-colors hover:bg-white/5"
                      style={{ background: "var(--nuit-haute)" }}
                    >
                      <span className="text-body min-w-0">
                        <span style={{ color: "var(--calcaire)" }}>{loc(locale, voisin.nomEn, voisin.nom)}</span>
                        <span className="mx-2" aria-hidden="true" style={{ color: "var(--line)" }}>·</span>
                        <span style={{ color: "var(--brume)" }}>{voisin.commune}</span>
                      </span>
                      <span className="text-data whitespace-nowrap" style={{ color: "var(--aube)" }}>
                        {minutes} min
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* Le bon moment — refonte UI Lot 4a (06 § 2.3) : reprend les anciens "Conseils
          pratiques" (cartes en grille) en un seul encadré tabulaire scannable, une ligne par
          conseil plutôt qu'une carte par conseil — plus rapide à parcourir d'un coup d'œil. */}
      {lieu.tips.length > 0 && (
        <section className="mb-10">
          <h2 className="text-card-title mb-4 flex items-center gap-2" style={{ color: "var(--calcaire)" }}>
            <span style={{ color: "var(--aube)" }}>
              <IconClock className="w-5 h-5" />
            </span>
            {t("leBonMoment")}
          </h2>
          <div className="rounded-lg overflow-hidden" style={{ background: "var(--nuit-haute)", border: "1px solid var(--line)" }}>
            {lieu.tips.map((tip, i) => (
              <div
                key={i}
                className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-4 px-4 py-3"
                style={i > 0 ? { borderTop: "1px solid var(--line)" } : undefined}
              >
                <p className="text-data" style={{ color: "var(--aube)" }}>
                  {loc(locale, tip.labelEn, tip.label)}
                </p>
                <p className="text-meta" style={{ color: "var(--brume)" }}>
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
          <h2 className="text-card-title mb-4" style={{ color: "var(--calcaire)" }}>{t("aFaireSurPlace")}</h2>
          <div className="hscroll flex gap-4 overflow-x-auto -mx-6 px-6 pb-2 snap-x snap-mandatory sm:grid sm:gap-4 sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible sm:grid-cols-2">
            {lieu.activites.map((act) => {
              const commune = communeActivite(act, lieu);
              return (
                <a
                  key={act.activiteId}
                  href={act.url}
                  target="_blank"
                  rel={relActivite(act.partenaire)}
                  className="group rounded-xl overflow-hidden flex flex-col flex-shrink-0 snap-start w-[70%] sm:w-auto transition-transform hover:-translate-y-0.5"
                  style={{ background: "var(--nuit-haute)" }}
                >
                  <div className="aspect-video overflow-hidden">
                    <Photo sizes="(max-width: 640px) 100vw, 50vw"
                      src={act.image}
                      alt={loc(locale, act.altEn, act.alt)}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Gratuit en Pin (seul usage sémantique de cette teinte), payant en
                          Brume — pas de couleur d'action ici, ce n'est pas un état cliquable
                          (docs/design-refonte-2026-09-14.md § 1 "Filtres & badges"). */}
                      <span
                        className="text-data"
                        style={{ color: act.badge === "gratuit" ? "var(--pin)" : "var(--brume)" }}
                      >
                        {act.badge === "gratuit" ? tActivite("gratuit") : tActivite("payant")}
                      </span>
                      <h3 className="text-card-title mt-1" style={{ color: "var(--calcaire)" }}>{loc(locale, act.nomEn, act.nom)}</h3>
                      <p className="text-meta mt-1" style={{ color: "var(--brume)" }}>
                        {loc(locale, act.dureeEn, act.duree)} · {prixAffiche(locale, act.prixEn, act.prix)}
                      </p>
                      {/* Ne s'affiche que si l'activité ne se pratique pas au lieu même
                          (Lot 3, DC-02) — sinon rien ne change, l'affichage sans commune
                          ne mentait pas. */}
                      {commune && (
                        <p className="text-meta mt-1" style={{ color: "var(--brume)" }}>
                          📍 {tActivite("aProximiteDe", { commune })}
                        </p>
                      )}
                      {act.horaires && (
                        <p className="text-meta mt-1" style={{ color: "var(--brume)" }}>
                          🕒 {loc(locale, act.horairesEn, act.horaires)}
                        </p>
                      )}
                      <FermeAujourdhui fermeJours={act.fermeJours} />
                    </div>
                    <span
                      className="text-meta mt-3"
                      style={{ color: "var(--aube)" }}
                    >
                      {tActivite(cleLienType(act.lienType))}
                      {act.partenaire && (
                        <span className="ml-1" style={{ color: "var(--brume)" }}>
                          · {tActivite("lienPartenaire")}
                        </span>
                      )}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* Related — region reste un nom de commune (nom propre), jamais traduit */}
      {lieu.related.length > 0 && (
        <section>
          <h2 className="text-card-title mb-4" style={{ color: "var(--calcaire)" }}>{t("aDecouvrirAussi")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {lieu.related.map((r, i) => (
              <Link
                key={i}
                href={`/lieux/${r.href.replace(".html", "")}`}
                className="group flex gap-4 rounded-xl overflow-hidden p-3 transition-colors"
                style={{ background: "var(--nuit-haute)" }}
              >
                <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <Photo sizes="(max-width: 640px) 100vw, 50vw"
                    src={r.img}
                    alt={loc(locale, r.altEn, r.alt)}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-meta mb-0.5" style={{ color: "var(--brume)" }}>
                    {r.region}
                  </p>
                  <p className="text-card-title line-clamp-2" style={{ color: "var(--calcaire)" }}>{loc(locale, r.titreEn, r.titre)}</p>
                  <p className="text-meta line-clamp-1" style={{ color: "var(--brume)" }}>
                    {loc(locale, r.blurbEn, r.blurb)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <LieuMobileActionBar lieuSlug={lieu.slug} lat={lieu.lat} lng={lieu.lng} nom={nom} />
    </article>
  );
}
