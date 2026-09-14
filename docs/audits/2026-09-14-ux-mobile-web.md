# Passe UX mobile + web — 2026-09-14

Suite opérationnelle de [l'audit de tests utilisateurs](2026-09-13-tests-utilisateurs.md) :
correction des défauts identifiés, chacun vérifié dans le navigateur avant commit.
`npx tsc --noEmit` et `npm run lint` verts avant chaque commit (0 erreur).

## Corrigé

| Commit | Objet | Vérification |
|---|---|---|
| `7af58eb` | **Modale de sauvegarde d'itinéraire** — champ pré-rempli (« Itinéraire Journée — Nice » / « Full day itinerary — Nice »), erreur visible (`role="alert"`, `aria-invalid`, bordure terracotta) si on valide à vide, libellé d'action **« Se connecter et sauvegarder »** au lieu de l'état « Connexion requise », phrase expliquant pourquoi un compte est demandé, `role="dialog"` et label sur le champ. | FR/EN, desktop + mobile, jusqu'à la redirection `/connexion?callbackUrl=…` avec le brouillon en `sessionStorage` |
| `1b1dffa` | **`/robots.txt`** — `app/robots.ts` créé (hors `[locale]`, avec la ligne `Sitemap:`), plus `dynamicParams = false` sur `[locale]/layout.tsx` pour la cause racine. | Build de prod (`next start`) : `/robots.txt` 200, `/foo.txt` et `/apple-touch-icon.png` 404, aucune régression sur `/lieux/[slug]`, assets, sitemap, favicon, `sw.js` |
| `59b056a` | **Recherche des activités** — `activites[].nom` + `nomEn` indexés dans les deux locales, la carte nomme l'activité qui a matché. | Avant : 0 partout. Après : kayak 2, parapente 1, musée 11, snorkeling 5, vélo 2 — FR et EN |
| `68a78a8` | **Horaires des cartes « À réserver »** dérivés de l'activité référencée ; `extraSpans` vidé dans le JSON et marqué `@deprecated`. | Recherche sur tout `data/*.json` : c'était le seul cas. Effet de bord : `/en` ne contient plus aucune chaîne française |
| `8db74bc` | **« Fermé aujourd'hui »** branché sur les pastilles d'étape et les cartes du créateur. | Testé un lundi : pastille présente sur la Chapelle du Rosaire et le Trophée d'Auguste, **absente** sur le Musée Renoir (fermé le mardi) — la condition est bien évaluée |
| `d9ef3a6` | **Cartes tactiles** — `touch-action: pan-y` en `(pointer: coarse)`, drag à un doigt désactivé, indication « deux doigts » traduite, carte d'accueil ramenée à 300 px en mobile. Correctif dans `createBaseMap`, donc les 4 cartes. | Desktop inchangé |
| `8e88475` | **Catalogue en grille verticale** (2 colonnes en mobile). Le fondu `.card-reveal`, bridé à 640px+ à cause du scroll horizontal, s'applique maintenant aussi en mobile. | |
| `a68e607` | **Sous-titre du hero** — `--text` + voile renforcé + ombre portée ; CTA secondaire rhabillé. | Pire cas absolu calculé (photo blanche) : **1,26:1 → 5,69:1** |
| `36c120a` | **Accessibilité** — classe `.focus-ring` unique (8,1:1), noms accessibles sur les cases de zone, `<label>` sur les 3 champs de `/connexion`. | |
| `3c7fe11` | Titres propres pour les 5 pages compte/outil. | |
| `fb8d130` | `rel=canonical` sur toutes les pages publiques, `/credits` sorti du `noindex`, texte périmé retiré. | |
| `392a0a9` | Manifeste PWA par langue ; page hors-ligne avec « Réessayer » et retour accueil. `CACHE_VERSION` bumpée, sinon la page cachée n'aurait jamais été remplacée. | |
| `08356cb` | Format euro à l'anglaise sur `/en` (`€20 / adult`). | |
| `a5ee75a` | `CLAUDE.md` — pièges et conventions issus de la passe. | |

## Constats de l'audit qui se sont révélés faux

Deux points relayés depuis le rapport de tests utilisateurs **n'ont pas été « corrigés »**,
parce qu'ils ne posaient pas de problème :

- **Le bouton « Générer mon itinéraire » n'était pas mort.** Le message « Sélectionne au
  moins un lieu. » s'affichait bien (`showEmptyNote`, antérieur à l'i18n). Il n'était
  simplement pas annoncé aux lecteurs d'écran — `role="alert"` et `aria-describedby` ajoutés.
- **Les radios de durée ont bien un libellé accessible** : `input.labels` renvoie
  « Demi-journée ». Le `demi-journee` observé dans l'audit était l'attribut `value` remonté
  par l'outil d'inspection.

En revanche, un troisième constat s'est révélé **plus grave que décrit** : les champs de
formulaire n'avaient *aucun* indicateur de focus, le `focus:border-white/30` étant neutralisé
par un `borderColor` inline. Trouvé en passant : les 3 champs de `/connexion` n'avaient pas
de `<label>` associé.

## Pièges rencontrés, à retenir

- **`dynamicParams = false`** est la cause racine des 500. Le proxy next-intl ignore tout
  chemin portant une extension (matcher `.*\..*`, indispensable pour `/sitemap.xml`,
  `/assets/…`, `/sw.js`) : une URL inexistante comme `/foo.txt` arrivait donc dans
  `/[locale]` avec `locale = "foo.txt"`. Cette page étant prérendue pour `fr` et `en`, Next
  tentait un rendu à la demande ; faute de `setRequestLocale` valide, next-intl lisait les
  en-têtes, ce que Next refuse sur une page statique → *« Page changed from static to dynamic
  at runtime, reason: headers »* → 500.
- **Bumper `CACHE_VERSION` du service worker** dès qu'on touche à une ressource précachée,
  sinon la version en cache ne sera jamais remplacée.
- **`/creer-itineraire` reste intestable en local** sans contournement : elle charge ses
  lieux côté client et le CORS de l'API de prod n'autorise que l'origine de prod. Un proxy
  same-origin temporaire dans `next.config.ts` fait l'affaire — **à retirer ensuite**.

## Laissé de côté

- **La base de prod garde les anciennes valeurs.** Les corrections de `data/*.json`
  (`extraSpans`) ne s'y propagent pas — le seeder est idempotent. Tout est corrigé côté
  rendu, donc rien ne casse, mais les colonnes restent sales. Même raison pour les `prixEn`
  au format français, normalisés à l'affichage plutôt que dans les données.
- **`extraSpans`/`extraSpansEn`** attendent une suppression d'entité + migration EF, comme
  `ogImage` avant eux.
- **Deux détails non corrigés** : « Voir les 1 autres → » ignore le singulier dans le
  créateur ; `/credits` laisse ~90 titres de photo en français sur `/en` — mais c'est un
  choix documenté dans le code (les titres d'œuvres Commons ne se traduisent pas), pas un
  oubli.
