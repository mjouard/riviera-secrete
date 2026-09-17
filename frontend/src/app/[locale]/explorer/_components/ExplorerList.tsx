"use client";

import { useTranslations } from "next-intl";
import type { Lieu } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import ExplorerListCard from "@/components/explorer/ExplorerListCard";
import { useExplorerHover } from "@/components/explorer/ExplorerHoverContext";

export default function ExplorerList({
  lieux,
  total,
  onVoirPlus,
  onToutEffacer,
  distanceBySlug,
}: {
  lieux: Lieu[];
  total: number;
  onVoirPlus: () => void;
  onToutEffacer: () => void;
  /** Présent seulement si « Près de moi » est actif. */
  distanceBySlug?: Map<string, number>;
}) {
  const t = useTranslations("explorer");
  const { hoveredSlug } = useExplorerHover();

  if (lieux.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-body mb-4" style={{ color: "var(--brume)" }}>{t("aucunResultat")}</p>
        <Button type="button" variant="secondaire" onClick={onToutEffacer}>{t("toutEffacer")}</Button>
      </div>
    );
  }

  return (
    // Défilement interne réservé au desktop (liste à hauteur de fenêtre à côté d'une carte
    // fixe) : sur mobile, ça créait deux défilements imbriqués sous le doigt (→ audit UX
    // 17/09, 3.2) — la liste flotte désormais avec la page, la carte devient plein écran
    // (bouton flottant, ExplorerShell.tsx).
    <div className="flex flex-col gap-1 lg:overflow-y-auto lg:max-h-[min(80vh,720px)]">
      {lieux.map((lieu) => (
        <ExplorerListCard
          key={lieu.slug}
          lieu={lieu}
          survole={hoveredSlug === lieu.slug}
          distance={distanceBySlug?.get(lieu.slug)}
        />
      ))}
      {lieux.length < total && (
        <Button type="button" variant="secondaire" onClick={onVoirPlus} className="self-center mt-3">
          {t("voirPlus", { count: Math.min(24, total - lieux.length) })}
        </Button>
      )}
    </div>
  );
}
