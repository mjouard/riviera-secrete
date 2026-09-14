import Link from "next/link";
import "./globals.css";

/**
 * Refonte UI Lot 2 — 404 de dernier recours.
 *
 * `[locale]/not-found.tsx` couvre les 404 levées *dans* une page (un slug de lieu inconnu,
 * le cas le plus fréquent puisque les fiches lieu reçoivent l'essentiel du trafic entrant).
 * Mais une URL dont le premier segment n'est ni `fr` ni `en` (`/nimportequoi`) n'entre jamais
 * dans ce layout : `dynamicParams = false` la rejette au niveau du routage, avant tout
 * rendu — et sans ce fichier, Next sert alors son écran par défaut, en anglais et sans mise
 * en page. C'est le second fichier que next-intl demande pour cette raison.
 *
 * Il vit hors de `[locale]`, donc sans contexte de langue : impossible de traduire, la locale
 * est précisément ce qui manque. Texte en français, langue par défaut du site, et le `Link`
 * de `next/link` et non celui de `@/i18n/navigation`, qui exige ce contexte.
 *
 * Il porte son propre `<html>` : le layout racine de l'application est `[locale]/layout.tsx`,
 * qu'on ne traverse pas ici.
 */
export default function NotFoundRacine() {
  return (
    <html lang="fr">
      <body style={{ background: "var(--bg)", color: "var(--text)" }}>
        <div className="max-w-2xl mx-auto px-6 py-20">
          <p className="text-data mb-3" style={{ color: "var(--text-muted)" }}>
            404
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-3">
            Cette page n&apos;existe pas
          </h1>
          <p className="text-base mb-8" style={{ color: "var(--text-muted)" }}>
            Le lien est peut-être périmé, ou l&apos;adresse comporte une faute.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/" className="btn btn-primaire focus-ring-aube">
              Retour à l&apos;accueil
            </Link>
            <Link href="/#lieux" className="btn btn-secondaire focus-ring-aube">
              Voir tous les lieux
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
