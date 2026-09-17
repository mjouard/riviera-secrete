"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Lieu } from "@/lib/types";
import { REGION_ORDER } from "@/lib/home-data";
import { regionToMerShade } from "@/lib/mer-colors";
import { Chip } from "@/components/ui/Chip";
import { Button, LinkButton } from "@/components/ui/Button";
import ExplorerMapWrapper from "@/components/explorer/ExplorerMapWrapper";
import ExplorerListCard from "@/components/explorer/ExplorerListCard";
import { ExplorerHoverProvider } from "@/components/explorer/ExplorerHoverContext";

const APERCU_MAX = 6;
const REGION_SLUGS = REGION_ORDER;

/**
 * Aperçu Explorer de l'accueil (refonte UI Lot 4e, docs/design-refonte-2026-09-14.md § 2
 * "Ordre des sections"). Un teaser, pas /explorer en miniature : un seul filtre (zone), une
 * liste plafonnée, pas d'URL — l'état réel du filtrage vit sur /explorer, atteint via le
 * bouton "Voir les N lieux". Réutilise les mêmes composants carte/carte-de-lieu que
 * /explorer (déplacés en src/components/explorer/ pour ce lot) plutôt que d'en refaire une
 * variante.
 */
export default function HomeExplorerSection({ lieux }: { lieux: Lieu[] }) {
  const t = useTranslations("home");
  const tRegion = useTranslations("regionShort");

  const [zone, setZone] = useState("");
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [vue, setVue] = useState<"liste" | "carte">("liste");

  const filtres = useMemo(() => (zone ? lieux.filter((l) => l.regionSlug === zone) : lieux), [lieux, zone]);
  const visibles = filtres.slice(0, APERCU_MAX);
  const hrefExplorer = zone ? `/explorer?zone=${zone}` : "/explorer";

  return (
    <div id="explorer" className="scroll-mt-20">
      <div className="flex flex-wrap gap-2 mb-4">
        {REGION_SLUGS.map((slug) => (
          <Chip key={slug} selected={zone === slug} onClick={() => setZone(zone === slug ? "" : slug)}>
            <span
              aria-hidden="true"
              className="inline-block w-2.5 h-2.5 rounded-full mr-1.5"
              style={{ background: regionToMerShade(slug) }}
            />
            {tRegion(slug as "menton-monaco" | "nice" | "arriere-pays" | "antibes-cannes" | "golfe-st-tropez")}
          </Chip>
        ))}
      </div>

      <p className="text-meta mb-4" style={{ color: "var(--brume)" }}>
        {t("explorerCompteur", { count: filtres.length })}
      </p>

      <div className="flex lg:hidden mb-4">
        <Button type="button" variant="secondaire" onClick={() => setVue((v) => (v === "liste" ? "carte" : "liste"))}>
          {vue === "liste" ? t("explorerVoirCarte") : t("explorerVoirListe")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-6">
        <div className={`${vue === "carte" ? "block" : "hidden"} lg:block`} style={{ height: "470px" }}>
          <ExplorerMapWrapper lieux={filtres} hoveredSlug={hoveredSlug} onHoverMarker={setHoveredSlug} />
        </div>
        <div className={vue === "liste" ? "block" : "hidden lg:block"}>
          <ExplorerHoverProvider value={{ hoveredSlug, onHover: setHoveredSlug }}>
            <div className="flex flex-col gap-1" style={{ maxHeight: "470px", overflowY: "auto" }}>
              {visibles.map((lieu) => (
                <ExplorerListCard key={lieu.slug} lieu={lieu} survole={hoveredSlug === lieu.slug} />
              ))}
            </div>
          </ExplorerHoverProvider>
        </div>
      </div>

      <LinkButton href={hrefExplorer} variant="secondaire" className="mt-6">
        {t("explorerVoirTous", { count: filtres.length })}
      </LinkButton>
    </div>
  );
}
