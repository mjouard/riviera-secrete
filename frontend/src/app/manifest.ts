import type { MetadataRoute } from "next";
import { construireManifest } from "@/lib/manifest";

/**
 * Manifeste de la locale par défaut (français, non préfixée). La variante anglaise est
 * servie par app/manifest.en.webmanifest/route.ts ; c'est [locale]/layout.tsx qui pointe
 * chaque page vers le bon fichier.
 *
 * Hors du segment [locale], comme sitemap.ts et favicon.ico : ces fichiers vivent à la
 * racine du domaine et le proxy next-intl ne les localise pas (matcher `.*\..*`).
 */
export default function manifest(): MetadataRoute.Manifest {
  return construireManifest("fr");
}
