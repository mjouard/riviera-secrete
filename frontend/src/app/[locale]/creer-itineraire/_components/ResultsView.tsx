import { useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Lieu } from "@/lib/types";
import { loc } from "@/lib/utils";
import { api } from "@/lib/api";
import { construirePlanning, formatDuree, formatTime, parseVisitMinutes, type DureeKey, type TransportMode } from "@/lib/itineraire-logic";
import { genererIcs, telechargerIcs } from "@/lib/ics";
import { ecrireEditToken } from "@/lib/itineraire-compose-tokens";
import { BADGE_ICONS } from "@/lib/home-data";
import ProgrammeSection from "./ProgrammeSection";
import BookingSection from "./BookingSection";
import Photo from "@/components/Photo";
import { Toast } from "@/components/ui/Toast";

const BuilderMap = dynamic(() => import("@/components/BuilderMap"), { ssr: false });

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://frontend-two-plum-92.vercel.app";
const SITE_DISPLAY_URL = SITE_URL.replace(/^https?:\/\//, "");

const KNOWN_BADGES = ["plage", "randonnee", "vtt", "plongee", "restaurant"] as const;

export default function ResultsView({
  currentDays, excluded, bonusSuggestions, dureeKey, currentNom, mapStops, savedBanner, source,
  editMode, onBack, onToggleEdit, onMoveStop, onRemoveStop, onDragStart, onDragOver, onSaveClick,
  mode, depart, heureDebutMinutes, date, removedStop, onUndoRemoveStop, onDismissRemovedStop,
}: {
  currentDays: Lieu[][];
  excluded: Lieu[];
  bonusSuggestions: {
    mode: "excluded" | "related";
    items: Array<{ slug: string; nom: string; nomEn?: string | null; thumbImage: string }>;
  };
  dureeKey: DureeKey;
  currentNom: string;
  mapStops: Array<{ lat: number; lng: number; nom: string }>;
  savedBanner: boolean;
  /** Itinéraire éditorial dont on est parti, quand on arrive via "Partir de cet itinéraire". */
  source: { slug: string; titre: string; titreEn?: string | null } | null;
  editMode: boolean;
  onBack: () => void;
  onToggleEdit: () => void;
  onMoveStop: (dayIndex: number, stopIndex: number, dir: -1 | 1) => void;
  onRemoveStop: (dayIndex: number, stopIndex: number) => void;
  onDragStart: (dayIndex: number, stopIndex: number) => void;
  onDragOver: (e: React.DragEvent, targetDay: number, targetStop: number) => void;
  onSaveClick: () => void;
  /** Toast "Annuler" après un retrait (→ audit UX 17/09, 2.2 — même pattern que
   * ItineraireComposeView.tsx). */
  removedStop: { dayIndex: number; stopIndex: number; lieu: Lieu } | null;
  onUndoRemoveStop: () => void;
  onDismissRemovedStop: () => void;
  /** Contexte du Composer (→ ROADMAP Lot 4c) : absent pour /creer-itineraire, qui garde son
   * comportement d'avant (voiture, 09:00, pas de point de départ, alertes sur aujourd'hui). */
  mode?: TransportMode;
  depart?: { lat: number; lng: number; nom: string } | null;
  heureDebutMinutes?: number;
  date?: Date | null;
}) {
  const locale = useLocale();
  const t = useTranslations("creerItineraire");
  const tDuree = useTranslations("dureeLabels");
  const tBadges = useTranslations("badges");
  const [lienCopie, setLienCopie] = useState(false);
  const [partageEnCours, setPartageEnCours] = useState(false);
  const [composeId, setComposeId] = useState<string | null>(null);
  const [composeEditToken, setComposeEditToken] = useState<string | null>(null);
  const nbLieux = currentDays.flat().length;
  const titre = currentNom || t("itineraireFallback", { duree: tDuree(dureeKey) });
  // Journées qui débordent du budget du préréglage. Elles n'existent que parce qu'on refuse
  // désormais d'écarter une étape venant d'un itinéraire éditorial : le dire franchement vaut
  // mieux que de laisser croire que tout rentre dans la journée.
  const journeesDenses = construirePlanning(currentDays, dureeKey, { mode, depart, heureDebutMinutes }).journees
    .map((j, i) => ({ ...j, numero: i + 1 }))
    .filter((j) => j.finTardive);

  /**
   * Crée (ou met à jour, si déjà fait pendant cette visite) un vrai `/i/[id]` — jusqu'ici,
   * aucun bouton du site n'appelait `POST /api/itineraires-composes` : ce bouton copiait un
   * lien `?jours=…` encodé dans l'URL courante, jamais persisté côté backend, donc jamais
   * modifiable ni consultable en dehors de qui recevait exactement ce lien-là (trouvé et
   * corrigé au Lot 4d, brique "brancher la création"). L'`EditToken` reçu est gardé en
   * mémoire (pour ré-appeler PATCH plutôt que POST sur un second clic dans la même visite)
   * et persisté dans `localStorage` (`lib/itineraire-compose-tokens.ts`) pour que `/i/[id]`
   * puisse plus tard reconnaître ce navigateur comme l'auteur du lien.
   *
   * Un clic reste possible sans réseau disponible : en cas d'échec, on ne casse rien, le
   * bouton redevient simplement cliquable (pas de lien à copier cette fois).
   */
  async function partager() {
    setPartageEnCours(true);
    try {
      const jours = currentDays.map((jour) => jour.map((l) => l.slug));
      let id = composeId;
      if (id && composeEditToken) {
        await api.itinerairesComposes.update(id, { nom: titre, dureeKey, jours }, composeEditToken);
      } else {
        const creeRes = await fetch("/api/proxy/itineraires-composes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nom: titre, dureeKey, jours }),
        });
        const cree = await creeRes.json() as { id: string; editToken: string };
        id = cree.id;
        setComposeId(cree.id);
        setComposeEditToken(cree.editToken);
        ecrireEditToken(cree.id, cree.editToken);
      }

      const prefixeLocale = locale === "en" ? "/en" : "";
      const lien = `${window.location.origin}${prefixeLocale}/i/${id}`;

      if (navigator.share) {
        try {
          await navigator.share({ title: titre, url: lien });
          return;
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") return; // annulé par l'utilisateur
        }
      }
      if (!navigator.clipboard) return;
      await navigator.clipboard.writeText(lien);
      setLienCopie(true);
      setTimeout(() => setLienCopie(false), 2000);
    } catch {
      // silent — le backend est peut-être injoignable, rien de mieux à proposer que de
      // laisser le visiteur retenter
    } finally {
      setPartageEnCours(false);
    }
  }
  function exporterIcs() {
    const contenu = genererIcs({
      titre,
      days: currentDays,
      dureeKey,
      dateDepart: date ?? new Date(),
      mode,
      depart,
      heureDebutMinutes,
      locale,
    });
    telechargerIcs(`${titre.replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase()}.ics`, contenu);
  }

  const meta = `${currentDays.length} ${currentDays.length > 1 ? t("jours") : t("jour")} · ${nbLieux} ${nbLieux > 1 ? t("lieuxSuffix") : t("lieu")}`;

  return (
    <div>
      {lienCopie && (
        <Toast message={t("lienCopie")} onDismiss={() => setLienCopie(false)} />
      )}

      {removedStop && (
        <Toast
          message={t("stopRetire", { nom: loc(locale, removedStop.lieu.nomEn, removedStop.lieu.nom) })}
          variant="undo"
          undoLabel={t("annuler")}
          onUndo={onUndoRemoveStop}
          onDismiss={onDismissRemovedStop}
        />
      )}
      <div className="print-header">
        <p className="print-header-url">{SITE_DISPLAY_URL}</p>
        <p className="print-header-title font-bold text-lg" aria-hidden="true">{titre}</p>
        <p className="print-header-meta">{meta}</p>
      </div>

      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">{titre}</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{meta}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onBack} className="text-sm px-3 py-2 rounded-lg border transition-colors hover:bg-white/5" style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}>
            {t("choisirAutresLieux")}
          </button>
          <button onClick={() => window.print()} className="text-sm px-3 py-2 rounded-lg border transition-colors hover:bg-white/5" style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}>
            {t("exporterPdf")}
          </button>
          <button onClick={exporterIcs} className="text-sm px-3 py-2 rounded-lg border transition-colors hover:bg-white/5" style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}>
            {t("exporterIcs")}
          </button>
          <button
            onClick={() => void partager()}
            disabled={partageEnCours}
            title={t("partagerTitre")}
            className="text-sm px-3 py-2 rounded-lg border transition-colors hover:bg-white/5 cursor-pointer disabled:opacity-60 disabled:cursor-default"
            style={{ borderColor: "var(--line)", color: lienCopie ? "var(--azure)" : "var(--text-muted)" }}
          >
            {lienCopie ? t("lienCopie") : partageEnCours ? t("partageEnCours") : t("partagerLien")}
          </button>
          {editMode ? (
            <button onClick={onSaveClick} className="text-sm px-3 py-2 rounded-lg font-semibold" style={{ background: "var(--azure)", color: "#0c1116" }}>
              {t("sauvegarder")}
            </button>
          ) : (
            <button onClick={onToggleEdit} className="text-sm px-3 py-2 rounded-lg font-semibold" style={{ background: "var(--azure)", color: "#0c1116" }}>
              {t("modifier")}
            </button>
          )}
        </div>
      </div>

      {savedBanner && (
        <div className="no-print mb-6 rounded-xl p-4 text-sm flex items-center gap-3" style={{ background: "rgba(79,195,201,0.1)", color: "var(--azure)" }}>
          {t("itineraireSauvegarde")} <Link href="/carnet?onglet=itineraires" className="underline">{t("voirMesItineraires")}</Link>
        </div>
      )}

      {source && (
        <div className="no-print mb-6 rounded-xl p-4 text-sm flex flex-wrap items-center gap-x-2 gap-y-1" style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
          <span>{t("baseSur")}</span>
          <Link href={`/itineraires/${source.slug}`} className="underline font-semibold" style={{ color: "var(--terracotta)" }}>
            {loc(locale, source.titreEn, source.titre)}
          </Link>
          <span>— {t("baseSurAide")}</span>
        </div>
      )}

      {journeesDenses.length > 0 && (
        <div className="no-print mb-6 rounded-xl p-4 text-sm" style={{ background: "rgba(232,163,61,0.1)", color: "var(--terracotta)" }}>
          {journeesDenses.map((j) => (
            <p key={j.numero}>
              {currentDays.length > 1
                ? t("journeeDenseJour", { n: j.numero, fin: formatTime(j.finMinutes) })
                : t("journeeDense", { fin: formatTime(j.finMinutes) })}
            </p>
          ))}
        </div>
      )}

      {excluded.length > 0 && (
        <p className="no-print mb-6 text-sm rounded-xl p-3" style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
          {t("nonInclus", { noms: excluded.map((l) => loc(locale, l.nomEn, l.nom)).join(", ") })}{" "}
          <a href="#suggestions-bonus" className="underline" style={{ color: "var(--azure)" }}>
            {t("aVoirEnBas")}
          </a>
          .
        </p>
      )}

      {/* Day columns */}
      <div className="print-days grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-10">
        {currentDays.map((day, dayIndex) => (
          <div key={dayIndex} className="print-day rounded-xl p-4" style={{ background: "var(--surface)" }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--azure)" }}>
              {t("jourN", { n: dayIndex + 1 })} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>— {day.length} {day.length > 1 ? t("lieuxSuffix") : t("lieu")}</span>
            </h3>
            <div
              className="builder-day-stops space-y-2"
              onDragOver={(e) => e.preventDefault()}
            >
              {day.map((lieu, stopIndex) => {
                const isFirstOverall = dayIndex === 0 && stopIndex === 0;
                const isLastOverall = dayIndex === currentDays.length - 1 && stopIndex === day.length - 1;
                const visitMin = parseVisitMinutes(lieu);
                const dureeLabel = formatDuree(visitMin);

                return (
                  <div
                    key={lieu.slug}
                    draggable={editMode}
                    onDragStart={editMode ? () => onDragStart(dayIndex, stopIndex) : undefined}
                    onDragOver={editMode ? (e) => onDragOver(e, dayIndex, stopIndex) : undefined}
                    className={`print-stop builder-stop-card rounded-lg flex gap-3 p-2 ${editMode ? "cursor-grab active:cursor-grabbing" : ""}`}
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
                        /* Icônes vectorielles plutôt qu'émojis (→ audit UX 17/09, 3.3) : carte
                           trop étroite (grille 2-3 colonnes) pour un libellé visible à côté de
                           chacune, donc titre + <span className="sr-only"> portent le mot pour
                           un lecteur d'écran. */
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {lieu.badges.map((id) => {
                            const Icon = (KNOWN_BADGES as readonly string[]).includes(id) ? BADGE_ICONS[id] : null;
                            if (!Icon) return null;
                            const label = tBadges(id as (typeof KNOWN_BADGES)[number]);
                            return (
                              <span key={id} title={label} style={{ color: "var(--text-muted)" }}>
                                <Icon className="w-3.5 h-3.5" />
                                <span className="sr-only">{label}</span>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {editMode && (
                      /* 44×44 minimum (→ audit UX 17/09, 2.2 — "actuellement 20×20") : même
                         markup que ItineraireComposeView.tsx, non partagé mais tenu identique. */
                      <div className="no-print flex-shrink-0 flex items-center gap-2">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => onMoveStop(dayIndex, stopIndex, -1)}
                            disabled={isFirstOverall}
                            aria-label={t("monter")}
                            className="focus-ring-aube w-11 h-11 flex items-center justify-center rounded-lg border transition-colors hover:bg-white/5 disabled:opacity-30 disabled:cursor-default cursor-pointer"
                            style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => onMoveStop(dayIndex, stopIndex, 1)}
                            disabled={isLastOverall}
                            aria-label={t("descendre")}
                            className="focus-ring-aube w-11 h-11 flex items-center justify-center rounded-lg border transition-colors hover:bg-white/5 disabled:opacity-30 disabled:cursor-default cursor-pointer"
                            style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
                          >
                            ▼
                          </button>
                        </div>
                        <button
                          onClick={() => onRemoveStop(dayIndex, stopIndex)}
                          aria-label={t("retirer")}
                          title={t("retirer")}
                          className="focus-ring-aube w-11 h-11 flex items-center justify-center rounded-lg border transition-colors hover:bg-white/5 cursor-pointer"
                          style={{ borderColor: "#B84040", color: "#E07A7A" }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {day.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>{t("glisseUnLieu")}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Map */}
      {mapStops.length > 0 && (
        <div className="no-print mb-10">
          <BuilderMap stops={mapStops} />
        </div>
      )}

      {/* Programme */}
      <ProgrammeSection days={currentDays} dureeKey={dureeKey} mode={mode} depart={depart} heureDebutMinutes={heureDebutMinutes} />

      {/* Booking */}
      <BookingSection days={currentDays} date={date} />

      {/* Bonus : lieux écartés faute de temps (ou suggestions à proximité pour un itinéraire
          déjà sauvegardé), discret pour ne pas concurrencer l'itinéraire lui-même */}
      {bonusSuggestions.items.length > 0 && (
        <section id="suggestions-bonus" className="no-print mt-10 pt-8" style={{ borderTop: "1px solid var(--line)" }}>
          <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
            {bonusSuggestions.mode === "excluded" ? t("maisEncore") : t("aProximite")}
          </h2>
          <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
            {bonusSuggestions.mode === "excluded" ? t("maisEncoreSubtitle") : t("aProximiteSubtitle")}
          </p>
          <div className="flex flex-wrap gap-3">
            {bonusSuggestions.items.map((item) => (
              <Link
                key={item.slug}
                href={`/lieux/${item.slug}`}
                target="_blank"
                className="flex items-center gap-2 pr-3 rounded-full overflow-hidden transition-colors hover:bg-white/5"
                style={{ background: "var(--surface)" }}
              >
                <Photo src={item.thumbImage} alt="" className="w-9 h-9 object-cover flex-shrink-0" />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{loc(locale, item.nomEn, item.nom)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
