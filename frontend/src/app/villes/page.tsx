import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import { imgUrl } from "@/lib/utils";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Villes",
  description: "Les villes et villages de la Côte d'Azur à explorer — de Menton à Saint-Tropez.",
};

export default async function VillesPage() {
  const villes = await api.villes.list();

  const byRegion = villes.reduce<Record<string, typeof villes>>((acc, v) => {
    (acc[v.regionLabel] ??= []).push(v);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Villes & villages</h1>
      <p className="mb-10" style={{ color: "var(--text-muted)" }}>
        {villes.length} communes sur la Côte d&apos;Azur
      </p>

      <div className="space-y-12">
        {Object.entries(byRegion).map(([region, list]) => (
          <section key={region}>
            <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
              {region}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((ville) => (
                <Link
                  key={ville.slug}
                  href={`/villes/${ville.slug}`}
                  className="group rounded-xl overflow-hidden transition-transform hover:-translate-y-0.5"
                  style={{ background: "var(--surface)" }}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={imgUrl(ville.thumbImage)}
                      alt={ville.nom}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-semibold">{ville.nom}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {ville.lieux.length} lieu{ville.lieux.length > 1 ? "x" : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
