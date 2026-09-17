import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { api } from "@/lib/api";
import { alternatesPage } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import ItinerairesShell from "./_components/ItinerairesShell";

export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://frontend-two-plum-92.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const [t, itineraires] = await Promise.all([
    getTranslations({ locale, namespace: "itineraires" }),
    api.itineraires.list().catch(() => []),
  ]);
  return {
    title: t("metaTitre"),
    description: t("metaDescription", { count: itineraires.length }),
    alternates: alternatesPage(SITE_URL, locale, "/itineraires"),
  };
}

/**
 * Index des itinéraires éditoriaux (refonte UI Lot 5, docs/design-refonte-2026-09-14.md § 2
 * "Ordre des sections" : "l'ancre #itineraires de l'accueil devient une vraie page"). Grille
 * verticale 3:2, réutilise ComposeCard tel quel (créé au Lot 4e pour la section "Déjà
 * composés" de l'accueil, qui a exactement le même format de carte) — pas de nouveau
 * composant de carte. Filtres zone/durée (→ ROADMAP § Trimestre) dans ItinerairesShell.tsx,
 * seule partie cliente de cette page — le reste reste un Server Component pour l'ISR.
 */
export default async function ItinerairesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [itineraires, lieux, t] = await Promise.all([
    api.itineraires.list(),
    api.lieux.list(),
    getTranslations({ locale, namespace: "itineraires" }),
  ]);
  const lieuBySlug = new Map(lieux.map((l) => [l.slug, l]));

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <nav className="text-xs mb-6" style={{ color: "var(--brume)" }} aria-label={t("filAriane")}>
        <Link href="/" className="hover:underline">{t("accueil")}</Link>
        <span className="mx-2">/</span>
        <span>{t("titre")}</span>
      </nav>

      <h1 className="text-section mb-2" style={{ color: "var(--calcaire)" }}>{t("titre")}</h1>
      <p className="text-body mb-8" style={{ color: "var(--brume)" }}>{t("sousTitre")}</p>

      <ItinerairesShell itineraires={itineraires} lieuBySlug={lieuBySlug} />
    </main>
  );
}
