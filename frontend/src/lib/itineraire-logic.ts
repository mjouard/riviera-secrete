import type { Lieu, Activite } from "./types";

/** Durée d'une pause déjeuner réservée sur les journées complètes (pas sur une demi-journée). */
export const LUNCH_BREAK_MINUTES = 75;

export const DUREE_META = {
  "demi-journee": { label: "Demi-journée", dayBudgets: [240], lunchBreak: false },
  journee: { label: "Journée", dayBudgets: [480], lunchBreak: true },
  "2-jours": { label: "2 jours", dayBudgets: [480, 480], lunchBreak: true },
  "3-jours": { label: "3 jours", dayBudgets: [480, 480, 480], lunchBreak: true },
} as const;

export type DureeKey = keyof typeof DUREE_META;

export function parseVisitMinutes(lieu: Lieu): number {
  const pill = (lieu.metaPills || []).find((p) => /urée/.test(p.label));
  const val = pill ? pill.valeur || "" : "";
  if (/journée/i.test(val)) return /demi/i.test(val) ? 240 : 480;
  const nums: number[] = [];
  const re = /(\d+)\s*h(?:\s*(\d+))?|(\d+)\s*min/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(val))) {
    nums.push(m[3] ? parseInt(m[3], 10) : parseInt(m[1], 10) * 60 + (m[2] ? parseInt(m[2], 10) : 0));
  }
  if (!nums.length) return 90;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
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

export function travelMinutes(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  return Math.round((haversineKm(a, b) / 35) * 60 + 10);
}

export function generateItineraire(candidates: Lieu[], dureeKey: DureeKey): { days: Lieu[][]; excluded: Lieu[] } {
  if (!candidates.length) return { days: [], excluded: [] };
  const meta = DUREE_META[dureeKey];
  const pool = candidates.slice();
  const days: Lieu[][] = [];
  let currentPos = pool.reduce((a, b) => (b.lng > a.lng ? b : a));

  const numDays = meta.dayBudgets.length;
  for (let d = 0; d < numDays && pool.length; d++) {
    // Répartit le pool restant à parts égales sur les jours restants, plutôt que de tout
    // entasser sur les premiers jours dès que ça tient dans leur budget horaire — sinon un
    // itinéraire "2 jours"/"3 jours" avec peu de lieux sélectionnés ne produit qu'un seul
    // jour rempli et des jours suivants vides (jamais générés).
    const remainingDays = numDays - d;
    const targetCount = Math.ceil(pool.length / remainingDays);
    // Réserve le temps de la pause déjeuner sur le budget du jour, pour ne pas enchaîner
    // 8h de visites/trajets sans respirer.
    let budget = meta.dayBudgets[d] - (meta.lunchBreak ? LUNCH_BREAK_MINUTES : 0);
    const day: Lieu[] = [];
    while (pool.length && day.length < targetCount) {
      // Choisit le prochain arrêt géographiquement le plus proche (trajet le plus court),
      // pas celui dont le coût total (trajet + visite) est le plus faible — sinon
      // l'algorithme peut préférer un lieu lointain à visite rapide à un lieu tout proche
      // à visite plus longue, ce qui crée des trajets incohérents (détours, allers-retours).
      // Le coût combiné ne sert qu'à vérifier que l'arrêt rentre dans le budget du jour.
      let best: Lieu | null = null;
      let bestTravel = Infinity;
      for (const cand of pool) {
        const travel = travelMinutes(currentPos, cand);
        if (travel < bestTravel) { bestTravel = travel; best = cand; }
      }
      const cost = bestTravel + parseVisitMinutes(best!);
      if (cost > budget && day.length > 0) break;
      pool.splice(pool.indexOf(best!), 1);
      day.push(best!);
      budget -= cost;
      currentPos = best!;
    }
    days.push(day);
  }
  return { days, excluded: pool };
}

export function formatTime(minutesSinceMidnight: number): string {
  const rounded = Math.round(minutesSinceMidnight / 5) * 5;
  const h = Math.floor(rounded / 60) % 24;
  const m = rounded % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatTransitDesc(minutes: number): string {
  if (minutes < 60) return `~${minutes} min de trajet estimé`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `~${h} h ${m} min de trajet estimé` : `~${h} h de trajet estimé`;
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
