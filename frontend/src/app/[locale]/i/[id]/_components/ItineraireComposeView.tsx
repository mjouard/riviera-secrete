"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import type { Lieu } from "@/lib/types";
import { loc, redirectToConnexion } from "@/lib/utils";
import { authFetch } from "@/lib/api";
import { formatDuree, parseVisitMinutes, encodeJours, type DureeKey } from "@/lib/itineraire-logic";
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
  const { data: session } = useSession();
  const [lienCopie, setLienCopie] = useState(false);
  const [garde, setGarde] = useState(false);
  const [gardeEnCours, setGardeEnCours] = useState(false);

  const nbLieux = days.flat().length;
  const meta = `${days.length} ${days.length > 1 ? t("jours") : t("jour")} · ${nbLieux} ${nbLieux > 1 ? t("lieuxSuffix") : t("lieu")}`;
  const date = new Date(createdAt).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const mapStops = days.flat().map((l) => ({ lat: l.lat, lng: l.lng, nom: l.nom }));

  /** Copie l'URL courante (celle de ce lien partagé) — même mécanique que le partage de
   * ResultsView, mais rien à encoder ici : l'itinéraire vit déjà côté serveur sous cet id. */
  async function partager() {
    const lien = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: nom, url: lien });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(lien);
      setLienCopie(true);
      setTimeout(() => setLienCopie(false), 2000);
    } catch {
      // silent — rien de mieux à proposer si le presse-papiers est refusé
    }
  }

  /**
   * "Garder" = copier cet itinéraire dans le carnet du compte connecté (POST
   * /api/my-itineraires, déjà protégé par JWT) — pas un PATCH sur l'itinéraire composé
   * lui-même : ce visiteur n'en est pas forcément le créateur (voir la doc du composant),
   * et ce lien /i/{id} doit continuer de fonctionner pour tout le monde après coup.
   */
  async function garder() {
    if (!session?.apiToken) { redirectToConnexion(); return; }
    setGardeEnCours(true);
    try {
      await authFetch("/api/my-itineraires", session.apiToken, {
        method: "POST",
        body: JSON.stringify({ nom, dureeKey, days: days.map((jour) => jour.map((l) => l.slug)) }),
      });
      setGarde(true);
    } finally {
      setGardeEnCours(false);
    }
  }

  /** "Modifier" rouvre l'itinéraire dans l'éditeur existant (/creer-itineraire?jours=…), au
   * lieu de PATCH ce /i/{id} en place — cet écran n'a nulle part où récupérer l'EditToken du
   * créateur (rien ne le pose encore en local côté client), donc la seule modification sûre
   * est d'en repartir dans le composeur, où "Sauvegarder" range le résultat dans son propre
   * carnet plutôt que d'écraser le lien partagé. */
  const lienModifier = `/creer-itineraire?jours=${encodeURIComponent(encodeJours(days))}&duree=${dureeKey}&nom=${encodeURIComponent(nom)}`;

  return (
    <div>
      <div className="print-header">
        <p className="print-header-url">{SITE_DISPLAY_URL}</p>
        <h1>{nom}</h1>
        <p className="print-header-meta">{meta}</p>
      </div>

      <div className="no-print flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
        <div>
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
        <div className="flex flex-wrap gap-2">
          <Link href={lienModifier} className="text-sm px-3 py-2 rounded-lg border transition-colors hover:bg-white/5" style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}>
            {t("modifier")}
          </Link>
          <button onClick={() => window.print()} className="text-sm px-3 py-2 rounded-lg border transition-colors hover:bg-white/5" style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}>
            {t("exporterPdf")}
          </button>
          <button
            onClick={partager}
            title={t("partagerTitre")}
            className="text-sm px-3 py-2 rounded-lg border transition-colors hover:bg-white/5 cursor-pointer"
            style={{ borderColor: "var(--line)", color: lienCopie ? "var(--azure)" : "var(--text-muted)" }}
          >
            {lienCopie ? t("lienCopie") : t("partagerLien")}
          </button>
          <button
            onClick={() => void garder()}
            disabled={gardeEnCours || garde}
            className="text-sm px-3 py-2 rounded-lg font-semibold disabled:opacity-60"
            style={{ background: "var(--azure)", color: "#0c1116" }}
          >
            {garde ? tItin("garde") : gardeEnCours ? tItin("gardeEnCours") : tItin("garder")}
          </button>
        </div>
      </div>

      {garde && (
        <div className="no-print mb-6 rounded-xl p-4 text-sm flex items-center gap-3" style={{ background: "rgba(79,195,201,0.1)", color: "var(--azure)" }}>
          {tItin("itineraireGarde")} <Link href="/mes-itineraires" className="underline">{t("voirMesItineraires")}</Link>
        </div>
      )}

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
