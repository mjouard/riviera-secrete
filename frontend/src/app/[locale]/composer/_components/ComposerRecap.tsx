"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Lieu } from "@/lib/types";
import { loc } from "@/lib/utils";
import {
  DUREE_META,
  LUNCH_BREAK_MINUTES,
  construirePlanning,
  estimerEntreesEuros,
  formatDuree,
  lieuFermeCeJour,
  parseVisitMinutes,
  travelMinutes,
  type DureeKey,
  type TransportMode,
} from "@/lib/itineraire-logic";
import { Button } from "@/components/ui/Button";
import Photo from "@/components/Photo";

/**
 * Récapitulatif vivant (ROADMAP Lot 4c, point 5) — se met à jour à chaque case cochée, sans
 * attendre le clic sur "Composer" : le visiteur voit tout de suite si sa sélection tient dans
 * la journée, avant de s'engager. `days` est déjà réordonné par le moteur (généré côté page
 * avec les mêmes réglages que le bandeau), donc les pastilles numérotées reflètent l'ordre de
 * visite réel, pas l'ordre dans lequel les vignettes ont été cochées.
 */
export default function ComposerRecap({
  days,
  dureeKey,
  mode,
  depart,
  heureDebutMinutes,
  date,
  tousLesLieux,
  selectedSlugs,
  onCompose,
}: {
  days: Lieu[][];
  dureeKey: DureeKey;
  mode: TransportMode;
  depart: { lat: number; lng: number; nom: string } | null;
  heureDebutMinutes: number;
  date: Date | null;
  tousLesLieux: Lieu[];
  selectedSlugs: Set<string>;
  onCompose: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("composer");

  const flat = useMemo(() => days.flat(), [days]);
  const nbLieux = flat.length;

  const planning = useMemo(
    () => construirePlanning(days, dureeKey, { mode, depart, heureDebutMinutes }),
    [days, dureeKey, mode, depart, heureDebutMinutes]
  );

  const tempsSurPlaceMin = useMemo(() => flat.reduce((sum, l) => sum + parseVisitMinutes(l), 0), [flat]);
  const trajetsMin = useMemo(
    () => planning.elements.reduce((sum, el) => (el.type === "transit" ? sum + el.minutes : sum), 0),
    [planning]
  );

  const meta = DUREE_META[dureeKey];
  const budgetTotal = useMemo(
    () => meta.dayBudgets.reduce((a, b) => a + b, 0) - (meta.lunchBreak ? LUNCH_BREAK_MINUTES * meta.dayBudgets.length : 0),
    [meta]
  );
  const resteMin = budgetTotal - tempsSurPlaceMin - trajetsMin;

  const entreesEuros = useMemo(() => estimerEntreesEuros(days), [days]);

  // Suggestion : le prochain lieu non retenu qui tiendrait dans ce qu'il reste, choisi au plus
  // proche du dernier arrêt (ou du point de départ si la sélection est encore vide).
  const suggestion = useMemo(() => {
    if (resteMin <= 0) return null;
    const ancre = flat[flat.length - 1] ?? depart;
    if (!ancre) return null;
    let best: { lieu: Lieu; travel: number; visit: number } | null = null;
    for (const l of tousLesLieux) {
      if (selectedSlugs.has(l.slug)) continue;
      if (date && lieuFermeCeJour(l, date) === true) continue;
      const travel = travelMinutes(ancre, l, mode);
      const visit = parseVisitMinutes(l);
      if (travel + visit > resteMin) continue;
      if (!best || travel + visit < best.travel + best.visit) best = { lieu: l, travel, visit };
    }
    return best;
  }, [resteMin, flat, depart, tousLesLieux, selectedSlugs, date, mode]);

  const titre = nbLieux === 0
    ? t("recapTitreVide")
    : t("recapTitre", { count: nbLieux, plural: nbLieux > 1 ? "x" : "", duree: formatDuree(tempsSurPlaceMin + trajetsMin) });

  return (
    <div
      className="rounded-xl p-5 lg:sticky lg:top-6"
      style={{ background: "var(--nuit-haute)", boxShadow: "var(--shadow-float)" }}
    >
      <h2 className="text-section mb-4" style={{ color: "var(--calcaire)", fontSize: "22px" }}>{titre}</h2>

      {nbLieux > 0 && (
        <ol className="mb-5 space-y-0">
          {flat.map((l, i) => (
            <li key={l.slug} className="relative flex items-start gap-3 pb-3 last:pb-0">
              {i < flat.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute left-[13px] top-[26px] bottom-0 w-0"
                  style={{ borderLeft: "2px dashed var(--aube)" }}
                />
              )}
              <span
                className="flex-shrink-0 w-[26px] h-[26px] rounded-full flex items-center justify-center text-data font-semibold"
                style={{ background: "var(--aube)", color: "var(--nuit)" }}
              >
                {i + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-meta truncate" style={{ color: "var(--calcaire)" }}>{loc(locale, l.nomEn, l.nom)}</p>
                <p className="text-meta" style={{ color: "var(--brume)" }}>{l.commune}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="grid grid-cols-2 gap-3 mb-5 pt-4" style={{ borderTop: "1px solid var(--line)" }}>
        <div>
          <p className="text-meta" style={{ color: "var(--brume)" }}>{t("tempsSurPlace")}</p>
          <p className="text-data" style={{ color: "var(--calcaire)", fontSize: "16px" }}>{nbLieux ? formatDuree(tempsSurPlaceMin) : "—"}</p>
        </div>
        <div>
          <p className="text-meta" style={{ color: "var(--brume)" }}>{t("trajets")}</p>
          <p className="text-data" style={{ color: "var(--calcaire)", fontSize: "16px" }}>{nbLieux ? formatDuree(trajetsMin) : "—"}</p>
        </div>
        <div>
          <p className="text-meta" style={{ color: "var(--brume)" }}>{t("entrees")}</p>
          <p className="text-data" style={{ color: "var(--calcaire)", fontSize: "16px" }}>{entreesEuros !== null ? `${entreesEuros} €` : "—"}</p>
        </div>
        <div>
          <p className="text-meta" style={{ color: "var(--brume)" }}>{t("reste")}</p>
          <p className="text-data" style={{ color: nbLieux === 0 ? "var(--calcaire)" : resteMin >= 0 ? "var(--pin)" : "var(--aube)", fontSize: "16px" }}>
            {nbLieux ? formatDuree(Math.abs(resteMin)) : "—"}
          </p>
        </div>
      </div>

      {suggestion && (
        <div className="rounded-lg p-3 mb-5 flex items-center gap-3" style={{ background: "rgba(242,162,92,0.1)" }}>
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
            <Photo src={suggestion.lieu.thumbImage} alt="" className="w-full h-full object-cover" />
          </div>
          <p className="text-meta" style={{ color: "var(--calcaire)" }}>
            {t("suggestionPlace", {
              nom: loc(locale, suggestion.lieu.nomEn, suggestion.lieu.nom),
              duree: formatDuree(suggestion.visit),
              trajet: formatDuree(suggestion.travel),
            })}
          </p>
        </div>
      )}

      <Button type="button" variant="primaire" className="w-full" disabled={nbLieux === 0} onClick={onCompose}>
        {t("composerBouton")}
      </Button>
      {nbLieux === 0 && (
        <p className="text-meta mt-2 text-center" style={{ color: "var(--brume)" }}>{t("composerBoutonVide")}</p>
      )}
      <p className="text-meta mt-3 text-center" style={{ color: "var(--brume)" }}>{t("persistanceInfo")}</p>
    </div>
  );
}
