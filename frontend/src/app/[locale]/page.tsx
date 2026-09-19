import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { api } from "@/lib/api";
import { loc, alternatesPage } from "@/lib/utils";
import HomeHero from "@/components/HomeHero";
import HomeQualificateur from "@/components/HomeQualificateur";
import HomeExplorerSection from "@/components/HomeExplorerSection";
import HomeItineraires from "@/components/HomeItineraires";
import HomeMethode from "@/components/HomeMethode";
import { LinkButton } from "@/components/ui/Button";

export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://frontend-two-plum-92.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: alternatesPage(SITE_URL, locale, "") };
}

/**
 * Refonte UI Lot 4e — héros qualificateur (3 questions → /composer pré-rempli) à la place du
 * carrousel vitrine, aperçu Explorer synchronisé à la place de la carte+grille dupliquées,
 * section Activités supprimée (cassait la hiérarchie Lieu→Activité, voir CLAUDE.md), bloc "La
 * méthode" ajouté. Voir docs/design-refonte-2026-09-14.md § 2-3 et ROADMAP.md, Lot 4e.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [lieux, itineraires, villes, t] = await Promise.all([
    api.lieux.list(),
    api.itineraires.list(),
    api.villes.list(),
    getTranslations("home"),
  ]);
  const lieuBySlug = new Map(lieux.map((l) => [l.slug, l]));
  const localePrefix = locale === "en" ? "/en" : "";

  // Pointe direct sur l'URL canonique (commune si ≥2 lieux, sinon le lieu lui-même — même
  // logique que la redirection /villes/[slug] de next.config.ts) plutôt que sur l'ancienne
  // URL /villes/[slug], qui existe encore mais ne fait plus que rediriger (308) : éviter aux
  // moteurs un saut de redirection inutile pour chaque entrée de la liste.
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("itemListName", { count: lieux.length }),
    itemListElement: villes.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}${localePrefix}${
        v.lieux.length >= 2 ? `/communes/${v.slug}` : `/lieux/${v.lieux[0]?.slug}`
      }`,
      name: loc(locale, v.nomEn, v.nom),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      {/* Héros qualificateur */}
      <section className="relative overflow-hidden py-24 px-6 text-center" style={{ minHeight: 620 }}>
        <HomeHero />
        {/* Voile renforcé + texte plein + ombre portée : contraste tenu quelle que soit
            l'image dessous (même raisonnement que l'ancien héros multi-images). */}
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(160deg, rgba(12,26,41,0.82) 0%, rgba(12,26,41,0.7) 50%, rgba(12,26,41,0.9) 100%)",
          }}
        />
        <HomeQualificateur villes={villes} lieuxCount={lieux.length} />
      </section>

      {/* Explorer — carte + liste synchronisées (aperçu, → /explorer) */}
      <section className="py-12 px-6 border-t" style={{ borderColor: "var(--line)" }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-section mb-2" style={{ color: "var(--calcaire)" }}>{t("explorerTitre")}</h2>
          <p className="text-body mb-6" style={{ color: "var(--brume)" }}>{t("explorerSousTitre")}</p>
          <HomeExplorerSection lieux={lieux} />
        </div>
      </section>

      {/* Déjà composés */}
      <section id="itineraires" className="py-12 px-6 border-t scroll-mt-20" style={{ borderColor: "var(--line)" }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-section mb-2" style={{ color: "var(--calcaire)" }}>{t("itinerairesTitle")}</h2>
          <p className="text-body mb-8" style={{ color: "var(--brume)" }}>{t("dejaComposesSousTitre")}</p>
          <HomeItineraires itineraires={itineraires} lieuBySlug={lieuBySlug} />
          <LinkButton href="/itineraires" variant="secondaire" className="mt-6">
            {t("itinerairesVoirTous")}
          </LinkButton>
        </div>
      </section>

      {/* La méthode */}
      <section className="py-12 px-6 border-t" style={{ borderColor: "var(--line)" }}>
        <HomeMethode locale={locale} lieuxCount={lieux.length} />
      </section>
    </>
  );
}
