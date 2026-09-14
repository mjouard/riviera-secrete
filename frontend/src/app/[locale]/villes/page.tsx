import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { loc, alternatesPage } from "@/lib/utils";
import Photo from "@/components/Photo";

export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://frontend-two-plum-92.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "villes" });
  return {
    title: t("title"),
    description:
      locale === "en"
        ? "The towns and villages of the French Riviera to explore — from Menton to Saint-Tropez."
        : "Les villes et villages de la Côte d'Azur à explorer — de Menton à Saint-Tropez.",
    alternates: alternatesPage(SITE_URL, locale, "/villes"),
  };
}

export default async function VillesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [villes, t, tRegionFull] = await Promise.all([
    api.villes.list(),
    getTranslations("villes"),
    getTranslations("regionFull"),
  ]);

  const byRegion = villes.reduce<Record<string, typeof villes>>((acc, v) => {
    (acc[v.regionSlug] ??= []).push(v);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
      <p className="mb-10" style={{ color: "var(--text-muted)" }}>
        {t("subtitle", { count: villes.length })}
      </p>

      <div className="space-y-12">
        {Object.entries(byRegion).map(([regionSlug, list]) => (
          <section key={regionSlug}>
            <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
              {tRegionFull(regionSlug as "menton-monaco" | "nice" | "arriere-pays" | "antibes-cannes" | "golfe-st-tropez")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((ville) => {
                const nom = loc(locale, ville.nomEn, ville.nom);
                return (
                  <Link
                    key={ville.slug}
                    href={`/villes/${ville.slug}`}
                    className="group rounded-xl overflow-hidden transition-transform hover:-translate-y-0.5"
                    style={{ background: "var(--surface)" }}
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <Photo sizes="(max-width: 640px) 50vw, 25vw"
                        src={ville.thumbImage}
                        alt={nom}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-semibold">{nom}</p>
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                        {ville.lieux.length} {ville.lieux.length > 1 ? t("lieux") : t("lieu")}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
