import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api-production-19623.up.railway.app";

type Redirect = { source: string; destination: string; permanent: boolean };
type VilleApi = { slug: string; lieux: { slug: string }[] };

/**
 * Refonte UI Lot 5 (03-architecture-routes-url.md § 4) — une commune à ≥ 2 lieux garde une
 * page sous /communes/[slug] ; à 1 seul lieu, elle redirige directement vers la fiche de ce
 * lieu (une page qui listerait le lieu qu'on vient de citer n'apporterait rien).
 *
 * Lu depuis l'API de prod, pas depuis data/villes.json : le déploiement Vercel n'inclut que
 * le sous-dossier `frontend/` (rootDirectory du projet), pas la racine du monorepo — un
 * `fs.readFileSync("../data/villes.json")` échoue en build avec `ENOENT` (constaté en
 * déployant cette brique, corrigé dans la foulée). `.catch(() => [])` : si l'API est
 * injoignable au moment du build, le déploiement continue sans ces redirections plutôt que
 * d'échouer entièrement — même logique de repli que sitemap.ts.
 */
async function communesRedirects(): Promise<Redirect[]> {
  const villes: VilleApi[] = await fetch(`${API_URL}/api/villes`)
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => []);
  const redirects: Redirect[] = [];
  for (const v of villes) {
    if (v.lieux.length === 0) continue;
    if (v.lieux.length >= 2) {
      redirects.push({ source: `/villes/${v.slug}`, destination: `/communes/${v.slug}`, permanent: true });
      redirects.push({ source: `/en/villes/${v.slug}`, destination: `/en/communes/${v.slug}`, permanent: true });
    } else {
      const lieuSlug = v.lieux[0].slug;
      redirects.push({ source: `/villes/${v.slug}`, destination: `/lieux/${lieuSlug}`, permanent: true });
      redirects.push({ source: `/en/villes/${v.slug}`, destination: `/en/lieux/${lieuSlug}`, permanent: true });
      redirects.push({ source: `/communes/${v.slug}`, destination: `/lieux/${lieuSlug}`, permanent: true });
      redirects.push({ source: `/en/communes/${v.slug}`, destination: `/en/lieux/${lieuSlug}`, permanent: true });
    }
  }
  return redirects;
}

const nextConfig: NextConfig = {
  // Refonte UI Lot 5 (03-architecture-routes-url.md § 3) — `redirects()` tourne avant le
  // middleware next-intl, donc chaque route doit être déclarée deux fois : la version FR non
  // préfixée et son équivalent `/en/…` (le FR est la locale par défaut, sans préfixe — voir
  // proxy.ts). Table amenée à grandir avec le reste des redirections du Lot 5.
  async redirects() {
    return [
      { source: "/mes-favoris", destination: "/carnet?onglet=favoris", permanent: true },
      { source: "/en/mes-favoris", destination: "/en/carnet?onglet=favoris", permanent: true },
      { source: "/mes-itineraires", destination: "/carnet?onglet=itineraires", permanent: true },
      { source: "/en/mes-itineraires", destination: "/en/carnet?onglet=itineraires", permanent: true },
      { source: "/villes", destination: "/explorer", permanent: true },
      { source: "/en/villes", destination: "/en/explorer", permanent: true },
      // /composer (Lot 4c) est l'outil principal depuis le Lot 4e — mais il ne sait pas
      // encore charger un itinéraire déjà sauvegardé par id (`/creer-itineraire?id=…`, seul
      // /carnet.tsx's bouton "Voir" en dépend). `missing: [{ type: "query", key: "id" }]` :
      // redirige tout le reste (page nue, `?add=`, `?jours=`, `?duree=`… — tous déjà compris
      // par /composer) et laisse passer ce seul cas vers la page /creer-itineraire, toujours
      // déployée. Ne pas élargir tant que /composer n'a pas cette capacité.
      {
        source: "/creer-itineraire",
        missing: [{ type: "query", key: "id" }],
        destination: "/composer",
        permanent: true,
      },
      {
        source: "/en/creer-itineraire",
        missing: [{ type: "query", key: "id" }],
        destination: "/en/composer",
        permanent: true,
      },
      ...(await communesRedirects()),
    ];
  },
};

export default withNextIntl(nextConfig);
