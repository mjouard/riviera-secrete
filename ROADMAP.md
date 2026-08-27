# Roadmap — Riviera Secrète

## Priorité contenu

- [ ] Finir les vraies images — 18/27 lieux ont encore des placeholders picsum.photos
      (Peillon, gorges du Loup/cascade de Courmes et la Citadelle de Saint-Tropez faits le
      28/08, sourcées sur Wikimedia Commons avec attribution sur `credits.html`)
- [x] Lien "Ouvrir dans Google Maps / Waze / Plans" sur chaque fiche lieu
- [ ] Photo sur chaque carte `itin-preview-card` de la homepage — les 6 cartes de la
      section "6 itinéraires prêts à suivre" sont 100% texte aujourd'hui alors que chaque
      itinéraire a déjà une `heroImgTag` dans `data/itineraires.json` ; fort impact visuel
      pour un coût faible, la donnée existe déjà
- [ ] Système d'images formalisé — ratios/dimensions par composant (`heroImage`,
      `thumbImage`, cartes homepage, strip itinéraire…), résolution minimale, export
      WebP/AVIF + `srcset` ; chantier technique indépendant du choix des photos elles-mêmes
      (qui reste manuel, voir ci-dessus), peut avancer en parallèle

## Features UX

- [ ] Filtres sur la grille des 27 lieux (par type : sentier, village, monument, île… —
      et par durée)
- [ ] Favoris en localStorage — épingler des lieux sans compte ni backend
- [ ] Bouton de partage natif (`navigator.share`) sur les fiches lieu
- [x] Carte homepage : remplacer la mini-fiche au survol par un vrai panneau au clic sur
      un marqueur — panneau latéral en desktop, bottom-sheet en mobile avec poignée de
      glissement pour fermer (fermeture aussi via ✕, clic en dehors, ou Échap)

## Features différenciantes

- [x] Créateur d'itinéraire à la volée — durée + zones/lieux au choix, génération auto,
      sauvegarde en localStorage (`creer-itineraire.html` / `mes-itineraires.html`)
- [ ] Créateur d'itinéraire : rendu complet façon `itin/*.html` (blocs transit estimés,
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

## SEO / technique

- [ ] Générer `sitemap.xml` depuis `data/lieux.json` dans `build.mjs` au lieu de le
      maintenir à la main (un `<url>` par lieu actuellement) — point de synchro manuelle
      fragile, déjà documenté dans `CLAUDE.md`
- [ ] Images Open Graph par page lieu (absentes pour la plupart)
- [ ] Migration SSG (Eleventy) si le site continue de grandir
