import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";

export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://frontend-two-plum-92.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aPropos" });
  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: {
      languages: {
        fr: `${SITE_URL}/a-propos`,
        en: `${SITE_URL}/en/a-propos`,
        "x-default": `${SITE_URL}/a-propos`,
      },
    },
  };
}

export default async function AProposPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Comptes dérivés de l'API plutôt qu'écrits en dur : le contenu du site grossit
  // régulièrement (voir project_villes_expansion.md), un nombre figé ici redeviendrait
  // faux au prochain lieu ajouté — même piège que le meta description corrigé le 2026-09-13.
  const [t, tCommon, lieux, villes, itineraires] = await Promise.all([
    getTranslations({ locale, namespace: "aPropos" }),
    getTranslations({ locale, namespace: "common" }),
    api.lieux.list().catch(() => []),
    api.villes.list().catch(() => []),
    api.itineraires.list().catch(() => []),
  ]);

  const counts = {
    lieux: lieux.length,
    villes: villes.length,
    itineraires: itineraires.length,
    activites: lieux.reduce((n, l) => n + (l.activites?.length ?? 0), 0),
  };

  const methodePoints = [
    t("methodePoint1"),
    t("methodePoint2"),
    t("methodePoint3"),
    t("methodePoint4"),
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <nav className="text-sm mb-8 flex gap-2" style={{ color: "var(--text-muted)" }}>
        <Link href="/" className="hover:text-white transition-colors">{tCommon("accueil")}</Link>
        <span>/</span>
        <span style={{ color: "var(--text)" }}>{t("title")}</span>
      </nav>

      <h1 className="font-display text-3xl font-bold mb-6">{t("title")}</h1>

      <p className="text-lg leading-relaxed mb-10" style={{ color: "var(--text-muted)" }}>
        {t("intro")}
      </p>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3">{t("quoiTitle")}</h2>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {t("quoiTexte", counts)}
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3">{t("choixTitle")}</h2>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {t("choixTexte")}
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3">{t("methodeTitle")}</h2>
        <p className="text-base leading-relaxed mb-4" style={{ color: "var(--text-muted)" }}>
          {t("methodeIntro")}
        </p>
        <ul className="flex flex-col gap-3">
          {methodePoints.map((point, i) => (
            <li
              key={i}
              className="rounded-lg p-4 text-sm leading-relaxed"
              style={{ background: "var(--surface)", color: "var(--text-muted)" }}
            >
              {point}
            </li>
          ))}
        </ul>
        <p className="text-sm mt-4">
          <Link href="/credits" style={{ color: "var(--terracotta)" }} className="hover:underline">
            {t("creditsLien")} →
          </Link>
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3">{t("limitesTitle")}</h2>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {t("limitesTexte")}
        </p>
      </section>

      <section
        className="rounded-xl p-5"
        style={{ background: "var(--surface)", borderLeft: "3px solid var(--azure)" }}
      >
        <h2 className="text-lg font-semibold mb-2">{t("contactTitle")}</h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {t("contactTexte")}
        </p>
      </section>
    </div>
  );
}
