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
 * Libellé du bouton d'action d'une activité (Lot 3, ROADMAP § Lot 3 § 1.3) — remplace
 * l'ancien `cleLinkText`/`Activite.linkText`, texte libre à trois variantes qui avait fini
 * par dériver du sens réel du lien. `lienType` est un vocabulaire fermé à deux valeurs
 * écrit à la main pour chacune des 208 activités : `"reservation"` seulement si l'URL mène
 * à la page de réservation de cette activité précise, `"officiel"` sinon.
 */
export function cleLienType(
  lienType: string | null | undefined
): "reserver" | "siteOfficiel" {
  return lienType === "officiel" ? "siteOfficiel" : "reserver";
}

/** `rel` du lien d'action — un lien partenaire impose `sponsored nofollow` (Lot 3 § 1.3). */
export function relActivite(partenaire: boolean): string {
  return partenaire ? "noopener noreferrer sponsored nofollow" : "noopener noreferrer";
}

/**
 * Commune où se pratique réellement une activité, à afficher seulement quand elle diffère
 * du lieu qui la porte (Lot 3 § 1.2 — corrige DC-02 : « Sortie kayak de mer · La Rue
 * Obscure » laissait croire qu'on fait du kayak dans une rue couverte du XIIIe siècle).
 * `null` quand l'activité se pratique bien sur place (`surPlace === true`) : rien à
 * corriger dans ce cas, l'affichage actuel ne ment pas.
 *
 * Résout via le nom déjà connu du lieu porteur quand `communeSlug` pointe sur sa propre
 * commune — le seul cas rencontré dans les 208 activités actuelles (voir data/lieux.json).
 * Sinon replie sur le slug mis en forme : imparfait pour un nom composé irrégulier
 * (« Villefranche-Sur-Mer » plutôt que « Villefranche-sur-Mer »), mais aucune activité
 * existante n'emprunte ce chemin aujourd'hui — à corriger avec de vraies données de commune
 * (ex. `api.villes.list()`) si un jour `communeSlug` diverge du lieu porteur.
 */
export function communeActivite(activite: Activite, lieu: Lieu): string | null {
  if (activite.surPlace || !activite.communeSlug) return null;
  if (activite.communeSlug === lieu.villeSlug) return lieu.commune;
  return activite.communeSlug
    .split("-")
    .map((mot) => (mot ? mot.charAt(0).toUpperCase() + mot.slice(1) : mot))
    .join("-");
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
