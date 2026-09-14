"use client";

/**
 * Refonte UI Lot 2 — persistance de la sélection en cours du créateur d'itinéraire.
 *
 * L'URL seule ne suffit pas à corriger PR-02 (« Ajouter à un itinéraire » efface le lieu
 * précédent). Chaque clic depuis une fiche lieu est un `router.push` vers
 * `/creer-itineraire?add=<slug>` : la page est **remontée**, et la sélection précédente
 * vivait uniquement dans la mémoire d'une page qui n'existe plus. Deux ajouts faits depuis
 * deux fiches différentes, sans repasser par le créateur entre les deux, n'ont aucune URL
 * commune où s'accumuler.
 *
 * D'où ce relais en `sessionStorage` : le créateur y écrit sa sélection à chaque changement,
 * et la relit au montage pour y fusionner le `?add=` entrant. L'URL (`?lieux=`) reste la
 * source partageable et rechargeable ; `sessionStorage` est ce qui traverse les navigations.
 * Portée session volontairement : un brouillon n'a pas à survivre à la fermeture de l'onglet.
 */
const CLE_SELECTION = "creer-itineraire:selection";

/** Toutes les lectures/écritures sont gardées : `sessionStorage` jette en navigation privée. */
export function lireSelectionPersistee(): string[] {
  try {
    const brut = sessionStorage.getItem(CLE_SELECTION);
    if (!brut) return [];
    const parsed: unknown = JSON.parse(brut);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function ecrireSelectionPersistee(slugs: string[]) {
  try {
    sessionStorage.setItem(CLE_SELECTION, JSON.stringify(slugs));
  } catch {
    // Stockage indisponible : on perd seulement le cumul entre deux fiches, l'URL reste.
  }
}
