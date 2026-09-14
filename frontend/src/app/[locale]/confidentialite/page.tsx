import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { alternatesPage } from "@/lib/utils";
import { politiqueConfidentialite } from "@/lib/legal-content";
import PageLegale from "@/components/PageLegale";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://frontend-two-plum-92.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return {
    title: t("confidentialiteTitre"),
    description: t("confidentialiteDescription"),
    alternates: alternatesPage(SITE_URL, locale, "/confidentialite"),
  };
}

export default async function ConfidentialitePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  const contenu = politiqueConfidentialite(locale);
  return (
    <PageLegale
      titre={t("confidentialiteTitre")}
      intro={contenu.intro}
      maj={contenu.maj}
      blocs={contenu.blocs}
      accueil={t("accueil")}
      filAriane={t("filAriane")}
    />
  );
}
