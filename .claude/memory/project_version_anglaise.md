---
name: project-version-anglaise
description: "Plan détaillé pour la version anglaise du site (pas encore démarré) — routing, stockage du contenu traduit, phasage, décisions à valider avant de commencer"
metadata:
  type: project
  originSessionId: 24767a28-abd9-41f0-9385-80f67dd8db6d
---

## Statut

Plan établi le 2026-09-12. **Phase 0 (fondations) terminée et déployée en prod le
2026-09-13** : les deux décisions ci-dessous ont été confirmées par l'utilisateur
(routing `/en` + next-intl, colonnes jumelles nullables), puis implémentées intégralement
dans la même session — voir "Phase 0 — ce qui a été fait" plus bas pour le détail exact
(fichiers, commits, vérifications).

**Phases 1-3 (MVP + contenu éditorial + activités) terminées et déployées en prod le
2026-09-13**, suite à "Finissons la version anglaise" — voir "Phases 1-3 — ce qui a été
fait" plus bas. Restent : phase 4 (auth/transactionnel) et phase 5 (polish SEO), plus une
extension de scope à trancher avec l'utilisateur (champs JSON imbriqués non traduits, voir
"Scope réduit assumé" ci-dessous).

**Trou signalé par l'utilisateur le 2026-09-13, pas encore scopé** : `/creer-itineraire` (le
constructeur d'itinéraire — `PickerView.tsx` et le reste de `_components/`) n'a jamais été
touché pour la locale, ni dans la phase 0 ni dans les phases 1-3 (qui ne couvraient que les
pages de contenu public, pas les pages outil/compte). Probablement le plus visible des
oublis puisque c'est une page d'action, pas juste de lecture — à traiter avec
`/mes-itineraires`/`/mes-favoris`/`/connexion`/`/confirmer-email` dans une passe dédiée aux
pages compte (phase 4 ou une phase 3.5 séparée). Au passage, `PickerView.tsx` a le même bug
que celui trouvé et corrigé sur la page lieu (regionLabel brut au lieu de
`tRegionFull(regionSlug)`) — voir la ligne `regionLabel` dans "Phases 1-3" ci-dessous, même
correctif à répliquer ici.

## État des lieux au moment du plan

Aucune infra i18n n'existe : pas de `next-intl` ni équivalent dans
`frontend/package.json`, pas de segment `[locale]` dans `frontend/src/app/`, et toutes les
entités backend (`Lieu`, `Ville`, `Itineraire`, `Activite`) sont mono-langue (`Nom`,
`Description`, etc. sans variante de langue). Volume de contenu éditorial à traduire au
2026-09-12 : 27 lieux, 22 villes, 6 itinéraires, ~109 activités (`data/lieux.json` = 3333
lignes, `data/villes.json` = 244, `data/itineraires.json` = 985).

## Les deux décisions à valider avant de commencer

1. **Routing** — recommandé : `frontend/src/app/[locale]/...` (segment dynamique App
   Router) + `next-intl` pour la UI chrome (nav, footer, formulaires, messages d'erreur).
   Slugs de lieux/villes **identiques** dans les deux langues (`/en/lieux/eze-village`, pas
   de slug anglais dédié) — évite une table de correspondance slug↔lieu séparée et des
   redirections cassées si un slug change un jour.
   Alternative écartée : sous-domaine `en.` — plus lourd à opérer (DNS, cookies
   cross-domain) sans bénéfice ici.

2. **Stockage du contenu traduit** — recommandé : **colonnes jumelles nullable** sur les
   entités backend existantes (`Lieu.NomEn`, `DescriptionEn`, `Description2En`,
   `Activite.NomEn`/`AltEn`, `Ville.NomEn`/`DescriptionEn`, `Itineraire.*En`…) plutôt qu'une
   deuxième ligne ou un fichier dupliqué par langue. Une seule ligne par lieu — lat/lng,
   images, badges, prix restent partagés et ne se dupliquent pas. Un champ `*En` encore
   `null` retombe simplement sur le français côté `/en/` en attendant sa traduction, au lieu
   de casser la page.
   Alternative écartée : dupliquer `data/lieux.json` en `data/lieux.en.json` (et
   équivalents) — risque de désync garanti avec le contenu français qui continue d'être
   enrichi (voir [[project-activites-par-badge]], ~12 lieux déjà retouchés en une session).

## Phasage proposé

0. **Fondations** — migration EF (colonnes `*En` nullable), routing `[locale]`, `next-intl`
   pour la chrome, `hreflang` + sitemap par langue. **Fait le 2026-09-13**, voir détail
   ci-dessous.
1. **MVP anglais** — homepage (hero, sections), nav (déjà fait en phase 0), footer (déjà
   fait), `/villes` (page liste) traduits : assez pour être indexé et utile à un visiteur
   anglophone. **Note 2026-09-13** : `/lieux` et `/itineraires` (pages listes) ont été
   supprimées du site le même jour que ce plan a été écrit à l'origine — elles dupliquaient
   pure la homepage et le lien "voir tous" a été retiré. Donc pas de page liste à traduire
   pour ces deux-là : c'est la homepage elle-même (sections `#lieux`/`#itineraires`) qui
   fait office de page liste et qu'il faut traduire.
2. **Contenu éditorial** — traduction des 27 lieux + 22 villes + 6 itinéraires
   (descriptions/tips), lot par lot au même rythme que le chantier "activités par badge".
3. **Activités** — traduction des ~109 `activites[].nom`/`alt`, intégrable directement à la
   phase 2 lieu par lieu.
4. **Auth & transactionnel** — `/connexion`, `/confirmer-email`, emails Resend en anglais.
   **Note 2026-09-13** : `NextAuth.pages.signIn` (`src/lib/auth.ts`) reste codé en dur sur
   `/connexion` (sans locale) — un visiteur anglophone non connecté qui doit se
   ré-authentifier atterrit sur la page française. Limitation connue, acceptée pour
   l'instant, à corriger dans cette phase (probablement via un callback dynamique ou une
   page de redirection par locale).
5. **Polish SEO** — `hreflang` croisés (pas encore ajoutés, voir note ci-dessous), sitemap
   complet (le sitemap actuel ne liste que le français, volontaire tant que `/en` n'a pas de
   contenu réel — voir ci-dessous), `og:locale` (déjà fait en phase 0, varie par locale),
   vérifier Search Console après mise en ligne.

## Phase 0 — ce qui a été fait (2026-09-13)

**Backend** (commit `bb82324`) — migration EF `AddEnglishTranslationColumns`, 13 colonnes
`text` nullable, appliquée en prod via `railway run`/`dotnet ef database update` avec la
connection string publique (`DATABASE_PUBLIC_URL` du service Postgres — la variable interne
`DATABASE_URL`/`postgres.railway.internal` n'est résolvable que depuis l'intérieur du réseau
Railway, pas depuis une commande locale), puis backend redéployé (`railway up --service
api`) pour que l'API expose réellement les nouveaux champs. Colonnes ajoutées : `Lieu.{NomEn,
DescriptionEn, Description2En}`, `Ville.{NomEn, DescriptionEn}`, `Activite.{NomEn, AltEn}`,
`Itineraire.{TitreEn, BadgeEn, DescriptionEn, IntroEn, MapLabelEn}` — champs scalaires
uniquement ; les libellés imbriqués dans `Itineraire.Items`/`Booking`/`Suggestions` (JSON)
seront traduits directement dans leur structure JSON en phase 2/3, sans nouvelle migration.
Vérifié via `curl` sur l'API prod que les champs apparaissent (valeur `null`).

**Frontend** (commit `da6fdf1`) — `next-intl` installé et configuré :
- `src/i18n/routing.ts` (`locales: ["fr","en"]`, `defaultLocale: "fr"`,
  `localePrefix: "as-needed"` → le français reste sans préfixe, l'anglais est sous `/en/...`
  avec les mêmes slugs), `src/i18n/navigation.ts` (`Link`/`useRouter`/etc. locale-aware via
  `createNavigation`), `src/i18n/request.ts` (charge `messages/{locale}.json`).
- **Toutes les routes déplacées sous `src/app/[locale]/`** (`git mv` de chaque dossier +
  `page.tsx`/`layout.tsx` racine) — sauf `src/app/api/` (routes NextAuth, non localisées),
  `src/app/sitemap.ts` et `favicon.ico` (restent au niveau racine, hors segment de langue).
- `src/proxy.ts` (pas `middleware.ts` — **Next.js 16 a renommé cette convention en "proxy"**,
  fichier + export ; utiliser l'ancien nom produit un avertissement de dépréciation au build,
  voir `node_modules/next/dist/docs/.../file-conventions/proxy.md`) — appelle
  `createMiddleware(routing)` de next-intl, `matcher` exclut `/api`, `_next`, et tout chemin
  avec une extension.
- **Tous les `<Link>` et `useRouter` internes (21 fichiers) basculés** de `next/link`/
  `next/navigation` vers `@/i18n/navigation` — sans ça, un lien interne sur `/en/...`
  retomberait sur la page française (`next/link` ne connaît pas la locale courante). `notFound`
  reste importé de `next/navigation` (agnostique à la locale, pas concerné).
- Chrome traduit : `messages/fr.json`/`en.json` (clés `meta.*`, `nav.*`, `footer.*`),
  `NavHeader.tsx` et `src/app/[locale]/layout.tsx` (footer + `generateMetadata` par locale,
  `<html lang>` dynamique, `openGraph.locale` fr_FR/en_US) convertis en `useTranslations`/
  `getTranslations`. **Rien d'autre n'est traduit** — homepage, `/villes`, fiches lieu/
  itinéraire/ville affichent encore le contenu français sur `/en/*` (phase 1+).
- **`/en/*` marqué `robots: noindex, follow`** (dans `generateMetadata` du layout) tant que
  son contenu reste identique au français — évite un signal de duplicate content à Google.
  **À retirer explicitement en phase 1** une fois le contenu anglais réel en ligne, sinon
  `/en` restera invisible de Google indéfiniment.
- Pas de `alternates.languages` (hreflang) ajouté : le layout racine s'applique à toutes les
  pages, un hreflang générique `"/" <-> "/en"` y serait faux sur toute page qui n'est pas la
  homepage. À faire page par page en phase 1+ quand chaque page aura un vrai équivalent
  anglais.
- `sitemap.ts` non modifié : ne liste toujours que les URLs françaises, cohérent avec le
  `noindex` sur `/en`.
- Vérifié : build de prod (`next build`) propre, `/` et `/en` répondent 200 avec le bon
  `<html lang>`, nav/footer traduits sur `/en`, liens internes préfixés `/en/...`
  automatiquement, `robots: noindex, follow` présent uniquement sur `/en` (confirmé en prod
  via `curl` après déploiement).

**Limitation connue laissée telle quelle** : `NextAuth.pages.signIn` (`src/lib/auth.ts`)
reste `/connexion` fixe, sans locale — voir phase 4 ci-dessus.

## Phases 1-3 — ce qui a été fait (2026-09-13)

Suite au message utilisateur "Finissons la version anglaise". Tout commité sur `main` et
déployé (frontend `vercel --prod` + purge cache, backend inchangé — pas de nouvelle
migration).

**Frontend câblé sur next-intl** (commit `6daf58e`, puis fixes `e054693`/`30bf778`) : la
homepage, `/villes`, `/villes/[slug]`, `/lieux/[slug]`, `/itineraires/[slug]` et leurs
composants client (`HomeMap`, `HomeLieuxGrid`, `HomeActivities`, `HomeItineraires`,
`ItineraireCard`) lisent la locale courante et affichent nom/description/badges/régions
traduits via `loc(locale, champEn, champFr)` (`src/lib/utils.ts`) + `messages/{fr,en}.json`
(namespaces `home`, `villes`, `lieu`, `itineraire`, `activite`, `badges`, `categories`,
`regionShort`, `regionFull`, `common`). Deux bugs trouvés et corrigés en vérifiant `/en` en
navigateur après coup (pas au premier passage) : le `linkText` des cartes "à réserver" d'un
itinéraire (`b.linkText`, JSON `booking[]`) restait en français faute d'être mappé sur les
clés `activite.reserver`/`verifierHoraires` déjà utilisées ailleurs ; la page lieu affichait
`lieu.regionLabel` brut au lieu de `tRegionFull(lieu.regionSlug)` comme les pages ville —
**si un futur passage retrouve du texte français non voulu sur `/en`, chercher spécifiquement
les champs affichés bruts depuis l'API sans passer par `loc()`/`t()`, c'est la même classe de
bug les deux fois**.

**Contenu éditorial traduit** (commits `93f42cd`, `bd5651f`) : les 6 itinéraires
(`titreEn`/`badgeEn`/`descriptionEn`/`introEn`/`mapLabelEn`, traduits directement par
Claude) et les 43 lieux + 205 activités (`nomEn`/`descriptionEn`/`description2En` par lieu,
`nomEn`/`altEn` par activité — traduits par un subagent dédié, relu par échantillonnage
avant commit) ont leurs champs `*En` remplis dans `data/lieux.json`/`itineraires.json`.
Synchronisés en prod via `refresh-lieu-fields`/`refresh-activite`/`refresh-itineraire-fields`
(RivieraSecrete.Tools, connection string `SYNC_CONNECTION_STRING` — pas
`ConnectionStrings__DefaultConnection`, piège rencontré) — 43 lieux + 205 activités + 6
itinéraires, zéro échec, vérifié via `curl` sur l'API prod après coup.

**Bouton de switch de langue ajouté** (commit `377cb96`, `LanguageSwitcher.tsx`) : la phase 0
avait traduit le texte du nav mais jamais ajouté de contrôle UI pour changer de locale —
`/en` n'était accessible qu'en tapant l'URL à la main. Utilise le `Link` de next-intl avec un
prop `locale` explicite ; next-intl force alors un préfixe même pour le français
(`/fr/lieux/...`) côté clic, mais `src/proxy.ts` (middleware next-intl) redirige
`/fr/*` vers l'URL non préfixée puisque `fr` est la locale par défaut — comportement
intentionnel de next-intl, vérifié en navigateur, pas un bug.

## Scope réduit assumé — à trancher avec l'utilisateur

Les champs suivants **n'ont aucune colonne `*En` côté backend** (JSON-mappés, jamais prévus
pour la traduction en phase 0) et restent donc en français sur `/en` même après les phases
1-3 : `Lieu.tips[]`/`related[]`, `Activite.duree`/`prix` (dans `activites[]`),
`Itineraire.items[]`/`booking[]`/`suggestions[]`. Concrètement sur `/en` aujourd'hui : les
conseils pratiques d'un lieu, les cartes "à découvrir aussi", le programme détaillé
jour-par-jour d'un itinéraire (horaires/durées/prix), et les cartes "autres itinéraires"
restent en français. Chaque occurrence est marquée d'un commentaire inline renvoyant ici.
Décision prise unilatéralement par Claude (pas demandée par l'utilisateur, qui a répondu "on
va dire que pour l'instant c'est ok" sans trancher explicitement sur l'extension du backend)
— si le sujet revient, proposer soit d'étendre le schéma (nouvelle migration EF pour ces
champs), soit d'assumer cette limitation durablement.

## Explicitement déconseillé

- Traduire les slugs eux-mêmes.
- Dupliquer les fichiers `data/*.json` par langue.

Voir aussi [[project-activites-par-badge]] pour le processus lieu-par-lieu qui inspire le
phasage 2/3 ci-dessus, et [[feedback_vercel_deploy]] pour le piège de déploiement à ne pas
reproduire pendant ce chantier non plus.
