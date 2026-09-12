import Link from "next/link";
import type { Lieu } from "@/lib/types";
import { buildMapLinks } from "@/lib/utils";
import { BADGE_DEFS_BY_SLUG } from "@/lib/home-data";
import {
  travelMinutes, parseVisitMinutes, formatTime, formatTransitDesc,
  DUREE_META, LUNCH_BREAK_MINUTES, type DureeKey,
} from "@/lib/itineraire-logic";

const LUNCH_THRESHOLD_MINUTES = 12 * 60 + 30; // 12h30

export default function ProgrammeSection({ days, dureeKey }: { days: Lieu[][]; dureeKey: DureeKey }) {
  if (days.flat().length === 0) return null;

  const hasLunchBreak = DUREE_META[dureeKey].lunchBreak;

  type ProgramItem =
    | { type: "transit"; minutes: number }
    | { type: "sleep"; dayNum: number }
    | { type: "lunch" }
    | { type: "stop"; lieu: Lieu; heure: string };

  let timeMinutes = 9 * 60;
  let prevLieu: Lieu | null = null;
  const items: ProgramItem[] = [];

  days.forEach((day, dayIndex) => {
    let lunchInserted = !hasLunchBreak;
    day.forEach((lieu) => {
      if (prevLieu) {
        const transit = travelMinutes(prevLieu, lieu);
        items.push({ type: "transit", minutes: transit });
        timeMinutes += transit;
      }
      if (!lunchInserted && timeMinutes >= LUNCH_THRESHOLD_MINUTES) {
        items.push({ type: "lunch" });
        timeMinutes += LUNCH_BREAK_MINUTES;
        lunchInserted = true;
      }
      items.push({ type: "stop", lieu, heure: formatTime(timeMinutes) });
      timeMinutes += parseVisitMinutes(lieu);
      prevLieu = lieu;
    });
    if (dayIndex < days.length - 1) {
      items.push({ type: "sleep", dayNum: dayIndex + 1 });
      timeMinutes = 9 * 60;
      prevLieu = null;
    }
  });

  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold mb-4">Programme détaillé</h2>
      <div className="space-y-2">
        {items.map((item, i) => {
          if (item.type === "transit") {
            return (
              <div key={i} className="print-stop text-sm py-2 px-4 rounded-lg" style={{ color: "var(--text-muted)", background: "var(--surface)" }}>
                🚗 {formatTransitDesc(item.minutes)}
              </div>
            );
          }
          if (item.type === "lunch") {
            return (
              <div key={i} className="print-stop rounded-xl p-4 flex items-center gap-4" style={{ background: "var(--surface)" }}>
                <span className="text-xs font-mono" style={{ color: "var(--azure)" }}>Pause</span>
                <span className="text-sm font-semibold">Déjeuner — ~1 h dans le coin</span>
              </div>
            );
          }
          if (item.type === "sleep") {
            return (
              <div key={i} className="print-stop rounded-xl p-4 flex items-center gap-4" style={{ background: "var(--surface)" }}>
                <span className="text-xs font-mono" style={{ color: "var(--azure)" }}>Nuit</span>
                <span className="text-sm font-semibold">Fin du jour {item.dayNum} — Hébergement au choix</span>
              </div>
            );
          }
          const l = item.lieu;
          return (
            <div key={i} className="print-stop rounded-xl p-4" style={{ background: "var(--surface)" }}>
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <span className="text-xs font-mono mr-2" style={{ color: "var(--azure)" }}>{item.heure}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{l.commune}</span>
                </div>
                <Link href={`/lieux/${l.slug}`} target="_blank" className="no-print text-xs hover:underline flex-shrink-0" style={{ color: "var(--azure)" }}>
                  Voir le lieu →
                </Link>
              </div>
              <h3 className="font-semibold mb-2">{l.nom}</h3>
              {l.badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {l.badges.map((id) => {
                    const def = BADGE_DEFS_BY_SLUG[id];
                    return def ? (
                      <span key={id} className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--surface-hover)", color: "var(--text-muted)" }}>
                        {def.emoji} {def.label}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              <div className="no-print flex flex-wrap gap-2">
                {buildMapLinks(l.lat, l.lng, l.nom).map((link) => (
                  <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs px-2.5 py-1 rounded-full border transition-colors hover:bg-white/5"
                    style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}>
                    {link.icon} {link.label}
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
