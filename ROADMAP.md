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
      du premier lieu de chaque itinéraire (fait le 28/08, en même temps que les vraies
      photos des lieux plutôt que via `heroImgTag`, qui est resté un placeholder — voir
      point suivant)
- [ ] Les pages `itin/*.html` ont leur propre hero carousel (`heroImgTag` dans
      `data/itineraires.json`), toujours en placeholder picsum pour les 6 itinéraires —
      distinct des cartes homepage ci-dessus ; pourrait réutiliser les photos des lieux qui
      composent chaque itinéraire (`data-carousel-srcs`, déjà le mécanisme utilisé par
      `menton-eze-monaco` avant sa dépose de Villa Ephrussi) plutôt que d'en chercher de
      nouvelles
- [ ] Système d'images formalisé — ratios/dimensions par composant (`heroImage`,
      `thumbImage`, cartes homepage, strip itinéraire…), résolution minimale, export
      WebP/AVIF + `srcset` ; chantier technique indépendant du choix des photos elles-mêmes
      (qui reste manuel, voir ci-dessus), peut avancer en parallèle

## Features UX

- [x] Filtres sur la grille des 27 lieux (par type : sentier, village, monument, île… —
      et par durée)
- [x] Favoris en localStorage — épingler des activités sans compte ni backend (♡ sur chaque activité, page `mes-favoris.html`)
- [x] Bouton de partage natif (`navigator.share`) sur les fiches lieu
- [x] Carte homepage : remplacer la mini-fiche au survol par un vrai panneau au clic sur
      un marqueur — panneau latéral en desktop, bottom-sheet en mobile avec poignée de
      glissement pour fermer (fermeture aussi via ✕, clic en dehors, ou Échap)

## Features différenciantes

- [x] Créateur d'itinéraire à la volée — durée + zones/lieux au choix, génération auto,
      sauvegarde en localStorage (`creer-itineraire.html` / `mes-itineraires.html`)
- [x] Créateur d'itinéraire : rendu complet façon `itin/*.html` (blocs transit estimés,
      marqueurs sommeil pour 2-3 jours, cartes "à réserver" pour les activités payantes) —
      la version actuelle est volontairement allégée (liste par jour + carte + liens Maps)
- [ ] Créateur d'itinéraire : partage par URL — encoder la sélection de lieux dans les
      query params plutôt que dans localStorage uniquement, pour partager un itinéraire créé
      via un simple lien, sans compte ni backend
- [ ] Créateur d'itinéraire : export/impression pour usage hors ligne sur le terrain
- [ ] Bouton "Ajouter à mon itinéraire" directement sur chaque fiche lieu (et sur le popup
      de la carte homepage) — aujourd'hui il faut passer par le picker de
      `creer-itineraire.html`, aucun raccourci depuis une fiche lieu déjà consultée
- [ ] PWA — manifest + service worker pour usage hors ligne sur le terrain

## Audience

- [ ] Version anglaise du site — la Côte d'Azur est une destination majeure pour les
      anglophones ; gros chantier (contenu à dupliquer/traduire, routing bilingue) mais
      probablement le plus gros levier d'audience disponible
- [ ] Analytics respectueux de la vie privée (Plausible ou Netlify Analytics) pour voir
      quels lieux/itinéraires attirent réellement et prioriser objectivement

## Communauté / comptes

- [ ] Connexion Google (OAuth) — authentification sans mot de passe ; prérequis à tout ce
      qui suit ; nécessite un backend (Netlify Functions ou service tiers type Supabase/Firebase)
      car le site est actuellement 100 % statique, sans serveur ni base de données
- [ ] Avis et notes sur les activités — noter une activité (étoiles) et laisser un commentaire
      court, visible par tous les visiteurs connectés ; stockage côté backend (pas localStorage),
      modération a minima (signalement) ; dépend de la connexion Google ci-dessus

## Mise en production réelle

### Domaine & DNS
- [x] Migrer de Netlify vers Vercel — site en prod sur Vercel (déploiement auto sur push
      `main`, `vercel.json` configuré avec cache et headers de sécurité)
- [ ] Acheter un nom de domaine (ex. `riviera-secrete.fr` ou `.com`) et le configurer sur
      Vercel — HTTPS Let's Encrypt activé automatiquement par Vercel une fois le domaine pointé
- [ ] Mettre à jour toutes les URLs canoniques dans les balises `<link rel="canonical">`,
      `<meta property="og:url">` et le JSON-LD — actuellement hardcodées sur
      `riviera-secrete.netlify.app`, à remplacer par le vrai domaine (chercher dans
      `scripts/render/lieu.mjs`, `scripts/render/itin.mjs`, `index.html`, puis rebuilder)

### SEO & indexation
- [ ] Soumettre `sitemap.xml` dans Google Search Console (après avoir enregistré le site avec
      le vrai domaine) — prérequis : générer `sitemap.xml` depuis `build.mjs` (déjà en
      roadmap SEO) pour qu'il soit à jour automatiquement
- [ ] Vérifier `robots.txt` — doit pointer vers le bon `sitemap.xml` avec l'URL du vrai
      domaine ; vérifier aussi que les pages `noindex` (`creer-itineraire.html`,
      `mes-itineraires.html`) sont bien exclues de l'indexation
- [ ] Ajouter le site dans Bing Webmaster Tools (2e moteur, souvent négligé)

### Performance & cache
- [x] Règles de cache et headers de sécurité configurés dans `vercel.json` — assets statiques
      en `max-age=31536000`, HTML en `no-cache`, `X-Frame-Options` / `X-Content-Type-Options` /
      `Referrer-Policy` / `Permissions-Policy` en place
- [ ] Minification CSS/JS au build (ex. via `esbuild` ou `lightningcss`) — actuellement
      les assets sont servis tels quels

### Monitoring
- [ ] Mettre en place un uptime monitor (ex. UptimeRobot gratuit) sur le domaine de
      production — alerte email si le site tombe
- [ ] Vérifier les Core Web Vitals dans Google Search Console après mise en ligne (LCP, CLS,
      INP) — les images non optimisées (pas encore de WebP/srcset) sont le risque principal

### Versionning & déploiement
- [x] Code commité et pushé, déploiement automatique Vercel déclenché sur chaque push `main`
- [ ] Configurer une branche `staging` (ou Vercel Preview Deployments) pour tester les
      changements avant de les mettre en prod — les Preview Deployments Vercel sont activés
      automatiquement sur chaque PR/branche

## SEO / technique

- [ ] Générer `sitemap.xml` depuis `data/lieux.json` dans `build.mjs` au lieu de le
      maintenir à la main (un `<url>` par lieu actuellement) — point de synchro manuelle
      fragile, déjà documenté dans `CLAUDE.md`
- [ ] Images Open Graph par page lieu (absentes pour la plupart)
- [ ] Migration SSG (Eleventy) si le site continue de grandir
