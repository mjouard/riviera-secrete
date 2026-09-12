import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js 16 a renommé la convention "middleware" en "proxy" (fichier + export) — voir
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md.
export default createMiddleware(routing);

export const config = {
  // Toutes les routes sauf /api (NextAuth y compris), les fichiers Next internes,
  // et tout chemin avec une extension (favicon.ico, robots.txt, sitemap.xml...).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
