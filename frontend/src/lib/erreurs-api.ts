/**
 * Traduction des erreurs renvoyées par l'API.
 *
 * Le backend répond en français uniquement : ses messages `error` sont écrits en dur, utiles
 * pour un appel direct (curl, journaux) mais impossibles à afficher tels quels sur `/en` —
 * c'était la dernière source de français sur le site anglais. Chaque erreur porte donc aussi
 * un `code` machine, que l'interface traduit.
 *
 * Repli volontaire sur un message générique plutôt que sur le `error` du backend : un code
 * ajouté côté API sans sa traduction ici doit donner une phrase correcte dans la langue du
 * visiteur, pas une phrase française. On perd un peu de précision, on ne régresse jamais.
 */

/** Codes connus, alignés sur ceux de `backend/RivieraSecrete.Api/Program.cs`. */
export const CODES_ERREUR = [
  "trop_de_tentatives",
  "email_invalide",
  "nom_requis",
  "trop_court",
  "trop_long",
  "email_deja_pris",
  "identifiants_invalides",
  "email_not_confirmed",
  "token_invalide",
  "token_expire",
  "slug_invalide",
  "lieu_inconnu",
] as const;

export type CodeErreur = (typeof CODES_ERREUR)[number];

const CONNUS = new Set<string>(CODES_ERREUR);

export function estCodeConnu(code: unknown): code is CodeErreur {
  return typeof code === "string" && CONNUS.has(code);
}

/**
 * Extrait le code d'une réponse d'erreur de l'API, ou `null` s'il n'y en a pas
 * d'exploitable. L'appelant traduit via `useTranslations("erreursApi")`.
 */
export function codeErreur(corps: unknown): CodeErreur | null {
  if (!corps || typeof corps !== "object") return null;
  const code = (corps as { code?: unknown }).code;
  return estCodeConnu(code) ? code : null;
}
