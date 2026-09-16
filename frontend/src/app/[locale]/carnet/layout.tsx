import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

/**
 * Refonte UI Lot 5 — remplace mes-favoris/layout.tsx et mes-itineraires/layout.tsx (fusionnés
 * ici en deux onglets). Même raison d'être : un titre d'onglet propre plutôt que celui,
 * générique, hérité de l'accueil.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "carnet" });
  return {
    title: t("title"),
    robots: { index: false, follow: true },
  };
}

export default function CarnetLayout({ children }: { children: React.ReactNode }) {
  return children;
}
