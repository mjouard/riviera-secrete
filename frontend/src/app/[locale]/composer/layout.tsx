import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

/**
 * Même raison que /creer-itineraire/layout.tsx : un titre d'onglet propre plutôt que celui,
 * générique, hérité de l'accueil. `noindex` : outil de composition, pas une page de contenu
 * éditorial — et pas encore reliée depuis la nav (ROADMAP Lot 5, hors périmètre ici).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "composer" });
  return {
    title: t("title"),
    robots: { index: false, follow: true },
  };
}

export default function ComposerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
