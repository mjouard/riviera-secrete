import dynamic from "next/dynamic";
import Link from "next/link";
import type { Lieu } from "@/lib/types";
import { imgUrl } from "@/lib/utils";
import { DUREE_META, parseVisitMinutes, type DureeKey } from "@/lib/itineraire-logic";
import { BADGE_DEFS_BY_SLUG } from "@/lib/home-data";
import ProgrammeSection from "./ProgrammeSection";
import BookingSection from "./BookingSection";

const BuilderMap = dynamic(() => import("@/components/BuilderMap"), { ssr: false });

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://frontend-two-plum-92.vercel.app";
const SITE_DISPLAY_URL = SITE_URL.replace(/^https?:\/\//, "");

export default function ResultsView({
  currentDays, excluded, bonusSuggestions, dureeKey, currentNom, mapStops, savedBanner,
  editMode, onBack, onToggleEdit, onMoveStop, onRemoveStop, onDragStart, onDragOver, onSaveClick,
}: {
  currentDays: Lieu[][];
  excluded: Lieu[];
  bonusSuggestions: {
    mode: "excluded" | "related";
    items: Array<{ slug: string; nom: string; thumbImage: string }>;
  };
  dureeKey: DureeKey;
  currentNom: string;
  mapStops: Array<{ lat: number; lng: number; nom: string }>;
  savedBanner: boolean;
  editMode: boolean;
  onBack: () => void;
  onToggleEdit: () => void;
  onMoveStop: (dayIndex: number, stopIndex: number, dir: -1 | 1) => void;
  onRemoveStop: (dayIndex: number, stopIndex: number) => void;
  onDragStart: (dayIndex: number, stopIndex: number) => void;
  onDragOver: (e: React.DragEvent, targetDay: number, targetStop: number) => void;
  onSaveClick: () => void;
}) {
  const nbLieux = currentDays.flat().length;

  return (
    <div>
      <div className="print-header">
        <p className="print-header-url">{SITE_DISPLAY_URL}</p>
        <h1>{currentNom || `Itinéraire ${DUREE_META[dureeKey].label}`}</h1>
        <p className="print-header-meta">
          {currentDays.length} jour{currentDays.length > 1 ? "s" : ""} · {nbLieux} lieu{nbLieux > 1 ? "x" : ""}
        </p>
      </div>

      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {currentNom || `Itinéraire ${DUREE_META[dureeKey].label}`}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {currentDays.length} jour{currentDays.length > 1 ? "s" : ""} · {nbLieux} lieu{nbLieux > 1 ? "x" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onBack} className="text-sm px-3 py-2 rounded-lg border transition-colors hover:bg-white/5" style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}>
            ← Choisir d&apos;autres lieux
          </button>
          <button onClick={() => window.print()} className="text-sm px-3 py-2 rounded-lg border transition-colors hover:bg-white/5" style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}>
            🖨 Exporter en PDF
          </button>
          {editMode ? (
            <button onClick={onSaveClick} className="text-sm px-3 py-2 rounded-lg font-semibold" style={{ background: "var(--azure)", color: "#0c1116" }}>
              Sauvegarder
            </button>
          ) : (
            <button onClick={onToggleEdit} className="text-sm px-3 py-2 rounded-lg font-semibold" style={{ background: "var(--azure)", color: "#0c1116" }}>
              ✏️ Modifier
            </button>
          )}
        </div>
      </div>

      {savedBanner && (
        <div className="no-print mb-6 rounded-xl p-4 text-sm flex items-center gap-3" style={{ background: "rgba(79,195,201,0.1)", color: "var(--azure)" }}>
          ✓ Itinéraire sauvegardé. <Link href="/mes-itineraires" className="underline">Voir mes itinéraires</Link>
        </div>
      )}

      {excluded.length > 0 && (
        <p className="no-print mb-6 text-sm rounded-xl p-3" style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
          {excluded.length} lieu{excluded.length > 1 ? "x" : ""} non inclus faute de temps —{" "}
          <a href="#suggestions-bonus" className="underline" style={{ color: "var(--azure)" }}>
            à voir en bas de page
          </a>
          .
        </p>
      )}

      {/* Day columns */}
      <div className="print-days grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-10">
        {currentDays.map((day, dayIndex) => (
          <div key={dayIndex} className="print-day rounded-xl p-4" style={{ background: "var(--surface)" }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--azure)" }}>
              Jour {dayIndex + 1} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>— {day.length} lieu{day.length > 1 ? "x" : ""}</span>
            </h3>
            <div
              className="builder-day-stops space-y-2"
              onDragOver={(e) => e.preventDefault()}
            >
              {day.map((lieu, stopIndex) => {
                const isFirstOverall = dayIndex === 0 && stopIndex === 0;
                const isLastOverall = dayIndex === currentDays.length - 1 && stopIndex === day.length - 1;
                const visitMin = parseVisitMinutes(lieu);
                const dureeLabel = visitMin >= 60 ? `~${(visitMin / 60).toFixed(visitMin % 60 ? 1 : 0)} h` : `~${visitMin} min`;

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
                      <img src={imgUrl(lieu.thumbImage)} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/lieux/${lieu.slug}`} target="_blank" className="text-sm font-semibold hover:underline line-clamp-1">
                        {lieu.nom}
                      </Link>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{lieu.commune}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>⏱ {dureeLabel}</p>
                      {lieu.badges.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {lieu.badges.map((id) => {
                            const def = BADGE_DEFS_BY_SLUG[id];
                            return def ? (
                              <span key={id} className="text-xs" style={{ color: "var(--text-muted)" }}>{def.emoji}</span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                    {editMode && (
                      <div className="no-print flex flex-col items-center gap-1 flex-shrink-0">
                        <button onClick={() => onMoveStop(dayIndex, stopIndex, -1)} disabled={isFirstOverall} className="text-xs px-1 py-0.5 rounded disabled:opacity-30" style={{ color: "var(--text-muted)" }} aria-label="Monter">▲</button>
                        <button onClick={() => onRemoveStop(dayIndex, stopIndex)} className="text-xs px-1 py-0.5 rounded" style={{ color: "var(--text-muted)" }} aria-label="Retirer">✕</button>
                        <button onClick={() => onMoveStop(dayIndex, stopIndex, 1)} disabled={isLastOverall} className="text-xs px-1 py-0.5 rounded disabled:opacity-30" style={{ color: "var(--text-muted)" }} aria-label="Descendre">▼</button>
                      </div>
                    )}
                  </div>
                );
              })}
              {day.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>Glisse un lieu ici</p>
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
      <ProgrammeSection days={currentDays} dureeKey={dureeKey} />

      {/* Booking */}
      <BookingSection days={currentDays} />

      {/* Bonus : lieux écartés faute de temps (ou suggestions à proximité pour un itinéraire
          déjà sauvegardé), discret pour ne pas concurrencer l'itinéraire lui-même */}
      {bonusSuggestions.items.length > 0 && (
        <section id="suggestions-bonus" className="no-print mt-10 pt-8" style={{ borderTop: "1px solid var(--line)" }}>
          <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
            {bonusSuggestions.mode === "excluded" ? "🎁 Mais encore…" : "🎁 À proximité"}
          </h2>
          <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
            {bonusSuggestions.mode === "excluded"
              ? "Ces lieux n'ont pas trouvé de place dans le planning demandé, mais méritent le détour si tu as un peu plus de temps."
              : "D'autres lieux à découvrir près de ton itinéraire."}
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
                <img src={imgUrl(item.thumbImage)} alt="" className="w-9 h-9 object-cover flex-shrink-0" loading="lazy" />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{item.nom}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
