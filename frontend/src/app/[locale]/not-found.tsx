import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { loc } from "@/lib/utils";
import Photo from "@/components/Photo";

/**
 * Refonte UI Lot 2 — 404 localisée.
 *
 * Avant : l'écran 404 par défaut de Next, en anglais quelle que soit la langue, sans en-tête
 * ni pied de page — une impasse sur un site dont les fiches lieu reçoivent l'essentiel du
 * trafic organique, donc l'essentiel des liens périmés.
 *
 * Placée sous `[locale]/`, elle s'imbrique dans le layout de la locale : en-tête, pied de page
 * et contexte next-intl sont hérités sans plomberie. Next ne passe **aucune prop** à
 * `not-found.tsx` (pas de `params`, vérifié dans la doc de cette version), mais
 * `getTranslations()` résout quand même la bonne langue via le contexte posé par le layout,
 * qui a déjà appelé `setRequestLocale`.
 */
export default async function NotFound() {
  const t = await getTranslations("nonTrouve");
  const locale = await getLocale();
  // Une 404 n'a pas à tomber en erreur si l'API est indisponible : sans lieux, on garde le
  // message et les deux liens de sortie.
  const lieux = await api.lieux.list().catch(() => []);
  // Tirage côté serveur : ce composant ne se re-rend jamais dans le navigateur, le risque de
  // résultat instable entre deux rendus que vise la règle de pureté ne s'applique pas ici.
  // eslint-disable-next-line react-hooks/purity
  const suggestions = [...lieux].sort(() => Math.random() - 0.5).slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <p className="text-data mb-3" style={{ color: "var(--text-muted)" }}>
        404
      </p>
      <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-3">{t("titre")}</h1>
      <p className="text-base mb-8 max-w-prose" style={{ color: "var(--text-muted)" }}>
        {t("explication")}
      </p>

      <div className="flex flex-wrap gap-3 mb-12">
        <Link href="/" className="btn btn-primaire focus-ring-aube">
          {t("retourAccueil")}
        </Link>
        <Link href="/explorer" className="btn btn-secondaire focus-ring-aube">
          {t("explorer")}
        </Link>
      </div>

      {suggestions.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-3 list-none p-0">
          {suggestions.map((lieu) => (
            <li key={lieu.slug}>
              <Link
                href={`/lieux/${lieu.slug}`}
                className="focus-ring-aube group block rounded-xl overflow-hidden transition-transform hover:-translate-y-1"
                style={{ background: "var(--surface)" }}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Photo
                    sizes="(max-width: 640px) 100vw, 33vw"
                    src={lieu.thumbImage}
                    alt={lieu.heroAlt}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <p className="text-xs mb-1" style={{ color: "var(--azure)" }}>
                    {lieu.commune}
                  </p>
                  <h2 className="font-semibold text-sm leading-snug">
                    {loc(locale, lieu.nomEn, lieu.nom)}
                  </h2>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
