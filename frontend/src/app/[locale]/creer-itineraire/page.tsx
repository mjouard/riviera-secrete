"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import type { Lieu } from "@/lib/types";
import { redirectToConnexion } from "@/lib/utils";
import { DUREE_META, decodeJours, encodeJours, type DureeKey, generateItineraire } from "@/lib/itineraire-logic";
import { ecrireSelectionPersistee, lireSelectionPersistee } from "@/lib/brouillon-itineraire";
import PickerView from "./_components/PickerView";
import ResultsView from "./_components/ResultsView";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useToast } from "@/components/Toast";

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
  const t = useTranslations("creerItineraire");
  const tCommon = useTranslations("common");
  const tDuree = useTranslations("dureeLabels");
  const { data: session, status } = useSession();
  const { showError } = useToast();
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
  /** Affiché quand on valide la modale avec un nom vide — sans quoi le bouton ne fait rien. */
  const [nomErreur, setNomErreur] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  /** Lecture seule à l'ouverture d'un itinéraire déjà sauvegardé (gagne en lisibilité) —
   * true par défaut pour un itinéraire fraîchement généré, pas encore sauvegardé. */
  const [editMode, setEditMode] = useState(true);
  /** Itinéraire éditorial dont on est parti (`?source=`), pour l'annoncer et y renvoyer. */
  const [source, setSource] = useState<{ slug: string; titre: string; titreEn?: string | null } | null>(null);
  /** Toast "Annuler" après un retrait (même pattern que ItineraireComposeView.tsx). */
  const [removedStop, setRemovedStop] = useState<{ dayIndex: number; stopIndex: number; lieu: Lieu } | null>(null);

  // Drag-and-drop
  const dragging = useRef<{ dayIndex: number; stopIndex: number } | null>(null);
  const dbIdAttempted = useRef<string | null>(null);
  const draftRestoreAttempted = useRef(false);
  /** Passe à vrai quand le montage a fini de lire l'URL — voir l'effet de synchronisation. */
  const selectionHydratee = useRef(false);

  const lieuBySlug = useMemo(() => new Map(lieux.map((l) => [l.slug, l])), [lieux]);

  // Fetch lieux (once)
  useEffect(() => {
    api.lieux.list().then((data) => {
      setLieux(data);
      setLoading(false);

      const params = new URLSearchParams(window.location.search);

      const map = new Map(data.map((l) => [l.slug, l]));

      const duree = params.get("duree");
      if (duree && duree in DUREE_META) setDureeKey(duree as DureeKey);

      // `?jours=` : itinéraire déjà composé, partagé par lien. Prioritaire sur `?add=`,
      // qui n'exprime qu'une pré-sélection — on ouvre directement le résultat, en
      // conservant la répartition par jour telle que l'expéditeur l'avait arrangée.
      const jours = params.get("jours");
      if (jours) {
        const parJour = decodeJours(jours, new Set(map.keys()));
        if (parJour.flat().length > 0) {
          setCurrentDays(parJour.map((j) => j.map((s) => map.get(s)!) ));
          setSelectedSlugs(new Set(parJour.flat()));
          setCurrentNom(params.get("nom") ?? "");
          setEditMode(true);
          setView("results");
          return;
        }
      }

      // Pré-sélection du sélecteur, par cumul de trois sources.
      //
      // `?add=` accepte un slug seul (bouton "Ajouter à un itinéraire" d'une fiche lieu) ou
      // plusieurs séparés par des virgules (bouton "Partir de cet itinéraire" d'un
      // itinéraire éditorial). Les slugs inconnus sont ignorés silencieusement : une URL
      // partagée après un renommage de lieu doit pré-remplir ce qui reste valide plutôt que
      // de ne rien faire.
      //
      // Il **s'ajoute** désormais à ce qui était déjà sélectionné, au lieu de le remplacer
      // (PR-02) : le verbe « ajouter » promettait un panier qui n'existait pas. La base vient
      // de `?lieux=` s'il est là (lien rechargé ou partagé, qui fait foi), sinon du brouillon
      // de session — seul moyen de cumuler deux ajouts faits depuis deux fiches différentes,
      // chacun étant une navigation qui remonte cette page (voir brouillon-itineraire.ts).
      const valider = (brut: string | null) =>
        (brut ?? "").split(",").map((s) => s.trim()).filter((s) => map.has(s));

      const ajouts = valider(params.get("add"));
      const sourceSlug = params.get("source");
      const depuisUrl = valider(params.get("lieux"));

      // « Partir de cet itinéraire » remplace au lieu de cumuler : le visiteur a cliqué sur
      // CET itinéraire-là, le mêler à un brouillon en cours lui donnerait autre chose que ce
      // qu'il vient de lire.
      const base = sourceSlug
        ? []
        : depuisUrl.length > 0
          ? depuisUrl
          : lireSelectionPersistee().filter((s) => map.has(s));

      const selection = [...new Set([...base, ...ajouts])];
      if (selection.length > 0) {
        setSelectedSlugs(new Set(selection));
        setExpandedRegions(new Set(selection.map((s) => map.get(s)!.regionSlug)));
      }

      // `?source=` : on vient d'un itinéraire éditorial via "Partir de cet itinéraire". On
      // génère tout de suite et on garde toutes les étapes — le visiteur a cliqué sur CET
      // itinéraire-là, le déposer sur le sélecteur avec des cases pré-cochées lui demandait
      // une étape de plus pour retrouver ce qu'il venait de lire.
      if (sourceSlug && ajouts.length > 0) {
        const dureeSource = duree && duree in DUREE_META ? (duree as DureeKey) : "journee";
        const candidats = ajouts.map((s) => map.get(s)!);
        const { days } = generateItineraire(candidats, dureeSource, { garderTous: true });
        setCurrentDays(days);
        setExcluded([]);
        setEditMode(true);
        setView("results");
        // Le nom sert au bandeau « Basé sur : … ». Son absence (slug inconnu, API
        // indisponible) ne doit pas empêcher l'itinéraire de s'afficher.
        api.itineraires.bySlug(sourceSlug)
          .then((it) => it && setSource({ slug: sourceSlug, titre: it.titre, titreEn: it.titreEn }))
          .catch(() => {});
      }

      // À partir d'ici le sélecteur possède l'URL : l'effet de synchronisation peut écrire
      // sans risquer d'effacer les paramètres qu'on vient tout juste de lire.
      selectionHydratee.current = true;
    }).catch(() => setLoading(false));
  }, []);

  // Load from ?id= param once lieux + session are ready
  useEffect(() => {
    if (loading) return;
    if (status === "loading") return;
    if (!session) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) return;
    if (view === "results") return;
    if (dbIdAttempted.current === id) return;
    dbIdAttempted.current = id;

    const map = new Map(lieux.map((l) => [l.slug, l]));
    fetch("/api/proxy/my-itineraires")
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
      .catch(() => showError("Impossible de charger votre itinéraire — vérifiez votre connexion."));
  }, [loading, status, session, lieux, view, showError]);

  // Restaure un brouillon perdu au moment de se connecter pour sauvegarder
  useEffect(() => {
    function restoreDraft() {
      if (loading) return;
      if (status === "loading") return;
      if (!session) return;
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

  /**
   * Sélection du sélecteur → URL + brouillon de session (PR-01).
   *
   * Avant, après génération comme pendant la sélection, l'URL restait `/creer-itineraire`
   * nue : un F5 ou un retour arrière effaçait tout le travail. Deux écritures selon l'étape —
   * `?lieux=` tant qu'on choisit, `?jours=` une fois l'itinéraire composé (même encodage que
   * le lien de partage déjà produit par ResultsView, donc rechargeable par le même chemin).
   *
   * `replaceState` et non `pushState` : empiler une entrée par case cochée rendrait le bouton
   * Précédent inutilisable. Conséquence assumée, Précédent depuis le résultat ne revient pas
   * au sélecteur — mais le brouillon de session, lui, le retrouve.
   */
  useEffect(() => {
    if (!selectionHydratee.current) return;
    // Ces trois-là désignent un itinéraire déjà constitué : leur URL ne nous appartient pas.
    const params = new URLSearchParams(window.location.search);
    if (params.has("id") || params.has("source")) return;

    const sortie = new URLSearchParams();
    if (view === "results" && currentDays.flat().length > 0) {
      sortie.set("jours", encodeJours(currentDays));
      if (currentNom) sortie.set("nom", currentNom);
    } else if (view === "picker") {
      const slugs = Array.from(selectedSlugs);
      ecrireSelectionPersistee(slugs);
      if (slugs.length > 0) sortie.set("lieux", slugs.join(","));
    } else {
      return;
    }
    if (dureeKey !== "journee") sortie.set("duree", dureeKey);

    const query = sortie.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  }, [view, selectedSlugs, dureeKey, currentDays, currentNom]);

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
      const [lieu] = days[dayIndex].splice(stopIndex, 1);
      setRemovedStop({ dayIndex, stopIndex, lieu });
      return days;
    });
  };

  const annulerRetraitStop = () => {
    if (!removedStop) return;
    const { dayIndex, stopIndex, lieu } = removedStop;
    setCurrentDays((prev) => {
      const days = prev.map((d) => [...d]);
      days[dayIndex].splice(stopIndex, 0, lieu);
      return days;
    });
    setRemovedStop(null);
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
        items: excluded.map((l) => ({ slug: l.slug, nom: l.nom, nomEn: l.nomEn, thumbImage: l.thumbImage })),
      };
    }
    const includedSlugs = new Set(currentDays.flat().map((l) => l.slug));
    const seen = new Set<string>();
    // related[] est un snapshot JSON sans variante *En (voir project_version_anglaise.md) —
    // nomEn reste undefined ici, loc() retombe sur le français côté ResultsView.
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

  /**
   * Nom proposé par défaut dans la modale de sauvegarde. Un champ vide en fin de parcours
   * (6-7 étapes) est un cul-de-sac : rien n'indique que nommer est obligatoire, et le
   * bouton reste sans effet tant qu'on n'a pas tapé quelque chose. On pré-remplit donc
   * avec le titre déjà affiché en haut du résultat, précisé par la commune de la première
   * étape pour distinguer deux itinéraires de même durée dans /mes-itineraires.
   */
  const nomParDefaut = () => {
    const base = t("itineraireFallback", { duree: tDuree(dureeKey) });
    const premier = currentDays.flat()[0];
    return premier ? `${base} — ${premier.commune}` : base;
  };

  const handleSave = async () => {
    const nom = saveInput.trim();
    if (!nom) { setNomErreur(true); return; }
    setNomErreur(false);
    if (!session) {
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
        await fetch(`/api/proxy/my-itineraires/${currentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nom, dureeKey, days: slugDays }),
        });
        id = currentId;
      } else {
        const res = await fetch("/api/proxy/my-itineraires", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        {t("chargement")}
      </div>
    );
  }

  return (
    <div className="print-page max-w-4xl mx-auto px-6 py-12">
      <nav className="no-print text-sm mb-8 flex gap-2" style={{ color: "var(--text-muted)" }}>
        <Link href="/" className="hover:text-white transition-colors">{tCommon("accueil")}</Link>
        <span>/</span>
        <span style={{ color: "var(--text)" }}>{t("breadcrumb")}</span>
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
          source={source}
          onBack={() => { setView("picker"); setSavedBanner(false); }}
          onMoveStop={moveStop}
          onRemoveStop={removeStop}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          removedStop={removedStop}
          onUndoRemoveStop={annulerRetraitStop}
          onDismissRemovedStop={() => setRemovedStop(null)}
          onSaveClick={() => { setSaveInput(currentNom || nomParDefaut()); setNomErreur(false); setShowSaveModal(true); }}
          editMode={editMode}
          onToggleEdit={() => setEditMode(true)}
        />
      )}

      {showSaveModal && (
        <Modal open={showSaveModal} onClose={() => setShowSaveModal(false)} titleId="save-modal-titre">
          <h2 id="save-modal-titre" className="text-lg font-semibold mb-2">{t("nommerItineraire")}</h2>
          <label htmlFor="save-modal-nom" className="block text-xs mb-2" style={{ color: "var(--text-muted)" }}>
            {t("nomLabel")}
          </label>
          <Field
            id="save-modal-nom"
            className="text-sm"
            style={{ borderColor: nomErreur ? "var(--terracotta)" : undefined }}
            value={saveInput}
            onChange={(e) => { setSaveInput(e.target.value); if (nomErreur) setNomErreur(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") void handleSave(); }}
            placeholder={t("nomPlaceholder")}
            aria-invalid={nomErreur}
            aria-describedby={nomErreur ? "save-modal-erreur" : undefined}
            autoFocus
          />
          <p
            id="save-modal-erreur"
            role="alert"
            className="text-xs mt-2 min-h-4"
            style={{ color: "var(--terracotta)" }}
          >
            {nomErreur ? t("nomRequis") : ""}
          </p>
          {!session && (
            <p className="text-xs mt-1 mb-2" style={{ color: "var(--text-muted)" }}>
              {t("connexionExplication")}
            </p>
          )}
          <div className="flex gap-3 justify-end mt-3">
            <Button type="button" variant="discret" onClick={() => setShowSaveModal(false)}>
              {t("annuler")}
            </Button>
            {/* Le libellé décrit l'action, jamais l'état : « Connexion requise » se lisait
                comme un bouton qui mène à la connexion, alors qu'il ne bougeait pas tant
                que le champ était vide. */}
            <Button
              type="button"
              variant="primaire"
              onClick={() => void handleSave()}
              disabled={saving}
            >
              {saving ? t("sauvegardeEnCours") : session ? t("sauvegarder") : t("seConnecterEtSauvegarder")}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
