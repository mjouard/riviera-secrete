"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Lieu } from "@/lib/types";
import { loc, normalizeSearch } from "@/lib/utils";
import { BADGE_DEFS, REGION_ORDER } from "@/lib/home-data";
import { Chip } from "@/components/ui/Chip";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { IconSearch } from "@/components/ui/Icons";
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

        <div className="flex flex-wrap gap-2 items-center overflow-x-auto pb-1">
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

          {aUnFiltre && (
            <Button
              type="button"
              variant="discret"
              onClick={() => { onQChange(""); onZoneChange(""); onBadgeChange(""); onFavorisOnlyChange(false); }}
            >
              {t("toutEffacer")}
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center overflow-x-auto pb-1">
          {BADGE_DEFS.map((b) => (
            <Chip key={b.slug} selected={badge === b.slug} onClick={() => onBadgeChange(badge === b.slug ? "" : b.slug)}>
              {b.emoji} {tBadges(b.slug as "plage" | "randonnee" | "vtt" | "plongee" | "restaurant")}
            </Chip>
          ))}
        </div>
      </div>

      <p className="text-meta mb-3" style={{ color: "var(--brume)" }}>
        {t("lieuxTrouves", { count: filtered.length, total: lieux.length })}
      </p>

      {filtered.length === 0 ? (
        <p className="text-body py-10 text-center" style={{ color: "var(--brume)" }}>{t("aucunResultat")}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
