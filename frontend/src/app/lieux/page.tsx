import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import { imgUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Lieux — Riviera Secrète",
  description: "Les 27 spots confidentiels de la Côte d'Azur.",
};

export const revalidate = 3600;

const REGION_ORDER = [
  "menton-monaco",
  "nice",
  "arriere-pays",
  "antibes-cannes",
  "golfe-st-tropez",
] as const;

export default async function LieuxPage() {
  const lieux = await api.lieux.list();

  const byRegion = REGION_ORDER.map((slug) => ({
    slug,
    label: lieux.find((l) => l.regionSlug === slug)?.regionLabel ?? slug,
    lieux: lieux.filter((l) => l.regionSlug === slug),
  })).filter((r) => r.lieux.length > 0);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Lieux</h1>
      <p className="mb-12" style={{ color: "var(--text-muted)" }}>
        {lieux.length} spots hors des sentiers battus de Menton à Saint-Tropez.
      </p>

      {byRegion.map((region) => (
        <section key={region.slug} className="mb-16">
          <h2
            className="text-xs font-semibold uppercase tracking-widest mb-6 pb-3 border-b"
            style={{ color: "var(--azure)", borderColor: "var(--line)" }}
          >
            {region.label}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {region.lieux.map((lieu) => (
              <Link
                key={lieu.id}
                href={`/lieux/${lieu.slug}`}
                className="group block rounded-xl overflow-hidden transition-transform hover:-translate-y-1"
                style={{ background: "var(--surface)" }}
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={imgUrl(lieu.thumbImage)}
                    alt={lieu.heroAlt}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <p className="text-xs mb-1" style={{ color: "var(--azure)" }}>
                    {lieu.commune}
                  </p>
                  <h3 className="font-semibold text-sm leading-snug mb-1">
                    {lieu.nom}
                  </h3>
                  <p
                    className="text-xs line-clamp-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {lieu.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
