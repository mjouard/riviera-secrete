/**
 * Rétablit l'unité omise sur la borne basse d'une fourchette : « 2 à 4 h » → « 2 h à 4 h »,
 * « 15-20 min » → « 15 min-20 min ».
 */
function completeUnitesFourchette(val: string): string {
  return val.replace(
    /(h\s*)?(\d+)\s*(à|-|–)\s*(\d+)\s*(h|min)\b/gi,
    (tout, apresHeure: string | undefined, basse: string, sep: string, haute: string, unite: string) =>
      apresHeure ? tout : `${basse} ${unite} ${sep} ${haute} ${unite}`
  );
}

/**
 * Convertit une durée écrite en toutes lettres en minutes.
 * Renvoie `null` quand rien n'est reconnaissable.
 * Analyse toujours le libellé français (champ canonique).
 */
export function parseDureeTexte(val: string): number | null {
  if (/journée/i.test(val)) return /demi/i.test(val) ? 240 : 480;
  const nums: number[] = [];
  const re = /(\d+)\s*h(?:\s*(\d+))?|(\d+)\s*min/gi;
  let m: RegExpExecArray | null;
  const normalise = completeUnitesFourchette(val);
  while ((m = re.exec(normalise))) {
    nums.push(m[3] ? parseInt(m[3], 10) : parseInt(m[1], 10) * 60 + (m[2] ? parseInt(m[2], 10) : 0));
  }
  if (!nums.length) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

/**
 * Formateur de durée unique du site — sous l'heure arrondi à 5 min, au-delà arrondi
 * au quart d'heure avec notation heures + minutes. Jamais de décimale ni de `~`.
 */
export function formatDuree(minutes: number): string {
  if (minutes < 60) {
    const arrondi = Math.max(5, Math.round(minutes / 5) * 5);
    if (arrondi < 60) return `${arrondi} min`;
    return "1 h";
  }
  const arrondi = Math.round(minutes / 15) * 15;
  const h = Math.floor(arrondi / 60);
  const m = arrondi % 60;
  return m ? `${h} h ${m}` : `${h} h`;
}

export function formatTransitDesc(minutes: number, locale: string = "fr"): string {
  const suffix = locale === "en" ? "estimated travel time" : "de trajet estimé";
  return `${formatDuree(minutes)} ${suffix}`;
}

export function formatTime(minutesSinceMidnight: number): string {
  const rounded = Math.round(minutesSinceMidnight / 5) * 5;
  const h = Math.floor(rounded / 60) % 24;
  const m = rounded % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * "HH:MM" → minutes depuis minuit ("08:30" → 510).
 * `null` si le format ne correspond pas — l'appelant retombe sur `DEBUT_JOURNEE_MINUTES`.
 */
export function parseHeureMinutes(heure: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(heure.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}
