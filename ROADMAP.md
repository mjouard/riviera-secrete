# Roadmap — Riviera Secrète

Nettoyé le 2026-09-16 : la refonte UI (Lots 1-5, ci-dessous) est terminée et déployée. Ce
fichier a été condensé à cette occasion — tout ce qui était fait sans reste actionnable a été
retiré ou réduit à une ligne ; le backlog produit spéculatif (avis communautaires, newsletter,
filtres situationnels, structured data) a été retiré à la demande de l'utilisateur, faute de
prérequis satisfaits ou de priorité proche. Détail historique complet dans `git log` et
`.claude/memory/` si besoin de retrouver une décision.

## 🔴 Bloquant — action utilisateur

- [ ] **Rotation du mot de passe PostgreSQL de prod.** Il est dans l'historique d'un dépôt
      **public** (commit `7f25aea`) sur le proxy public Railway : accès `postgres` complet à
      quiconque lit le dépôt — comptes, hashs, tokens de confirmation en clair. Le retirer du
      fichier (fait, `7f57c21`) ne suffit pas. Rotation via Railway, puis mise à jour de
      `ConnectionStrings__DefaultConnection` sur le service `api` et de
      l'`appsettings.Development.json` local. Inspecter les lignes de `Users` non reconnues.
      `scripts/sync-coordonnees.sh` relit la chaîne à chaque exécution, restera valable après.

## Backend — dette technique (audit 2026-09-17)

Audit complet dans `backend/AUDIT.md`. Priorités extraites ici.
Fixes appliqués le 2026-09-17 (commits `3f250c7`, `6c21499`).

### Critiques

- [x] **S1 — Guard sur `Jwt:Issuer` / `Jwt:Audience`** — `?? throw InvalidOperationException`
      ajouté comme pour `Jwt:Secret`.
- [ ] **M1 — Zéro test** — `ValiderItineraire`, `EstAutoriseSurItineraireCompose`,
      `EstSlugValide` non couverts. Minimum : tests unitaires sur les validators + 1 test
      d'intégration auth (SQLite in-memory).

### Majeurs

- [x] **S2 — `EditToken` comparé par `==`** → `CryptographicOperations.FixedTimeEquals`.
- [x] **S3 — Headers de sécurité HTTP** — `X-Content-Type-Options`, `X-Frame-Options`,
      `Referrer-Policy` ajoutés via middleware.
- [ ] **S4 — Confirmer `ASPNETCORE_ENVIRONMENT=Production` sur Railway** — sinon `/api/seed`
      est accessible en prod.
- [x] **S5 — CORS `AllowAnyMethod()`** → `WithMethods("GET","POST","PUT","PATCH","DELETE","OPTIONS")`.
- [x] **P1 — `AsNoTracking()`** ajouté sur les 6 endpoints de lecture publique.
- [ ] **P2 — Aucun cache côté API** — `OutputCache` 60 s sur les endpoints publics. Différé :
      nécessite d'invalider aussi le cache ASP.NET Core depuis `RivieraSecrete.Tools`,
      sinon le `/api/revalidate` frontend ne suffit plus.
- [x] **A1 + M2 — `EmailService` injectable** — converti en classe non-statique avec
      `IHttpClientFactory` et `ILogger<EmailService>` ; enregistré en DI.
- [x] **M3 — Gestion globale des exceptions** — `app.UseExceptionHandler` en production,
      log structuré `LogError` + 500 JSON.

### Mineurs

- [x] **S6 — Race condition `/register`** → `catch (DbUpdateException)` → 409.
- [x] **S7 — Validation email** → regex `^[^@\s]+@[^@\s]+\.[^@\s]+$`.
- [x] **M5 — `PasswordResetTokenExpiry` null** — `is null ||` ajouté avant la comparaison.
- [ ] **P3 — `GET /api/villes` surcharge** → projection sans `Include(Lieux)`. Différé :
      plusieurs pages frontend utilisent `v.lieux` depuis le listing, nécessite un refactor
      du type `Ville` côté frontend d'abord.
- [x] **M6 — Tag Docker `sdk:10.0` flottant** → épinglé sur `sdk:10.0.401`.
- [x] **A2 — `Program.cs` monolithique** → `Helpers.cs` (static class + `using static`) +
      `Dtos.cs` ; `Program.cs` passe de 767 à 588 lignes.
- [ ] **M7 — `CreatedAt` non-nullable sans init C#** → `DateTime?` ou `= DateTime.UtcNow`.

## Frontend — dette technique (audit 2026-09-17)

Audit complet dans `frontend/AUDIT.md`. Priorités extraites ici.

### Critiques

- [x] **F1 — `FormulaireAuth.tsx` à scinder** — ~350 lignes, 3 logiques mélangées (login,
      register, pending confirmation), 8 états simultanés. Toute évolution du flow auth est
      bloquée tant que ce fichier n'est pas découpé en `LoginForm` / `RegisterForm` /
      `PendingConfirmationForm`.
- [x] **F2 — Typage NextAuth Session/JWT insuffisant** (`src/types/next-auth.d.ts`) —
      `apiToken?: string` déclaré optionnel alors que tout `authFetch` l'assume présent. Pas
      d'interceptor 401 → session expirée = requête silencieusement échouée. Rendre `apiToken`
      et `user.id` obligatoires ; ajouter `signOut()` sur 401 dans `authFetch`.
- [x] **F3 — `carnet/page.tsx` : 3 états de chargement disjoints** — `favLoading`,
      `itinLoaded`, `loadingAuth` chargés dans 2 `useEffect` séparés. Extraire un hook
      `useCarnetData()` avec `Promise.all`.

### Majeurs

- [x] **F4 — `estTactile()` dupliquée** (`ExplorerMap.tsx` l.16 copie `map-tiles.ts` l.32) →
      centralisée dans `map-tiles.ts` (exportée), `ExplorerMap` importe depuis là.
- [x] **F5 — Couleurs Leaflet hardcodées** (`"#E8A33D"` dans `BuilderMap.tsx`, `"#4a9eca"`
      dans `LeafletItinMap.tsx`) → `var(--aube)` et jeton `--trace-itin` ajouté dans
      `globals.css` ; pas de `getMarkerColor()` (tokens CSS directs suffisent).
- [x] **F6 — `ItineraireItem` : union sans discriminant** (`types.ts`) — `nom?`, `lieuSlug?`,
      `activites?`, `dormirA?` tous optionnels, compilateur n'aide pas → discriminated union
      sur `type: "stop" | "transit" | "sleep"` ; prédicats de type dans les appelants.
- [x] **F7 — Champs `?: T | null` incohérents** (`types.ts`) — `?: T | null` → `: T | null`
      sur tous les champs i18n et nullable (nomEn, horaires, fermeJours…) : le backend
      envoie toujours null pour ces champs, jamais undefined.
- [x] **F8 — `itineraire-logic.ts` monolithique** (~350 lignes, mélange génération / planning /
      formatage) → scindé en `itineraire-format.ts` (pur formatage, zéro import Lieu) et
      `itineraire-url.ts` (encode/decode jours) ; `itineraire-logic.ts` ré-exporte les deux
      pour que les 17 sites d'import restent inchangés.
- [x] **F9 — Props drilling Explorer sur 4 niveaux** (`ExplorerShell → List → Card`) →
      `ExplorerHoverContext` (hoveredSlug + onHover) ; Shell fournit via Provider, List et
      Card consomment via `useExplorerHover()` sans props intermédiaires.
- [ ] **F10 — `.catch(() => {})` muet** dans plusieurs pages (Carnet, Explorer) → `ErrorBoundary`
      global + toast system pour les erreurs réseau silencieuses.

### Mineurs

- [ ] **F11 — Zéro test sur la logique métier** — `generateItineraire()`, `construirePlanning()`
      non couverts → Jest/Vitest sur `itineraire-logic.ts` en priorité (logique pure, pas de DOM).
- [ ] **F12 — Pas de bundle analysis** → `@next/bundle-analyzer` pour mesurer les chunks.
- [ ] **F13 — 5 fonts Google** (`layout.tsx`) — FCP/LCP non mesuré ; auditer et supprimer les
      peu utilisées.

## Arbitrages produit en attente

- [ ] **Durée de vie du JWT** — 30 jours, aucune denylist de `jti`, pas de refresh token : un
      token volé reste valable 30 jours, une rotation du secret déconnecte tout le monde.
- [ ] **`409` de `register`** — « Un compte existe déjà avec cet email » permet d'énumérer les
      comptes. Le corriger change l'UX du frontend.
- [~] **Nom de `rue-obscure-villefranche`** — l'audit signalait des badges `plage`/`plongee`
      incohérents sur ce lieu ; vérifié le 2026-09-14, les badges sont corrects (la plage des
      Marinières est à 3-5 min, l'activité elle-même le mentionne). Le vrai problème est que
      le nom ne couvre pas tout ce que le lieu recense (citadelle, kayak, snorkeling, plage) —
      renommage en « Le Vieux Villefranche et la Rue Obscure » suggéré, décision éditoriale
      laissée à l'utilisateur (`refresh-lieu-fields` peut appliquer un renommage sans toucher
      au slug).
- [ ] **Couvrir l'état connecté en test** — jamais testé par audit (reconnexion Google exige
      des identifiants) : favoris persistés, `/carnet` peuplé, édition/suppression d'un
      itinéraire sauvegardé.

## Refonte UI — spécifications du 2026-09-14

Spécifications complètes dans `docs/design-refonte-2026-09-14.md` (extrait des maquettes,
seule source encore sur disque). Maquettes de référence : `Downloads/refonte-riviera-secrete.html`
(hors dépôt). **Les 5 lots sont livrés, déployés et vérifiés en prod** (Lot 1 : 2026-09-14 ;
Lot 2 : 2026-09-14 ; Lot 3 : 2026-09-15 ; Lot 4a-4e : 2026-09-14 → 2026-09-16 ; Lot 5 :
2026-09-16). Détail des bricks dans l'historique git (chaque commit `feat: refonte UI Lot X`).
Ne reste ci-dessous que ce qui est explicitement resté hors périmètre ou non fait.

### Reste ouvert — transversal (posé au Lot 1, jamais repris globalement)

- [x] **Cache CDN/ISR** — fiches lieux (`/lieux/[slug]`) renvoyaient `x-vercel-cache: MISS`
      (TTFB ~2s) car `searchParams` (`?itin=`) dans le server component forçait le rendu
      dynamique. Corrigé le 2026-09-17 : breadcrumb extrait dans `LieuBreadcrumb` (client,
      `useSearchParams` + `<Suspense>`), le server component ne lit plus `searchParams` et
      bénéficie de l'ISR. La homepage et les pages communes/itinéraires étaient déjà en
      cache (`STALE`/`PRERENDER`) — seules les fiches lieux étaient cassées.
- [ ] **Sécurité du token API** — proxifier les appels via des route handlers Next
      (`app/api/**/route.ts`), garder le JWT dans un cookie `httpOnly Secure SameSite=Lax` au
      lieu de l'exposer côté client. À défaut, réduire fortement sa durée de vie.
- [ ] **Règle de rareté du bouton primaire** — un seul bouton ambre visible par zone d'écran ;
      si deux cohabitent, l'un passe en secondaire. Pas encore audité écran par écran.
- [ ] **Accessibilité générale** — `aria-pressed` sur chips/cœurs, `role="alert"` sur les
      erreurs de formulaire, `alt=""` explicite sur le décoratif, lien "Aller au contenu",
      `.focus-ring` posée partout (la classe existe, peu appliquée). Le `<dialog>` natif
      (Modal) a déjà Échap/piège à focus gratuits ; le menu burger n'a pas d'écoute Échap.
- [ ] **Migration `rounded-lg`/`rounded-full` → tokens** — 74 occurrences sur les fichiers
      que les Lots 4/5 n'ont pas touchés.

### Reste ouvert — par écran

- **Fiche lieu (4a)** : ligne de confiance « vérifié sur place en [mois/année] » non faite —
  le champ `verifieSurPlace` n'existe pas, l'écrire en dur serait inventer une vérification.
  Feuille contextuelle « Connecte-toi pour épingler Èze » pas faite (reste une redirection
  sèche vers `/connexion`). Chrome partagé pas encore repris : burger 40px, flèches carrousel
  36px, pastilles 7-9px, sous les 44px cible.
- **Explorer (4b)** : légende d'altitude non faite (`altitude` n'existe pas sur `Lieu`).
  Squelettes de chargement et « chercher dans cette zone » non faits (pas de `bbox` en URL,
  décision délibérée — 43 lieux tiennent déjà à l'écran). `/activites → /explorer?type=activites`
  non fait, décision actée (dupliquerait la logique de `ActivitesGrid.tsx`).
- **`/i/[id]` (4d)** : persistance complète dans l'URL de `/composer` pour le cas anonyme (F5
  reconstruit tout) — non faite, hors périmètre de cette passe, `/creer-itineraire` garde son
  mécanisme `?jours=`. Profil d'altitude en cartouche — même lacune de donnée qu'Explorer.
  Chronologie `60px 1fr` interne à `ProgrammeSection.tsx` — composant partagé avec
  `/creer-itineraire`/`/composer`, restylage jugé hors périmètre.
- **Accueil (4e)** : performance non auditée (objectif <900 Ko/<60 requêtes — seul le héros à
  une image, le plus gros levier, a été fait).
- **Lot 5** : renommage backend `Ville` → `Commune` (entité, migration EF, endpoints) — non
  fait, gain invisible côté utilisateur, décision actée. `/carnet` : rendu des listes
  favoris/itinéraires jamais retesté en session authentifiée (même item que plus haut).
  `/composer` ne gère pas encore `?id=` (un itinéraire déjà sauvegardé) — la redirection
  `/creer-itineraire → /composer` est donc conditionnelle (`missing: id`).

### Bugs de fond trouvés pendant la refonte, pas encore corrigés

- [ ] Syntaxe ICU invalide sur `composer.lieuxTrouves` (`FORMATTING_ERROR` en console) —
      signalé en tâche de fond.
- [ ] `sitemap.ts` n'inclut pas `/explorer`/`/composer` — signalé en tâche de fond.

### Reliquat des audits UX/UI du 2026-09-14, non couvert par la refonte ci-dessus

La plupart des constats de ces deux audits (`docs/audits/2026-09-14-audit-ux*.html`) ont été
corrigés au fil des Lots 1-5 (404 localisée, partage de lien, suppression via `<dialog>`
natif, générateur moins conservateur, filtres carte/liste unifiés, marqueurs groupés,
vocabulaire figé, cibles tactiles des liens Maps…). Ce qui reste, sans qu'aucun lot ne l'ait
couvert :

- [ ] **Cartes `/carnet` (onglet itinéraires) sans lien direct** (EC-05) — « Voir »/« Supprimer »
      sont des `<button>`, pas de `href`. Impossible d'ouvrir dans un nouvel onglet.
- [ ] **Champs de saisie en 12–14px → zoom auto Safari iOS** (MO-02) — `font-size: 16px`
      manquant sur des `input`/`select`/`textarea` restants.
- [ ] **Libellés de sortie des activités inconsistants** (DC-03) — « En savoir plus → »,
      « Réserver → », « Voir les offres → » cohabitent sans règle.
- [ ] **Message d'erreur de connexion non annoncé** (AC-01) — pas de `role="alert"`/
      `aria-live`, un lecteur d'écran n'annonce rien.

## Priorité contenu

Chantiers de contenu (activités par badge, villes manquantes, photos réelles, horaires
d'ouverture des sites payants) **terminés** entre le 2026-08-27 et le 2026-09-15 — 40 lieux,
34 villes, 6 itinéraires, tous avec vraie photo et coordonnées vérifiées. Détail complet dans
`.claude/memory/project_activites_par_badge.md` et `project_villes_expansion.md`.

- [ ] **133 photos plus petites que leur emplacement** — listées dans
      `docs/photos-a-resourcer.md`. Aucun script ne peut les réparer (re-sourçage Wikimedia
      nécessaire). Chantier de contenu, à lancer quand voulu.
- [ ] **Horaires des 37 restaurants + 12 locations/sorties** — volontairement laissés de côté
      (horaires trop volatils pour les figer) ; seuls les 22 sites à visiter sont renseignés.

## Découverte & navigation

Recherche textuelle, filtres saison/durée/niveau, « Surprends-moi », géolocalisation « Près de
moi » — tous faits (2026-09-13), portés sur `/explorer` au Lot 4e.

- [ ] **« Depuis Nice/Cannes/Monaco en X min »** — stocker une durée de trajet approximative
      par lieu, filtre « moins de 45 min de [ville de départ] », sans appel API routage
      (estimation manuelle à la saisie, ~data + 2h).

## Features UX

Créateur d'itinéraire (rendu complet, export PDF, partage par URL), connexion Google + email/
mot de passe avec confirmation et réinitialisation, page `/a-propos`, page `/activites`
filtrable, messages d'erreur backend traduits, PWA installable + cache offline (paliers 0-1) —
tous faits. Détail dans l'historique git si besoin.

- [ ] **`/a-propos` : formulaire de contact/signalement** — différé pour ne pas exposer une
      adresse perso au scraping, à faire une fois le domaine acheté (voir plus bas).
- [ ] **Mentions légales / confidentialité : champs `[À compléter]`** — identité de l'éditeur,
      directeur de publication, adresse de contact. Seul l'éditeur peut les renseigner ;
      l'adresse dépend aussi du domaine.
- [ ] **Réinitialisation de mot de passe non vérifiée de bout en bout** — le code est en place
      (`AddPasswordReset`, migration appliquée en prod) mais jamais testé avec un vrai envoi
      (Resend est en sandbox). À faire une fois le domaine branché.
- [ ] **Préciser la promesse marketing** — « hors des sentiers battus »/« lieux secrets » est
      contredit par Èze, Monaco, Saint-Tropez, Pampelonne. Piste : « la Côte d'Azur au-delà des
      cartes postales ». Relevé indépendamment par deux audits différents.
- [ ] **PWA palier 2 (optionnel)** — bouton « télécharger cet itinéraire » pour mettre en cache
      explicitement N fiches + photos avant un départ. Carte hors ligne nécessiterait de
      changer de fournisseur de tuiles (coût séparé, non prioritaire).

## Communauté / comptes

Connexion Google + email/mot de passe, confirmation d'email, favoris et itinéraires en base
(migration depuis localStorage) — tous faits.

- [ ] **Confirmation d'email indisponible pour un vrai visiteur** — Resend est en sandbox
      (`onboarding@resend.dev`), n'envoie qu'à l'adresse du compte Resend. Bloqué sur l'achat
      du domaine (voir ci-dessous).

## Mise en production réelle

- [x] Migration Netlify → Vercel, déploiement auto sur push `main`.
- [ ] **Acheter un nom de domaine** (ex. `riviera-secrete.fr`/`.com`) et le pointer sur Vercel.
      Débloque : la vérification du domaine sur Resend (lève la limite sandbox des emails), et
      le formulaire de contact de `/a-propos`.
- [ ] Soumettre `sitemap.xml` dans Google Search Console une fois le domaine enregistré.
- [ ] Ajouter le site dans Bing Webmaster Tools.
- [ ] Minification CSS/JS au build (`esbuild`/`lightningcss`).
- [ ] Uptime monitor (ex. UptimeRobot gratuit).
- [ ] Vérifier les Core Web Vitals dans Search Console après mise en ligne.
- [ ] Configurer une branche `staging`/Vercel Preview Deployments.

**Déploiement toujours manuel** (`cd frontend && vercel --prod --yes`) — la GitHub integration
Vercel a été désactivée (redéployait depuis la racine du repo au lieu de `frontend/`). Ne pas
la reconnecter, voir `.claude/memory/feedback_vercel_deploy.md`.

## Critères de recette globaux

| # | Critère | Vérification |
|---|---|---|
| 1 | Un itinéraire composé survit à un F5 et à Précédent, sans compte | Manuel — ⚠️ `/composer` seul, voir "Reste ouvert par écran" |
| 2 | Un lien `/i/[id]` s'ouvre en navigation privée | ✅ vérifié |
| 3 | Une vue filtrée se partage et se recharge à l'identique | ✅ vérifié (Lot 2) |
| 4 | Aucun élément interactif sous 44px sur les 8 écrans | Partiel — chrome partagé (4a) encore sous le seuil |
| 5 | Aucun `input`/`select`/`textarea` sous 16px | ⚠️ MO-02 encore ouvert |
| 6 | Tout texte atteint 4,5:1 de contraste | Non audité |
| 7 | Chaque image a un `alt` (vide si décoratif) | ⚠️ AC-02 encore ouvert |
| 8 | Échap ferme menu, modale et feuille | Partiel — modale ✅, menu burger ⚠️ |
| 9 | Aucun `window.confirm`/`alert` dans le code | ✅ vérifié (Lot 4d) |
| 10 | Toute action > 150ms a un état visible | Majoritairement fait |
| 11 | `x-vercel-cache: HIT` sur les routes éditoriales | ❌ cache CDN/ISR non fait |
| 12 | Accueil < 900 Ko et < 60 requêtes | Non audité |
| 13 | Aucun filtre ne remonte un lieu hors catégorie | ✅ vérifié |
| 14 | Un seul bouton primaire ambre visible par zone d'écran | ❌ règle de rareté non appliquée |
