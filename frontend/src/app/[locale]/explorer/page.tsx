import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { api } from "@/lib/api";
import { alternatesPage } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import ExplorerShell from "./_components/ExplorerShell";

export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://frontend-two-plum-92.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const [t, lieux] = await Promise.all([
    getTranslations({ locale, namespace: "explorer" }),
    api.lieux.list().catch(() => []),
  ]);
  return {
    title: t("metaTitre"),
    description: t("metaDescription", { count: lieux.length }),
    alternates: alternatesPage(SITE_URL, locale, "/explorer"),
  };
}

/**
 * Carte et liste synchronisées, un seul jeu de filtres (refonte Lot 4b, → AI-04/NF-01).
 *
 * Avant : la carte de l'accueil et la grille de lieux avaient chacune leurs propres filtres,
 * sans rapport entre eux — filtrer une zone sur la carte ne changeait pas la liste, et
 * inversement. Ici les deux lisent le même état, dérivé de l'URL comme sur l'accueil (Lot 2).
 *
 * Filtrage entièrement client (43 lieux déjà chargés, page ISR — le HTML servi est identique
 * quelle que soit la query, même raisonnement que HomeLieuxGrid).
 */
export default async function ExplorerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [lieux, t] = await Promise.all([
    api.lieux.list(),
    getTranslations({ locale, namespace: "explorer" }),
  ]);

  return (
    <main className="max-w-[1400px] mx-auto px-4 py-8">
      <nav className="text-xs mb-6" style={{ color: "var(--brume)" }} aria-label={t("filAriane")}>
        <Link href="/" className="hover:underline">{t("accueil")}</Link>
        <span className="mx-2">/</span>
        <span>{t("titre")}</span>
      </nav>

      <h1 className="text-section mb-6" style={{ color: "var(--calcaire)" }}>{t("titre")}</h1>

      <ExplorerShell lieux={lieux} />
    </main>
  );
}
