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
 *
 * **Piège corrigé** (trouvé en vérifiant /composer dans le navigateur — React plantait avec
 * "The result of getSnapshot should be cached to avoid an infinite loop") : `getSnapshot` doit
 * renvoyer une référence **stable** entre deux appels tant que rien n'a changé, or
 * `() => new Date()` en fabriquait une neuve à chaque appel. `useSyncExternalStore` compare les
 * instantanés par `Object.is` ; deux `Date` neuves ne sont jamais `===`, donc React re-render en
 * boucle. Ce bug touchait déjà tout usage de `FermeAujourdhui` sans prop `date` (le cas par
 * défaut), pas seulement /composer, simplement aucune page ne l'avait fait crasher fort avant.
 * Fix : un instantané mis en cache au niveau module, rafraîchi par un minuteur plutôt qu'à
 * chaque rendu — couvre toujours le cas "onglet ouvert à cheval sur minuit" (comme avant), à une
 * minute de latence près, sans violer le contrat de `useSyncExternalStore`.
 */
const abonnes = new Set<() => void>();
let instantane = new Date();
let minuteur: ReturnType<typeof setInterval> | null = null;

function sAbonner(cb: () => void) {
  abonnes.add(cb);
  if (minuteur === null) {
    minuteur = setInterval(() => {
      instantane = new Date();
      abonnes.forEach((c) => c());
    }, 60_000);
  }
  return () => {
    abonnes.delete(cb);
    if (abonnes.size === 0 && minuteur !== null) {
      clearInterval(minuteur);
      minuteur = null;
    }
  };
}
const getSnapshot = () => instantane;
const maintenantServeur = () => null;

export function useAujourdhui(): Date | null {
  return useSyncExternalStore(sAbonner, getSnapshot, maintenantServeur);
}

/** "2026-09-19", pour un input `type="date"` — format ISO local, jamais UTC (`toISOString`
 * décale à minuit près du fuseau horaire, ce qui affichait parfois la veille). */
export function dateISOLocale(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
