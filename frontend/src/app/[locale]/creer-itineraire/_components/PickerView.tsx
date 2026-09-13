import { useLocale, useTranslations } from "next-intl";
import type { Lieu } from "@/lib/types";
import { DUREE_META, type DureeKey } from "@/lib/itineraire-logic";
import { REGION_ORDER } from "@/lib/home-data";
import { loc } from "@/lib/utils";

export default function PickerView({
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
  const locale = useLocale();
  const t = useTranslations("creerItineraire");
  const tDuree = useTranslations("dureeLabels");
  const tRegionFull = useTranslations("regionFull");

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
      <p className="mb-8" style={{ color: "var(--text-muted)" }}>
        {t("subtitle")}
      </p>

      {/* Duration */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>{t("duree")}</h2>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(DUREE_META) as DureeKey[]).map((key) => (
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
                {tDuree(key)}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Zones */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
          {t("lieuxSection", { count: selectedSlugs.size, plural: selectedSlugs.size !== 1 ? "s" : "" })}
        </h2>
        <div className="space-y-2">
          {REGION_ORDER.filter((r) => byRegion.has(r)).map((regionSlug) => {
            const regionLieux = byRegion.get(regionSlug)!;
            const regionLabel = tRegionFull(regionSlug as "menton-monaco" | "nice" | "arriere-pays" | "antibes-cannes" | "golfe-st-tropez");
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
                      {t("lieuxCount", { count: regionLieux.length })} {open ? "▴" : "▾"}
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
                        <span className="text-sm" style={{ color: "var(--text-muted)" }}>{loc(locale, l.nomEn, l.nom)}</span>
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
          {t("emptyNote")}
        </p>
      )}

      <button
        onClick={onGenerate}
        className="px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
        style={{ background: "var(--terracotta)", color: "#0c1116" }}
      >
        {t("generer")}
      </button>
    </div>
  );
}
