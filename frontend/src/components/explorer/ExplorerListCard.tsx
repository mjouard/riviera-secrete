"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Lieu } from "@/lib/types";
import { formatDistanceKm, loc } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import Photo from "@/components/Photo";
import { BADGE_ICONS } from "@/lib/home-data";
import { useExplorerHover } from "./ExplorerHoverContext";

const KNOWN_BADGES = ["plage", "randonnee", "vtt", "plongee", "restaurant"] as const;
/** Max de badges affichés avec icône + libellé avant de replier le reste en « +N »
 * (→ audit UX 17/09, 3.3). */
const MAX_BADGES_VISIBLES = 3;

/**
 * Carte compacte horizontale — pas le format 4:3 pleine largeur de l'ancienne HomeLieuxGrid
 * (accueil), dont le ratio ne convient pas à une colonne de 468px de large.
 */
export default function ExplorerListCard({
  lieu,
  survole,
  distance,
}: {
  lieu: Lieu;
  survole: boolean;
  /** Distance à vol d'oiseau depuis la position du visiteur (km) — « Près de moi ». */
  distance?: number;
}) {
  const locale = useLocale();
  const tBadges = useTranslations("badges");
  const { onHover } = useExplorerHover();
  const badgesConnus = lieu.badges.filter((b) => (KNOWN_BADGES as readonly string[]).includes(b));

  return (
    <Link
      href={`/lieux/${lieu.slug}`}
      onMouseEnter={() => onHover(lieu.slug)}
      onMouseLeave={() => onHover(null)}
      className="focus-ring-aube flex gap-3 p-2 rounded-lg transition-colors"
      style={{ background: survole ? "var(--nuit-haute)" : "transparent" }}
    >
      <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden">
        <Photo sizes="80px" src={lieu.thumbImage} alt={lieu.heroAlt} className="w-full h-full object-cover" />
        {distance !== undefined && (
          <span
            className="absolute bottom-1 right-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{ background: "rgba(12,26,41,0.85)", color: "var(--mer-3)" }}
          >
            {formatDistanceKm(distance)}
          </span>
        )}
      </div>
      <div className="min-w-0 py-0.5">
        <p className="text-meta truncate" style={{ color: "var(--mer-3)" }}>{lieu.commune}</p>
        <h3 className="text-card-title truncate" style={{ color: "var(--calcaire)" }}>
          {loc(locale, lieu.nomEn, lieu.nom)}
        </h3>
        {badgesConnus.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-1 text-meta" style={{ color: "var(--brume)" }}>
            {badgesConnus.slice(0, MAX_BADGES_VISIBLES).map((slug) => {
              const Icon = BADGE_ICONS[slug];
              return (
                <span key={slug} className="inline-flex items-center gap-1">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {tBadges(slug as (typeof KNOWN_BADGES)[number])}
                </span>
              );
            })}
            {badgesConnus.length > MAX_BADGES_VISIBLES && (
              <span>+{badgesConnus.length - MAX_BADGES_VISIBLES}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
