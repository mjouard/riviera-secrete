"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Lieu } from "@/lib/types";
import { loc, nomJourSemaine } from "@/lib/utils";
import { formatDuree, lieuFermeCeJour, parseVisitMinutes } from "@/lib/itineraire-logic";
import Photo from "@/components/Photo";

/**
 * Vignette de sélection du Composer (ROADMAP Lot 4c, → PR-05) — remplace la case à cocher nue
 * de /creer-itineraire : photo, commune, durée de visite, et une case d'état 28×28 plutôt
 * qu'un `<input type="checkbox">` par défaut du navigateur.
 */
export default function ComposerCard({
  lieu,
  selected,
  date,
  onToggle,
}: {
  lieu: Lieu;
  selected: boolean;
  /** Date de voyage choisie dans le bandeau — `null` tant qu'elle n'est pas fixée : pas de
   * badge "Fermé" affiché sans date de référence, plutôt que de retomber sur aujourd'hui et
   * mentir sur le jour réellement concerné. */
  date: Date | null;
  onToggle: (slug: string) => void;
}) {
  const locale = useLocale();
  const t = useTranslations("composer");
  const ferme = date ? lieuFermeCeJour(lieu, date) === true : false;
  const dureeLabel = formatDuree(parseVisitMinutes(lieu));

  return (
    <button
      type="button"
      onClick={() => onToggle(lieu.slug)}
      aria-pressed={selected}
      className="focus-ring-aube text-left rounded-xl overflow-hidden transition-transform hover:-translate-y-0.5"
      style={{ background: "var(--nuit-haute)" }}
    >
      <div className="relative aspect-[3/2] overflow-hidden">
        <Photo
          src={lieu.thumbImage}
          alt={lieu.heroAlt}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
          className="w-full h-full object-cover"
          style={ferme ? { opacity: 0.6 } : undefined}
        />
        {ferme && <div className="absolute inset-0" style={{ background: "rgba(12,26,41,0.45)" }} aria-hidden="true" />}

        {/* Case d'état 28×28 (→ spec 02 § 5.3) */}
        <span
          aria-hidden="true"
          className="absolute top-2 right-2 w-7 h-7 rounded-md flex items-center justify-center"
          style={
            selected
              ? { background: "var(--aube)" }
              : { border: "2px solid var(--brume)", background: "rgba(12,26,41,0.35)" }
          }
        >
          {selected && (
            <svg viewBox="0 0 16 16" className="w-4 h-4" style={{ color: "var(--nuit)" }}>
              <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>

        {ferme && (
          <span
            className="absolute bottom-2 left-2 text-meta font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(12,26,41,0.75)", color: "var(--calcaire)" }}
          >
            {t("fermeJour", { jour: nomJourSemaine(date!, locale) })}
          </span>
        )}
      </div>

      <div className="p-2.5">
        <p className="text-meta truncate" style={{ color: "var(--mer-3)" }}>{lieu.commune}</p>
        <h3 className="text-card-title truncate" style={{ color: "var(--calcaire)", fontSize: "15px" }}>
          {loc(locale, lieu.nomEn, lieu.nom)}
        </h3>
        <p className="text-meta mt-0.5" style={{ color: "var(--brume)" }}>⏱ {dureeLabel}</p>
      </div>
    </button>
  );
}
