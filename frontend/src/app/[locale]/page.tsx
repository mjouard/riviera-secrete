import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { loc } from "@/lib/utils";
import HomeMapWrapper from "@/components/HomeMapWrapper";
import HomeActivities from "@/components/HomeActivities";
import HomeLieuxGrid from "@/components/HomeLieuxGrid";
import HomeHero from "@/components/HomeHero";
import HomeItineraires from "@/components/HomeItineraires";

export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://frontend-two-plum-92.vercel.app";

export function generateMetadata(): Metadata {
  return {
    alternates: {
      languages: {
        fr: `${SITE_URL}/`,
        en: `${SITE_URL}/en`,
        "x-default": `${SITE_URL}/`,
      },
    },
  };
}

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

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("itemListName", { count: lieux.length }),
    itemListElement: villes.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/villes/${v.slug}`,
      name: loc(locale, v.nomEn, v.nom),
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
        {/* Le voile était le plus clair (0,52) en son milieu, c'est-à-dire exactement
            derrière le texte, et le sous-titre était en --text-muted — une couleur pensée
            pour le fond sombre du site, pas pour une photo. Sur les 8 visuels du hero, dont
            plusieurs très clairs, le contraste mesuré tombait à ~2,0:1 (AA en exige 4,5) et
            changeait toutes les 5 s. Voile renforcé + texte plein + ombre portée : ~5,8:1
            au pire, quelle que soit l'image dessous. */}
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(160deg, rgba(12,17,22,0.82) 0%, rgba(12,17,22,0.68) 50%, rgba(12,17,22,0.88) 100%)",
          }}
        />
        <div
          className="relative z-[2] max-w-2xl mx-auto"
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.65)" }}
        >
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            {t("heroTitleStart")}{" "}
            <em className="not-italic" style={{ color: "var(--terracotta)" }}>
              {t("heroTitleEm")}
            </em>
          </h1>
          <p className="text-lg" style={{ color: "var(--text)" }}>
            {t("heroSubtitle", { lieuxCount: lieux.length, itinCount: itineraires.length })}
          </p>
          <div className="flex gap-4 justify-center mt-8">
            <Link
              href="#lieux"
              className="px-6 py-3 rounded-full text-sm font-medium transition-colors"
              style={{ background: "var(--azure)", color: "#0C1116", textShadow: "none" }}
            >
              {t("exploreLieux")}
            </Link>
            {/* Bordure --line (rgba(255,255,255,.08)) : invisible sur une photo, le CTA
                secondaire ne se lisait pas comme un bouton. Bordure franche + fond sombre
                translucide, pour qu'il tienne sur les 8 visuels. */}
            <Link
              href="#itineraires"
              className="px-6 py-3 rounded-full text-sm font-medium border transition-colors hover:bg-white/15"
              style={{
                borderColor: "rgba(255,255,255,0.5)",
                background: "rgba(12,17,22,0.45)",
                color: "var(--text)",
                textShadow: "none",
              }}
            >
              {t("seeItineraires")}
            </Link>
          </div>
        </div>
      </section>

      {/* Itinéraires */}
      <section id="itineraires" className="py-12 px-6 border-t scroll-mt-20" style={{ borderColor: "var(--line)" }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">{t("itinerairesTitle")}</h2>
          <HomeItineraires itineraires={itineraires} lieuBySlug={lieuBySlug} />
        </div>
      </section>

      {/* Activités suggérées */}
      <section className="py-12 px-6 border-t" style={{ borderColor: "var(--line)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1">
              {t("activitesTitleStart")} <em className="not-italic" style={{ color: "var(--terracotta)" }}>{t("activitesTitleEm")}</em>
            </h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {t("activitesSubtitle")}
            </p>
          </div>
          <HomeActivities lieux={lieux} />
        </div>
      </section>

      {/* Carte */}
      <section className="py-12 px-6 border-t" style={{ borderColor: "var(--line)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1">{t("mapTitle", { count: villes.length })}</h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {t("mapSubtitle")}
            </p>
          </div>
          <HomeMapWrapper villes={villes} />
        </div>
      </section>

      {/* Lieux */}
      <section id="lieux" className="py-12 px-6 border-t scroll-mt-20" style={{ borderColor: "var(--line)" }}>
        <div className="max-w-6xl mx-auto">
          <HomeLieuxGrid lieux={lieux} />
        </div>
      </section>
    </>
  );
}
