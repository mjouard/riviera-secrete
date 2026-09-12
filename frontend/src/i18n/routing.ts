import { defineRouting } from "next-intl/routing";

/**
 * Français = locale par défaut, sans préfixe (/, /villes, /lieux/eze-village...) —
 * comportement identique à avant l'ajout de l'i18n, aucune URL FR ne change.
 * Anglais = préfixé /en/... avec les mêmes slugs qu'en français (pas de slug traduit,
 * voir .claude/memory/project_version_anglaise.md).
 */
export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "as-needed",
});
