"use client";

import { useTranslations, useLocale } from "next-intl";
import { useAujourdhui } from "@/lib/aujourdhui";
import { nomJourSemaine } from "@/lib/utils";

/**
 * Avertissement de fermeture pour une activité — "fermé aujourd'hui" par défaut, ou "fermé
 * <jour>" quand une date de voyage est fournie (Composer, refonte Lot 4c → PR-04).
 *
 * Sans la prop `date`, se comporte exactement comme avant (2026-08-XX) : jour du visiteur via
 * `useAujourdhui` (voir ce fichier — même raison qu'ici, un `new Date()` lu pendant le rendu
 * resterait figé dans le HTML ISR pendant jusqu'à une heure). Avec `date` — un voyage
 * programmé dans le futur depuis `/composer` — l'alerte porte sur le jour effectivement
 * prévu, jamais sur `new Date()` : un itinéraire composé pour samedi doit dire si le lieu est
 * fermé *ce samedi-là*, pas si le bureau qui l'a généré tombe un jour de fermeture.
 */
export default function FermeAujourdhui({
  fermeJours,
  compact = false,
  date = null,
}: {
  fermeJours?: number[] | null;
  /** Variante sans marge haute, pour s'insérer dans une pastille d'étape déjà dense. */
  compact?: boolean;
  /** Date du voyage (Composer). `null` (repli) = aujourd'hui, calculé côté client. */
  date?: Date | null;
}) {
  const t = useTranslations("activite");
  const locale = useLocale();
  const maintenant = useAujourdhui();
  const reference = date ?? maintenant;

  if (reference === null || !fermeJours?.includes(reference.getDay())) return null;

  return (
    <span
      className={`inline-block font-semibold rounded-full ${compact ? "text-[10px] px-1.5 py-0.5 ml-1.5" : "text-[11px] px-2 py-0.5 mt-2"}`}
      style={{ background: "rgba(232,74,74,0.15)", color: "#E8705A" }}
    >
      {date ? t("fermeCeJour", { jour: nomJourSemaine(reference, locale) }) : t("fermeAujourdhui")}
    </span>
  );
}
