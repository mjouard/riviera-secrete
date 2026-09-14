"use client";

import { useLocale } from "next-intl";
import type { Lieu } from "@/lib/types";
import { loc } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import Photo from "@/components/Photo";
import { BADGE_DEFS_BY_SLUG } from "@/lib/home-data";

/**
 * Carte compacte horizontale — pas le format 4:3 pleine largeur de l'accueil (HomeLieuxGrid),
 * dont le ratio ne convient pas à une colonne de 468px de large.
 */
export default function ExplorerListCard({
  lieu,
  survole,
  onHover,
}: {
  lieu: Lieu;
  survole: boolean;
  onHover: (slug: string | null) => void;
}) {
  const locale = useLocale();

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
      </div>
      <div className="min-w-0 py-0.5">
        <p className="text-meta truncate" style={{ color: "var(--mer-3)" }}>{lieu.commune}</p>
        <h3 className="text-card-title truncate" style={{ color: "var(--calcaire)" }}>
          {loc(locale, lieu.nomEn, lieu.nom)}
        </h3>
        {lieu.badges.length > 0 && (
          <p className="text-meta mt-1" style={{ color: "var(--brume)" }}>
            {lieu.badges
              .map((slug) => BADGE_DEFS_BY_SLUG[slug]?.emoji)
              .filter(Boolean)
              .join(" ")}
          </p>
        )}
      </div>
    </Link>
  );
}
