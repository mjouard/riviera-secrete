"use client";

import { useTranslations } from "next-intl";
import type { Lieu } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import ExplorerListCard from "./ExplorerListCard";

export default function ExplorerList({
  lieux,
  total,
  hoveredSlug,
  onHover,
  onVoirPlus,
  onToutEffacer,
}: {
  lieux: Lieu[];
  total: number;
  hoveredSlug: string | null;
  onHover: (slug: string | null) => void;
  onVoirPlus: () => void;
  onToutEffacer: () => void;
}) {
  const t = useTranslations("explorer");

  if (lieux.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-body mb-4" style={{ color: "var(--brume)" }}>{t("aucunResultat")}</p>
        <Button type="button" variant="secondaire" onClick={onToutEffacer}>{t("toutEffacer")}</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: "min(80vh, 720px)" }}>
      {lieux.map((lieu) => (
        <ExplorerListCard key={lieu.slug} lieu={lieu} survole={hoveredSlug === lieu.slug} onHover={onHover} />
      ))}
      {lieux.length < total && (
        <Button type="button" variant="secondaire" onClick={onVoirPlus} className="self-center mt-3">
          {t("voirPlus", { count: Math.min(24, total - lieux.length) })}
        </Button>
      )}
    </div>
  );
}
