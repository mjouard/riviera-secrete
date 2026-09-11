"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api, authFetch } from "@/lib/api";
import type { Lieu, Activite } from "@/lib/types";
import { imgUrl, buildMapLinks } from "@/lib/utils";
import {
  DUREE_META, BADGE_DEFS, REGION_ORDER,
  type DureeKey,
  generateItineraire, parseVisitMinutes, travelMinutes,
  formatTime, formatTransitDesc, buildBookingActivites,
} from "@/lib/itineraire-logic";

const BuilderMap = dynamic(() => import("@/components/BuilderMap"), { ssr: false });

// ─── Types ───────────────────────────────────────────────────────────────────

type View = "picker" | "results";

// ─── Main page ───────────────────────────────────────────────────────────────

export default function CreerItinerairePage() {
  const { data: session, status } = useSession();
  const [lieux, setLieux] = useState<Lieu[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("picker");

  // Picker state
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [dureeKey, setDureeKey] = useState<DureeKey>("journee");
  const [showEmptyNote, setShowEmptyNote] = useState(false);

  // Results state
  const [currentDays, setCurrentDays] = useState<Lieu[][]>([]);
  const [excluded, setExcluded] = useState<Lieu[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [currentNom, setCurrentNom] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveInput, setSaveInput] = useState("");
  const [savedBanner, setSavedBanner] = useState(false);
  const [saving, setSaving] = useState(false);

  // Drag-and-drop
  const dragging = useRef<{ dayIndex: number; stopIndex: number } | null>(null);
  const dbIdAttempted = useRef<string | null>(null);

  const lieuBySlug = useMemo(() => new Map(lieux.map((l) => [l.slug, l])), [lieux]);

  // Fetch lieux (once)
  useEffect(() => {
    api.lieux.list().then((data) => {
      setLieux(data);
      setLoading(false);

      const params = new URLSearchParams(window.location.search);
      const add = params.get("add");
      if (add) {
        const map = new Map(data.map((l) => [l.slug, l]));
        if (map.has(add)) {
          setSelectedSlugs(new Set([add]));
          setExpandedRegions(new Set([map.get(add)!.regionSlug]));
        }
      }
    }).catch(() => setLoading(false));
  }, []);

  // Load from ?id= param once lieux + session are ready
  useEffect(() => {
    if (loading) return;
    if (status === "loading") return;
    if (!session?.apiToken) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) return;
    if (view === "results") return;
    if (dbIdAttempted.current === id) return;
    dbIdAttempted.current = id;

    const map = new Map(lieux.map((l) => [l.slug, l]));
    authFetch("/api/my-itineraires", session.apiToken)
      .then((r) => (r.ok ? r.json() : []))
      .then((itins: Array<{ id: string; nom: string; dureeKey: string; days: string[][] }>) => {
        const found = itins.find((it) => it.id === id);
        if (found) {
          setCurrentId(found.id);
          setCurrentNom(found.nom);
          setDureeKey(found.dureeKey as DureeKey);
          const days = found.days.map((day) =>
            day.map((slug) => map.get(slug)).filter(Boolean) as Lieu[]
          );
          setCurrentDays(days);
          setSelectedSlugs(new Set(found.days.flat()));
          setView("results");
        }
      })
      .catch(() => {});
  }, [loading, status, session, lieux, view]);

  // ─── Picker logic ──────────────────────────────────────────────────────────

  const byRegion = useMemo(() => {
    const m = new Map<string, Lieu[]>();
    lieux.forEach((l) => { (m.get(l.regionSlug) ?? m.set(l.regionSlug, []).get(l.regionSlug)!).push(l); });
    return m;
  }, [lieux]);

  const toggleLieu = useCallback((slug: string) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });
  }, []);

  const toggleRegion = useCallback((regionSlug: string, checked: boolean) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      byRegion.get(regionSlug)?.forEach((l) => { if (checked) next.add(l.slug); else next.delete(l.slug); });
      return next;
    });
  }, [byRegion]);

  const regionCheckState = useCallback((regionSlug: string) => {
    const regionLieux = byRegion.get(regionSlug) || [];
    const checked = regionLieux.filter((l) => selectedSlugs.has(l.slug)).length;
    return { checked: checked === regionLieux.length && regionLieux.length > 0, indeterminate: checked > 0 && checked < regionLieux.length };
  }, [byRegion, selectedSlugs]);

  const handleGenerate = () => {
    if (selectedSlugs.size === 0) { setShowEmptyNote(true); return; }
    setShowEmptyNote(false);
    const candidates = Array.from(selectedSlugs).map((s) => lieuBySlug.get(s)).filter(Boolean) as Lieu[];
    const result = generateItineraire(candidates, dureeKey);
    setCurrentDays(result.days);
    setExcluded(result.excluded);
    setCurrentId(null);
    setCurrentNom("");
    setSavedBanner(false);
    setView("results");
  };

  // ─── Results logic ─────────────────────────────────────────────────────────

  const moveStop = (dayIndex: number, stopIndex: number, direction: -1 | 1) => {
    setCurrentDays((prev) => {
      const days = prev.map((d) => [...d]);
      const targetIndex = stopIndex + direction;
      if (targetIndex >= 0 && targetIndex < days[dayIndex].length) {
        [days[dayIndex][stopIndex], days[dayIndex][targetIndex]] = [days[dayIndex][targetIndex], days[dayIndex][stopIndex]];
      } else if (direction === -1 && dayIndex > 0) {
        const [item] = days[dayIndex].splice(stopIndex, 1);
        days[dayIndex - 1].push(item);
      } else if (direction === 1 && dayIndex < days.length - 1) {
        const [item] = days[dayIndex].splice(stopIndex, 1);
        days[dayIndex + 1].unshift(item);
      } else return prev;
      return days;
    });
  };

  const removeStop = (dayIndex: number, stopIndex: number) => {
    setCurrentDays((prev) => {
      const days = prev.map((d) => [...d]);
      days[dayIndex].splice(stopIndex, 1);
      return days;
    });
  };

  const handleDragStart = (dayIndex: number, stopIndex: number) => {
    dragging.current = { dayIndex, stopIndex };
  };

  const handleDragOver = (e: React.DragEvent, targetDay: number, targetStop: number) => {
    e.preventDefault();
    if (!dragging.current) return;
    const { dayIndex: srcDay, stopIndex: srcStop } = dragging.current;
    if (srcDay === targetDay && srcStop === targetStop) return;

    setCurrentDays((prev) => {
      const days = prev.map((d) => [...d]);
      const [item] = days[srcDay].splice(srcStop, 1);
      let tgt = targetStop;
      if (srcDay === targetDay && srcStop < targetStop) tgt--;
      days[targetDay].splice(tgt, 0, item);
      dragging.current = { dayIndex: targetDay, stopIndex: tgt };
      return days;
    });
  };

  const mapStops = useMemo(
    () => currentDays.flat().map((l) => ({ lat: l.lat, lng: l.lng, nom: l.nom })),
    [currentDays]
  );

  const handleSave = async () => {
    const nom = saveInput.trim();
    if (!nom) return;
    if (!session?.apiToken) {
      window.location.href = "/connexion?callbackUrl=" + encodeURIComponent(window.location.href);
      return;
    }
    setSaving(true);
    try {
      const slugDays = currentDays.map((day) => day.map((l) => l.slug));
      let id: string;
      if (currentId) {
        await authFetch(`/api/my-itineraires/${currentId}`, session.apiToken, {
          method: "PUT",
          body: JSON.stringify({ nom, dureeKey, days: slugDays }),
        });
        id = currentId;
      } else {
        const res = await authFetch("/api/my-itineraires", session.apiToken, {
          method: "POST",
          body: JSON.stringify({ nom, dureeKey, days: slugDays }),
        });
        const data = await res.json();
        id = data.id;
      }
      setCurrentId(id);
      setCurrentNom(nom);
      setShowSaveModal(false);
      setSavedBanner(true);
      window.history.replaceState(null, "", `/creer-itineraire?id=${encodeURIComponent(id)}`);
    } catch {
      // silent — état inchangé si erreur réseau
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const dureeLabels: Record<DureeKey, string> = {
    "demi-journee": "Demi-journée", journee: "1 journée", "2-jours": "2 jours", "3-jours": "3 jours",
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center" style={{ color: "var(--text-muted)" }}>
        Chargement…
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <nav className="text-sm mb-8 flex gap-2" style={{ color: "var(--text-muted)" }}>
        <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
        <span>/</span>
        <span style={{ color: "var(--text)" }}>Créer un itinéraire</span>
      </nav>

      {view === "picker" ? (
        <PickerView
          byRegion={byRegion}
          selectedSlugs={selectedSlugs}
          expandedRegions={expandedRegions}
          dureeKey={dureeKey}
          showEmptyNote={showEmptyNote}
          onToggleLieu={toggleLieu}
          onToggleRegion={toggleRegion}
          onToggleExpand={(r) => setExpandedRegions((prev) => {
            const next = new Set(prev);
            if (next.has(r)) next.delete(r); else next.add(r);
            return next;
          })}
          onDureeChange={setDureeKey}
          onGenerate={handleGenerate}
          regionCheckState={regionCheckState}
        />
      ) : (
        <ResultsView
          currentDays={currentDays}
          excluded={excluded}
          dureeKey={dureeKey}
          currentNom={currentNom}
          mapStops={mapStops}
          savedBanner={savedBanner}
          onBack={() => { setView("picker"); setSavedBanner(false); }}
          onMoveStop={moveStop}
          onRemoveStop={removeStop}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onSaveClick={() => { setSaveInput(currentNom); setShowSaveModal(true); }}
        />
      )}

      {showSaveModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSaveModal(false); }}
        >
          <div className="rounded-2xl p-6 w-full max-w-sm mx-4" style={{ background: "var(--surface)" }}>
            <h2 className="text-lg font-semibold mb-4">Nommer l&apos;itinéraire</h2>
            <input
              className="w-full rounded-lg px-3 py-2 text-sm mb-4 outline-none"
              style={{ background: "var(--surface-hover)", color: "var(--text)", border: "1px solid var(--line)" }}
              value={saveInput}
              onChange={(e) => setSaveInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void handleSave(); }}
              placeholder="Mon itinéraire…"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowSaveModal(false)} className="text-sm px-4 py-2 rounded-lg transition-colors hover:bg-white/5" style={{ color: "var(--text-muted)" }}>
                Annuler
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={saving}
                className="text-sm px-4 py-2 rounded-lg font-semibold disabled:opacity-50 cursor-pointer disabled:cursor-default"
                style={{ background: "var(--azure)", color: "#0c1116" }}
              >
                {saving ? "Sauvegarde…" : session ? "Sauvegarder" : "Connexion requise"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PickerView ───────────────────────────────────────────────────────────────

function PickerView({
  byRegion, selectedSlugs, expandedRegions, dureeKey, showEmptyNote,
  onToggleLieu, onToggleRegion, onToggleExpand, onDureeChange, onGenerate, regionCheckState,
}: {
  byRegion: Map<string, Lieu[]>;
  selectedSlugs: Set<string>;
  expandedRegions: Set<string>;
  dureeKey: DureeKey;
  showEmptyNote: boolean;
  onToggleLieu: (slug: string) => void;
  onToggleRegion: (regionSlug: string, checked: boolean) => void;
  onToggleExpand: (regionSlug: string) => void;
  onDureeChange: (k: DureeKey) => void;
  onGenerate: () => void;
  regionCheckState: (slug: string) => { checked: boolean; indeterminate: boolean };
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Créer mon itinéraire</h1>
      <p className="mb-8" style={{ color: "var(--text-muted)" }}>
        Choisis une durée et les lieux qui t&apos;intéressent — l&apos;algorithme compose le meilleur itinéraire possible.
      </p>

      {/* Duration */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>Durée</h2>
        <div className="flex flex-wrap gap-3">
          {(Object.entries(DUREE_META) as [DureeKey, { label: string }][]).map(([key, { label }]) => (
            <label key={key} className="cursor-pointer">
              <input type="radio" name="duree" value={key} checked={dureeKey === key} onChange={() => onDureeChange(key)} className="sr-only" />
              <span
                className="inline-block px-4 py-2 rounded-full text-sm border transition-colors"
                style={{
                  borderColor: dureeKey === key ? "var(--azure)" : "var(--line)",
                  color: dureeKey === key ? "var(--azure)" : "var(--text-muted)",
                  background: dureeKey === key ? "rgba(79,195,201,0.08)" : "transparent",
                }}
              >
                {label}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Zones */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
          Lieux ({selectedSlugs.size} sélectionné{selectedSlugs.size !== 1 ? "s" : ""})
        </h2>
        <div className="space-y-2">
          {REGION_ORDER.filter((r) => byRegion.has(r)).map((regionSlug) => {
            const regionLieux = byRegion.get(regionSlug)!;
            const regionLabel = regionLieux[0].regionLabel;
            const open = expandedRegions.has(regionSlug);
            const { checked, indeterminate } = regionCheckState(regionSlug);

            return (
              <div key={regionSlug} className="rounded-xl overflow-hidden" style={{ background: "var(--surface)" }}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    ref={(el) => { if (el) el.indeterminate = indeterminate; }}
                    onChange={(e) => onToggleRegion(regionSlug, e.target.checked)}
                    className="w-4 h-4 cursor-pointer flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    className="flex-1 text-left flex items-center justify-between text-sm font-semibold"
                    onClick={() => onToggleExpand(regionSlug)}
                  >
                    <span>{regionLabel}</span>
                    <span className="text-xs font-normal ml-2" style={{ color: "var(--text-muted)" }}>
                      {regionLieux.length} lieux {open ? "▴" : "▾"}
                    </span>
                  </button>
                </div>
                {open && (
                  <div className="px-4 pb-3 grid gap-1 sm:grid-cols-2">
                    {regionLieux.map((l) => (
                      <label key={l.slug} className="flex items-center gap-2 cursor-pointer py-1">
                        <input
                          type="checkbox"
                          checked={selectedSlugs.has(l.slug)}
                          onChange={() => onToggleLieu(l.slug)}
                          className="w-4 h-4 cursor-pointer flex-shrink-0"
                        />
                        <span className="text-sm" style={{ color: "var(--text-muted)" }}>{l.nom}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {showEmptyNote && (
        <p className="mb-4 text-sm" style={{ color: "var(--terracotta)" }}>
          Sélectionne au moins un lieu.
        </p>
      )}

      <button
        onClick={onGenerate}
        className="px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
        style={{ background: "var(--terracotta)", color: "#0c1116" }}
      >
        Générer mon itinéraire →
      </button>
    </div>
  );
}

// ─── ResultsView ──────────────────────────────────────────────────────────────

function ResultsView({
  currentDays, excluded, dureeKey, currentNom, mapStops, savedBanner,
  onBack, onMoveStop, onRemoveStop, onDragStart, onDragOver, onSaveClick,
}: {
  currentDays: Lieu[][];
  excluded: Lieu[];
  dureeKey: DureeKey;
  currentNom: string;
  mapStops: Array<{ lat: number; lng: number; nom: string }>;
  savedBanner: boolean;
  onBack: () => void;
  onMoveStop: (dayIndex: number, stopIndex: number, dir: -1 | 1) => void;
  onRemoveStop: (dayIndex: number, stopIndex: number) => void;
  onDragStart: (dayIndex: number, stopIndex: number) => void;
  onDragOver: (e: React.DragEvent, targetDay: number, targetStop: number) => void;
  onSaveClick: () => void;
}) {
  const nbLieux = currentDays.flat().length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {currentNom || `Itinéraire ${DUREE_META[dureeKey].label}`}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {currentDays.length} jour{currentDays.length > 1 ? "s" : ""} · {nbLieux} lieu{nbLieux > 1 ? "x" : ""}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={onBack} className="text-sm px-3 py-2 rounded-lg border transition-colors hover:bg-white/5" style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}>
            ← Modifier
          </button>
          <button onClick={onSaveClick} className="text-sm px-3 py-2 rounded-lg font-semibold" style={{ background: "var(--azure)", color: "#0c1116" }}>
            Sauvegarder
          </button>
        </div>
      </div>

      {savedBanner && (
        <div className="mb-6 rounded-xl p-4 text-sm flex items-center gap-3" style={{ background: "rgba(79,195,201,0.1)", color: "var(--azure)" }}>
          ✓ Itinéraire sauvegardé. <Link href="/mes-itineraires" className="underline">Voir mes itinéraires</Link>
        </div>
      )}

      {excluded.length > 0 && (
        <p className="mb-6 text-sm rounded-xl p-3" style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
          {excluded.length} lieu{excluded.length > 1 ? "x" : ""} non inclus faute de temps :{" "}
          {excluded.map((l) => l.nom).join(", ")}.
        </p>
      )}

      {/* Day columns */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-10">
        {currentDays.map((day, dayIndex) => (
          <div key={dayIndex} className="rounded-xl p-4" style={{ background: "var(--surface)" }}>
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
                    draggable
                    onDragStart={() => onDragStart(dayIndex, stopIndex)}
                    onDragOver={(e) => onDragOver(e, dayIndex, stopIndex)}
                    className="builder-stop-card rounded-lg flex gap-3 p-2 cursor-grab active:cursor-grabbing"
                    style={{ background: "var(--surface-hover)" }}
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
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
                            const def = BADGE_DEFS[id];
                            return def ? (
                              <span key={id} className="text-xs" style={{ color: "var(--text-muted)" }}>{def.icon}</span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <button onClick={() => onMoveStop(dayIndex, stopIndex, -1)} disabled={isFirstOverall} className="text-xs px-1 py-0.5 rounded disabled:opacity-30" style={{ color: "var(--text-muted)" }} aria-label="Monter">▲</button>
                      <button onClick={() => onRemoveStop(dayIndex, stopIndex)} className="text-xs px-1 py-0.5 rounded" style={{ color: "var(--text-muted)" }} aria-label="Retirer">✕</button>
                      <button onClick={() => onMoveStop(dayIndex, stopIndex, 1)} disabled={isLastOverall} className="text-xs px-1 py-0.5 rounded disabled:opacity-30" style={{ color: "var(--text-muted)" }} aria-label="Descendre">▼</button>
                    </div>
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
        <div className="mb-10">
          <BuilderMap stops={mapStops} />
        </div>
      )}

      {/* Programme */}
      <ProgrammeSection days={currentDays} />

      {/* Booking */}
      <BookingSection days={currentDays} />
    </div>
  );
}

// ─── ProgrammeSection ─────────────────────────────────────────────────────────

function ProgrammeSection({ days }: { days: Lieu[][] }) {
  if (days.flat().length === 0) return null;

  type ProgramItem =
    | { type: "transit"; minutes: number }
    | { type: "sleep"; dayNum: number }
    | { type: "stop"; lieu: Lieu; heure: string };

  let timeMinutes = 9 * 60;
  let prevLieu: Lieu | null = null;
  const items: ProgramItem[] = [];

  days.forEach((day, dayIndex) => {
    day.forEach((lieu) => {
      if (prevLieu) {
        const transit = travelMinutes(prevLieu, lieu);
        items.push({ type: "transit", minutes: transit });
        timeMinutes += transit;
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
              <div key={i} className="text-sm py-2 px-4 rounded-lg" style={{ color: "var(--text-muted)", background: "var(--surface)" }}>
                🚗 {formatTransitDesc(item.minutes)}
              </div>
            );
          }
          if (item.type === "sleep") {
            return (
              <div key={i} className="rounded-xl p-4 flex items-center gap-4" style={{ background: "var(--surface)" }}>
                <span className="text-xs font-mono" style={{ color: "var(--azure)" }}>Nuit</span>
                <span className="text-sm font-semibold">Fin du jour {item.dayNum} — Hébergement au choix</span>
              </div>
            );
          }
          const l = item.lieu;
          return (
            <div key={i} className="rounded-xl p-4" style={{ background: "var(--surface)" }}>
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <span className="text-xs font-mono mr-2" style={{ color: "var(--azure)" }}>{item.heure}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{l.commune}</span>
                </div>
                <Link href={`/lieux/${l.slug}`} target="_blank" className="text-xs hover:underline flex-shrink-0" style={{ color: "var(--azure)" }}>
                  Voir le lieu →
                </Link>
              </div>
              <h3 className="font-semibold mb-2">{l.nom}</h3>
              {l.badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {l.badges.map((id) => {
                    const def = BADGE_DEFS[id];
                    return def ? (
                      <span key={id} className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--surface-hover)", color: "var(--text-muted)" }}>
                        {def.icon} {def.label}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
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

// ─── BookingSection ───────────────────────────────────────────────────────────

function BookingSection({ days }: { days: Lieu[][] }) {
  const bookings = buildBookingActivites(days);
  if (!bookings.length) return null;

  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold mb-2">À réserver avant de partir</h2>
      <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
        Ces expériences demandent un peu d&apos;anticipation, surtout en haute saison.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {bookings.map(({ lieu, activite: act }, i) => (
          <div key={i} className="rounded-xl overflow-hidden" style={{ background: "var(--surface)" }}>
            <div className="aspect-video overflow-hidden">
              <img src={imgUrl(act.image)} alt={act.alt} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="p-4">
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{lieu.nom}</p>
              <p className="font-semibold text-sm mb-1">{act.nom}</p>
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>⏱ {act.duree} · 💶 {act.prix}</p>
              <a href={act.url} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: "var(--azure)" }}>
                {act.linkText || "Réserver"} →
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
