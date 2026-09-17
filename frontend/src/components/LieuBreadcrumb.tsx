"use client";

import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";

type Props = {
  accueilLabel: string;
  villeHref: string;
  villeLabel: string;
  /** Nom affiché quand le parent est une commune (préfixe commune retiré si redondant). */
  nomVille: string;
  /** Nom complet, affiché quand le parent est un itinéraire. */
  nom: string;
  /** Map slug → titre localisé de tous les itinéraires, pour éviter un fetch client. */
  itinTitles: Record<string, string>;
};

/**
 * Fil d'Ariane de la fiche lieu — adapte le parent à `?itin=<slug>` si présent.
 *
 * Extrait du server component pour que la page ne lise pas `searchParams` côté serveur
 * (un `await searchParams` suffit à forcer toute la page en rendu dynamique, court-
 * circuitant l'ISR). Enveloppé dans <Suspense> par le parent : le fallback SSR montre
 * le fil commune, la version hydratée bascule sur l'itinéraire si `?itin=` est dans l'URL.
 */
export default function LieuBreadcrumb({
  accueilLabel,
  villeHref,
  villeLabel,
  nomVille,
  nom,
  itinTitles,
}: Props) {
  const searchParams = useSearchParams();
  const itinSlug = searchParams.get("itin");

  const parentHref = itinSlug ? `/itineraires/${itinSlug}` : villeHref;
  const parentLabel = itinSlug ? (itinTitles[itinSlug] ?? villeLabel) : villeLabel;
  const nomBreadcrumb = itinSlug ? nom : nomVille;

  return (
    <nav className="text-meta mb-8 flex gap-2" style={{ color: "var(--brume)" }}>
      <Link href="/" className="hover:text-white transition-colors">{accueilLabel}</Link>
      <span>/</span>
      <Link href={parentHref} className="hover:text-white transition-colors">
        {parentLabel}
      </Link>
      <span>/</span>
      <span style={{ color: "var(--calcaire)" }}>{nomBreadcrumb}</span>
    </nav>
  );
}
