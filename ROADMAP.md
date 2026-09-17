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

### Critiques

- [ ] **S1 — Guard sur `Jwt:Issuer` / `Jwt:Audience`** (`Program.cs:42-43`) — lus avec `!`
      sans vérification : si absent de Railway, le token est émis avec `null` et la validation
      passe. Fix : `?? throw new InvalidOperationException(...)` comme pour `Jwt:Secret`. < 5 min.
- [ ] **M1 — Zéro test** — `ValiderItineraire`, `EstAutoriseSurItineraireCompose`,
      `EstSlugValide` non couverts. Minimum : tests unitaires sur les validators + 1 test
      d'intégration auth (SQLite in-memory).

### Majeurs

- [ ] **S2 — `EditToken` comparé par `==`** (timing attack) → `CryptographicOperations.FixedTimeEquals`.
- [ ] **S3 — Aucun header de sécurité HTTP** — `X-Content-Type-Options`, `X-Frame-Options`,
      `Referrer-Policy` manquants. Fix : middleware de 4 lignes avant `app.MapGet`.
- [ ] **S4 — Confirmer `ASPNETCORE_ENVIRONMENT=Production` sur Railway** — sinon `/api/seed`
      est accessible en prod.
- [ ] **P1 — Zéro `AsNoTracking()`** sur les endpoints de lecture publique — gain ~20-30 %
      garanti, 10 min de travail.
- [ ] **P2 — Aucun cache côté API** — chaque revalidation ISR frappe PostgreSQL. `OutputCache`
      60 s sur les endpoints publics.
- [ ] **A1 — `EmailService` non injectable** — `static class` + `static HttpClient` sans
      `IHttpClientFactory` → DNS non renouvelés, non testable. Extraire vers Infrastructure
      avec `IEmailService`.
- [ ] **M2 — Logging `Console.WriteLine`** → `ILogger<T>` pour des logs corrélés sur Railway.
- [ ] **M3 — Aucune gestion globale des exceptions** → `app.UseExceptionHandler` ou middleware
      de logging des 5xx.

### Mineurs

- [ ] **S6 — Race condition `/register`** → `DbUpdateException` non catchée → 500 au lieu de
      409 sur double inscription simultanée.
- [ ] **S7 — Validation email `Contains('@')`** → regex minimale ou `MailAddress`.
- [ ] **P3 — `GET /api/villes` surcharge** → `.Include(v => v.Lieux)` inutile pour le listing,
      remplacer par une projection.
- [ ] **M6 — Tag Docker `sdk:10.0` flottant** → épingler `sdk:10.0.x`.
- [ ] **M7 — `CreatedAt` non-nullable sans init C#** → `DateTime?` ou `= DateTime.UtcNow`.

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
