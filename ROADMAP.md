# Roadmap — Riviera Secrète

## Priorité contenu

- [ ] Finir les vraies images — 21/27 lieux ont encore des placeholders picsum.photos
- [x] Lien "Ouvrir dans Google Maps / Waze / Plans" sur chaque fiche lieu

## Features UX

- [ ] Filtres sur la grille des 27 lieux (par type : sentier, village, monument, île…)
- [ ] Favoris en localStorage — épingler des lieux sans compte ni backend
- [ ] Bouton de partage natif (`navigator.share`) sur les fiches lieu

## Features différenciantes

- [x] Créateur d'itinéraire à la volée — durée + zones/lieux au choix, génération auto,
      sauvegarde en localStorage (`creer-itineraire.html` / `mes-itineraires.html`)
- [ ] Créateur d'itinéraire : rendu complet façon `itin/*.html` (blocs transit estimés,
      marqueurs sommeil pour 2-3 jours, cartes "à réserver" pour les activités payantes) —
      la version actuelle est volontairement allégée (liste par jour + carte + liens Maps)
- [ ] PWA — manifest + service worker pour usage hors ligne sur le terrain

## SEO / technique

- [ ] `sitemap.xml` et `robots.txt`
- [ ] Images Open Graph par page lieu (absentes pour la plupart)
- [ ] Migration SSG (Eleventy) si le site continue de grandir
