"use client";

import { useTranslations } from "next-intl";
import { BADGE_DEFS } from "@/lib/home-data";
import { regionToMerShade } from "@/lib/mer-colors";
import { DUREES, NIVEAUX, SAISONS } from "@/lib/lieu-filters";
import { Chip } from "@/components/ui/Chip";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { IconSearch } from "@/components/ui/Icons";
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
}: {
  filtres: FiltresExplorer;
  onChange: (patch: Partial<FiltresExplorer>) => void;
}) {
  const t = useTranslations("explorer");
  const tRegion = useTranslations("regionShort");
  const tBadges = useTranslations("badges");
  const tFiltres = useTranslations("filtres");

  const aUnFiltre = Object.values(filtres).some((v) => v !== "");

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

      <div className="flex flex-wrap gap-2 items-center">
        {REGION_SLUGS.map((slug) => (
          <Chip key={slug} selected={filtres.zone === slug} onClick={() => onChange({ zone: filtres.zone === slug ? "" : slug })}>
            <span
              aria-hidden="true"
              className="inline-block w-2.5 h-2.5 rounded-full mr-1.5"
              style={{ background: regionToMerShade(slug) }}
            />
            {tRegion(slug as "menton-monaco" | "nice" | "arriere-pays" | "antibes-cannes" | "golfe-st-tropez")}
          </Chip>
        ))}

        <span className="w-px self-stretch mx-1" style={{ background: "var(--line)" }} aria-hidden="true" />

        {BADGE_DEFS.map((b) => (
          <Chip key={b.slug} selected={filtres.badge === b.slug} onClick={() => onChange({ badge: filtres.badge === b.slug ? "" : b.slug })}>
            <span aria-hidden="true">{b.emoji}</span>{" "}
            {tBadges(b.slug as "plage" | "randonnee" | "vtt" | "plongee" | "restaurant")}
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

        {aUnFiltre && (
          <Button type="button" variant="discret" onClick={() => onChange({ zone: "", badge: "", saison: "", duree: "", niveau: "", q: "" })}>
            {t("toutEffacer")}
          </Button>
        )}
      </div>
    </div>
  );
}
