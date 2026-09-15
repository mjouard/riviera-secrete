import type { Lieu, Activite } from "./types";

/** Durée d'une pause déjeuner réservée sur les journées complètes (pas sur une demi-journée). */
export const LUNCH_BREAK_MINUTES = 75;

export const DUREE_META = {
  "demi-journee": { label: "Demi-journée", dayBudgets: [240], lunchBreak: false },
  journee: { label: "Journée", dayBudgets: [480], lunchBreak: true },
  "2-jours": { label: "2 jours", dayBudgets: [480, 480], lunchBreak: true },
  "3-jours": { label: "3 jours", dayBudgets: [480, 480, 480], lunchBreak: true },
} as const;

export type DureeKey = keyof typeof DUREE_META;

/**
 * Encode/décode la répartition par jour dans l'URL, pour partager un itinéraire composé
 * sans compte ni backend.
 *
 * Format lisible (`slugA,slugB|slugC`) plutôt que du base64 : les slugs sont déjà URL-safe,
 * l'URL reste compréhensible et débogable à l'œil, et un lien tronqué se diagnostique.
 *
 * On partage l'**arrangement** et pas seulement la sélection (que `?add=` couvre déjà) :
 * l'ordre des étapes et leur répartition par jour sont justement ce que le visiteur a
 * ajusté à la main, et les régénérer ferait retomber sur l'algorithme glouton.
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

/**
 * Déduit la durée du créateur depuis le badge d'un itinéraire éditorial
 * ("6 étapes · 2 jours", "3 étapes · Journée complète") pour pré-sélectionner le bon
 * préréglage sur "Partir de cet itinéraire". Analyse le français (`badge`), jamais
 * `badgeEn` : c'est le champ canonique. Retombe sur "journee" si rien ne correspond —
 * le visiteur peut de toute façon changer, mieux vaut un préréglage plausible que rien.
 */
export function dureeKeyDepuisBadge(badge: string): DureeKey {
  const s = badge.toLowerCase();
  if (/3\s*jours/.test(s)) return "3-jours";
  if (/2\s*jours/.test(s)) return "2-jours";
  if (/demi-journ/.test(s)) return "demi-journee";
  return "journee";
}

/**
 * Rétablit l'unité omise sur la borne basse d'une fourchette : « 2 à 4 h » → « 2 h à 4 h »,
 * « 15-20 min » → « 15 min-20 min ».
 *
 * Sans ça, `parseVisitMinutes` ne voyait que la borne **haute** (son motif exige une unité),
 * donc toute fourchette écrite de cette façon était surestimée — « 2 à 4 h » comptait pour
 * 4 h au lieu de 3 h. Les formes « 1 h 30 à 2 h », où les deux bornes portent leur unité,
 * étaient correctes, ce qui explique que le biais soit passé inaperçu. Il suffisait pourtant
 * à faire déborder les deux itinéraires « Journée complète » du budget et à leur faire
 * perdre des étapes à la génération.
 *
 * Le groupe optionnel `(h\s*)` en tête distingue une vraie borne basse des minutes d'une
 * heure composée : dans « 1 h 30 à 2 h », le « 30 » est précédé d'un « h » et ne doit surtout
 * pas devenir « 30 h ». On repère ce cas plutôt que d'utiliser un lookbehind, non disponible
 * sur la cible ES2017 de ce projet.
 */
function completeUnitesFourchette(val: string): string {
  return val.replace(
    /(h\s*)?(\d+)\s*(à|-|–)\s*(\d+)\s*(h|min)\b/gi,
    (tout, apresHeure: string | undefined, basse: string, sep: string, haute: string, unite: string) =>
      apresHeure ? tout : `${basse} ${unite} ${sep} ${haute} ${unite}`
  );
}

/**
 * Convertit une durée écrite en toutes lettres en minutes — « 1h30 », « 2h à 3h »,
 * « 20 min de vol », « 1h15–1h45 », « Demi-journée ». Une fourchette donne sa moyenne.
 *
 * Renvoie `null` quand rien n'est reconnaissable, pour que l'appelant décide quoi en faire :
 * le générateur d'itinéraire retombe sur une estimation par défaut, alors qu'un filtre de
 * durée doit pouvoir dire « on ne sait pas » plutôt que d'inventer une valeur et de ranger
 * l'activité dans la mauvaise tranche.
 *
 * Analyse toujours le libellé **français**, jamais sa traduction : c'est le champ canonique.
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

export function parseVisitMinutes(lieu: Lieu): number {
  const pill = (lieu.metaPills || []).find((p) => /urée/.test(p.label));
  // 90 min : estimation de repli quand la pastille est absente ou illisible. Le générateur a
  // besoin d'un nombre pour boucler, contrairement au filtre de durée de /activites.
  return parseDureeTexte(pill ? pill.valeur || "" : "") ?? 90;
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Refonte UI Lot 4c (Composer) — le bandeau de paramètres propose un mode de transport. */
export type TransportMode = "voiture" | "transport-commun";

/**
 * Vitesse moyenne et battement fixe par mode. Les deux restent des ordres de grandeur, pas un
 * calcul multimodal réel (pas d'horaires SNCF/Lignes d'Azur consultés) — "transport-commun"
 * suppose train + marche, plus lent et avec plus de battement (correspondance, marche d'accès
 * à la gare) que la voiture. Étiqueté comme estimation dans l'UI (`ComposerParamsBar`), jamais
 * présenté comme un horaire garanti.
 */
const VITESSE_KMH: Record<TransportMode, number> = { voiture: 35, "transport-commun": 20 };
const BATTEMENT_MINUTES: Record<TransportMode, number> = { voiture: 10, "transport-commun": 20 };

export function travelMinutes(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  mode: TransportMode = "voiture"
): number {
  return Math.round((haversineKm(a, b) / VITESSE_KMH[mode]) * 60 + BATTEMENT_MINUTES[mode]);
}

/**
 * `garderTous` : place **toutes** les étapes, même si la journée déborde du budget.
 *
 * Réservé au cas « Partir de cet itinéraire », où la sélection vient d'un itinéraire
 * éditorial. Un tel itinéraire est un choix humain, déjà équilibré à la main : l'algorithme
 * n'a pas à le censurer. Sans cette option il l'amputait silencieusement — `lerins-esterel`
 * passait de 3 étapes à 1, `villages-perches` de 5 à 3 — sans jamais dire au visiteur que ce
 * qu'il obtenait différait de la page qu'il venait de lire.
 *
 * Relever le budget ne suffisait pas : même à 600 min, les deux itinéraires « Journée
 * complète » dépassent (540 et 525 min de visites *avant* les trajets). L'honnêteté est donc
 * de tout garder et d'annoncer une journée dense, pas de prétendre que ça rentre.
 */
export function generateItineraire(
  candidates: Lieu[],
  dureeKey: DureeKey,
  options: { garderTous?: boolean; mode?: TransportMode } = {}
): { days: Lieu[][]; excluded: Lieu[] } {
  if (!candidates.length) return { days: [], excluded: [] };
  const { garderTous = false, mode = "voiture" } = options;
  const meta = DUREE_META[dureeKey];
  const pool = candidates.slice();
  const days: Lieu[][] = [];
  const restants: number[] = [];
  let currentPos = pool.reduce((a, b) => (b.lng > a.lng ? b : a));

  const numDays = meta.dayBudgets.length;
  for (let d = 0; d < numDays && pool.length; d++) {
    // Répartit le pool restant à parts égales sur les jours restants, plutôt que de tout
    // entasser sur les premiers jours dès que ça tient dans leur budget horaire — sinon un
    // itinéraire "2 jours"/"3 jours" avec peu de lieux sélectionnés ne produit qu'un seul
    // jour rempli et des jours suivants vides (jamais générés).
    const remainingDays = numDays - d;
    const targetCount = Math.ceil(pool.length / remainingDays);
    // Réserve le temps de la pause déjeuner sur le budget du jour, pour ne pas enchaîner
    // 8h de visites/trajets sans respirer.
    let budget = meta.dayBudgets[d] - (meta.lunchBreak ? LUNCH_BREAK_MINUTES : 0);
    const day: Lieu[] = [];
    while (pool.length && day.length < targetCount) {
      // Choisit le prochain arrêt géographiquement le plus proche (trajet le plus court),
      // pas celui dont le coût total (trajet + visite) est le plus faible — sinon
      // l'algorithme peut préférer un lieu lointain à visite rapide à un lieu tout proche
      // à visite plus longue, ce qui crée des trajets incohérents (détours, allers-retours).
      // Le coût combiné ne sert qu'à vérifier que l'arrêt rentre dans le budget du jour.
      let best: Lieu | null = null;
      let bestTravel = Infinity;
      for (const cand of pool) {
        const travel = travelMinutes(currentPos, cand, mode);
        if (travel < bestTravel) { bestTravel = travel; best = cand; }
      }
      const cost = bestTravel + parseVisitMinutes(best!);
      if (!garderTous && cost > budget && day.length > 0) break;
      pool.splice(pool.indexOf(best!), 1);
      day.push(best!);
      budget -= cost;
      currentPos = best!;
    }
    days.push(day);
    restants.push(budget);
  }

  // ── Seconde passe : replacer ce que la première a laissé de côté ────────────
  //
  // La coupure ci-dessus s'arrête au **premier** candidat qui ne rentre pas, or c'est le
  // plus proche géographiquement, pas le moins coûteux : un lieu suivant, plus court, aurait
  // pu tenir. `antibes-biot-juan` perdait ainsi une étape alors que sa journée se termine à
  // 17h55 pour un budget de 8 h. D'où cette passe, qui tente de replacer chaque exclu dans
  // la journée où il coûte le moins de trajet supplémentaire, tant qu'il y reste du budget.
  //
  // Elle explique aussi le message « N lieux non inclus faute de temps », que l'audit jugeait
  // à raison peu crédible : il s'affichait sur des journées finissant vers 16h.
  if (!garderTous) {
    // Le budget de `DUREE_META` est un repère de planification, pas une limite dure : il
    // fixe une journée type de 9h à 17h. S'arrêter pile dessus faisait écarter une étape à
    // quinze minutes près, sur une journée qui se terminait à 15h10. On tolère donc un quart
    // de budget en plus — une journée complète peut finir vers 19h, une demi-journée vers
    // 14h — et c'est l'avertissement « journée dense », exprimé à l'horloge, qui prend le
    // relais au-delà plutôt qu'un retrait silencieux.
    const avecTolerance = restants.map(
      (r, d) => r + Math.round(meta.dayBudgets[d] * TOLERANCE_JOURNEE)
    );
    placerLesRestants(pool, days, avecTolerance, mode);
  }

  return { days, excluded: pool };
}

/**
 * Insère les lieux non placés là où ils tiennent, en mutant `days`, `restants` et `pool`.
 *
 * Pour chaque candidat on essaie toutes les positions de toutes les journées et on retient
 * celle qui ajoute le moins de trajet — insérer entre deux arrêts voisins coûte souvent bien
 * moins que de rallonger la fin de journée. On boucle tant qu'un placement a réussi : caser
 * un lieu peut raccourcir le détour d'un autre.
 */
function placerLesRestants(pool: Lieu[], days: Lieu[][], restants: number[], mode: TransportMode = "voiture"): void {
  let placeAuMoinsUn = true;
  while (pool.length && placeAuMoinsUn) {
    placeAuMoinsUn = false;

    for (let i = 0; i < pool.length; i++) {
      const lieu = pool[i];
      const visite = parseVisitMinutes(lieu);
      let meilleur: { jour: number; position: number; surcout: number } | null = null;

      for (let j = 0; j < days.length; j++) {
        const jour = days[j];
        if (jour.length === 0) continue; // une journée vide n'a pas d'ancrage géographique

        for (let k = 0; k <= jour.length; k++) {
          // Surcoût de trajet réel de l'insertion : ce qu'on ajoute, moins le tronçon
          // qu'on remplace. En fin de journée il n'y a rien à remplacer.
          const avant = k > 0 ? jour[k - 1] : null;
          const apres = k < jour.length ? jour[k] : null;
          const ajoute =
            (avant ? travelMinutes(avant, lieu, mode) : 0) + (apres ? travelMinutes(lieu, apres, mode) : 0);
          const retire = avant && apres ? travelMinutes(avant, apres, mode) : 0;
          const surcout = ajoute - retire + visite;

          if (surcout > restants[j]) continue;
          if (!meilleur || surcout < meilleur.surcout) meilleur = { jour: j, position: k, surcout };
        }
      }

      if (meilleur) {
        days[meilleur.jour].splice(meilleur.position, 0, lieu);
        restants[meilleur.jour] -= meilleur.surcout;
        pool.splice(i, 1);
        placeAuMoinsUn = true;
        break; // le pool a changé : on repart proprement plutôt que d'ajuster les indices
      }
    }
  }
}

/** Heure de départ de chaque journée dans le programme généré. */
export const DEBUT_JOURNEE_MINUTES = 9 * 60;
/** Le déjeuner s'insère au premier arrêt atteint après 12h30. */
export const SEUIL_DEJEUNER_MINUTES = 12 * 60 + 30;
/**
 * Au-delà de cette heure, on prévient que la journée est dense.
 *
 * Seuil exprimé à l'horloge, et non en dépassement du budget de `DUREE_META` : ce budget est
 * un outil de planification interne, alors que le visiteur juge à l'heure de fin. Une journée
 * qui finit à 17h55 dépasse techniquement le budget de 8 h sans mériter un avertissement ;
 * une qui finit à 20h05 le mérite, budget ou pas.
 */
export const FIN_JOURNEE_RAISONNABLE_MINUTES = 19 * 60;

/**
 * Dépassement toléré du budget d'une journée quand on replace les étapes écartées, en part
 * du budget. Un quart laisse une journée complète finir vers 19h et une demi-journée vers
 * 14h — au-delà, c'est l'avertissement « journée dense » qui parle.
 */
const TOLERANCE_JOURNEE = 0.25;

export type ElementPlanning =
  | { type: "transit"; minutes: number }
  | { type: "sleep"; dayNum: number }
  | { type: "lunch" }
  | { type: "stop"; lieu: Lieu; heure: string };

export type Planning = {
  /** Le programme à plat, transits et pauses interposés, prêt à rendre. */
  elements: ElementPlanning[];
  /** Par jour : heure de fin réelle, et si elle déborde sur la soirée. */
  journees: Array<{ finMinutes: number; finTardive: boolean }>;
};

/**
 * Déroule le programme jour par jour — horaires, trajets, pause déjeuner — et rapporte au
 * passage l'heure de fin réelle de chaque journée.
 *
 * Calcul unique et partagé : le rendu du programme et l'avertissement « journée dense » de la
 * vue résultat doivent annoncer exactement les mêmes horaires. Les dédoubler, c'est se
 * garantir qu'ils divergeront un jour — et le site a déjà eu le cas, avec une carte de
 * réservation qui affichait des jours d'ouverture contredisant la fiche du même lieu.
 */
export function construirePlanning(
  days: Lieu[][],
  dureeKey: DureeKey,
  options: {
    mode?: TransportMode;
    /** Heure de départ du premier jour, en minutes depuis minuit — vient du champ "Heure"
     * du bandeau Composer. Les jours suivants (après une "nuit") gardent l'heure de repli
     * par défaut : on ne sait pas à quelle heure l'hébergement du soir libère le matin. */
    heureDebutMinutes?: number;
    /** Point de départ du voyage (ex. la ville choisie dans "Je pars de"). Quand fourni, un
     * premier trajet est inséré avant la toute première étape — sans lui le programme
     * commençait directement au premier lieu, comme si le visiteur s'y téléportait. */
    depart?: { lat: number; lng: number } | null;
  } = {}
): Planning {
  const { mode = "voiture", heureDebutMinutes = DEBUT_JOURNEE_MINUTES, depart = null } = options;
  const meta = DUREE_META[dureeKey];
  const elements: ElementPlanning[] = [];
  const journees: Planning["journees"] = [];

  let timeMinutes = heureDebutMinutes;
  let prevLieu: Lieu | null = null;

  days.forEach((day, dayIndex) => {
    let lunchInserted = !meta.lunchBreak;
    day.forEach((lieu, stopIndex) => {
      if (prevLieu) {
        const transit = travelMinutes(prevLieu, lieu, mode);
        elements.push({ type: "transit", minutes: transit });
        timeMinutes += transit;
      } else if (dayIndex === 0 && stopIndex === 0 && depart) {
        const transit = travelMinutes(depart, lieu, mode);
        elements.push({ type: "transit", minutes: transit });
        timeMinutes += transit;
      }
      if (!lunchInserted && timeMinutes >= SEUIL_DEJEUNER_MINUTES) {
        elements.push({ type: "lunch" });
        timeMinutes += LUNCH_BREAK_MINUTES;
        lunchInserted = true;
      }
      elements.push({ type: "stop", lieu, heure: formatTime(timeMinutes) });
      timeMinutes += parseVisitMinutes(lieu);
      prevLieu = lieu;
    });

    journees.push({
      finMinutes: timeMinutes,
      finTardive: timeMinutes > FIN_JOURNEE_RAISONNABLE_MINUTES,
    });

    if (dayIndex < days.length - 1) {
      elements.push({ type: "sleep", dayNum: dayIndex + 1 });
      timeMinutes = DEBUT_JOURNEE_MINUTES;
      prevLieu = null;
    }
  });

  return { elements, journees };
}

export function formatTime(minutesSinceMidnight: number): string {
  const rounded = Math.round(minutesSinceMidnight / 5) * 5;
  const h = Math.floor(rounded / 60) % 24;
  const m = rounded % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Formateur de durée unique du site (refonte Lot 3, → DC-05).
 *
 * Trois écritures cohabitaient pour la même chose — « ~1 h », « ~18 min » et « ~1.8 h », ce
 * dernier avec un point décimal anglais au milieu d'une page française, et surtout illisible :
 * personne ne convertit 0,8 h en 48 min de tête.
 *
 * Règle : sous l'heure, arrondi à 5 min ; au-delà, arrondi au quart d'heure et notation
 * heures + minutes. Jamais de décimale, jamais de `~` — l'approximation est déjà dans
 * l'arrondi, et le tilde ajoutait du bruit sans ajouter d'information.
 */
export function formatDuree(minutes: number): string {
  // L'arrondi d'abord, le choix de l'unité ensuite : 58 min arrondies donnent 60, qui
  // s'écrit « 1 h » et non « 60 min ».
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

/**
 * "HH:MM" → minutes depuis minuit ("08:30" → 510). `null` si le format ne correspond pas
 * (champ vide, saisie invalide) — l'appelant retombe alors sur `DEBUT_JOURNEE_MINUTES`.
 */
export function parseHeureMinutes(heure: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(heure.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/**
 * Un lieu est-il fermé un jour donné, d'après les fermetures hebdomadaires connues de ses
 * activités (`Activite.fermeJours`) ?
 *
 * Renvoie `null` — statut inconnu, pas affiché — quand l'information est absente ou
 * ambiguë (ex. une activité fermée ce jour-là et une autre ouverte) : même retenue que la
 * puce "Ouvert aujourd'hui" jamais ajoutée à Explorer (ROADMAP Lot 4b, → NF-01) — bâtir une
 * heuristique sur une fermeture partielle inventerait un statut que le lieu n'a pas. Un lieu
 * n'ayant qu'une seule activité (le cas le plus courant) donne toujours une réponse nette.
 */
export function lieuFermeCeJour(lieu: Lieu, date: Date): boolean | null {
  const connues = (lieu.activites || [])
    .map((a) => a.fermeJours)
    .filter((f): f is number[] => Array.isArray(f) && f.length > 0);
  if (connues.length === 0) return null;
  const jour = date.getDay();
  const fermes = connues.filter((f) => f.includes(jour)).length;
  if (fermes === connues.length) return true;
  if (fermes === 0) return false;
  return null;
}

/**
 * Estimation grossière du budget "entrées" d'une sélection, pour le récapitulatif vivant du
 * Composer (→ ROADMAP Lot 4c). `prix` est du texte libre ("8 €", "8–10 €", "Gratuit") — on
 * retient le premier nombre venu par activité payante (une par lieu, comme `BookingSection`)
 * et on additionne. Volontairement approximatif (une fourchette "8–10 €" ne garde que 8, pas
 * sa moyenne) : le récapitulatif l'annonce comme "à prévoir", jamais comme un total exact.
 * `null` quand aucune activité payante n'a de prix analysable, pour que l'appelant affiche
 * "—" plutôt qu'un 0 € trompeur.
 */
export function estimerEntreesEuros(days: Lieu[][]): number | null {
  const bookings = buildBookingActivites(days);
  let total = 0;
  let trouve = false;
  for (const { activite } of bookings) {
    const m = /(\d+(?:[.,]\d+)?)/.exec(activite.prix);
    if (!m) continue;
    total += parseFloat(m[1].replace(",", "."));
    trouve = true;
  }
  return trouve ? Math.round(total) : null;
}

export function buildBookingActivites(days: Lieu[][]): Array<{ lieu: Lieu; activite: Activite }> {
  const seen = new Set<number>();
  const result: Array<{ lieu: Lieu; activite: Activite }> = [];
  for (const day of days) {
    for (const lieu of day) {
      for (const act of lieu.activites || []) {
        if (act.badge === "payant" && act.url && !seen.has(act.id)) {
          seen.add(act.id);
          result.push({ lieu, activite: act });
        }
      }
    }
  }
  return result;
}
