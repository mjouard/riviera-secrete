"use client";

import { cleLienType, communeActivite, relActivite } from "@/lib/activites-data";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Lieu } from "@/lib/types";
import { loc, prixAffiche } from "@/lib/utils";
import { buildBookingActivites } from "@/lib/itineraire-logic";
import FermeAujourdhui from "@/components/FermeAujourdhui";
import Photo from "@/components/Photo";

/** Nombre de cartes visibles sur desktop avant de replier le reste derrière "Voir plus". */
const VISIBLE_COUNT = 4;

export default function BookingSection({
  days,
  date,
}: {
  days: Lieu[][];
  /** Date du voyage (Composer, → ROADMAP Lot 4c/PR-04). `undefined`/`null` retombe sur le
   * jour du visiteur, comportement inchangé pour /creer-itineraire. */
  date?: Date | null;
}) {
  const locale = useLocale();
  const t = useTranslations("creerItineraire");
  const tActivite = useTranslations("activite");
  const [expanded, setExpanded] = useState(false);
  const bookings = buildBookingActivites(days);
  if (!bookings.length) return null;
  const hiddenCount = bookings.length - VISIBLE_COUNT;

  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold mb-2">{t("aReserverAvantDePartir")}</h2>
      <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
        {t("aReserverSubtitle")}
      </p>
      <div
        className={`booking-grid hscroll flex gap-4 overflow-x-auto -mx-6 px-6 pb-2 snap-x snap-mandatory sm:grid sm:gap-4 sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible sm:grid-cols-2 lg:grid-cols-3 ${expanded ? "expanded" : ""}`}
      >
        {bookings.map(({ lieu, activite: act }, i) => {
          const linkText = tActivite(cleLienType(act.lienType));
          const commune = communeActivite(act, lieu);
          return (
            <div
              key={i}
              className={`print-stop rounded-xl overflow-hidden flex-shrink-0 snap-start w-[46%] sm:w-auto ${i >= VISIBLE_COUNT ? "booking-extra" : ""}`}
              style={{ background: "var(--surface)" }}
            >
              <div className="no-print aspect-video overflow-hidden">
                <Photo src={act.image} alt={loc(locale, act.altEn, act.alt)} className="w-full h-full object-cover" />
              </div>
              <div className="p-4">
                <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{loc(locale, lieu.nomEn, lieu.nom)}</p>
                <p className="font-semibold text-sm mb-1">{loc(locale, act.nomEn, act.nom)}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>⏱ {loc(locale, act.dureeEn, act.duree)} · 💶 {prixAffiche(locale, act.prixEn, act.prix)}</p>
                {/* Ne s'affiche que si l'activité ne se pratique pas au lieu même (Lot 3). */}
                {commune && (
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    📍 {tActivite("aProximiteDe", { commune })}
                  </p>
                )}
                {/* Même information d'ouverture que la fiche lieu et que les itinéraires
                    éditoriaux : un itinéraire se lit le matin du départ. */}
                {act.horaires && (
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    🕒 {loc(locale, act.horairesEn, act.horaires)}
                  </p>
                )}
                <div className="mb-3">
                  <FermeAujourdhui fermeJours={act.fermeJours} date={date ?? null} />
                </div>
                <a href={act.url} target="_blank" rel={relActivite(act.partenaire)} className="no-print text-xs" style={{ color: "var(--azure)" }}>
                  {linkText}
                  {act.partenaire && (
                    <span className="ml-1" style={{ color: "var(--text-muted)" }}>
                      · {tActivite("lienPartenaire")}
                    </span>
                  )}
                </a>
              </div>
            </div>
          );
        })}
      </div>
      {hiddenCount > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="no-print hidden sm:inline-block mt-4 text-sm font-medium hover:underline"
          style={{ color: "var(--azure)" }}
        >
          {expanded ? t("voirMoins") : t("voirLesAutres", { count: hiddenCount })}
        </button>
      )}
    </section>
  );
}
