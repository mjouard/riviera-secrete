"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

/** Le jour ne change pas pendant une visite : rien à écouter. */
const neJamaisResouscrire = () => () => {};
const jourClient = () => new Date().getDay();
/** Côté serveur (et au premier rendu d'hydratation) : aucun jour connu, donc rien affiché. */
const jourServeur = () => null;

/**
 * Avertissement "fermé aujourd'hui" pour une activité.
 *
 * Client et non serveur, volontairement : la page lieu est rendue en ISR (revalidate 3600),
 * un `new Date().getDay()` côté serveur serait donc figé dans le HTML mis en cache et
 * afficherait le mauvais jour pendant une heure — voire bien plus longtemps sur une page
 * peu visitée. Le jour doit être celui du visiteur, au moment où il regarde.
 *
 * `useSyncExternalStore` plutôt qu'un `useState` + `useEffect` : il expose nativement un
 * instantané serveur distinct (null, donc rien affiché) du instantané client, ce qui évite
 * à la fois la discordance d'hydratation et le `setState` synchrone dans un effet.
 */
export default function FermeAujourdhui({
  fermeJours,
  compact = false,
}: {
  fermeJours?: number[] | null;
  /** Variante sans marge haute, pour s'insérer dans une pastille d'étape déjà dense. */
  compact?: boolean;
}) {
  const t = useTranslations("activite");
  const jour = useSyncExternalStore(neJamaisResouscrire, jourClient, jourServeur);

  if (jour === null || !fermeJours?.includes(jour)) return null;

  return (
    <span
      className={`inline-block font-semibold rounded-full ${compact ? "text-[10px] px-1.5 py-0.5 ml-1.5" : "text-[11px] px-2 py-0.5 mt-2"}`}
      style={{ background: "rgba(232,74,74,0.15)", color: "#E8705A" }}
    >
      {t("fermeAujourdhui")}
    </span>
  );
}
