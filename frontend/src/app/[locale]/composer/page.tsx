"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { api, authFetch } from "@/lib/api";
import type { Lieu, Ville } from "@/lib/types";
import { redirectToConnexion } from "@/lib/utils";
import {
  DEBUT_JOURNEE_MINUTES,
  DUREE_META,
  construirePlanning,
  decodeJours,
  encodeJours,
  generateItineraire,
  parseHeureMinutes,
  parseVisitMinutes,
  type DureeKey,
  type TransportMode,
} from "@/lib/itineraire-logic";
import { useAujourdhui, dateISOLocale } from "@/lib/aujourdhui";
import ComposerParamsBar from "./_components/ComposerParamsBar";
import ComposerPicker from "./_components/ComposerPicker";
import ComposerRecap from "./_components/ComposerRecap";
import ComposerMobileBar from "./_components/ComposerMobileBar";
// Réutilise la vue résultat de /creer-itineraire telle quelle (ROADMAP Lot 4c) : elle
// accepte déjà mode/depart/heureDebutMinutes/date, ajoutés cette nuit précisément pour ce
// nouvel écran (voir ResultsView.tsx). La dupliquer aurait fait diverger tôt ou tard le
// calcul des horaires entre les deux points d'entrée du générateur.
import ResultsView from "../creer-itineraire/_components/ResultsView";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

type View = "picker" | "results";

const DEFAULT_HEURE = "09:00";
const DRAFT_KEY = "composer:draft-before-login";
interface Draft {
  nom: string;
  dureeKey: DureeKey;
  daySlugs: string[][];
}

export default function ComposerPage() {
  const t = useTranslations("composer");
  const tCommon = useTranslations("common");
  const tCreer = useTranslations("creerItineraire");
  const tDuree = useTranslations("dureeLabels");
  const { data: session, status } = useSession();

  const [lieux, setLieux] = useState<Lieu[]>([]);
  const [villes, setVilles] = useState<Ville[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("picker");

  // Bandeau de paramètres
  const [dureeKey, setDureeKey] = useState<DureeKey>("journee");
  const [mode, setMode] = useState<TransportMode>("voiture");
  const [departSlug, setDepartSlug] = useState("");
  const [heure, setHeure] = useState(DEFAULT_HEURE);
  const [dateStr, setDateStr] = useState("");
  const dateVenueDeLUrl = useRef(false);

  // Sélection + filtres du picker
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [zone, setZone] = useState("");
  const [favorisOnly, setFavorisOnly] = useState(false);
  const [favorisSlugs, setFavorisSlugs] = useState<string[] | null>(null);

  // Résultat composé
  const [currentDays, setCurrentDays] = useState<Lieu[][]>([]);
  const [excluded, setExcluded] = useState<Lieu[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [currentNom, setCurrentNom] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveInput, setSaveInput] = useState("");
  const [nomErreur, setNomErreur] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(true);

  const dragging = useRef<{ dayIndex: number; stopIndex: number } | null>(null);
  const draftRestoreAttempted = useRef(false);
  const selectionHydratee = useRef(false);

  const lieuBySlug = useMemo(() => new Map(lieux.map((l) => [l.slug, l])), [lieux]);
  const villeBySlug = useMemo(() => new Map(villes.map((v) => [v.slug, v])), [villes]);

  // ─── Chargement initial + lecture de l'URL ────────────────────────────────
  useEffect(() => {
    Promise.all([api.lieux.list(), api.villes.list()])
      .then(([lieuxData, villesData]) => {
        setLieux(lieuxData);
        setVilles(villesData);
        setLoading(false);

        const params = new URLSearchParams(window.location.search);
        const map = new Map(lieuxData.map((l) => [l.slug, l]));
        const villeSlugs = new Set(villesData.map((v) => v.slug));

        const duree = params.get("duree");
        if (duree && duree in DUREE_META) setDureeKey(duree as DureeKey);

        const modeParam = params.get("mode");
        if (modeParam === "voiture" || modeParam === "transport-commun") setMode(modeParam);

        const departParam = params.get("depart");
        if (departParam && villeSlugs.has(departParam)) setDepartSlug(departParam);

        const heureParam = params.get("heure");
        if (heureParam && parseHeureMinutes(heureParam) !== null) setHeure(heureParam);

        const dateParam = params.get("date");
        if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
          setDateStr(dateParam);
          dateVenueDeLUrl.current = true;
        }

        setQ(params.get("q") ?? "");
        const zoneParam = params.get("zone");
        if (zoneParam) setZone(zoneParam);

        // `?jours=` : composition déjà faite, partagée par lien — on rouvre directement le
        // résultat (même logique que /creer-itineraire, voir ce fichier pour le détail).
        const jours = params.get("jours");
        if (jours) {
          const parJour = decodeJours(jours, new Set(map.keys()));
          if (parJour.flat().length > 0) {
            setCurrentDays(parJour.map((j) => j.map((s) => map.get(s)!)));
            setSelectedSlugs(new Set(parJour.flat()));
            setCurrentNom(params.get("nom") ?? "");
            setEditMode(true);
            setView("results");
            selectionHydratee.current = true;
            return;
          }
        }

        const valider = (brut: string | null) =>
          (brut ?? "").split(",").map((s) => s.trim()).filter((s) => map.has(s));
        const selection = [...new Set([...valider(params.get("lieux")), ...valider(params.get("add"))])];
        if (selection.length > 0) setSelectedSlugs(new Set(selection));

        selectionHydratee.current = true;
      })
      .catch(() => setLoading(false));
  }, []);

  // Date de voyage par défaut = aujourd'hui, résolue côté client une fois l'horloge du
  // visiteur connue (voir aujourdhui.ts) — sauf si l'URL en imposait déjà une.
  const maintenant = useAujourdhui();
  useEffect(() => {
    if (!dateStr && !dateVenueDeLUrl.current && maintenant) setDateStr(dateISOLocale(maintenant));
  }, [maintenant, dateStr]);

  // Favoris du visiteur connecté — pont manquant entre /mes-favoris et le générateur (→ PA-04).
  useEffect(() => {
    function chargerFavoris() {
      if (!session?.apiToken) { setFavorisSlugs(null); return; }
      authFetch("/api/favorites", session.apiToken)
        .then((r) => (r.ok ? r.json() : []))
        .then(setFavorisSlugs)
        .catch(() => {});
    }
    chargerFavoris();
  }, [session]);

  // Restaure un brouillon perdu au moment de se connecter pour sauvegarder (même mécanisme
  // que /creer-itineraire, clé de stockage distincte pour ne pas se marcher dessus).
  useEffect(() => {
    function restoreDraft() {
      if (loading || status === "loading" || !session?.apiToken || draftRestoreAttempted.current) return;
      draftRestoreAttempted.current = true;
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      sessionStorage.removeItem(DRAFT_KEY);
      try {
        const draft = JSON.parse(raw) as Draft;
        const map = new Map(lieux.map((l) => [l.slug, l]));
        const days = draft.daySlugs.map((day) => day.map((slug) => map.get(slug)).filter(Boolean) as Lieu[]);
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

  // ─── Dérivés du bandeau de paramètres ──────────────────────────────────────

  const depart = useMemo(() => {
    const v = departSlug ? villeBySlug.get(departSlug) : null;
    return v ? { lat: v.lat, lng: v.lng, nom: v.nom } : null;
  }, [departSlug, villeBySlug]);

  const heureDebutMinutes = useMemo(() => parseHeureMinutes(heure) ?? DEBUT_JOURNEE_MINUTES, [heure]);

  const dateVoyage = useMemo(() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }, [dateStr]);

  // ─── Sélection → aperçu vivant (récap) ─────────────────────────────────────

  const selectedLieux = useMemo(
    () => Array.from(selectedSlugs).map((s) => lieuBySlug.get(s)).filter(Boolean) as Lieu[],
    [selectedSlugs, lieuBySlug]
  );
  const preview = useMemo(
    () => generateItineraire(selectedLieux, dureeKey, { mode }),
    [selectedLieux, dureeKey, mode]
  );
  const previewFlat = useMemo(() => preview.days.flat(), [preview]);
  const previewPlanning = useMemo(
    () => construirePlanning(preview.days, dureeKey, { mode, depart, heureDebutMinutes }),
    [preview, dureeKey, mode, depart, heureDebutMinutes]
  );
  const previewTempsTotalMin = useMemo(
    () =>
      previewFlat.reduce((s, l) => s + parseVisitMinutes(l), 0) +
      previewPlanning.elements.reduce((s, el) => (el.type === "transit" ? s + el.minutes : s), 0),
    [previewFlat, previewPlanning]
  );

  const toggleLieu = useCallback((slug: string) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });
  }, []);

  const handleCompose = () => {
    if (selectedLieux.length === 0) return;
    setCurrentDays(preview.days);
    setExcluded(preview.excluded);
    setCurrentId(null);
    setCurrentNom("");
    setSavedBanner(false);
    setEditMode(true);
    setView("results");
  };

  // ─── Écriture de l'état dans l'URL (→ spec "Tout dans l'URL") ──────────────
  //
  // `history.replaceState`, pas `router.replace` : même raison que /creer-itineraire (voir ce
  // fichier) — un `pushState` par frappe/clic rendrait le bouton Précédent inutilisable, et
  // faire retraverser le routeur de Next à chaque changement de filtre n'apporte rien ici, le
  // rendu restant entièrement côté client.
  useEffect(() => {
    if (!selectionHydratee.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.has("id")) return;

    const sortie = new URLSearchParams();
    if (view === "results" && currentDays.flat().length > 0) {
      sortie.set("jours", encodeJours(currentDays));
      if (currentNom) sortie.set("nom", currentNom);
    } else if (view === "picker") {
      const slugs = Array.from(selectedSlugs);
      if (slugs.length > 0) sortie.set("lieux", slugs.join(","));
      if (q) sortie.set("q", q);
      if (zone) sortie.set("zone", zone);
    } else {
      return;
    }
    if (dureeKey !== "journee") sortie.set("duree", dureeKey);
    if (mode !== "voiture") sortie.set("mode", mode);
    if (departSlug) sortie.set("depart", departSlug);
    if (heure !== DEFAULT_HEURE) sortie.set("heure", heure);
    if (dateStr) sortie.set("date", dateStr);

    const query = sortie.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  }, [view, selectedSlugs, dureeKey, currentDays, currentNom, mode, departSlug, heure, dateStr, q, zone]);

  // ─── Vue résultat : réordonnancement, sauvegarde ───────────────────────────

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

  const bonusSuggestions = useMemo(() => {
    if (excluded.length > 0) {
      return {
        mode: "excluded" as const,
        items: excluded.map((l) => ({ slug: l.slug, nom: l.nom, nomEn: l.nomEn, thumbImage: l.thumbImage })),
      };
    }
    const includedSlugs = new Set(currentDays.flat().map((l) => l.slug));
    const seen = new Set<string>();
    const items: Array<{ slug: string; nom: string; nomEn?: string | null; thumbImage: string }> = [];
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

  const nomParDefaut = () => {
    const base = tCreer("itineraireFallback", { duree: tDuree(dureeKey) });
    const premier = currentDays.flat()[0];
    return premier ? `${base} — ${premier.commune}` : base;
  };

  const handleSave = async () => {
    const nom = saveInput.trim();
    if (!nom) { setNomErreur(true); return; }
    setNomErreur(false);
    if (!session?.apiToken) {
      const draft: Draft = { nom, dureeKey, daySlugs: currentDays.map((day) => day.map((l) => l.slug)) };
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
      window.history.replaceState(null, "", `${window.location.pathname}?id=${encodeURIComponent(id)}`);
    } catch {
      // silent — état inchangé si erreur réseau
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center" style={{ color: "var(--brume)" }}>
        {t("chargement")}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <nav className="no-print text-sm mb-8 flex gap-2" style={{ color: "var(--brume)" }}>
        <Link href="/" className="hover:text-white transition-colors">{tCommon("accueil")}</Link>
        <span>/</span>
        <span style={{ color: "var(--calcaire)" }}>{t("breadcrumb")}</span>
      </nav>

      {view === "picker" ? (
        <div className="pb-28 lg:pb-0">
          <h1 className="text-display mb-2" style={{ color: "var(--calcaire)" }}>{t("title")}</h1>
          <p className="text-body mb-6" style={{ color: "var(--brume)" }}>{t("subtitle")}</p>

          <ComposerParamsBar
            dureeKey={dureeKey}
            onDureeChange={setDureeKey}
            villes={villes}
            departSlug={departSlug}
            onDepartChange={setDepartSlug}
            heure={heure}
            onHeureChange={setHeure}
            date={dateStr}
            onDateChange={(v) => { setDateStr(v); dateVenueDeLUrl.current = true; }}
            dateMin={maintenant ? dateISOLocale(maintenant) : ""}
            mode={mode}
            onModeChange={setMode}
          />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_500px] gap-6 items-start">
            <ComposerPicker
              lieux={lieux}
              selectedSlugs={selectedSlugs}
              onToggle={toggleLieu}
              date={dateVoyage}
              q={q}
              onQChange={setQ}
              zone={zone}
              onZoneChange={setZone}
              favorisOnly={favorisOnly}
              onFavorisOnlyChange={setFavorisOnly}
              favorisSlugs={favorisSlugs}
            />
            <div className="hidden lg:block">
              <ComposerRecap
                days={preview.days}
                dureeKey={dureeKey}
                mode={mode}
                depart={depart}
                heureDebutMinutes={heureDebutMinutes}
                date={dateVoyage}
                tousLesLieux={lieux}
                selectedSlugs={selectedSlugs}
                onCompose={handleCompose}
              />
            </div>
          </div>

          <ComposerMobileBar
            nbLieux={previewFlat.length}
            tempsTotalMin={previewTempsTotalMin}
            onCompose={handleCompose}
          />
        </div>
      ) : (
        <ResultsView
          currentDays={currentDays}
          excluded={excluded}
          bonusSuggestions={bonusSuggestions}
          dureeKey={dureeKey}
          currentNom={currentNom}
          mapStops={mapStops}
          savedBanner={savedBanner}
          source={null}
          mode={mode}
          depart={depart}
          heureDebutMinutes={heureDebutMinutes}
          date={dateVoyage}
          onBack={() => { setView("picker"); setSavedBanner(false); }}
          onMoveStop={moveStop}
          onRemoveStop={removeStop}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onSaveClick={() => { setSaveInput(currentNom || nomParDefaut()); setNomErreur(false); setShowSaveModal(true); }}
          editMode={editMode}
          onToggleEdit={() => setEditMode(true)}
        />
      )}

      {showSaveModal && (
        <Modal open={showSaveModal} onClose={() => setShowSaveModal(false)} titleId="composer-save-modal-titre">
          <h2 id="composer-save-modal-titre" className="text-lg font-semibold mb-2">{tCreer("nommerItineraire")}</h2>
          <label htmlFor="composer-save-modal-nom" className="block text-xs mb-2" style={{ color: "var(--brume)" }}>
            {tCreer("nomLabel")}
          </label>
          <Field
            id="composer-save-modal-nom"
            className="text-sm"
            style={{ borderColor: nomErreur ? "var(--terracotta)" : undefined }}
            value={saveInput}
            onChange={(e) => { setSaveInput(e.target.value); if (nomErreur) setNomErreur(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") void handleSave(); }}
            placeholder={tCreer("nomPlaceholder")}
            aria-invalid={nomErreur}
            aria-describedby={nomErreur ? "composer-save-modal-erreur" : undefined}
            autoFocus
          />
          <p id="composer-save-modal-erreur" role="alert" className="text-xs mt-2 min-h-4" style={{ color: "var(--terracotta)" }}>
            {nomErreur ? tCreer("nomRequis") : ""}
          </p>
          {!session && (
            <p className="text-xs mt-1 mb-2" style={{ color: "var(--brume)" }}>
              {tCreer("connexionExplication")}
            </p>
          )}
          <div className="flex gap-3 justify-end mt-3">
            <Button type="button" variant="discret" onClick={() => setShowSaveModal(false)}>
              {tCreer("annuler")}
            </Button>
            <Button type="button" variant="primaire" onClick={() => void handleSave()} disabled={saving}>
              {saving ? tCreer("sauvegardeEnCours") : session ? tCreer("sauvegarder") : tCreer("seConnecterEtSauvegarder")}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
