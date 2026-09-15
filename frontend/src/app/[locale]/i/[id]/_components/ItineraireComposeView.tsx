"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Lieu } from "@/lib/types";
import { loc } from "@/lib/utils";
import { formatDuree, parseVisitMinutes, type DureeKey } from "@/lib/itineraire-logic";
import { BADGE_DEFS_BY_SLUG } from "@/lib/home-data";
import ProgrammeSection from "@/app/[locale]/creer-itineraire/_components/ProgrammeSection";
import BookingSection from "@/app/[locale]/creer-itineraire/_components/BookingSection";
import MapItinWrapper from "@/components/MapItinWrapper";
import Photo from "@/components/Photo";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://frontend-two-plum-92.vercel.app";
const SITE_DISPLAY_URL = SITE_URL.replace(/^https?:\/\//, "");

/**
 * Vue en lecture seule d'un itinéraire composé (`/i/[id]`, ROADMAP.md § 4d) — équivalent de
 * `ResultsView` (creer-itineraire) mais sans mode Modifier/glisser-déposer : ce visiteur n'est
 * pas forcément celui qui l'a composé (voir `EstAutoriseSurItineraireCompose` côté backend),
 * l'écran par défaut d'un lien partagé doit donc être consultable, pas éditable.
 */
export default function ItineraireComposeView({
  id,
  nom,
  dureeKey,
  days,
  createdAt,
}: {
  id: string;
  nom: string;
  dureeKey: DureeKey;
  days: Lieu[][];
  createdAt: string;
}) {
  const locale = useLocale();
  const t = useTranslations("creerItineraire");
  const tItin = useTranslations("itineraireCompose");
  const tDuree = useTranslations("dureeLabels");

  const nbLieux = days.flat().length;
  const meta = `${days.length} ${days.length > 1 ? t("jours") : t("jour")} · ${nbLieux} ${nbLieux > 1 ? t("lieuxSuffix") : t("lieu")}`;
  const date = new Date(createdAt).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const mapStops = days.flat().map((l) => ({ lat: l.lat, lng: l.lng, nom: l.nom }));

  return (
    <div>
      <div className="print-header">
        <p className="print-header-url">{SITE_DISPLAY_URL}</p>
        <h1>{nom}</h1>
        <p className="print-header-meta">{meta}</p>
      </div>

      <div className="no-print mb-6">
        <h1 className="text-2xl font-bold">{nom}</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {meta} · {tDuree(dureeKey)}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          {tItin("creeLe", { date })}
        </p>
        {/* URL de partage affichée dans l'en-tête (ROADMAP.md § 4d) — pas décoratif : signale
            que ce lien existe, se partage, survit au F5. */}
        <p className="text-xs mt-1 font-mono" style={{ color: "var(--text-muted)" }}>
          {tItin("lienPartage", { id })}
        </p>
      </div>

      {/* Day columns */}
      <div className="print-days grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-10">
        {days.map((day, dayIndex) => (
          <div key={dayIndex} className="print-day rounded-xl p-4" style={{ background: "var(--surface)" }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--azure)" }}>
              {t("jourN", { n: dayIndex + 1 })}{" "}
              <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                — {day.length} {day.length > 1 ? t("lieuxSuffix") : t("lieu")}
              </span>
            </h3>
            <div className="space-y-2">
              {day.map((lieu) => {
                const dureeLabel = formatDuree(parseVisitMinutes(lieu));
                return (
                  <div
                    key={lieu.slug}
                    className="rounded-lg flex gap-3 p-2"
                    style={{ background: "var(--surface-hover)" }}
                  >
                    <div className="no-print w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                      <Photo src={lieu.thumbImage} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/lieux/${lieu.slug}`} target="_blank" className="text-sm font-semibold hover:underline line-clamp-1">
                        {loc(locale, lieu.nomEn, lieu.nom)}
                      </Link>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{lieu.commune}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>⏱ {dureeLabel}</p>
                      {lieu.badges.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {lieu.badges.map((badgeId) => {
                            const def = BADGE_DEFS_BY_SLUG[badgeId];
                            return def ? (
                              <span key={badgeId} className="text-xs" style={{ color: "var(--text-muted)" }}>{def.emoji}</span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {day.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>—</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Map */}
      {mapStops.length > 0 && (
        <div className="no-print mb-10">
          <MapItinWrapper stops={mapStops} />
        </div>
      )}

      {/* Programme */}
      <ProgrammeSection days={days} dureeKey={dureeKey} />

      {/* Booking */}
      <BookingSection days={days} />
    </div>
  );
}
