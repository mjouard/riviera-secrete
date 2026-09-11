---
name: frontend-migration-checklist
description: Inventaire exhaustif des features du site statique à porter vers Next.js — état par feature
metadata: 
  node_type: memory
  type: project
  originSessionId: 52dd96aa-badc-4607-83f8-5de46933687d
---

## Légende

- ✅ Fait dans le Next.js
- 🔜 À faire
- ⏳ Dépend de l'auth / backend futur
- ❌ Non prévu (pages legacy/admin)

---

## Navigation & Structure

| Feature | Statut | Notes |
|---|---|---|
| Header nav + liens | ✅ | Simplifié (sans Villes ni Favoris pour l'instant) |
| Menu hamburger mobile | 🔜 | Nécessite un composant client React |
| Breadcrumb | ✅ | Implémenté dans lieux/[slug] et itineraires/[slug] |
| Breadcrumb contextuel `?itin=` | 🔜 | Lecture de searchParams → lien retour vers l'itinéraire |

---

## Homepage

| Feature | Statut | Notes |
|---|---|---|
| Hero carrousel 8 images | 🔜 | Composant client React avec timer |
| Carte Leaflet des villes | 🔜 | Leaflet dans Next.js = `dynamic(() => import(...), { ssr: false })` |
| Filtres par badge sur la grille | 🔜 | État client React |
| Grille des villes par région | ✅ | Implémenté (lieux groupés par région) |
| Filtre par région (boutons) | 🔜 | État client React |
| Apparition au scroll (IntersectionObserver) | 🔜 | Hook React ou CSS animation |
| Grille des 6 itinéraires | ✅ | |
| Section activités par catégorie (tabs) | 🔜 | Composant client, données depuis API |
| CTA "Créer ton itinéraire" | 🔜 | Lien vers /creer-itineraire |

---

## Pages Lieu (`/lieux/[slug]`)

| Feature | Statut | Notes |
|---|---|---|
| Hero image | ✅ | Image simple |
| Hero carrousel multi-slides | 🔜 | Swipe tactile, dots, boutons ‹/› |
| Badges | ✅ | |
| Meta-pills (saison, durée, niveau) | ✅ | |
| Coordonnées GPS pill | 🔜 | Calculer depuis lat/lng |
| Description | ✅ | |
| Conseils pratiques (tips) | ✅ | |
| Mini-carte Leaflet | 🔜 | `dynamic()` ssr:false |
| Liens Google Maps / Waze / Plans | 🔜 | Construire depuis lat/lng |
| Bouton "Partager" (Share API) | 🔜 | Composant client |
| Bouton "Ajouter à un itinéraire" | ⏳ | Dépend des itinéraires en DB |
| Bouton favori (cœur) sur activités | ⏳ | Dépend de l'auth ou localStorage |
| Grille d'activités | ✅ | Sans bouton favori pour l'instant |
| Section "Related" (lieux proches) | ✅ | |
| JSON-LD TouristAttraction | 🔜 | `<script type="application/ld+json">` dans generateMetadata |
| OG tags complets (og:image, etc.) | 🔜 | Via generateMetadata |
| Canonical URL | 🔜 | Via generateMetadata |

---

## Pages Itinéraire (`/itineraires/[slug]`)

| Feature | Statut | Notes |
|---|---|---|
| Hero carrousel multi-lieu | 🔜 | Même composant que pages lieux |
| Meta-pills | ✅ | |
| Bouton "Ouvrir dans Google Maps" | 🔜 | URL multi-waypoints depuis stops |
| Strip de photos des stops | 🔜 | |
| Programme détaillé (stops + transit + sleep) | ✅ | Stops OK, transits OK, marqueur nuit à améliorer |
| Lien `?itin=<slug>` sur chaque stop | 🔜 | Pour le breadcrumb contextuel |
| Liens GPS par stop (Maps/Waze/Plans) | 🔜 | Construire depuis lat/lng du lieu |
| Carte Leaflet de la route | 🔜 | Polyline + marqueurs numérotés |
| Section "À réserver" (booking cards) | ✅ | Lien vers lieu, sans image/prix pour l'instant |
| Booking cards avec image + prix + durée | 🔜 | Nécessite de croiser avec les activités via API |
| Section "Autres itinéraires" | 🔜 | suggestions[] existe en DB, pas encore rendu |

---

## Pages Ville (`/villes/[slug]`)

| Feature | Statut | Notes |
|---|---|---|
| Page ville entière | 🔜 | Pas encore créée dans Next.js |
| Hero + mini-carte Leaflet | 🔜 | |
| Liste des lieux de la ville | 🔜 | |
| JSON-LD TouristDestination | 🔜 | |

---

## Créateur d'itinéraire (`/creer-itineraire`)

| Feature | Statut | Notes |
|---|---|---|
| Page entière | 🔜 | Page complexe, priorité après les bases |
| Picker durée + zones/lieux | 🔜 | |
| Génération algorithmique (greedy) | 🔜 | Logique dans `itineraire-data.js` à porter |
| Drag-and-drop + boutons ▲/▼ | 🔜 | Composants client |
| Carte Leaflet résultats | 🔜 | |
| Programme détaillé avec heures/transits | 🔜 | |
| Section "À réserver" dynamique | 🔜 | |
| Sauvegarde localStorage | ⏳ | localStorage pour l'instant, DB après auth |
| Chargement `?id=` et `?add=` | 🔜 | |
| Export PDF / impression | 🔜 | `window.print()` + @media print |

---

## Mes Itinéraires (`/mes-itineraires`)

| Feature | Statut | Notes |
|---|---|---|
| Page entière | ⏳ | localStorage → DB après auth |
| Liste des itinéraires sauvegardés | ⏳ | |

---

## Mes Favoris (`/mes-favoris`)

| Feature | Statut | Notes |
|---|---|---|
| Page entière | ⏳ | localStorage → DB après auth |
| Bouton cœur sur les activités | ⏳ | |

---

## SEO & Analytics

| Feature | Statut | Notes |
|---|---|---|
| Plausible Analytics | ✅ | Même script que site statique |
| JSON-LD ItemList homepage | 🔜 | |
| OG tags par page | 🔜 | Via generateMetadata |
| Canonical URL | 🔜 | Via generateMetadata |
| Sitemap | 🔜 | Next.js peut auto-générer via `sitemap.ts` |
| noindex sur pages user-generated | 🔜 | |

---

## Images (problème actuel)

Les chemins d'images dans la DB viennent du site statique :
- `thumbImage` : `assets/images/lieux/<slug>/thumb.jpg` (sans `../`)
- `heroImage` : `../assets/images/lieux/<slug>/hero.jpg` (avec `../`)
- `activites[].image` : `../assets/images/lieux/<slug>/act-N.jpg` (avec `../`)

**Solution temporaire** : construire l'URL depuis `https://riviera-secrete.netlify.app/` + chemin nettoyé.
**Solution définitive** : migrer vers Cloudflare R2, mettre à jour les chemins en DB.

Fonction helper à créer :
```ts
function imgUrl(path: string): string {
  return "https://riviera-secrete.netlify.app/" + path.replace(/^(\.\.\/)+/, "");
}
```

---

## Priorités suggérées

### P1 — Quick wins (< 1 session)
- Fix images (helper `imgUrl`)
- OG tags + JSON-LD via generateMetadata
- Hamburger mobile
- Sitemap auto Next.js
- Coordonnées GPS pill + liens Maps/Waze/Plans
- Bouton "Ouvrir dans Google Maps" itinéraire

### P2 — Features visibles importantes (1–2 sessions)
- Mini-carte Leaflet sur pages lieux
- Carte Leaflet sur pages itinéraires
- Carte Leaflet homepage
- Hero carrousel

### P3 — Pages manquantes (2–3 sessions)
- Pages Ville `/villes/[slug]`
- Créateur d'itinéraire `/creer-itineraire`

### P4 — Nécessite auth (plus tard)
- Favoris
- Mes itinéraires (lecture/write en DB)
- Bouton "Ajouter à un itinéraire"
