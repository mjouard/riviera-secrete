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

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, priority: 1, changeFrequency: "weekly" },
    { url: `${SITE_URL}/villes`, priority: 0.8, changeFrequency: "weekly" },
  ];

  const lieuRoutes: MetadataRoute.Sitemap = lieux.map((l) => ({
    url: `${SITE_URL}/lieux/${l.slug}`,
    priority: 0.7,
    changeFrequency: "monthly" as const,
  }));

  const itinRoutes: MetadataRoute.Sitemap = itineraires.map((i) => ({
    url: `${SITE_URL}/itineraires/${i.slug}`,
    priority: 0.7,
    changeFrequency: "monthly" as const,
  }));

  const villeRoutes: MetadataRoute.Sitemap = villes.map((v) => ({
    url: `${SITE_URL}/villes/${v.slug}`,
    priority: 0.6,
    changeFrequency: "monthly" as const,
  }));

  return [...staticRoutes, ...lieuRoutes, ...itinRoutes, ...villeRoutes];
}
