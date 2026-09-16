import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * 404 dédiée à `/i/[id]` (refonte UI Lot 4d — spec : titre « Cet itinéraire n'existe plus »,
 * explication, bouton primaire « En composer un »). Next route ici tout `notFound()` levé
 * depuis `page.tsx` (le plus proche `not-found.tsx` dans l'arbre), avant que ça ne remonte à
 * la 404 générique du site (`[locale]/not-found.tsx`) — un id inconnu de `/i/[id]` est un cas
 * bien identifié (lien périmé, lien supprimé), pas une erreur générique de navigation.
 *
 * Comme `[locale]/not-found.tsx` : Next ne passe aucune prop à un `not-found.tsx` dans cette
 * version (pas de `params`), donc pas d'id à afficher — le message reste volontairement
 * générique, ce que le spec demande de toute façon.
 */
export default async function ItineraireComposeNotFound() {
  const t = await getTranslations("itineraireCompose");

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-center">
      <p className="text-data mb-3" style={{ color: "var(--brume)" }}>404</p>
      <h1 className="text-display mb-3" style={{ color: "var(--calcaire)" }}>
        {t("introuvableTitre")}
      </h1>
      <p className="text-body mb-8" style={{ color: "var(--brume)" }}>
        {t("introuvableExplication")}
      </p>
      <Link href="/composer" className="btn btn-primaire focus-ring-aube">
        {t("enComposerUn")}
      </Link>
    </div>
  );
}
