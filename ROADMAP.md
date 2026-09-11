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
- [ ] Page `/a-propos.html` — angle éditorial du site ("carnet de repérage, pas un guide
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
- [ ] "Partir de cet itinéraire" — bouton sur chaque page `itin/*.html` qui ouvre
      `creer-itineraire.html` en pré-cochant les lieux de cet itinéraire éditorial ;
      pont entre contenu éditorial et créateur custom (~1h)
- [ ] Créateur d'itinéraire : partage par URL — encoder la sélection dans les query params
      pour partager sans compte ni backend (sera mieux fait côté backend)
- [ ] PWA — manifest + service worker pour usage hors ligne sur le terrain

## Maillage interne & SEO éditorial

- [ ] Liens croisés itinéraire ↔ ville — une page ville liste les itinéraires qui la
      traversent ; une page itinéraire renvoie vers les pages ville de ses stops ; améliore
      le maillage interne (SEO) et la navigation (~1h dans les templates + build)
- [ ] Structured data enrichi — schéma `Activity` sur les activités payantes pour apparaître
      dans Google Things to do ; enrichissement du JSON-LD existant dans `lieu.mjs` (~2h)

## Audience & engagement

- [ ] Newsletter — "Un lieu secret par semaine" via Brevo ou Mailchimp (formulaire embed,
      aucun backend requis) ; meilleur levier de rétention avant le backend (30 min)
- [ ] Version anglaise du site — gros chantier (contenu à dupliquer/traduire, routing
      bilingue) mais probablement le plus gros levier d'audience disponible
- [x] Analytics respectueux de la vie privée (Plausible) — script déployé sur les 63 pages

## Communauté / comptes (backend requis)

- [x] Connexion Google (OAuth) via NextAuth.js (Option A retenue) — backend ASP.NET Core +
      PostgreSQL sur Railway (décision archi 2026-09-11), `frontend/` uniquement
- [x] Migration favoris + itinéraires custom de localStorage → DB — favoris (`/mes-favoris`,
      `9e055b3`) et itinéraires custom (`fc84181`, DB-only) faits côté `frontend/` ; le site
      statique garde sa propre version localStorage séparée (`mes-favoris.html`), non migrée
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
      Vercel — HTTPS Let's Encrypt activé automatiquement par Vercel une fois le domaine pointé
- [ ] Mettre à jour toutes les URLs canoniques (`<link rel="canonical">`, `og:url`, JSON-LD,
      `ogImage` dans les lieux) — hardcodées sur `riviera-secrete.netlify.app` ; chercher
      dans `scripts/render/lieu.mjs`, `itin.mjs`, `index.html`, puis rebuilder

### SEO & indexation
- [ ] Soumettre `sitemap.xml` dans Google Search Console après enregistrement du vrai domaine
- [ ] Vérifier `robots.txt` — pointer vers le bon `sitemap.xml` avec l'URL du vrai domaine ;
      vérifier que les pages `noindex` (`creer-itineraire.html`, `mes-itineraires.html`,
      `mes-favoris.html`) sont bien exclues
- [ ] Ajouter le site dans Bing Webmaster Tools (2e moteur, souvent négligé)

### Performance & cache
- [x] Règles de cache et headers de sécurité configurés dans `vercel.json`
- [ ] Minification CSS/JS au build (ex. via `esbuild` ou `lightningcss`)

### Monitoring
- [ ] Uptime monitor (ex. UptimeRobot gratuit) — alerte email si le site tombe
- [ ] Vérifier les Core Web Vitals dans Google Search Console après mise en ligne

### Versionning & déploiement
- [x] Code commité et pushé, déploiement automatique Vercel déclenché sur chaque push `main`
- [ ] Configurer une branche `staging` (ou Vercel Preview Deployments)

## SEO / technique

- [x] Générer `sitemap.xml` depuis les JSON dans `build.mjs` — 56 URLs auto (1 homepage +
      6 itin + 27 lieux + 22 villes), domaine corrigé vercel.app, robots.txt à jour
- [ ] Images Open Graph par page lieu — `ogImage` existe dans le JSON mais les URLs sont
      hardcodées sur `netlify.app` ; à corriger en même temps que les canonicals
- [ ] Migration vers Next.js + ASP.NET Core backend (décision archi 2026-09-11 —
      voir fichier mémoire `architecture_future.md`)
