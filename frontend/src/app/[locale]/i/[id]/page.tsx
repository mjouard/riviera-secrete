import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import type { Lieu } from "@/lib/types";
import { imgUrl, alternatesPage } from "@/lib/utils";
import { DUREE_META, type DureeKey } from "@/lib/itineraire-logic";
import ItineraireComposeView from "./_components/ItineraireComposeView";

// Contenu utilisateur (lot 4d, ROADMAP.md § 4d) : jamais mis en cache côté Next (voir
// `api.itinerairesComposes.bySlug`, `cache: "no-store"`) — un PATCH doit être visible
// immédiatement à quiconque rouvre le lien, sans attendre une revalidation.
export const revalidate = 0;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://frontend-two-plum-92.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const itin = await api.itinerairesComposes.bySlug(id).catch(() => null);
  if (!itin) return {};

  // Image de la première étape pour l'aperçu Open Graph (ROADMAP.md § 4d) — l'itinéraire
  // composé n'a pas de photo propre.
  const lieux = await api.lieux.list().catch(() => []);
  const lieuBySlug = new Map(lieux.map((l) => [l.slug, l]));
  const premierSlug = itin.jours.flat()[0];
  const premier = premierSlug ? lieuBySlug.get(premierSlug) : undefined;

  return {
    title: itin.nom,
    openGraph: {
      title: itin.nom,
      images: premier?.heroImage ? [{ url: imgUrl(premier.heroImage), width: 1200, height: 800 }] : [],
    },
    alternates: alternatesPage(SITE_URL, locale, `/i/${id}`),
    // Contenu généré par un visiteur, sans compte ni modération éditoriale — accessible à
    // quiconque a le lien, mais pas destiné à apparaître dans les résultats de recherche.
    robots: { index: false, follow: false },
  };
}

export default async function ItineraireComposePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const [itin, lieux, t, tCommon] = await Promise.all([
    api.itinerairesComposes.bySlug(id).catch(() => null),
    api.lieux.list().catch(() => []),
    getTranslations("itineraireCompose"),
    getTranslations("common"),
  ]);
  if (!itin) notFound();

  const lieuBySlug = new Map(lieux.map((l) => [l.slug, l]));
  // Un slug qui ne résout plus (lieu supprimé/renommé depuis la composition) est ignoré
  // silencieusement plutôt que de casser l'affichage — même choix que /creer-itineraire pour
  // ?jours= (decodeJours) et ?id= (voir page.tsx de cette route).
  const days: Lieu[][] = itin.jours.map(
    (jour) => jour.map((slug) => lieuBySlug.get(slug)).filter((l): l is Lieu => Boolean(l))
  );
  const dureeKey = (itin.dureeKey in DUREE_META ? itin.dureeKey : "journee") as DureeKey;

  return (
    <div className="print-page max-w-4xl mx-auto px-6 py-12">
      <nav className="no-print text-sm mb-8 flex gap-2" style={{ color: "var(--text-muted)" }}>
        <Link href="/" className="hover:text-white transition-colors">
          {tCommon("accueil")}
        </Link>
        <span>/</span>
        <span style={{ color: "var(--text)" }}>{t("breadcrumb")}</span>
      </nav>

      <ItineraireComposeView
        id={id}
        nom={itin.nom}
        dureeKey={dureeKey}
        days={days}
        createdAt={itin.createdAt}
      />
    </div>
  );
}
