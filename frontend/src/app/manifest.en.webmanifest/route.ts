import { construireManifest } from "@/lib/manifest";

/**
 * Variante anglaise du manifeste PWA. Next ne génère qu'un `app/manifest.ts` par
 * application, d'où ce Route Handler — même procédé que le `app/robots.txt/route.ts`
 * documenté par Next quand le fichier généré ne suffit pas. L'extension dans le nom du
 * segment le fait aussi sortir du matcher du proxy next-intl, donc il n'est jamais
 * réécrit vers une locale.
 */
export const dynamic = "force-static";

export function GET() {
  return Response.json(construireManifest("en"), {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
