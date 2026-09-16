import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Refonte UI Lot 5 (03-architecture-routes-url.md § 3) — /mes-favoris et /mes-itineraires
  // sont remplacées par /carnet (deux onglets, voir carnet/page.tsx). `redirects()` tourne
  // avant le middleware next-intl, donc chaque route doit être déclarée deux fois : la
  // version FR non préfixée et son équivalent `/en/…` (le FR est la locale par défaut, sans
  // préfixe — voir proxy.ts). Table amenée à grandir avec le reste des redirections du Lot 5.
  async redirects() {
    return [
      { source: "/mes-favoris", destination: "/carnet?onglet=favoris", permanent: true },
      { source: "/en/mes-favoris", destination: "/en/carnet?onglet=favoris", permanent: true },
      { source: "/mes-itineraires", destination: "/carnet?onglet=itineraires", permanent: true },
      { source: "/en/mes-itineraires", destination: "/en/carnet?onglet=itineraires", permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);
