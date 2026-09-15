"use client";

import { useSyncExternalStore } from "react";

/**
 * "Maintenant", côté client uniquement — un seul hook, réutilisé partout où le site a besoin
 * de l'horloge du visiteur plutôt que de celle du serveur.
 *
 * Sortait déjà en double avant ce fichier : `FermeAujourdhui.tsx` avait sa propre version
 * (jour de la semaine seul) pour la raison suivante, qui vaut pour tout usage de `new Date()`
 * dans ce projet — un `new Date()` lu pendant le rendu serait figé dans le HTML d'une page ISR
 * (`revalidate: 3600`) et resterait faux pendant jusqu'à une heure pour tout le monde, pas
 * seulement au premier chargement. `useSyncExternalStore` expose nativement un instantané
 * serveur distinct (`null`, donc rien affiché tant que le client n'a pas pris le relais) de
 * l'instantané client, ce qui règle la discordance d'hydratation sans `setState` dans un effet.
 *
 * Le générateur d'itinéraire (`/composer`) en a besoin pour préremplir la date de voyage par
 * défaut à "aujourd'hui" sans figer cette valeur dans le cache — voir ComposerParamsBar.tsx.
 */
const neJamaisResouscrire = () => () => {};
const maintenantServeur = () => null;

export function useAujourdhui(): Date | null {
  // `() => new Date()` : une nouvelle instance par appel plutôt qu'un `Date` constant capturé
  // au chargement du module, sans quoi la valeur ne changerait plus jamais après le premier
  // rendu client (utile si l'onglet reste ouvert à cheval sur minuit — cas rare mais gratuit
  // à couvrir ici).
  return useSyncExternalStore(neJamaisResouscrire, () => new Date(), maintenantServeur);
}

/** "2026-09-19", pour un input `type="date"` — format ISO local, jamais UTC (`toISOString`
 * décale à minuit près du fuseau horaire, ce qui affichait parfois la veille). */
export function dateISOLocale(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
