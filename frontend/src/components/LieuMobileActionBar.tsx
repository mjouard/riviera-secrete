"use client";

import { useTranslations } from "next-intl";
import { buildMapLinks } from "@/lib/utils";
import { IconPin } from "@/components/ui/Icons";
import FavoriteButton from "./FavoriteButton";
import ShareButton from "./ShareButton";
import AddToItinButton from "./AddToItinButton";

/**
 * Barre d'action fixe mobile (refonte UI Lot 4a, `02-composants.md` § 7) — corrige MO-05 (les
 * actions disparaissaient au défilement) et complète MO-01 (les liens Maps/Waze/Plans avaient
 * 16px de haut avant leur passage en vrais boutons 44px au Lot 1 ; ici, l'action principale
 * « Y aller » passe à 52px). Masquée ≥1024px — la colonne collante du Lot 4a (composition
 * desktop) couvre déjà ce rôle sans bar fixe.
 *
 * « Y aller » ouvre Google Maps (premier lien de `buildMapLinks`) plutôt que de proposer les
 * trois services : sur une barre fixe, il n'y a la place que pour une seule action principale
 * — Waze/Plans restent choisissables depuis les liens statiques dans la fiche (colonne carte).
 */
export default function LieuMobileActionBar({
  lieuSlug,
  lat,
  lng,
  nom,
}: {
  lieuSlug: string;
  lat: number;
  lng: number;
  nom: string;
}) {
  const t = useTranslations("lieuActions");
  const yAllerUrl = buildMapLinks(lat, lng, nom)[0].url;

  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t"
      style={{
        background: "var(--nuit-haute)",
        borderColor: "var(--line)",
        paddingBottom: "max(20px, env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex items-center gap-2 px-4 pt-3">
        <a
          href={yAllerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring-aube flex-grow flex items-center justify-center gap-2 h-[52px] rounded-lg text-body font-semibold"
          style={{ background: "var(--aube)", color: "var(--nuit)" }}
        >
          <IconPin className="w-[19px] h-[19px]" />
          {t("yAller")}
        </a>
        <FavoriteButton slug={lieuSlug} variant="square" />
        <ShareButton title={nom} variant="square" />
        <AddToItinButton lieuSlug={lieuSlug} nom={nom} variant="square" />
      </div>
    </div>
  );
}
