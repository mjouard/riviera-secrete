import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

/**
 * Ces pages heritaient du titre generique de l'accueil ("Riviera Secrete - Les spots
 * confidentiels..."), indistinguable dans un onglet, un historique ou un favori. Titre
 * propre, traduit, combine au `titleTemplate` du layout racine.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "creerItineraire" });
  return {
    title: t("title"),
    robots: { index: false, follow: true },
  };
}

export default function CreerItineraireLayout({ children }: { children: React.ReactNode }) {
  return children;
}
