import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Lieu } from "@/lib/types";
import { buildMapLinks, loc } from "@/lib/utils";
import { BADGE_DEFS_BY_SLUG } from "@/lib/home-data";
import { construirePlanning, formatTransitDesc, type DureeKey, type TransportMode } from "@/lib/itineraire-logic";

/**
 * Horaires connus des activités d'un lieu, pour la version imprimée.
 *
 * Seules celles qui en déclarent : 10 activités sur 208 renseignent leurs jours de fermeture
 * et 23 un texte d'horaires. Afficher une ligne vide pour les autres laisserait croire à une
 * information manquante alors qu'elle n'a simplement jamais été relevée.
 */
function horairesDuLieu(lieu: Lieu, locale: string): Array<{ nom: string; horaires: string }> {
  return (lieu.activites || [])
    .filter((a) => a.horaires)
    .map((a) => ({
      nom: loc(locale, a.nomEn, a.nom),
      horaires: loc(locale, a.horairesEn, a.horaires!),
    }));
}

const KNOWN_BADGES = ["plage", "randonnee", "vtt", "plongee", "restaurant"] as const;

export default function ProgrammeSection({
  days,
  dureeKey,
  mode,
  depart,
  heureDebutMinutes,
}: {
  days: Lieu[][];
  dureeKey: DureeKey;
  /** Contexte du Composer (→ ROADMAP Lot 4c) : `undefined` reproduit le calcul par défaut de
   * `construirePlanning` (voiture, 09:00, pas de trajet de départ) — /creer-itineraire, qui
   * n'a pas ces paramètres, n'est pas affecté par leur ajout. */
  mode?: TransportMode;
  depart?: { lat: number; lng: number } | null;
  heureDebutMinutes?: number;
}) {
  const locale = useLocale();
  const t = useTranslations("itineraire");
  const tCreer = useTranslations("creerItineraire");
  const tBadges = useTranslations("badges");
  const tCommon = useTranslations("common");
  if (days.flat().length === 0) return null;

  const { elements: items } = construirePlanning(days, dureeKey, { mode, depart, heureDebutMinutes });

  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold mb-4">{t("programmeDetaille")}</h2>
      <div className="space-y-2">
        {items.map((item, i) => {
          if (item.type === "transit") {
            return (
              <div key={i} className="print-stop text-sm py-2 px-4 rounded-lg" style={{ color: "var(--text-muted)", background: "var(--surface)" }}>
                🚗 {formatTransitDesc(item.minutes, locale)}
              </div>
            );
          }
          if (item.type === "lunch") {
            return (
              <div key={i} className="print-stop rounded-xl p-4 flex items-center gap-4" style={{ background: "var(--surface)" }}>
                <span className="text-xs font-mono" style={{ color: "var(--azure)" }}>{tCreer("pause")}</span>
                <span className="text-sm font-semibold">{tCreer("dejeuner")}</span>
              </div>
            );
          }
          if (item.type === "sleep") {
            return (
              <div key={i} className="print-stop rounded-xl p-4 flex items-center gap-4" style={{ background: "var(--surface)" }}>
                <span className="text-xs font-mono" style={{ color: "var(--azure)" }}>{tCreer("nuit")}</span>
                <span className="text-sm font-semibold">{tCreer("finDuJour", { n: item.dayNum })}</span>
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
                  {t("voirLeLieu")}
                </Link>
              </div>
              <h3 className="font-semibold mb-2">{loc(locale, l.nomEn, l.nom)}</h3>
              {l.badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {l.badges.map((id) => {
                    const def = BADGE_DEFS_BY_SLUG[id];
                    const label = (KNOWN_BADGES as readonly string[]).includes(id)
                      ? tBadges(id as (typeof KNOWN_BADGES)[number])
                      : def?.label;
                    return def ? (
                      <span key={id} className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--surface-hover)", color: "var(--text-muted)" }}>
                        {def.emoji} {label}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              {/* Version imprimée : les liens ci-dessous sont inutiles sur papier, mais les
                  coordonnées et les horaires sont exactement ce qu'on emporte sur le terrain.
                  L'export était présenté comme l'artefact hors-ligne et n'en contenait aucun. */}
              <div className="print-only text-xs" style={{ color: "var(--text-muted)" }}>
                <p>📍 {l.lat}°N, {l.lng}°E</p>
                {horairesDuLieu(l, locale).map((h) => (
                  <p key={h.nom}>🕒 {h.nom} — {h.horaires}</p>
                ))}
              </div>

              <div className="no-print flex flex-wrap gap-2">
                {buildMapLinks(l.lat, l.lng, loc(locale, l.nomEn, l.nom), tCommon("plans")).map((link) => (
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
