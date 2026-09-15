import type { Lieu } from "./types";
import { normalizeSearch } from "./utils";

/**
 * Catégories dérivées des `metaPills` d'un lieu (saison / durée / niveau).
 *
 * Ces pills sont du **texte libre** rédigé à la main ("1 h 30 à 2 h avec le musée",
 * "Automne à printemps, éviter la chaleur estivale") — 46 valeurs distinctes sur 43 lieux.
 * Impossible de filtrer dessus tel quel : on en dérive donc des catégories par analyse.
 * Le classement des 46 valeurs a été vérifié une par une avant d'écrire ce module.
 *
 * On analyse toujours `valeur` (le français, toujours présent) et jamais `valeurEn` :
 * c'est le champ canonique, la traduction anglaise n'est qu'un affichage.
 */

export const SAISONS = ["printemps", "ete", "automne", "hiver"] as const;
export const DUREES = ["court", "moyen", "long", "demi-journee"] as const;
export const NIVEAUX = ["facile", "modere"] as const;

/**
 * Vocabulaire figé de `Lieu.tags` (Lot 3, ROADMAP § Lot 3 § 1.1) — jamais dérivé de la
 * commune, toujours propre au lieu. `emoji` reste ici en JS (même bord que `BADGE_DEFS`
 * dans home-data.ts) ; le libellé traduit vient de `messages/*.json`'s `tags` namespace.
 */
export const TAG_DEFS: { slug: string; emoji: string }[] = [
  { slug: "village", emoji: "🏘️" },
  { slug: "sentier", emoji: "🥾" },
  { slug: "crique", emoji: "🏖️" },
  { slug: "jardin", emoji: "🌿" },
  { slug: "monument", emoji: "🏛️" },
  { slug: "panorama", emoji: "🌄" },
  { slug: "table", emoji: "🍽️" },
];
export const TAGS_LIEU = TAG_DEFS.map((t) => t.slug);

export type Saison = (typeof SAISONS)[number];
export type Duree = (typeof DUREES)[number];
export type Niveau = (typeof NIVEAUX)[number];
export type TagLieu = (typeof TAGS_LIEU)[number];

const MOIS: Record<string, number> = {
  janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12,
};

const saisonDuMois = (m: number): Saison =>
  m <= 2 || m === 12 ? "hiver" : m <= 5 ? "printemps" : m <= 8 ? "ete" : "automne";

function pill(lieu: Lieu, re: RegExp): string {
  return (lieu.metaPills ?? []).find((p) => re.test(p.label))?.valeur ?? "";
}

/**
 * Un lieu praticable toute l'année ressort sur les quatre saisons : le filtre doit le
 * proposer quel que soit le mois choisi par le visiteur.
 */
export function saisonsDuLieu(lieu: Lieu): Saison[] {
  const s = normalizeSearch(pill(lieu, /saison/i));
  if (!s) return [];
  if (/toute l'annee/.test(s)) return [...SAISONS];

  const out = new Set<Saison>();
  if (/\bprintemps\b/.test(s)) out.add("printemps");
  // Pas de mot-clé "estival" : sa seule occurrence dans les données est une négation
  // ("éviter la chaleur estivale"), le retenir classait le lieu en été à contresens.
  if (/\bete\b/.test(s)) out.add("ete");
  if (/\bautomne\b/.test(s)) out.add("automne");
  if (/\bhiver\b/.test(s)) out.add("hiver");

  // Plage de mois : "Avril à octobre", "Février-mars".
  const noms = Object.keys(MOIS).join("|");
  const plage = s.match(new RegExp(`(${noms})\\s*(?:a|-|–)\\s*(${noms})`));
  if (plage) {
    const debut = MOIS[plage[1]];
    const fin = MOIS[plage[2]];
    for (let i = 0; i < 12; i++) {
      const m = ((debut - 1 + i) % 12) + 1;
      out.add(saisonDuMois(m));
      if (m === fin) break;
    }
  }

  // Plage de saisons : "Automne à printemps".
  const ps = s.match(/(printemps|ete|automne|hiver)\s*(?:a|-|–)\s*(printemps|ete|automne|hiver)/);
  if (ps) {
    const a = SAISONS.indexOf(ps[1] as Saison);
    const b = SAISONS.indexOf(ps[2] as Saison);
    if (a >= 0 && b >= 0) {
      for (let i = 0; i < SAISONS.length; i++) {
        const idx = (a + i) % SAISONS.length;
        out.add(SAISONS[idx]);
        if (idx === b) break;
      }
    }
  }
  return [...out];
}

/** Borne haute de la durée annoncée, en minutes — c'est ce qu'il faut réellement prévoir. */
function dureeMaxMinutes(valeur: string): number {
  const s = valeur.toLowerCase();
  let max = 0;
  for (const m of s.matchAll(/(\d+)\s*h\s*(\d{2})?/g)) {
    max = Math.max(max, Number(m[1]) * 60 + (m[2] ? Number(m[2]) : 0));
  }
  for (const m of s.matchAll(/(\d+)\s*min/g)) max = Math.max(max, Number(m[1]));
  // "2 à 3 h" / "2h-3h" : le second nombre s'exprime en heures.
  for (const m of s.matchAll(/(\d+)\s*(?:à|-|–)\s*(\d+)\s*h/g)) max = Math.max(max, Number(m[2]) * 60);
  return max;
}

export function dureeDuLieu(lieu: Lieu): Duree | null {
  const valeur = pill(lieu, /dur[ée]e/i);
  if (!valeur) return null;
  // "Demi-journée" vient du mot-clé explicite et non d'un seuil : "2 à 4 h" est une longue
  // sortie, pas un programme de demi-journée.
  if (/demi-journ[ée]e|journ[ée]e/i.test(valeur)) return "demi-journee";
  const minutes = dureeMaxMinutes(valeur);
  if (!minutes) return null;
  if (minutes <= 60) return "court";
  if (minutes <= 120) return "moyen";
  return "long";
}

/** "Facile à modéré" compte dans les deux catégories, volontairement. */
export function niveauxDuLieu(lieu: Lieu): Niveau[] {
  const s = normalizeSearch(pill(lieu, /niveau/i));
  const out: Niveau[] = [];
  if (/facile/.test(s)) out.push("facile");
  if (/moder/.test(s)) out.push("modere");
  return out;
}
