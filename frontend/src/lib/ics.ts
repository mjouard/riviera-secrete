import type { Lieu } from "./types";
import { loc } from "./utils";
import { construirePlanning, parseVisitMinutes, type DureeKey, type TransportMode } from "./itineraire-logic";

/**
 * Export agenda .ics (→ ROADMAP § Trimestre "Export agenda .ics — le moteur calcule déjà des
 * horaires"). Un événement par étape, à l'heure calculée par `construirePlanning` — la même
 * qu'affichée dans la timeline, donc jamais en contradiction avec ce que le visiteur a sous
 * les yeux. Heures "flottantes" (sans `Z`/`TZID`) : la génération se fait dans le navigateur du
 * visiteur, ses heures locales sont déjà celles qu'on veut voir apparaître dans son agenda.
 */
function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function dateIcs(date: Date, minutesDepuisMinuit: number): string {
  const h = Math.floor(minutesDepuisMinuit / 60) % 24;
  const m = minutesDepuisMinuit % 60;
  return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}T${pad2(h)}${pad2(m)}00`;
}

function horodatageUtc(): string {
  return new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/** Échappe les caractères réservés par la RFC 5545 (`;`, `,`, `\`, retours à la ligne). */
function echapperTexteIcs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Découpe une ligne ICS toutes les 75 octets avec l'indentation continue exigée par la RFC. */
function plierLigne(ligne: string): string {
  if (ligne.length <= 75) return ligne;
  const morceaux: string[] = [];
  let reste = ligne;
  while (reste.length > 75) {
    morceaux.push(reste.slice(0, 75));
    reste = " " + reste.slice(75);
  }
  morceaux.push(reste);
  return morceaux.join("\r\n");
}

export function genererIcs({
  titre,
  days,
  dureeKey,
  dateDepart,
  mode,
  depart,
  heureDebutMinutes,
  locale,
}: {
  titre: string;
  days: Lieu[][];
  dureeKey: DureeKey;
  /** Jour du premier arrêt — chaque jour suivant (marqueur "sleep") avance d'une journée. */
  dateDepart: Date;
  mode?: TransportMode;
  depart?: { lat: number; lng: number } | null;
  heureDebutMinutes?: number;
  locale: string;
}): string {
  const { elements } = construirePlanning(days, dureeKey, { mode, depart, heureDebutMinutes });
  const lignes: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Riviera Secrete//FR",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${echapperTexteIcs(titre)}`,
  ];

  const horodatage = horodatageUtc();
  let jourIndex = 0;
  let compteur = 0;

  for (const el of elements) {
    if (el.type === "sleep") {
      jourIndex += 1;
      continue;
    }
    if (el.type !== "stop") continue;

    const [hh, mm] = el.heure.split(":").map(Number);
    const debutMinutes = hh * 60 + mm;
    const dureeMin = parseVisitMinutes(el.lieu);
    const jour = new Date(dateDepart);
    jour.setDate(jour.getDate() + jourIndex);

    compteur += 1;
    const nom = loc(locale, el.lieu.nomEn, el.lieu.nom);
    lignes.push(
      "BEGIN:VEVENT",
      `UID:${compteur}-${el.lieu.slug}-${dateDepart.getTime()}@riviera-secrete.fr`,
      `DTSTAMP:${horodatage}`,
      `DTSTART:${dateIcs(jour, debutMinutes)}`,
      `DTEND:${dateIcs(jour, debutMinutes + dureeMin)}`,
      plierLigne(`SUMMARY:${echapperTexteIcs(nom)}`),
      plierLigne(`LOCATION:${echapperTexteIcs(el.lieu.commune)}`),
      `GEO:${el.lieu.lat};${el.lieu.lng}`,
      plierLigne(`URL:https://frontend-two-plum-92.vercel.app/lieux/${el.lieu.slug}`),
      "END:VEVENT"
    );
  }

  lignes.push("END:VCALENDAR");
  return lignes.join("\r\n");
}

/** Déclenche le téléchargement d'un fichier .ics généré côté client (aucun aller-retour serveur). */
export function telechargerIcs(nomFichier: string, contenu: string) {
  const blob = new Blob([contenu], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomFichier;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
