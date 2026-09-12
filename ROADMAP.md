# Roadmap — Riviera Secrète

## Priorité contenu

- [ ] Enrichir les activités de chaque lieu — angle éditorial : activités secrètes, atypiques,
      intimes ou bon-plans (pas les incontournables déjà sur tous les guides). Règle de
      cohérence à respecter : tout lieu portant un badge doit avoir au moins une activité en
      rapport direct avec ce badge (ex. badge `randonnee` → au moins un itinéraire de randonnée
      proposé ; badge `plage` → au moins une activité plage/baignade ; badge `plongee` → au
      moins un spot ou sortie plongée/snorkeling, etc.). À faire via `/add-activities` qui
      vérifie déjà qu'une activité n'est pas elle-même un lieu existant.

- [x] Finir les vraies images — les 27 lieux ont une vraie photo (terminé le 28/08 ; les 21
      sourcées sur Wikimedia Commons cette session-là sont créditées sur `credits.html`,
      licences CC BY/CC BY-SA)
- [x] Lien "Ouvrir dans Google Maps / Waze / Plans" sur chaque fiche lieu
- [x] Photo sur chaque carte `itin-preview-card` de la homepage — utilise le `thumbImage`
      du premier lieu de chaque itinéraire
- [x] Les pages `itin/*.html` ont leur propre hero carousel — les 6 itinéraires utilisent
      désormais les photos réelles des lieux qui les composent via `data-carousel-srcs`
- [ ] Système d'images formalisé — ratios/dimensions par composant (`heroImage`,
      `thumbImage`, cartes homepage, strip itinéraire…), résolution minimale, export
      WebP/AVIF + `srcset` ; chantier technique indépendant du choix des photos elles-mêmes

## Découverte & navigation

- [ ] Recherche textuelle client-side — input qui filtre la grille des lieux en temps réel
      par nom / commune / badge ; toutes les données sont déjà chargées sur la homepage,
      zéro backend requis ; levier UX le plus impactant actuellement (~2h)
- [ ] Filtres supplémentaires sur la grille — exploiter les `metaPills` déjà présents dans
      `data/lieux.json` (saison, durée, niveau) et ajouter un filtre "Gratuit seulement"
      (badge activité) — données disponibles, juste un filtre JS à câbler (~2h)
- [ ] "Surprends-moi" — bouton qui pioche un lieu au hasard parmi les filtres actifs ;
      petit, fun, différenciant (30 min)
- [ ] Géolocalisation sur la carte homepage — "lieux près de moi" via l'API Geolocation
      native, aucun backend requis ; utile en situation terrain (~1h)
- [ ] "Depuis Nice / Cannes / Monaco en X min" — stocker une durée de trajet approximative
      par lieu dans le JSON, exposer un filtre "moins de 45 min de [ville de départ]" ;
      pas d'appel API routage, estimation manuelle à la saisie (~data + 2h)

## Features UX

- [x] Filtres sur la grille des 27 lieux (par type : sentier, village, monument, île… —
      et par durée)
- [x] Favoris en localStorage — épingler des activités sans compte ni backend (♡ sur chaque
      activité depuis les fiches lieu et les pages ville, page `mes-favoris.html`)
- [x] Bouton de partage natif (`navigator.share`) sur les fiches lieu
- [x] Carte homepage : panneau latéral en desktop, bottom-sheet en mobile au clic marqueur
- [ ] Page `/a-propos` — angle éditorial du site ("carnet de repérage, pas un guide
      officiel"), aide le SEO et donne confiance aux premiers visiteurs (30 min)

## Features différenciantes

- [x] Créateur d'itinéraire à la volée — durée + zones/lieux au choix, génération auto,
      sauvegarde en localStorage (`creer-itineraire.html` / `mes-itineraires.html`)
- [x] Créateur d'itinéraire : rendu complet façon `itin/*.html` (blocs transit estimés,
      marqueurs sommeil pour 2-3 jours, cartes "à réserver" pour les activités payantes)
- [x] Créateur d'itinéraire : export/impression pour usage hors ligne sur le terrain —
      bouton "Exporter en PDF" (window.print + @media print thème clair, jours en colonne A4)
- [x] Bouton "Ajouter à mon itinéraire" directement sur chaque fiche lieu — mini-panneau
      déroulant listant les itinéraires sauvegardés, clic pour ajouter le lieu au dernier
      jour de l'itinéraire sans quitter la page
- [ ] "Partir de cet itinéraire" — bouton sur chaque page `/itineraires/[slug]` qui ouvre
      `/creer-itineraire` en pré-cochant les lieux de cet itinéraire éditorial ;
      pont entre contenu éditorial et créateur custom (~1h)
- [ ] Créateur d'itinéraire : partage par URL — encoder la sélection dans les query params
      pour partager sans compte ni backend (sera mieux fait côté backend)
- [ ] PWA — manifest + service worker pour usage hors ligne sur le terrain

## Maillage interne & SEO éditorial

- [ ] Liens croisés itinéraire ↔ ville — une page ville liste les itinéraires qui la
      traversent ; une page itinéraire renvoie vers les pages ville de ses stops ; améliore
      le maillage interne (SEO) et la navigation (~1h dans les templates + build)
- [ ] Structured data enrichi — schéma `Activity` sur les activités payantes pour apparaître
      dans Google Things to do ; il n'y a actuellement aucun JSON-LD sur les pages lieu
      (seulement homepage `ItemList` et ville `TouristDestination`, voir CLAUDE.md) — à
      ajouter dans `frontend/src/app/lieux/[slug]/page.tsx` (~2h)

## Audience & engagement

- [ ] Newsletter — "Un lieu secret par semaine" via Brevo ou Mailchimp (formulaire embed,
      aucun backend requis) ; meilleur levier de rétention avant le backend (30 min)
- [ ] Version anglaise du site — gros chantier (contenu à dupliquer/traduire, routing
      bilingue) mais probablement le plus gros levier d'audience disponible
- [x] Analytics respectueux de la vie privée (Plausible) — script déployé sur les 63 pages

## Portage site statique → Next.js (terminé le 2026-09-12)

`frontend/` est le seul stack désormais (voir CLAUDE.md) — le site statique a été supprimé du
repo le 2026-09-12 une fois la parité listée ci-dessous atteinte. Le suivi feature par feature
qui a servi à repérer ces trous (`.claude/memory/frontend_migration_checklist.md`) a été
supprimé avec le site statique lui-même, son rôle terminé.

Fait le 2026-09-11 dans cette passe : carte Leaflet homepage, section activités par catégorie,
filtres badge sur la grille lieux, images sur les cartes itinéraires (tous manquants avant),
décodage des entités HTML (`&amp;` → `&`), bascule des 4 cartes Leaflet sur OpenStreetMap
(CARTO a coupé l'accès anonyme à ses tuiles `dark_all`, renvoyait un "API key required").

- [x] Export PDF / impression de l'itinéraire créé (`/creer-itineraire`, 2026-09-12) — porté
      depuis le site statique (`window.print()` + `@media print`, classes `.no-print`/
      `.print-day`/`.print-stop`/`.print-header` dans `globals.css`)
- [x] Bouton "Partager" (Web Share API) sur les fiches lieu (2026-09-12) — porté depuis le
      site statique, `ShareButton.tsx`, fallback presse-papiers si l'API est indisponible
- [x] Bouton "Ajouter à un itinéraire" sur les fiches lieu (2026-09-12) — porté depuis le
      site statique, `AddToItinButton.tsx`, adapté pour passer par `/api/my-itineraires`
      (DB) au lieu de localStorage
- [x] Booking cards "À réserver" avec image + prix + durée (2026-09-12) — croise
      `b.lieuSlug`/`b.activiteId` avec l'activité réelle (déjà chargée via `lieuBySlug`),
      lien "Réserver" pointe maintenant vers l'URL réelle de l'activité au lieu de la fiche lieu
- [x] Section "Autres itinéraires" (suggestions) en bas d'une page itinéraire (2026-09-12) —
      grille 3 colonnes, href converti en route Next.js (même pattern que `lieu.related`)
- [x] Lien `?itin=<slug>` sur les stops + breadcrumb contextuel retour-vers-l'itinéraire
      (2026-09-12) — corrige au passage le crumb par défaut de la fiche lieu (pointait vers
      la liste générique `/lieux`, pointe maintenant vers la ville). `/lieux/[slug]` passe de
      statique à dynamique (rendu à la demande) suite à l'usage de `searchParams`
- [x] Hero carrousel ambiant sur la homepage (2026-09-12) — nouveau composant `HomeHero.tsx`
      (fondu auto 5s, sans contrôles — différent de `HeroCarousel.tsx` qui est manuel/à
      clics, utilisé sur lieu/itinéraire). Cycle de state React vérifié en prod (0→6 sur la
      durée du test) ; le rendu visuel exact de la transition CSS n'a pas pu être confirmé à
      l'oeil dans cette session (outil de capture instable), mais la logique est correcte et
      standard (`transition: opacity`)
- [x] JSON-LD `ItemList` sur la homepage Next.js (2026-09-12) — 22 `ListItem` (une par
      ville), même structure que le site statique, urls vers les routes Next.js
- [x] JSON-LD `TouristDestination` sur les pages ville Next.js (2026-09-12) — même structure
      que `ville.mjs`, image du premier lieu de la ville, urls vers les routes Next.js
- [x] `noindex` sur les pages user-generated (2026-09-12) — `/creer-itineraire`,
      `/mes-itineraires`, `/mes-favoris` (parité site statique) + `/connexion` et
      `/confirmer-email` (pages compte propres à Next.js, même traitement)
- [x] Apparition au scroll (IntersectionObserver) sur la grille homepage (2026-09-12) —
      mêmes valeurs que le site statique (threshold 0.15, one-shot, translateY 16px). Le
      comportement du `useEffect`/`IntersectionObserver` n'a pas pu être confirmé
      visuellement en prod dans cette session (l'onglet de test avait
      `document.visibilityState: "hidden"`, qui suspend l'API navigateur elle-même — même
      un observer trivial isolé ne se déclenche pas dans ces conditions) ; la logique est un
      portage exact et standard, aucune raison de douter du comportement en usage réel

- [x] Page `/credits` (attribution photos, 2026-09-12) — trou trouvé en auditant avant la
      suppression du site statique : `credits.html` listait les crédits CC BY/CC BY-SA
      obligatoires (licence) pour les photos Wikimedia Commons utilisées, sans équivalent sur
      Next.js. Contrairement aux autres items de cette liste ce n'était pas une feature UX
      optionnelle — retirer le site statique sans porter cette page aurait supprimé une
      attribution légalement requise du site réellement en ligne. Porté en premier, avant la
      suppression, précisément pour ça (`frontend/src/app/credits/page.tsx`)

**Site statique supprimé le 2026-09-12** — tous les items ci-dessus vérifiés en prod, la
parité fonctionnelle atteinte ; `index.html`, `lieux/`, `itin/`, `villes/`, `assets/`,
`scripts/`, `netlify.toml`, `vercel.json` racine, `sitemap.xml`, `robots.txt` supprimés du
repo. `data/*.json` conservé (seule source de seed du backend). Le projet Vercel
`riviera-secrete.vercel.app` qui hébergeait ce site n'a plus de code source dans ce repo —
ignorer cette URL, le seul vrai site est désormais `frontend-two-plum-92.vercel.app`.

## Communauté / comptes (backend requis)

- [x] Connexion Google (OAuth) via NextAuth.js (Option A retenue) — backend ASP.NET Core +
      PostgreSQL sur Railway (décision archi 2026-09-11), `frontend/` uniquement
- [x] Connexion par email/mot de passe (2026-09-12) — `CredentialsProvider` NextAuth +
      `POST /api/auth/{register,login}`, hash BCrypt, page `/connexion` unique (bascule
      login/inscription, Google et mot de passe côte à côte)
- [x] Confirmation d'email obligatoire à l'inscription par mot de passe (2026-09-12) —
      email envoyé via Resend (`backend/RivieraSecrete.Api/EmailService.cs`), login refusé
      tant que non confirmé, page `/confirmer-email`. **Limitation connue** : Resend est en
      mode sandbox (`onboarding@resend.dev`, aucun domaine vérifié) donc n'accepte d'envoyer
      qu'à l'adresse email du compte Resend lui-même — les vrais visiteurs ne recevront pas
      cet email tant qu'un domaine n'est pas vérifié sur resend.com/domains (voir la tâche
      domaine ci-dessous, `RESEND_API_KEY` déjà configurée sur Railway)
- [x] Migration favoris + itinéraires custom de localStorage → DB — favoris (`/mes-favoris`,
      `9e055b3`) et itinéraires custom (`fc84181`, DB-only) faits côté `frontend/` ; la
      version localStorage séparée du site statique (`mes-favoris.html`) était restée non
      migrée mais le site statique lui-même a été supprimé le 2026-09-12, donc sans objet
      désormais
- [ ] Social proof — "X personnes ont mis ce lieu en favori", visible publiquement
- [ ] "J'y suis allé" — visited tracker distinct des favoris
- [ ] Avis et notes sur les activités — étoiles + commentaire court, stockage backend,
      modération a minima ; dépend de la connexion Google
- [ ] Tips visiteurs — note courte laissée par les utilisateurs sur un lieu

## Mise en production réelle

### Domaine & DNS
- [x] Migrer de Netlify vers Vercel — site en prod sur Vercel (déploiement auto sur push
      `main`, `vercel.json` configuré avec cache et headers de sécurité)
- [ ] Acheter un nom de domaine (ex. `riviera-secrete.fr` ou `.com`) et le configurer sur
      Vercel — HTTPS Let's Encrypt activé automatiquement par Vercel une fois le domaine
      pointé. Sert aussi à vérifier un domaine sur Resend (resend.com/domains) pour lever la
      limitation d'envoi sandbox des emails de confirmation (voir "Communauté / comptes")
- [ ] Purger le champ `ogImage` de `data/lieux.json`/la DB — hardcodé sur
      `riviera-secrete.netlify.app` (domaine mort, l'ancien site statique n'existe plus).
      **Trouvé mort le 2026-09-12** : le frontend Next.js ne le lit jamais — les pages lieu/
      itinéraire calculent leur propre `openGraph.images` à partir de `heroImage`/
      `firstLieu.heroImage` via `imgUrl()` (voir `lieux/[slug]/page.tsx`,
      `itineraires/[slug]/page.tsx`). Pas un bug visible aujourd'hui, mais de la donnée morte
      à nettoyer (retirer le champ du JSON + colonne EF + migration) plutôt qu'à corriger

### SEO & indexation
- [ ] Soumettre `sitemap.xml` dans Google Search Console après enregistrement du vrai domaine
- [x] Pages `noindex` — `/creer-itineraire`, `/mes-itineraires`, `/mes-favoris`, `/connexion`,
      `/confirmer-email` toutes exclues via `metadata.robots` (voir Portage ci-dessus,
      2026-09-12) ; `frontend/src/app/sitemap.ts` (route Next.js dynamique) ne les liste pas
- [ ] Ajouter le site dans Bing Webmaster Tools (2e moteur, souvent négligé)

### Performance & cache
- [x] Règles de cache et headers de sécurité configurés dans `vercel.json`
- [ ] Minification CSS/JS au build (ex. via `esbuild` ou `lightningcss`)

### Monitoring
- [ ] Uptime monitor (ex. UptimeRobot gratuit) — alerte email si le site tombe
- [ ] Vérifier les Core Web Vitals dans Google Search Console après mise en ligne

### Versionning & déploiement
- [x] Code systématiquement commité et pushé sur `main` après chaque changement — mais
      déploiement **manuel** (`cd frontend && vercel --prod --yes`), pas automatique : la
      GitHub integration Vercel a été désactivée le 2026-09-11 (voir
      `feedback_vercel_deploy.md`) car elle re-déployait depuis la racine du repo au lieu de
      `frontend/`. Ne pas la reconnecter.
- [ ] Configurer une branche `staging` (ou Vercel Preview Deployments)

## SEO / technique

Section fusionnée le 2026-09-12 dans "Mise en production réelle" et "Portage" ci-dessus —
elle datait d'avant la décision de migrer vers Next.js (2026-09-11) et listait cette migration
elle-même comme non faite, ainsi qu'un `sitemap.xml` généré par le `build.mjs` du site
statique (remplacé depuis par `frontend/src/app/sitemap.ts`, une route Next.js dynamique).
