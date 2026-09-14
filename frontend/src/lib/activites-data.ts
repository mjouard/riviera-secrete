import type { Activite, Lieu } from "./types";
import { parseDureeTexte } from "./itineraire-logic";
import { normalizeSearch } from "./utils";

/**
 * Aplatit les activités de tous les lieux et en dérive de quoi les filtrer.
 *
 * Les 208 activités portent la donnée la plus actionnable du site — nom, durée, prix,
 * horaires, lien de réservation — mais elles n'étaient atteignables qu'en ouvrant les
 * 43 fiches lieu une par une. Ce module est la couche de dérivation qui rend la page
 * `/activites` possible sans toucher au modèle de données.
 */

export type CategorieActivite = "outdoor" | "culture" | "gastronomie" | "loisirs";

export const CATEGORIES_ACTIVITE: { slug: CategorieActivite; emoji: string }[] = [
  { slug: "outdoor", emoji: "🥾" },
  { slug: "culture", emoji: "🏛" },
  { slug: "gastronomie", emoji: "🍽️" },
  { slug: "loisirs", emoji: "⛵" },
];

/**
 * Classement par mots-clés du **nom français** (champ canonique, jamais `nomEn`).
 *
 * L'ordre compte : il fait office de priorité quand un nom touche plusieurs familles.
 * « Déjeuner à la plage » est d'abord un déjeuner ; « Location de kayak » d'abord une
 * location. Les règles couvrent les 208 activités existantes — vérifié, zéro non classée —
 * mais une activité future dont le nom ne déclenche rien retombe sur `culture`, la famille
 * la plus large, plutôt que de disparaître des filtres.
 */
const REGLES_CATEGORIE: { categorie: CategorieActivite; motif: RegExp }[] = [
  {
    categorie: "gastronomie",
    motif: /dejeuner|diner|restaurant|bistrot|brasserie|table|cave|degustation|glacier|marche|gouter|aperitif|chez |auberge|vin|cuisine|patisserie|fromag/,
  },
  {
    categorie: "loisirs",
    motif: /location|kayak|paddle|bateau|croisiere|voilier|parapente|plongee|snorkeling|traversee|navette|jet-ski|catamaran|velo|vtt|via ferrata|escalade|canyon|accrobranche|golf/,
  },
  {
    categorie: "outdoor",
    motif: /randonnee|balade|promenade|chemin|sentier|baignade|plage|crique|calanque|littoral|gorges|cascade|mont |montee|escalier|panorama|point de vue|parc |jardin|nature|sommet|pic |col |lac|etang|source|foret|oliveraie|belvedere/,
  },
  {
    categorie: "culture",
    motif: /musee|visite|eglise|chateau|chapelle|village|vieux|vieille|medieval|rempart|atelier|place |siecle|picasso|fondation|villa|citadelle|monument|cathedrale|abbaye|monastere|fort|tour |phare|cimetiere|galerie|expo|artisan|verrerie|parfum|distillerie|savonnerie|poterie|ceramique|festival|palais|rocher|colonne|traces|centre |photographie/,
  },
];

export function categorieDeLActivite(activite: Activite): CategorieActivite {
  const nom = normalizeSearch(activite.nom);
  for (const { categorie, motif } of REGLES_CATEGORIE) {
    if (motif.test(nom)) return categorie;
  }
  return "culture";
}

export type TrancheDuree = "court" | "moyen" | "long" | "journee";

/** Bornes hautes (incluses) de chaque tranche, en minutes. */
const TRANCHES: { slug: TrancheDuree; maxMinutes: number }[] = [
  { slug: "court", maxMinutes: 59 },
  { slug: "moyen", maxMinutes: 120 },
  { slug: "long", maxMinutes: 240 },
  { slug: "journee", maxMinutes: Infinity },
];

export function trancheDeDuree(minutes: number | null): TrancheDuree | null {
  if (minutes === null) return null;
  return TRANCHES.find((t) => minutes <= t.maxMinutes)!.slug;
}

/**
 * `linkText` n'a pas de colonne traduite : le libellé du lien de réservation est l'un des
 * trois seuls du jeu de données, donc on le mappe vers une clé i18n plutôt que d'ajouter une
 * colonne `linkTextEn` à remplir 208 fois. Repli sur `reserver` pour tout libellé inconnu —
 * mieux vaut un bouton correct en anglais qu'une chaîne française sur `/en`.
 */
export function cleLinkText(
  linkText: string | null | undefined
): "reserver" | "verifierHoraires" | "enSavoirPlus" | "voirLesOffres" {
  if (linkText === "En savoir plus →") return "enSavoirPlus";
  if (linkText === "Vérifier les horaires →") return "verifierHoraires";
  // « Voir les offres » et non « Réserver » pour les liens qui atterrissent sur le
  // catalogue d'une ville plutôt que sur l'activité nommée : le bouton doit décrire ce qui
  // va réellement se passer. Quinze activités sont dans ce cas.
  if (linkText === "Voir les offres →") return "voirLesOffres";
  return "reserver";
}

export interface ActiviteEnrichie {
  activite: Activite;
  lieu: Lieu;
  categorie: CategorieActivite;
  /** `null` quand la durée annoncée n'est pas interprétable — on ne l'invente pas. */
  minutes: number | null;
  tranche: TrancheDuree | null;
  gratuite: boolean;
  /**
   * Jours de fermeture connus (0 = dimanche). Vide = **on ne sait pas**, pas « ouvert tous
   * les jours » : seules 10 activités sur 208 renseignent ce champ aujourd'hui.
   */
  fermeJours: number[];
  /** Texte cherché par la recherche libre, déjà normalisé (accents et casse retirés). */
  recherche: string;
}

export function enrichirActivites(lieux: Lieu[]): ActiviteEnrichie[] {
  const out: ActiviteEnrichie[] = [];
  for (const lieu of lieux) {
    for (const activite of lieu.activites || []) {
      const minutes = parseDureeTexte(activite.duree || "");
      out.push({
        activite,
        lieu,
        categorie: categorieDeLActivite(activite),
        minutes,
        tranche: trancheDeDuree(minutes),
        gratuite: activite.badge === "gratuit",
        fermeJours: activite.fermeJours || [],
        recherche: normalizeSearch(
          [activite.nom, activite.nomEn, lieu.nom, lieu.nomEn, lieu.commune]
            .filter(Boolean)
            .join(" ")
        ),
      });
    }
  }
  return out;
}
