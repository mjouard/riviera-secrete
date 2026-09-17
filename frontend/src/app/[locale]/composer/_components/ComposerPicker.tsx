"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Lieu } from "@/lib/types";
import { loc, normalizeSearch } from "@/lib/utils";
import { BADGE_DEFS, REGION_ORDER } from "@/lib/home-data";
import { Chip } from "@/components/ui/Chip";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { IconSearch } from "@/components/ui/Icons";
import { FilterDrawer } from "@/components/ui/FilterDrawer";
import ComposerCard from "./ComposerCard";

/**
 * Recherche + filtre de zone + grille de vignettes (ROADMAP Lot 4c, points 2 et 3) — même
 * technique de filtrage/recherche qu'Explorer (ExplorerShell.tsx), simplifiée : pas de
 * saison/durée/niveau ici, ce sont des filtres de *découverte* déjà couverts par /explorer,
 * pas des paramètres de composition d'itinéraire.
 */
export default function ComposerPicker({
  lieux,
  selectedSlugs,
  onToggle,
  date,
  q,
  onQChange,
  zone,
  onZoneChange,
  badge,
  onBadgeChange,
  favorisOnly,
  onFavorisOnlyChange,
  favorisSlugs,
}: {
  lieux: Lieu[];
  selectedSlugs: Set<string>;
  onToggle: (slug: string) => void;
  date: Date | null;
  q: string;
  onQChange: (v: string) => void;
  zone: string;
  onZoneChange: (v: string) => void;
  badge: string;
  onBadgeChange: (v: string) => void;
  favorisOnly: boolean;
  onFavorisOnlyChange: (v: boolean) => void;
  /** `null` tant que non connecté / pas encore chargé — le lien "Depuis mes favoris" ne
   * s'affiche pas dans ce cas plutôt que de proposer un filtre qui viderait toujours la grille. */
  favorisSlugs: string[] | null;
}) {
  const locale = useLocale();
  const t = useTranslations("composer");
  const tRegion = useTranslations("regionShort");
  const tBadges = useTranslations("badges");

  const index = useMemo(
    () =>
      lieux.map((l) => ({
        lieu: l,
        haystack: normalizeSearch([loc(locale, l.nomEn, l.nom), l.nom, l.commune].join(" ")),
      })),
    [lieux, locale]
  );

  const filtered = useMemo(() => {
    const query = normalizeSearch(q);
    const favSet = favorisOnly && favorisSlugs ? new Set(favorisSlugs) : null;
    return index
      .filter((entry) => {
        if (zone && entry.lieu.regionSlug !== zone) return false;
        if (badge && !entry.lieu.badges?.includes(badge)) return false;
        if (favSet && !favSet.has(entry.lieu.slug)) return false;
        if (query === "") return true;
        return entry.haystack.includes(query);
      })
      .map((entry) => entry.lieu);
  }, [index, q, zone, badge, favorisOnly, favorisSlugs]);

  const aUnFiltre = q !== "" || zone !== "" || badge !== "" || favorisOnly;
  const nbFiltresSecondaires = [zone, badge, favorisOnly ? "1" : ""].filter(Boolean).length;

  /** Tiroir mobile (→ audit UX 17/09, 1.3) — zone/badge/favoris, en plus du bandeau de
   * ComposerParamsBar, formaient la seconde moitié du "mur de réglages" avant le premier
   * lieu. La recherche reste visible en permanence. */
  const [tiroirOuvert, setTiroirOuvert] = useState(false);

  const filtresSecondaires = (
    <>
      {REGION_ORDER.map((slug) => (
        <Chip key={slug} selected={zone === slug} onClick={() => onZoneChange(zone === slug ? "" : slug)}>
          {tRegion(slug as "menton-monaco" | "nice" | "arriere-pays" | "antibes-cannes" | "golfe-st-tropez")}
        </Chip>
      ))}

      {favorisSlugs && favorisSlugs.length > 0 && (
        <>
          <span className="w-px self-stretch mx-1" style={{ background: "var(--line)" }} aria-hidden="true" />
          <Chip selected={favorisOnly} onClick={() => onFavorisOnlyChange(!favorisOnly)}>
            {t("depuisMesFavoris", { count: favorisSlugs.length })}
          </Chip>
        </>
      )}

      <span className="w-px self-stretch mx-1" style={{ background: "var(--line)" }} aria-hidden="true" />

      {BADGE_DEFS.map((b) => (
        <Chip key={b.slug} selected={badge === b.slug} onClick={() => onBadgeChange(badge === b.slug ? "" : b.slug)}>
          {b.emoji} {tBadges(b.slug as "plage" | "randonnee" | "vtt" | "plongee" | "restaurant")}
        </Chip>
      ))}

      {aUnFiltre && (
        <Button
          type="button"
          variant="discret"
          onClick={() => { onQChange(""); onZoneChange(""); onBadgeChange(""); onFavorisOnlyChange(false); }}
        >
          {t("toutEffacer")}
        </Button>
      )}
    </>
  );

  return (
    <div>
      <div className="flex flex-col gap-3 mb-4">
        <div className="relative w-full sm:max-w-sm">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--brume)" }}>
            <IconSearch className="w-4 h-4" />
          </span>
          <Field
            type="search"
            aria-label={t("rechercheLabel")}
            placeholder={t("recherchePlaceholder")}
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            style={{ paddingLeft: "36px" }}
          />
        </div>

        {/* Mobile — recherche + bouton Filtres, le reste replié dans le tiroir. */}
        <div className="lg:hidden">
          <Button type="button" variant="secondaire" onClick={() => setTiroirOuvert(true)}>
            {t("filtres")}{nbFiltresSecondaires > 0 ? ` (${nbFiltresSecondaires})` : ""}
          </Button>
        </div>

        {/* Desktop — inchangé, tout à plat. */}
        <div className="hidden lg:flex flex-wrap gap-2 items-center overflow-x-auto pb-1">
          {filtresSecondaires}
        </div>
      </div>

      <p className="text-meta mb-3" style={{ color: "var(--brume)" }}>
        {t("lieuxTrouves", { count: filtered.length, total: lieux.length })}
      </p>

      <FilterDrawer
        open={tiroirOuvert}
        onClose={() => setTiroirOuvert(false)}
        title={t("filtres")}
        footer={
          <Button type="button" variant="primaire" className="w-full justify-center" onClick={() => setTiroirOuvert(false)}>
            {t("voirResultats", { count: filtered.length })}
          </Button>
        }
      >
        <div className="flex flex-wrap gap-2 items-center">{filtresSecondaires}</div>
      </FilterDrawer>

      {filtered.length === 0 ? (
        <p className="text-body py-10 text-center" style={{ color: "var(--brume)" }}>{t("aucunResultat")}</p>
      ) : (
        // 1 colonne sur mobile (→ audit UX 17/09, 1.4 : 2 colonnes ne laissaient que ~160px
        // au titre, tronqué à 100%) — cartes horizontales en dessous de sm, grille de
        // vignettes verticales inchangée à partir de sm.
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {filtered.map((lieu) => (
            <ComposerCard
              key={lieu.slug}
              lieu={lieu}
              selected={selectedSlugs.has(lieu.slug)}
              date={date}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
