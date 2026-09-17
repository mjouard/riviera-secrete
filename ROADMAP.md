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
- [x] **F10 — `.catch(() => {})` muet** dans plusieurs pages (Carnet, Explorer) →
      `Toast.tsx` (ToastProvider + useToast, zéro lib externe) dans `Providers.tsx` ;
      carnet ajoute `loadError` + bannière inline ; creer-itineraire et composer utilisent
      `showError()` dans leurs catch client-side.

### Mineurs

- [x] **F11 — Zéro test sur la logique métier** — Vitest v5 installé (`npm run test`) ;
      40 tests couvrant `parseDureeTexte`, `formatDuree`, `formatTime`, `parseHeureMinutes`,
      `dureeKeyDepuisBadge`, `generateItineraire`, `construirePlanning` — tous passent.
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
  Feuille contextuelle « Connecte-toi pour épingler Èze » pas faite — la redirection vers
  `/connexion` préserve désormais la locale (`663b7ff`), reste à faire la bottom sheet locale. Chrome partagé pas encore repris : burger 40px, flèches carrousel
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

- [x] Syntaxe ICU invalide sur `composer.lieuxTrouves` / `recapTitre` / `lieuxSection`
      (`FORMATTING_ERROR` en console, "placex" affiché) — corrigé le 2026-09-17 (`663b7ff`).
- [ ] `sitemap.ts` n'inclut pas `/explorer`/`/composer` — signalé en tâche de fond.

### Audit UX/UI du 2026-09-17 (docs/audit-ux-riviera-secrete.md, wireframes docs/audit-riviera-secrete.html)

Note globale : 5,4/10. Maquettes M1–M6 dans `docs/audit-riviera-secrete.html` — référence visuelle pour les correctifs Mois 1 et Trimestre.

#### Semaine 1 — réparer (fait le 2026-09-17, commit `663b7ff`)

- [x] Pluriels ICU `composer.lieuxTrouves` / `recapTitre` / `lieuxSection` — "placex" et `FORMATTING_ERROR` corrigés.
- [x] `redirectToConnexion()` préserve la locale — `/en/` → `/en/connexion`.
- [x] Un seul `<h1>` par page — print-header de ResultsView converti en `<p aria-hidden>`.
- [x] Toast favori — "Ajouté / Retiré de vos favoris" après chaque bascule réussie.
- [x] Bouton « Composer » désactivé sans sélection — fait en amont (ComposerMobileBar).
- [x] 404 localisée — faite en amont (`not-found.tsx`).
- [x] Recherche header branchée sur `/explorer?q=` — faite en amont (NavHeader).
- [x] `alt` sur toutes les images (AC-02) — vérifié le 2026-09-17 : `Photo` impose déjà un `alt`
      non optionnel, et les 43 lieux/activités/`related`/`suggestions` ont tous un `heroAlt`/
      `alt` non vide en base (script de contrôle). Seul bug réel trouvé : `ActivitesGrid.tsx`
      ignorait `altEn` et affichait l'alt français même sur `/en/activites` — corrigé.

#### Mois 1 — restructurer le mobile (maquettes M1, M3, M4)

- [ ] **M1 · Composeur mobile** — récapitulatif éditable + tiroir filtres, cartes 1 colonne, titres non tronqués, état « Ajouté ✓ » explicite.
- [ ] **M3 · Explorer mobile** — chips défilantes + bouton « Filtres », liste plein écran, carte flottante « 🗺 Carte ».
- [ ] **M4 · Fiche lieu mobile** — titre + accroche avant la photo, tableau de métadonnées, une seule barre d'actions.
- [x] **Hero accueil : CTA « Composer » dans le premier écran mobile, header 56 px** (fait le
      2026-09-17) — header mobile 77→56px (`py-1.5`, desktop inchangé via `lg:py-4`), titre du
      hero 32px sur mobile (`sm:text-display` au-dessus de 640px), question « J'ai envie de »
      masquée sur mobile et reportée à `/composer` (qui a déjà son propre filtre par badge).
      Bouton visible à 693px sur 812px de viewport (vérifié au navigateur).
- [x] **Réordonnancement par glisser-déposer, cibles 44 px** (▲✕▼ actuellement 20 px, fait le
      2026-09-17) — `ResultsView.tsx` (partagé par `/composer` et `/creer-itineraire`) reprend
      le markup 44×44 + toast « {nom} retiré · Annuler » déjà en prod sur
      `ItineraireComposeView.tsx` (`/i/[id]`), qui n'avait jamais été porté ici (commentaire
      "MO-01... non touché ici" trouvé dans le code). Le vrai glisser-déposer HTML5
      (`onDragStart`/`onDragOver`) reste souris seulement — un drag tactile fonctionnel est un
      chantier à part, non fait ici. Non vérifié au navigateur (CORS bloque l'API prod depuis
      localhost, pas de backend local dans cette session) — vérifié par `tsc`/build propres et
      identité avec le pattern déjà en prod.
- [x] **Icônes vectorielles monochromes à la place des émojis** (fait le 2026-09-17) — 3
      nouvelles icônes (`IconBeach`/`IconBike`/`IconDiving` dans `ui/Icons.tsx`, réutilise
      `IconHike`/`IconFork` pour randonnée/restaurant) + table `BADGE_ICONS` dans
      `home-data.ts`. Appliqué aux 5 endroits qui affichaient un badge de lieu :
      `ExplorerListCard.tsx` (le cas cité par l'audit — icône + libellé, max 3 puis « +N »),
      `ResultsView.tsx`/`ItineraireComposeView.tsx` (cartes trop étroites — icône + libellé en
      `sr-only`), `lieux/[slug]/page.tsx`/`ProgrammeSection.tsx` (avaient déjà un libellé —
      simple remplacement emoji→icône). Les puces de filtre (déjà emoji + `aria-hidden` +
      libellé visible, donc déjà accessibles) restent inchangées — hors périmètre de ce
      correctif. Vérifié au navigateur sur `/explorer` et une fiche lieu ; les cartes de jour
      du composeur n'ont pas pu être vérifiées en navigateur (CORS bloque l'API prod depuis
      localhost) — vérifiées par `tsc`/build propres et identité de pattern.

#### Trimestre — différencier (maquettes M2, M6)

- [ ] **M2 · Résultat desktop** — timeline + carte collante côte à côte, sauvegarde « Enregistré ✓ ».
- [ ] Alerte déjeuner tardif + « Optimiser l'ordre » dans `itineraire-logic.ts`.
- [ ] **M6 · Mode « Sur place »** — thème clair fort contraste, étape courante développée, corps 18 px.
- [ ] Export agenda `.ics` (le moteur calcule déjà des horaires).
- [ ] Filtres itinéraires prêts (durée, zone, voiture/train).
- [ ] Menu compte (Carnet, Mes itinéraires, Se déconnecter) + confirmation suppression.

### Reliquat des audits UX/UI du 2026-09-14, non couvert par la refonte ci-dessus

La plupart des constats de ces deux audits (`docs/audits/2026-09-14-audit-ux*.html`) ont été
corrigés au fil des Lots 1-5 (404 localisée, partage de lien, suppression via `<dialog>`
natif, générateur moins conservateur, filtres carte/liste unifiés, marqueurs groupés,
vocabulaire figé, cibles tactiles des liens Maps…). Ce qui reste, sans qu'aucun lot ne l'ait
couvert :

- [x] **Cartes `/carnet` (onglet itinéraires) sans lien direct** (EC-05, fait le 2026-09-17) —
      « Voir » est maintenant un vrai `<Link href>` (ouvrable dans un nouvel onglet).
      « Supprimer » reste un `<button>` par conception (action destructive, pas une navigation)
      mais passe désormais par la modale `<dialog>` native (`Modal.tsx`, Lot 1) au lieu d'un
      `window.confirm()` — la même régression que EC-03 avait déjà corrigée ailleurs
      (`ItineraireComposeView.tsx`), réapparue ici car cette page n'avait pas été migrée.
- [x] **Champs de saisie en 12–14px → zoom auto Safari iOS** (MO-02, fait le 2026-09-17) —
      `font-size: 16px` (`text-base`) sur les 11 champs restants qui utilisaient encore
      `text-sm`/`text-xs` : les 5 champs de `FormulaireAuth.tsx`, `mot-de-passe-oublie`,
      les 2 champs de `reinitialiser-mot-de-passe`, la recherche d'`ActivitesGrid.tsx`, et les
      `<select>` d'`ExplorerSelectChip.tsx`/`FilterSelect.tsx`. Vérifié en navigateur
      (`getComputedStyle` → 16px partout).
- [x] **Libellés de sortie des activités inconsistants** (DC-03, vérifié le 2026-09-17) — déjà
      résolu par le Lot 3 : `lienType` est un vocabulaire fermé à deux valeurs
      (`"reservation"` → « Réserver », `"officiel"` → « Site officiel », voir
      `lib/activites-data.ts`), plus de texte libre à trois variantes. Trouvé au passage :
      `BookingRef.linkText` (le champ que ce vocabulaire a remplacé) est un mort-vivant du
      même genre que `ogImage`/`extraSpans` — encore servi par l'API (`"linkText": "Réserver
      →"` dans `/api/itineraires/...`) et stocké en base, mais plus lu nulle part côté front
      (`grep .linkText` ne remonte qu'un commentaire). Safe à ignorer jusqu'à la même passe de
      nettoyage que les deux autres (JSON + entité + migration EF).
- [x] **Message d'erreur de connexion non annoncé** (AC-01, fait le 2026-09-17) — `role="alert"
      aria-live="polite"` (même convention que `Toast.tsx`) sur le message d'erreur des deux
      formulaires (connexion + inscription) de `FormulaireAuth.tsx`, taille remontée de
      `text-xs` (12px) à `text-sm` (14px). Vérifié : lecteur d'écran annoncerait désormais le
      message (role+aria-live confirmés en DOM après un échec de connexion).

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
| 5 | Aucun `input`/`select`/`textarea` sous 16px | ✅ vérifié (MO-02, 2026-09-17) |
| 6 | Tout texte atteint 4,5:1 de contraste | Non audité |
| 7 | Chaque image a un `alt` (vide si décoratif) | ✅ vérifié (AC-02, 2026-09-17) |
| 8 | Échap ferme menu, modale et feuille | Partiel — modale ✅, menu burger ⚠️ |
| 9 | Aucun `window.confirm`/`alert` dans le code | ✅ vérifié (Lot 4d + EC-05 carnet, 2026-09-17) |
| 10 | Toute action > 150ms a un état visible | Majoritairement fait |
| 11 | `x-vercel-cache: HIT` sur les routes éditoriales | ❌ cache CDN/ISR non fait |
| 12 | Accueil < 900 Ko et < 60 requêtes | Non audité |
| 13 | Aucun filtre ne remonte un lieu hors catégorie | ✅ vérifié |
| 14 | Un seul bouton primaire ambre visible par zone d'écran | ❌ règle de rareté non appliquée |
