"use client";

import { useTranslations } from "next-intl";
import { formatDuree } from "@/lib/itineraire-logic";
import { Button } from "@/components/ui/Button";

/**
 * Barre fixe mobile (ROADMAP Lot 4c, point 5) — remplace la colonne récap de 500px, absente
 * sous `lg`. Ligne 1 : les mêmes chiffres vivants que le panneau desktop, condensés ; ligne 2 :
 * le même bouton primaire pleine largeur.
 */
export default function ComposerMobileBar({
  nbLieux,
  tempsTotalMin,
  onCompose,
}: {
  nbLieux: number;
  tempsTotalMin: number;
  onCompose: () => void;
}) {
  const t = useTranslations("composer");

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden p-3 pb-[calc(env(safe-area-inset-bottom)+12px)] flex flex-col gap-2"
      style={{ background: "var(--nuit-haute)", boxShadow: "var(--shadow-float)" }}
    >
      <p className="text-meta text-center" style={{ color: "var(--brume)" }}>
        {nbLieux > 0
          ? t("recapTitre", { count: nbLieux, duree: formatDuree(tempsTotalMin) })
          : t("composerBoutonVide")}
      </p>
      <Button type="button" variant="primaire" className="w-full" style={{ height: "52px" }} disabled={nbLieux === 0} onClick={onCompose}>
        {t("composerBouton")}
      </Button>
    </div>
  );
}
