/**
 * Encode/décode la répartition par jour dans l'URL, pour partager un itinéraire composé
 * sans compte ni backend.
 *
 * Format lisible (`slugA,slugB|slugC`) plutôt que du base64 : les slugs sont déjà URL-safe,
 * l'URL reste compréhensible et débogable à l'œil, et un lien tronqué se diagnostique.
 */
export const SEPARATEUR_JOUR = "|";

export function encodeJours(days: { slug: string }[][]): string {
  return days
    .map((jour) => jour.map((l) => l.slug).join(","))
    .join(SEPARATEUR_JOUR);
}

/**
 * Les slugs inconnus sont filtrés silencieusement (lieu renommé ou retiré depuis le
 * partage), et un jour devenu vide est conservé : supprimer le jour décalerait tous les
 * suivants, alors qu'une journée vide reste compréhensible et modifiable.
 */
export function decodeJours(param: string, slugsConnus: Set<string>): string[][] {
  return param
    .split(SEPARATEUR_JOUR)
    .map((jour) =>
      jour
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== "" && slugsConnus.has(s))
    );
}
