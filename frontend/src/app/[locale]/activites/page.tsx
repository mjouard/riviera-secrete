import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { api } from "@/lib/api";
import { alternatesPage } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import ActivitesGrid from "@/components/ActivitesGrid";

export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://frontend-two-plum-92.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "activites" });
  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: alternatesPage(SITE_URL, locale, "/activites"),
  };
}

/**
 * Catalogue complet des activités, filtrable.
 *
 * Elles existaient déjà toutes en base — nom, durée, prix, horaires, lien de réservation —
 * mais n'étaient atteignables qu'en ouvrant les fiches lieu une par une : l'accueil en
 * montrait 36 curées sur plus de 200, sans le dire, et son filtre « gratuit » portait sur
 * cet extrait. C'est la donnée la plus actionnable du site ; cette page la rend parcourable.
 *
 * Les lieux sont chargés côté serveur (ISR, comme les autres pages publiques) et la
 * dérivation des catégories et tranches de durée se fait côté client, dans `ActivitesGrid`.
 */
export default async function ActivitesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [lieux, t] = await Promise.all([
    api.lieux.list(),
    getTranslations({ locale, namespace: "activites" }),
  ]);

  const total = lieux.reduce((n, l) => n + (l.activites?.length || 0), 0);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <nav className="text-xs mb-6" style={{ color: "var(--text-muted)" }} aria-label={t("filAriane")}>
        <Link href="/" className="hover:underline">{t("accueil")}</Link>
        <span className="mx-2">/</span>
        <span>{t("titre")}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("titre")}</h1>
        <p className="text-sm max-w-2xl" style={{ color: "var(--text-muted)" }}>
          {t("intro", { total })}
        </p>
      </header>

      <ActivitesGrid lieux={lieux} />
    </main>
  );
}
