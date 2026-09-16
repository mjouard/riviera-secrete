import type { MetadataRoute } from "next";
import { api } from "@/lib/api";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://frontend-two-plum-92.vercel.app";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [lieux, itineraires, villes] = await Promise.all([
    api.lieux.list().catch(() => []),
    api.itineraires.list().catch(() => []),
    api.villes.list().catch(() => []),
  ]);

  // Chaque entrée porte son alternate `/en` via `alternates.languages` (hreflang) plutôt
  // que d'ajouter une ligne séparée par langue — le slug est identique dans les deux
  // langues (voir project_version_anglaise.md), donc `/en${path}` suffit à le dériver.
  const withEn = (path: string) => ({
    languages: { fr: `${SITE_URL}${path}`, en: `${SITE_URL}/en${path}` },
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, priority: 1, changeFrequency: "weekly", alternates: withEn("") },
    { url: `${SITE_URL}/villes`, priority: 0.8, changeFrequency: "weekly", alternates: withEn("/villes") },
    { url: `${SITE_URL}/activites`, priority: 0.8, changeFrequency: "weekly", alternates: withEn("/activites") },
    { url: `${SITE_URL}/itineraires`, priority: 0.8, changeFrequency: "weekly", alternates: withEn("/itineraires") },
    { url: `${SITE_URL}/a-propos`, priority: 0.5, changeFrequency: "yearly", alternates: withEn("/a-propos") },
    { url: `${SITE_URL}/mentions-legales`, priority: 0.2, changeFrequency: "yearly", alternates: withEn("/mentions-legales") },
    { url: `${SITE_URL}/confidentialite`, priority: 0.2, changeFrequency: "yearly", alternates: withEn("/confidentialite") },
  ];

  const lieuRoutes: MetadataRoute.Sitemap = lieux.map((l) => ({
    url: `${SITE_URL}/lieux/${l.slug}`,
    priority: 0.7,
    changeFrequency: "monthly" as const,
    alternates: withEn(`/lieux/${l.slug}`),
  }));

  const itinRoutes: MetadataRoute.Sitemap = itineraires.map((i) => ({
    url: `${SITE_URL}/itineraires/${i.slug}`,
    priority: 0.7,
    changeFrequency: "monthly" as const,
    alternates: withEn(`/itineraires/${i.slug}`),
  }));

  const villeRoutes: MetadataRoute.Sitemap = villes.map((v) => ({
    url: `${SITE_URL}/villes/${v.slug}`,
    priority: 0.6,
    changeFrequency: "monthly" as const,
    alternates: withEn(`/villes/${v.slug}`),
  }));

  return [...staticRoutes, ...lieuRoutes, ...itinRoutes, ...villeRoutes];
}
