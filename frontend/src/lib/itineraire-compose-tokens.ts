"use client";

/**
 * Persistance locale des `EditToken` des itinéraires composés créés depuis ce navigateur
 * (Lot 4d — brique "brancher la création"). `localStorage`, pas `sessionStorage`
 * (`lib/brouillon-itineraire.ts`, portée volontairement session) : un créateur doit pouvoir
 * revenir modifier son lien plusieurs jours après, pas seulement dans le même onglet.
 *
 * Le token n'est jamais renvoyé par `GET /api/itineraires-composes/{id}` (public) — c'est ce
 * qui permet à `/i/[id]` de savoir localement "je suis l'auteur de ce lien-ci" sans backend
 * dédié : présence d'une entrée ici pour cet id.
 */
const PREFIXE_CLE = "itineraire-compose:edit-token:";

export function lireEditToken(id: string): string | null {
  try {
    return localStorage.getItem(PREFIXE_CLE + id);
  } catch {
    return null;
  }
}

export function ecrireEditToken(id: string, token: string) {
  try {
    localStorage.setItem(PREFIXE_CLE + id, token);
  } catch {
    // Stockage indisponible (navigation privée…) : le lien reste utilisable, seule la
    // détection "je suis l'auteur" sur ce navigateur est perdue.
  }
}

export function oublierEditToken(id: string) {
  try {
    localStorage.removeItem(PREFIXE_CLE + id);
  } catch {
    // rien à faire de plus
  }
}
