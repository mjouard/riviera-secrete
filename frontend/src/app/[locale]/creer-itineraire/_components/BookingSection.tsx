"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Lieu } from "@/lib/types";
import { imgUrl, loc } from "@/lib/utils";
import { buildBookingActivites } from "@/lib/itineraire-logic";

/** Nombre de cartes visibles sur desktop avant de replier le reste derrière "Voir plus". */
const VISIBLE_COUNT = 4;

export default function BookingSection({ days }: { days: Lieu[][] }) {
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
          const linkText =
            act.linkText === "Réserver →" ? tActivite("reserver")
            : act.linkText === "Vérifier les horaires →" ? tActivite("verifierHoraires")
            : act.linkText === "En savoir plus →" ? tActivite("enSavoirPlus")
            : act.linkText || tActivite("reserver");
          return (
            <div
              key={i}
              className={`print-stop rounded-xl overflow-hidden flex-shrink-0 snap-start w-[46%] sm:w-auto ${i >= VISIBLE_COUNT ? "booking-extra" : ""}`}
              style={{ background: "var(--surface)" }}
            >
              <div className="no-print aspect-video overflow-hidden">
                <img src={imgUrl(act.image)} alt={loc(locale, act.altEn, act.alt)} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="p-4">
                <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{loc(locale, lieu.nomEn, lieu.nom)}</p>
                <p className="font-semibold text-sm mb-1">{loc(locale, act.nomEn, act.nom)}</p>
                <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>⏱ {loc(locale, act.dureeEn, act.duree)} · 💶 {loc(locale, act.prixEn, act.prix)}</p>
                <a href={act.url} target="_blank" rel="noopener noreferrer" className="no-print text-xs" style={{ color: "var(--azure)" }}>
                  {linkText}
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
