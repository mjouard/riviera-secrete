import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { loc } from "@/lib/utils";
import type { Itineraire, Lieu } from "@/lib/types";
import Photo from "@/components/Photo";

/**
 * Carte verticale 3:2 pour la section "Déjà composés" (refonte UI Lot 4e, docs/design-refonte-
 * 2026-09-14.md § 2). Nouveau composant plutôt qu'une modification de ItineraireCard.tsx : ce
 * dernier est aussi utilisé par villes/[slug]/page.tsx dans son format horizontal actuel, que
 * ce lot ne touche pas.
 */
export default function ComposeCard({
  itin,
  lieuBySlug,
}: {
  itin: Itineraire;
  lieuBySlug: Map<string, Lieu>;
}) {
  const locale = useLocale();
  const firstStop = itin.items.find((item) => item.type === "stop" && item.lieuSlug);
  const thumb = firstStop?.lieuSlug ? lieuBySlug.get(firstStop.lieuSlug)?.thumbImage : undefined;
  const titre = loc(locale, itin.titreEn, itin.titre);

  return (
    <Link
      href={`/itineraires/${itin.slug}`}
      className="group block rounded-xl overflow-hidden transition-transform hover:-translate-y-1"
      style={{ background: "var(--nuit-haute)", border: "1px solid var(--line)" }}
    >
      {thumb && (
        <div className="relative aspect-[3/2] overflow-hidden">
          <Photo
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
            src={thumb}
            alt={titre}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-4">
        <p className="text-data mb-1" style={{ color: "var(--aube)" }}>
          {loc(locale, itin.badgeEn, itin.badge)}
        </p>
        <h3 className="text-card-title mb-1" style={{ color: "var(--calcaire)" }}>{titre}</h3>
        <p className="text-meta line-clamp-2" style={{ color: "var(--brume)" }}>
          {loc(locale, itin.descriptionEn, itin.description)}
        </p>
      </div>
    </Link>
  );
}
