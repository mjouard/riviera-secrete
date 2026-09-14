import type { MetadataRoute } from "next";

/**
 * Hors du segment [locale], comme sitemap.ts et manifest.ts : robots.txt est un fichier
 * unique à la racine du domaine, il n'a pas de variante par langue.
 *
 * Sans ce fichier, `/robots.txt` tombait dans la route attrape-tout `/[locale]` et
 * répondait **500** (voir le commentaire dans [locale]/layout.tsx) — or Google interprète
 * un 5xx sur robots.txt comme « ne pas explorer ce site » et suspend le crawl, là où un
 * 404 signifie simplement « pas de restriction ».
 *
 * Les chemins interdits sont exactement les pages déjà en `noindex` via leur propre
 * layout.tsx (outils de compte, sans intérêt pour un moteur), déclinés en `/…` et `/en/…`
 * puisque le français est la locale par défaut non préfixée.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://frontend-two-plum-92.vercel.app";

const PRIVEES = [
  "/creer-itineraire",
  "/mes-itineraires",
  "/mes-favoris",
  "/connexion",
  "/confirmer-email",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        ...PRIVEES,
        ...PRIVEES.map((p) => `/en${p}`),
        // NextAuth (callbacks OAuth, CSRF) : jamais de contenu indexable.
        "/api/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
