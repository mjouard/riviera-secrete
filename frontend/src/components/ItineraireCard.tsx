import Link from "next/link";
import { imgUrl } from "@/lib/utils";
import type { Itineraire, Lieu } from "@/lib/types";

export default function ItineraireCard({
  itin,
  lieuBySlug,
}: {
  itin: Itineraire;
  lieuBySlug: Map<string, Lieu>;
}) {
  const firstStop = itin.items.find((item) => item.type === "stop" && item.lieuSlug);
  const thumb = firstStop?.lieuSlug ? lieuBySlug.get(firstStop.lieuSlug)?.thumbImage : undefined;

  return (
    <Link
      href={`/itineraires/${itin.slug}`}
      className="group flex gap-4 rounded-xl overflow-hidden transition-transform hover:-translate-y-1"
      style={{ background: "var(--surface)" }}
    >
      {thumb && (
        <div className="w-28 flex-shrink-0 overflow-hidden">
          <img
            src={imgUrl(thumb)}
            alt={itin.titre}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}
      <div className="flex-1 min-w-0 py-4 pr-4">
        <p className="text-xs mb-1" style={{ color: "var(--terracotta)" }}>
          {itin.badge}
        </p>
        <h3 className="font-semibold text-sm leading-snug">{itin.titre}</h3>
        <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-muted)" }}>
          {itin.description}
        </p>
      </div>
    </Link>
  );
}
