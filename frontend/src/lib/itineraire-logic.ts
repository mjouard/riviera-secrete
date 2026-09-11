import type { Lieu, Activite } from "./types";

export const STORAGE_KEY = "riviera-secrete:itineraires-custom";

export const DUREE_META = {
  "demi-journee": { label: "Demi-journée", dayBudgets: [240] },
  journee: { label: "Journée", dayBudgets: [480] },
  "2-jours": { label: "2 jours", dayBudgets: [480, 480] },
  "3-jours": { label: "3 jours", dayBudgets: [480, 480, 480] },
} as const;

export type DureeKey = keyof typeof DUREE_META;

export const BADGE_DEFS: Record<string, { icon: string; label: string }> = {
  plage: { icon: "🏖️", label: "Plage" },
  randonnee: { icon: "🥾", label: "Randonnée" },
  vtt: { icon: "🚵", label: "VTT" },
  plongee: { icon: "🤿", label: "Plongée" },
  restaurant: { icon: "🍽️", label: "Restaurant" },
};

export const REGION_ORDER = [
  "menton-monaco",
  "nice",
  "arriere-pays",
  "antibes-cannes",
  "golfe-st-tropez",
];

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

  for (let d = 0; d < meta.dayBudgets.length && pool.length; d++) {
    let budget = meta.dayBudgets[d];
    const day: Lieu[] = [];
    while (pool.length) {
      let best: Lieu | null = null;
      let bestCost = Infinity;
      for (const cand of pool) {
        const cost = travelMinutes(currentPos, cand) + parseVisitMinutes(cand);
        if (cost < bestCost) { bestCost = cost; best = cand; }
      }
      if (bestCost > budget && day.length > 0) break;
      pool.splice(pool.indexOf(best!), 1);
      day.push(best!);
      budget -= bestCost;
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

export interface SavedItineraire {
  id: string;
  nom: string;
  dureeKey: DureeKey;
  days: string[][];
  createdAt: string;
}

export function listSaved(): SavedItineraire[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") || []; }
  catch { return []; }
}

export function getSaved(id: string): SavedItineraire | null {
  return listSaved().find((it) => it.id === id) || null;
}

export function saveItineraire({ id, nom, dureeKey, days }: { id: string | null; nom: string; dureeKey: DureeKey; days: Lieu[][] }): string {
  const all = listSaved();
  const daySlugs = days.map((day) => day.map((l) => l.slug));
  const idx = id ? all.findIndex((it) => it.id === id) : -1;
  const finalId = id || crypto.randomUUID();
  const entry: SavedItineraire = {
    id: finalId, nom, dureeKey, days: daySlugs,
    createdAt: idx >= 0 ? all[idx].createdAt : new Date().toISOString(),
  };
  if (idx >= 0) all[idx] = entry; else all.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return finalId;
}

export function deleteSaved(id: string): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(listSaved().filter((it) => it.id !== id)));
}
