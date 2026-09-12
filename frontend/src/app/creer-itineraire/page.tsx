"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api, authFetch } from "@/lib/api";
import type { Lieu } from "@/lib/types";
import { redirectToConnexion } from "@/lib/utils";
import { type DureeKey, generateItineraire } from "@/lib/itineraire-logic";
import PickerView from "./_components/PickerView";
import ResultsView from "./_components/ResultsView";

// ─── Types ───────────────────────────────────────────────────────────────────

type View = "picker" | "results";

/** Brouillon non sauvegardé, préservé le temps d'un aller-retour par /connexion. */
const DRAFT_KEY = "creer-itineraire:draft-before-login";
interface Draft {
  nom: string;
  dureeKey: DureeKey;
  daySlugs: string[][];
}

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
  /** Lecture seule à l'ouverture d'un itinéraire déjà sauvegardé (gagne en lisibilité) —
   * true par défaut pour un itinéraire fraîchement généré, pas encore sauvegardé. */
  const [editMode, setEditMode] = useState(true);

  // Drag-and-drop
  const dragging = useRef<{ dayIndex: number; stopIndex: number } | null>(null);
  const dbIdAttempted = useRef<string | null>(null);
  const draftRestoreAttempted = useRef(false);

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
          setEditMode(false);
          setView("results");
        }
      })
      .catch(() => {});
  }, [loading, status, session, lieux, view]);

  // Restaure un brouillon perdu au moment de se connecter pour sauvegarder
  useEffect(() => {
    function restoreDraft() {
      if (loading) return;
      if (status === "loading") return;
      if (!session?.apiToken) return;
      if (draftRestoreAttempted.current) return;
      draftRestoreAttempted.current = true;

      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      sessionStorage.removeItem(DRAFT_KEY);
      try {
        const draft = JSON.parse(raw) as Draft;
        const map = new Map(lieux.map((l) => [l.slug, l]));
        const days = draft.daySlugs.map(
          (day) => day.map((slug) => map.get(slug)).filter(Boolean) as Lieu[]
        );
        if (days.flat().length === 0) return;
        setCurrentDays(days);
        setDureeKey(draft.dureeKey);
        setCurrentNom(draft.nom);
        setSaveInput(draft.nom);
        setEditMode(true);
        setView("results");
        setShowSaveModal(true);
      } catch {
        // brouillon corrompu — on l'ignore silencieusement
      }
    }
    restoreDraft();
  }, [loading, status, session, lieux]);

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
    setEditMode(true);
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

  // Bonus "Mais encore…" : les lieux écartés faute de temps juste après une génération, ou —
  // pour un itinéraire déjà sauvegardé rechargé via ?id= (où cette liste d'origine n'existe
  // plus) — les lieux "à proximité" (related[]) de ceux déjà dans l'itinéraire.
  const bonusSuggestions = useMemo(() => {
    if (excluded.length > 0) {
      return {
        mode: "excluded" as const,
        items: excluded.map((l) => ({ slug: l.slug, nom: l.nom, thumbImage: l.thumbImage })),
      };
    }
    const includedSlugs = new Set(currentDays.flat().map((l) => l.slug));
    const seen = new Set<string>();
    const items: Array<{ slug: string; nom: string; thumbImage: string }> = [];
    for (const lieu of currentDays.flat()) {
      for (const rel of lieu.related || []) {
        const slug = rel.href.replace(/\.html$/, "");
        if (includedSlugs.has(slug) || seen.has(slug)) continue;
        seen.add(slug);
        items.push({ slug, nom: rel.titre, thumbImage: rel.img });
        if (items.length >= 6) break;
      }
      if (items.length >= 6) break;
    }
    return { mode: "related" as const, items };
  }, [excluded, currentDays]);

  const handleSave = async () => {
    const nom = saveInput.trim();
    if (!nom) return;
    if (!session?.apiToken) {
      const draft: Draft = {
        nom,
        dureeKey,
        daySlugs: currentDays.map((day) => day.map((l) => l.slug)),
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      redirectToConnexion();
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center" style={{ color: "var(--text-muted)" }}>
        Chargement…
      </div>
    );
  }

  return (
    <div className="print-page max-w-4xl mx-auto px-6 py-12">
      <nav className="no-print text-sm mb-8 flex gap-2" style={{ color: "var(--text-muted)" }}>
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
          bonusSuggestions={bonusSuggestions}
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
          editMode={editMode}
          onToggleEdit={() => setEditMode(true)}
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
