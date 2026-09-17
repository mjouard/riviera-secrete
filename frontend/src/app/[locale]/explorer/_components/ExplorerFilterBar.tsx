"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { BADGE_DEFS } from "@/lib/home-data";
import { regionToMerShade } from "@/lib/mer-colors";
import { DUREES, NIVEAUX, SAISONS, TAG_DEFS } from "@/lib/lieu-filters";
import { Chip } from "@/components/ui/Chip";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { IconSearch } from "@/components/ui/Icons";
import { FilterDrawer } from "@/components/ui/FilterDrawer";
import ExplorerSelectChip from "./ExplorerSelectChip";
import type { FiltresExplorer } from "./ExplorerShell";

const REGION_SLUGS = ["menton-monaco", "nice", "arriere-pays", "antibes-cannes", "golfe-st-tropez"] as const;

/**
 * Barre de filtres unique pilotant carte ET liste (→ AI-04/NF-01) — ne touche jamais l'URL
 * elle-même, remonte chaque changement à ExplorerShell, seul point d'écriture.
 */
export default function ExplorerFilterBar({
  filtres,
  onChange,
  position,
  geoEtat,
  onToggleProximite,
  onSurprendsMoi,
  surprendsMoiDesactive,
  resultCount,
}: {
  filtres: FiltresExplorer;
  onChange: (patch: Partial<FiltresExplorer>) => void;
  position: { lat: number; lng: number } | null;
  geoEtat: "idle" | "chargement" | "refuse" | "indisponible";
  onToggleProximite: () => void;
  onSurprendsMoi: () => void;
  surprendsMoiDesactive: boolean;
  /** Nombre de lieux retenus par les filtres actifs — affiché sur le bouton du tiroir mobile. */
  resultCount: number;
}) {
  const t = useTranslations("explorer");
  const tRegion = useTranslations("regionShort");
  const tBadges = useTranslations("badges");
  const tTags = useTranslations("tags");
  const tFiltres = useTranslations("filtres");
  // presDeMoi*/localisation* vivaient dans "home" (ancienne HomeLieuxGrid) — réutilisées
  // telles quelles ici, portées vers /explorer (Lot 4e), pas dupliquées dans les messages.
  const tHome = useTranslations("home");

  /** Tiroir mobile (→ audit UX 17/09, 3.1) — regroupe tout sauf la recherche et les chips de
   * zone, qui restent visibles en permanence sur mobile (ligne défilante juste en dessous). */
  const [tiroirOuvert, setTiroirOuvert] = useState(false);

  const aUnFiltre = Object.values(filtres).some((v) => v !== "");
  const nbFiltresSecondaires = [filtres.badge, filtres.type, filtres.saison, filtres.duree, filtres.niveau, position ? "1" : ""].filter(Boolean).length;

  const zoneChips = REGION_SLUGS.map((slug) => (
    <Chip key={slug} selected={filtres.zone === slug} onClick={() => onChange({ zone: filtres.zone === slug ? "" : slug })}>
      <span
        aria-hidden="true"
        className="inline-block w-2.5 h-2.5 rounded-full mr-1.5"
        style={{ background: regionToMerShade(slug) }}
      />
      {tRegion(slug as "menton-monaco" | "nice" | "arriere-pays" | "antibes-cannes" | "golfe-st-tropez")}
    </Chip>
  ));

  /** Tout sauf la recherche et la zone — replié dans le tiroir mobile (→ audit UX 17/09, 3.1),
   * affiché tel quel sur desktop (même rendu utilisé aux deux endroits, cf. plus bas). */
  const filtresSecondaires = (
    <>
      {BADGE_DEFS.map((b) => (
        <Chip key={b.slug} selected={filtres.badge === b.slug} onClick={() => onChange({ badge: filtres.badge === b.slug ? "" : b.slug })}>
          <span aria-hidden="true">{b.emoji}</span>{" "}
          {tBadges(b.slug as "plage" | "randonnee" | "vtt" | "plongee" | "restaurant")}
        </Chip>
      ))}

      <span className="w-px self-stretch mx-1" style={{ background: "var(--line)" }} aria-hidden="true" />

      {/* Chips de type (Lot 3) — même pattern que les chips de zone/badge ci-dessus,
          vocabulaire figé de Lieu.tags (village/sentier/crique/jardin/monument/panorama/table). */}
      {TAG_DEFS.map((tag) => (
        <Chip key={tag.slug} selected={filtres.type === tag.slug} onClick={() => onChange({ type: filtres.type === tag.slug ? "" : tag.slug })}>
          <span aria-hidden="true">{tag.emoji}</span>{" "}
          {tTags(tag.slug as "village" | "sentier" | "crique" | "jardin" | "monument" | "panorama" | "table")}
        </Chip>
      ))}

      <ExplorerSelectChip
        label={tFiltres("saison")}
        value={filtres.saison}
        onChange={(v) => onChange({ saison: v })}
        placeholder={tFiltres("saisonToutes")}
        options={SAISONS.map((s) => ({ value: s, label: tFiltres(s) }))}
      />
      <ExplorerSelectChip
        label={tFiltres("duree")}
        value={filtres.duree}
        onChange={(v) => onChange({ duree: v })}
        placeholder={tFiltres("dureeToutes")}
        options={DUREES.map((d) => ({ value: d, label: tFiltres(d) }))}
      />
      <ExplorerSelectChip
        label={tFiltres("niveau")}
        value={filtres.niveau}
        onChange={(v) => onChange({ niveau: v })}
        placeholder={tFiltres("niveauTous")}
        options={NIVEAUX.map((n) => ({ value: n, label: tFiltres(n) }))}
      />

      <span className="w-px self-stretch mx-1" style={{ background: "var(--line)" }} aria-hidden="true" />

      <Chip
        selected={position !== null}
        onClick={onToggleProximite}
        disabled={geoEtat === "chargement"}
        title={tHome("presDeMoiTitre")}
      >
        {geoEtat === "chargement"
          ? tHome("localisationEnCours")
          : position
            ? tHome("presDeMoiActif")
            : tHome("presDeMoi")}
      </Chip>

      <Button type="button" variant="discret" onClick={onSurprendsMoi} disabled={surprendsMoiDesactive} title={tFiltres("surprendsMoiTitre")}>
        {tFiltres("surprendsMoi")}
      </Button>

      {aUnFiltre && (
        <Button type="button" variant="discret" onClick={() => onChange({ zone: "", badge: "", type: "", saison: "", duree: "", niveau: "", q: "" })}>
          {t("toutEffacer")}
        </Button>
      )}
    </>
  );

  return (
    <div className="flex flex-col gap-3 mb-6">
      <div className="relative w-full sm:max-w-sm">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--brume)" }}>
          <IconSearch className="w-4 h-4" />
        </span>
        <Field
          type="search"
          aria-label={t("rechercheLabel")}
          placeholder={t("recherchePlaceholder")}
          value={filtres.q}
          onChange={(e) => onChange({ q: e.target.value })}
          style={{ paddingLeft: "36px" }}
        />
      </div>

      {/* Mobile (→ audit UX 17/09, 3.1) : zone en ligne de chips défilante, tout le reste
          replié dans un tiroir plutôt que 21 filtres à plat avant le premier lieu. */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="flex gap-2 overflow-x-auto flex-nowrap -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
          {zoneChips}
        </div>
        <Button
          type="button"
          variant="secondaire"
          onClick={() => setTiroirOuvert(true)}
          className="flex-shrink-0"
        >
          {tFiltres("filtres")}{nbFiltresSecondaires > 0 ? ` (${nbFiltresSecondaires})` : ""}
        </Button>
      </div>

      {/* Desktop — inchangé : tout à plat, la ligne défilante + le tiroir sont un correctif
          mobile uniquement (le mur de filtres n'était signalé que sur 375px). */}
      <div className="hidden lg:flex flex-wrap gap-2 items-center">
        {zoneChips}
        <span className="w-px self-stretch mx-1" style={{ background: "var(--line)" }} aria-hidden="true" />
        {filtresSecondaires}
      </div>

      {(geoEtat === "refuse" || geoEtat === "indisponible") && (
        <p className="text-meta -mt-1" style={{ color: "var(--aube)" }}>
          {geoEtat === "refuse" ? tHome("localisationRefusee") : tHome("localisationIndisponible")}
        </p>
      )}

      <FilterDrawer
        open={tiroirOuvert}
        onClose={() => setTiroirOuvert(false)}
        title={tFiltres("filtres")}
        footer={
          <Button type="button" variant="primaire" className="w-full justify-center" onClick={() => setTiroirOuvert(false)}>
            {tFiltres("voirResultats", { count: resultCount })}
          </Button>
        }
      >
        <div className="flex flex-wrap gap-2 items-center">{filtresSecondaires}</div>
      </FilterDrawer>
    </div>
  );
}
