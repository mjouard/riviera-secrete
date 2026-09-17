import type { Lieu, Activite } from "./types";
import { parseDureeTexte, formatTime } from "./itineraire-format";

export { parseDureeTexte, formatDuree, formatTransitDesc, formatTime, parseHeureMinutes } from "./itineraire-format";
export { SEPARATEUR_JOUR, encodeJours, decodeJours } from "./itineraire-url";

/** Durée d'une pause déjeuner réservée sur les journées complètes (pas sur une demi-journée). */
export const LUNCH_BREAK_MINUTES = 75;

export const DUREE_META = {
  "demi-journee": { label: "Demi-journée", dayBudgets: [240], lunchBreak: false },
  journee: { label: "Journée", dayBudgets: [480], lunchBreak: true },
  "2-jours": { label: "2 jours", dayBudgets: [480, 480], lunchBreak: true },
  "3-jours": { label: "3 jours", dayBudgets: [480, 480, 480], lunchBreak: true },
} as const;

export type DureeKey = keyof typeof DUREE_META;

/**
 * Déduit la durée du créateur depuis le badge d'un itinéraire éditorial
 * ("6 étapes · 2 jours", "3 étapes · Journée complète") pour pré-sélectionner le bon
 * préréglage sur "Partir de cet itinéraire". Retombe sur "journee" si rien ne correspond.
 */
export function dureeKeyDepuisBadge(badge: string): DureeKey {
  const s = badge.toLowerCase();
  if (/3\s*jours/.test(s)) return "3-jours";
  if (/2\s*jours/.test(s)) return "2-jours";
  if (/demi-journ/.test(s)) return "demi-journee";
  return "journee";
}

export function parseVisitMinutes(lieu: Lieu): number {
  const pill = (lieu.metaPills || []).find((p) => /urée/.test(p.label));
  // 90 min : estimation de repli quand la pastille est absente ou illisible.
  return parseDureeTexte(pill ? pill.valeur || "" : "") ?? 90;
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Refonte UI Lot 4c (Composer) — le bandeau de paramètres propose un mode de transport. */
export type TransportMode = "voiture" | "transport-commun";

/**
 * Vitesse moyenne et battement fixe par mode. Étiqueté comme estimation dans l'UI
 * (`ComposerParamsBar`), jamais présenté comme un horaire garanti.
 */
const VITESSE_KMH: Record<TransportMode, number> = { voiture: 35, "transport-commun": 20 };
const BATTEMENT_MINUTES: Record<TransportMode, number> = { voiture: 10, "transport-commun": 20 };

export function travelMinutes(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  mode: TransportMode = "voiture"
): number {
  return Math.round((haversineKm(a, b) / VITESSE_KMH[mode]) * 60 + BATTEMENT_MINUTES[mode]);
}

/**
 * `garderTous` : place **toutes** les étapes, même si la journée déborde du budget.
 *
 * Réservé au cas « Partir de cet itinéraire », où la sélection vient d'un itinéraire
 * éditorial déjà équilibré à la main : l'algorithme n'a pas à le censurer.
 */
export function generateItineraire(
  candidates: Lieu[],
  dureeKey: DureeKey,
  options: { garderTous?: boolean; mode?: TransportMode } = {}
): { days: Lieu[][]; excluded: Lieu[] } {
  if (!candidates.length) return { days: [], excluded: [] };
  const { garderTous = false, mode = "voiture" } = options;
  const meta = DUREE_META[dureeKey];
  const pool = candidates.slice();
  const days: Lieu[][] = [];
  const restants: number[] = [];
  let currentPos = pool.reduce((a, b) => (b.lng > a.lng ? b : a));

  const numDays = meta.dayBudgets.length;
  for (let d = 0; d < numDays && pool.length; d++) {
    const remainingDays = numDays - d;
    const targetCount = Math.ceil(pool.length / remainingDays);
    let budget = meta.dayBudgets[d] - (meta.lunchBreak ? LUNCH_BREAK_MINUTES : 0);
    const day: Lieu[] = [];
    while (pool.length && day.length < targetCount) {
      let best: Lieu | null = null;
      let bestTravel = Infinity;
      for (const cand of pool) {
        const travel = travelMinutes(currentPos, cand, mode);
        if (travel < bestTravel) { bestTravel = travel; best = cand; }
      }
      const cost = bestTravel + parseVisitMinutes(best!);
      if (!garderTous && cost > budget && day.length > 0) break;
      pool.splice(pool.indexOf(best!), 1);
      day.push(best!);
      budget -= cost;
      currentPos = best!;
    }
    days.push(day);
    restants.push(budget);
  }

  if (!garderTous) {
    const avecTolerance = restants.map(
      (r, d) => r + Math.round(meta.dayBudgets[d] * TOLERANCE_JOURNEE)
    );
    placerLesRestants(pool, days, avecTolerance, mode);
  }

  return { days, excluded: pool };
}

/**
 * Insère les lieux non placés là où ils tiennent, en mutant `days`, `restants` et `pool`.
 * Boucle tant qu'un placement a réussi : caser un lieu peut raccourcir le détour d'un autre.
 */
function placerLesRestants(pool: Lieu[], days: Lieu[][], restants: number[], mode: TransportMode = "voiture"): void {
  let placeAuMoinsUn = true;
  while (pool.length && placeAuMoinsUn) {
    placeAuMoinsUn = false;

    for (let i = 0; i < pool.length; i++) {
      const lieu = pool[i];
      const visite = parseVisitMinutes(lieu);
      let meilleur: { jour: number; position: number; surcout: number } | null = null;

      for (let j = 0; j < days.length; j++) {
        const jour = days[j];
        if (jour.length === 0) continue;

        for (let k = 0; k <= jour.length; k++) {
          const avant = k > 0 ? jour[k - 1] : null;
          const apres = k < jour.length ? jour[k] : null;
          const ajoute =
            (avant ? travelMinutes(avant, lieu, mode) : 0) + (apres ? travelMinutes(lieu, apres, mode) : 0);
          const retire = avant && apres ? travelMinutes(avant, apres, mode) : 0;
          const surcout = ajoute - retire + visite;

          if (surcout > restants[j]) continue;
          if (!meilleur || surcout < meilleur.surcout) meilleur = { jour: j, position: k, surcout };
        }
      }

      if (meilleur) {
        days[meilleur.jour].splice(meilleur.position, 0, lieu);
        restants[meilleur.jour] -= meilleur.surcout;
        pool.splice(i, 1);
        placeAuMoinsUn = true;
        break;
      }
    }
  }
}

/** Heure de départ de chaque journée dans le programme généré. */
export const DEBUT_JOURNEE_MINUTES = 9 * 60;
/** Le déjeuner s'insère au premier arrêt atteint après 12h30. */
export const SEUIL_DEJEUNER_MINUTES = 12 * 60 + 30;
/**
 * Au-delà de cette heure, on prévient que la journée est dense.
 * Seuil à l'horloge, pas en dépassement du budget interne.
 */
export const FIN_JOURNEE_RAISONNABLE_MINUTES = 19 * 60;

const TOLERANCE_JOURNEE = 0.25;

export type ElementPlanning =
  | { type: "transit"; minutes: number }
  | { type: "sleep"; dayNum: number }
  | { type: "lunch" }
  | { type: "stop"; lieu: Lieu; heure: string };

export type Planning = {
  /** Le programme à plat, transits et pauses interposés, prêt à rendre. */
  elements: ElementPlanning[];
  /** Par jour : heure de fin réelle, et si elle déborde sur la soirée. */
  journees: Array<{ finMinutes: number; finTardive: boolean }>;
};

/**
 * Déroule le programme jour par jour — horaires, trajets, pause déjeuner — et rapporte
 * l'heure de fin réelle de chaque journée.
 */
export function construirePlanning(
  days: Lieu[][],
  dureeKey: DureeKey,
  options: {
    mode?: TransportMode;
    heureDebutMinutes?: number;
    depart?: { lat: number; lng: number } | null;
  } = {}
): Planning {
  const { mode = "voiture", heureDebutMinutes = DEBUT_JOURNEE_MINUTES, depart = null } = options;
  const meta = DUREE_META[dureeKey];
  const elements: ElementPlanning[] = [];
  const journees: Planning["journees"] = [];

  let timeMinutes = heureDebutMinutes;
  let prevLieu: Lieu | null = null;

  days.forEach((day, dayIndex) => {
    let lunchInserted = !meta.lunchBreak;
    day.forEach((lieu, stopIndex) => {
      if (prevLieu) {
        const transit = travelMinutes(prevLieu, lieu, mode);
        elements.push({ type: "transit", minutes: transit });
        timeMinutes += transit;
      } else if (dayIndex === 0 && stopIndex === 0 && depart) {
        const transit = travelMinutes(depart, lieu, mode);
        elements.push({ type: "transit", minutes: transit });
        timeMinutes += transit;
      }
      if (!lunchInserted && timeMinutes >= SEUIL_DEJEUNER_MINUTES) {
        elements.push({ type: "lunch" });
        timeMinutes += LUNCH_BREAK_MINUTES;
        lunchInserted = true;
      }
      elements.push({ type: "stop", lieu, heure: formatTime(timeMinutes) });
      timeMinutes += parseVisitMinutes(lieu);
      prevLieu = lieu;
    });

    journees.push({
      finMinutes: timeMinutes,
      finTardive: timeMinutes > FIN_JOURNEE_RAISONNABLE_MINUTES,
    });

    if (dayIndex < days.length - 1) {
      elements.push({ type: "sleep", dayNum: dayIndex + 1 });
      timeMinutes = DEBUT_JOURNEE_MINUTES;
      prevLieu = null;
    }
  });

  return { elements, journees };
}

/**
 * Un lieu est-il fermé un jour donné, d'après les fermetures hebdomadaires connues de ses
 * activités ? Renvoie `null` — statut inconnu — quand l'information est absente ou ambiguë.
 */
export function lieuFermeCeJour(lieu: Lieu, date: Date): boolean | null {
  const connues = (lieu.activites || [])
    .map((a) => a.fermeJours)
    .filter((f): f is number[] => Array.isArray(f) && f.length > 0);
  if (connues.length === 0) return null;
  const jour = date.getDay();
  const fermes = connues.filter((f) => f.includes(jour)).length;
  if (fermes === connues.length) return true;
  if (fermes === 0) return false;
  return null;
}

/**
 * Estimation grossière du budget "entrées" d'une sélection pour le récapitulatif vivant
 * du Composer. `null` quand aucune activité payante n'a de prix analysable.
 */
export function estimerEntreesEuros(days: Lieu[][]): number | null {
  const bookings = buildBookingActivites(days);
  let total = 0;
  let trouve = false;
  for (const { activite } of bookings) {
    const m = /(\d+(?:[.,]\d+)?)/.exec(activite.prix);
    if (!m) continue;
    total += parseFloat(m[1].replace(",", "."));
    trouve = true;
  }
  return trouve ? Math.round(total) : null;
}

export function buildBookingActivites(days: Lieu[][]): Array<{ lieu: Lieu; activite: Activite }> {
  const seen = new Set<number>();
  const result: Array<{ lieu: Lieu; activite: Activite }> = [];
  for (const day of days) {
    for (const lieu of day) {
      for (const act of lieu.activites || []) {
        if (act.badge === "payant" && act.url && !seen.has(act.id)) {
          seen.add(act.id);
          result.push({ lieu, activite: act });
        }
      }
    }
  }
  return result;
}
