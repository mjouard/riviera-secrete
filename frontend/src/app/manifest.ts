import type { MetadataRoute } from "next";

/**
 * Hors du segment [locale], comme sitemap.ts et favicon.ico : un manifest par locale
 * n'apporterait rien (le proxy next-intl route déjà "/" vers la bonne langue selon le
 * cookie/Accept-Language). Le français étant la locale par défaut non préfixée, les
 * libellés sont en français.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Riviera Secrète — Côte d'Azur hors des sentiers battus",
    short_name: "Riviera Secrète",
    description:
      "Les lieux confidentiels de la Côte d'Azur, de Menton à Saint-Tropez, et des itinéraires prêts à suivre.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0C1116",
    theme_color: "#0C1116",
    categories: ["travel", "navigation", "lifestyle"],
    lang: "fr",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
