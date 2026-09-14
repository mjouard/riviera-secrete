import type { MetadataRoute } from "next";
import fr from "../../messages/fr.json";
import en from "../../messages/en.json";

const MESSAGES = { fr, en } as const;

/**
 * Manifeste PWA d'une locale.
 *
 * Il n'y en avait qu'un, figé en français (`lang: "fr"`, nom et description FR) : un
 * anglophone qui installait le site depuis /en se retrouvait avec une icône et une fiche
 * d'application en français. Les libellés viennent de `messages/{fr,en}.json` comme le
 * reste du site — importés statiquement plutôt que via next-intl, parce que le manifeste
 * est généré hors de tout contexte de requête.
 *
 * `start_url` suit la locale, `scope` reste "/" : restreindre le scope à /en ferait sortir
 * du mode application dès qu'on ouvre un lien français.
 */
export function construireManifest(locale: "fr" | "en"): MetadataRoute.Manifest {
  const t = MESSAGES[locale].pwa;
  return {
    name: t.nom,
    short_name: t.nomCourt,
    description: t.description,
    start_url: locale === "en" ? "/en" : "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0C1116",
    theme_color: "#0C1116",
    categories: ["travel", "navigation", "lifestyle"],
    lang: locale,
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
