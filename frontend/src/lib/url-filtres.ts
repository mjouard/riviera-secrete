"use client";

import { useSyncExternalStore } from "react";

/**
 * Refonte UI Lot 2 — contrat d'URL des listes filtrées.
 *
 * L'URL est la **source de vérité** des filtres, pas une copie tenue à jour à côté d'un
 * `useState` : deux exemplaires du même état finissent toujours par diverger, et c'est
 * précisément ce qu'on vient corriger (un rechargement ou un lien partagé repartait de la
 * grille nue).
 *
 * `useSyncExternalStore` plutôt qu'un `useState` + effet de synchronisation : la page
 * d'accueil est prérendue statiquement (ISR 3600), donc les paramètres de recherche ne font
 * pas partie de ce qui est mis en cache — le HTML servi est le même pour toutes les valeurs,
 * et le client doit les adopter après hydratation. Ce hook expose nativement un instantané
 * serveur distinct (chaîne vide) du client, ce qui règle la discordance d'hydratation sans
 * `setState` dans un effet. Même raisonnement que `FermeAujourdhui.tsx`.
 *
 * `history.replaceState` et non `router.replace` : le filtrage est entièrement client, faire
 * retraverser le routeur de Next à chaque frappe n'apporterait rien. Conséquence assumée :
 * « Précédent » ne défait pas un filtre (aucune entrée empilée), il quitte la page.
 */

const abonnes = new Set<() => void>();

function sAbonner(cb: () => void) {
  abonnes.add(cb);
  window.addEventListener("popstate", cb);
  return () => {
    abonnes.delete(cb);
    window.removeEventListener("popstate", cb);
  };
}

const instantaneClient = () => window.location.search;
/** Côté serveur : aucune URL de requête connue, donc aucun filtre. */
const instantaneServeur = () => "";

/** Chaîne de recherche courante, re-rendue à chaque écriture ou retour d'historique. */
export function useSearchString(): string {
  return useSyncExternalStore(sAbonner, instantaneClient, instantaneServeur);
}

/**
 * Règle du spec : un état vide n'écrit jamais son paramètre (jamais `?saison=`), pour qu'une
 * vue non filtrée ait exactement la même URL que la page nue et reste donc une seule et même
 * entrée pour le cache et les moteurs.
 */
export function construireQuery(valeurs: Record<string, string>): string {
  const params = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(valeurs)) {
    if (valeur) params.set(cle, valeur);
  }
  const chaine = params.toString();
  return chaine ? `?${chaine}` : "";
}

/** Écrit les filtres dans l'URL et prévient les abonnés (le hook ci-dessus). */
export function ecrireFiltres(valeurs: Record<string, string>) {
  const query = construireQuery(valeurs);
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${query}${window.location.hash}`
  );
  abonnes.forEach((cb) => cb());
}

/**
 * Lit un paramètre en ne retenant que les valeurs du vocabulaire fourni — une URL bricolée à
 * la main (`?duree=nimportequoi`) ne doit pas installer un filtre inexistant et vider la
 * grille sans explication.
 */
export function lireParam<T extends string>(
  search: string,
  cle: string,
  valeursAutorisees: readonly T[]
): T | "" {
  const brut = new URLSearchParams(search).get(cle);
  if (!brut) return "";
  return (valeursAutorisees as readonly string[]).includes(brut) ? (brut as T) : "";
}

/** Variante texte libre (recherche) : aucune validation possible, on borne juste la longueur. */
export function lireTexte(search: string, cle: string, maxLongueur = 100): string {
  return (new URLSearchParams(search).get(cle) ?? "").slice(0, maxLongueur);
}
