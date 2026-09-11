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
| Header nav + liens | ✅ | `NavHeader.tsx`, inclut Connexion/Déconnexion |
| Menu hamburger mobile | ✅ | Dans `NavHeader.tsx` |
| Breadcrumb | ✅ | Implémenté dans lieux/[slug] et itineraires/[slug] |
| Breadcrumb contextuel `?itin=` | 🔜 | Pas confirmé porté (existe sur le site statique) — vérifier avant de supposer fait |

---

## Homepage

| Feature | Statut | Notes |
|---|---|---|
| Hero carrousel 8 images | ❓ | `HeroCarousel.tsx` existe (composant partagé) — pas de hero carousel dédié homepage confirmé, hors scope de la passe du 2026-09-11 |
| Carte Leaflet des villes | ✅ | Ajoutée 2026-09-11 : `HomeMap.tsx`/`HomeMapWrapper.tsx`, 22 marqueurs colorés par région, panneau d'info au clic, filtres région (toggle layer group) |
| Filtres par badge sur la grille | ✅ | Ajouté 2026-09-11 : `HomeLieuxGrid.tsx`, mêmes 5 badges (`BADGE_DEFS`) que le site statique |
| Grille des villes par région | ✅ | |
| Filtre par région (boutons) | ✅ | Fait sur la carte homepage (`HomeMap.tsx`), pas sur la grille villes elle-même |
| Apparition au scroll (IntersectionObserver) | 🔜 | Pas confirmé — cosmétique, non prioritaire |
| Grille des 6 itinéraires | ✅ | Images ajoutées 2026-09-11 (thumbnail du 1er stop, manquaient avant) |
| Section activités par catégorie (tabs) | ✅ | Ajoutée 2026-09-11 : `HomeActivities.tsx`, `FEATURED_ACTIVITIES` copié depuis index.html (`lib/home-data.ts`) — garder les deux copies en synchro |
| CTA "Créer ton itinéraire" | ✅ | `/creer-itineraire` existe et est lié depuis la nav/homepage |

**Note (2026-09-11)** : ces 4 trous (carte, activités, filtres badges, images itinéraires) avaient été
signalés par l'utilisateur comme "sautés" par rapport au site statique — corrigés dans la même
session. Nouveaux fichiers : `frontend/src/lib/home-data.ts`, `frontend/src/components/{HomeMap,
HomeMapWrapper,HomeActivities,HomeLieuxGrid}.tsx`. Un bug de course Leaflet (double-init sous React
Strict Mode) a été trouvé et corrigé dans `HomeMap.tsx` au passage — probablement présent aussi
dans `LeafletLieuMap.tsx`/`LeafletItinMap.tsx` (non corrigé, tâche séparée flaggée).

---

## Pages Lieu (`/lieux/[slug]`)

| Feature | Statut | Notes |
|---|---|---|
| Hero image | ✅ | |
| Hero carrousel multi-slides | ✅ | `HeroCarousel.tsx`, P2 |
| Badges | ✅ | |
| Meta-pills (saison, durée, niveau) | ✅ | |
| Coordonnées GPS pill | ✅ | P1 |
| Description | ✅ | |
| Conseils pratiques (tips) | ✅ | |
| Mini-carte Leaflet | ✅ | `MapLieuWrapper.tsx` / `LeafletLieuMap.tsx`, P2 |
| Liens Google Maps / Waze / Plans | ✅ | `buildMapLinks()`, P1 |
| Bouton "Partager" (Share API) | 🔜 | Pas confirmé porté |
| Bouton "Ajouter à un itinéraire" | 🔜 | Pas confirmé porté (existe sur le site statique) |
| Bouton favori (cœur) sur activités | ✅ | `FavoriteButton.tsx`, DB via `/api/favorites`, fait 2026-09-11 (`9e055b3`) |
| Grille d'activités | ✅ | |
| Section "Related" (lieux proches) | ✅ | |
| JSON-LD TouristAttraction | ✅ | P1 |
| OG tags complets (og:image, etc.) | ✅ | P1 |
| Canonical URL | ✅ | P1 |

---

## Pages Itinéraire (`/itineraires/[slug]`)

| Feature | Statut | Notes |
|---|---|---|
| Hero carrousel multi-lieu | ✅ | P2 |
| Meta-pills | ✅ | |
| Bouton "Ouvrir dans Google Maps" | ✅ | `buildGoogleMapsRouteUrl()`, P1 |
| Strip de photos des stops | 🔜 | Pas confirmé |
| Programme détaillé (stops + transit + sleep) | ✅ | |
| Lien `?itin=<slug>` sur chaque stop | 🔜 | Pas confirmé porté |
| Liens GPS par stop (Maps/Waze/Plans) | ✅ | P1 |
| Carte Leaflet de la route | ✅ | `MapItinWrapper.tsx` / `LeafletItinMap.tsx`, P2 |
| Section "À réserver" (booking cards) | ✅ | |
| Booking cards avec image + prix + durée | 🔜 | Pas confirmé |
| Section "Autres itinéraires" | 🔜 | Pas confirmé |

---

## Pages Ville (`/villes/[slug]`)

| Feature | Statut | Notes |
|---|---|---|
| Page ville entière | ✅ | P3, `/villes` + `/villes/[slug]` (22 pages SSG) |
| Hero + mini-carte Leaflet | ✅ | `MapLieuWrapper` réutilisé |
| Liste des lieux de la ville | ✅ | |
| JSON-LD TouristDestination | 🔜 | Pas confirmé |

---

## Créateur d'itinéraire (`/creer-itineraire`)

| Feature | Statut | Notes |
|---|---|---|
| Page entière | ✅ | P3, port complet |
| Picker durée + zones/lieux | ✅ | |
| Génération algorithmique (greedy) | ✅ | `itineraire-logic.ts` (port TS) |
| Drag-and-drop + boutons ▲/▼ | ✅ | Mobile-first |
| Carte Leaflet résultats | ✅ | `BuilderMap.tsx` |
| Programme détaillé avec heures/transits | ✅ | `ProgrammeSection` |
| Section "À réserver" dynamique | ✅ | `BookingSection` |
| Sauvegarde | ✅ | DB uniquement depuis 2026-09-11 (`fc84181`) — plus de localStorage, login requis |
| Chargement `?id=` et `?add=` | ❓ | `?id=` confirmé ; `?add=` pas confirmé |
| Export PDF / impression | 🔜 | Existait sur le site statique — pas confirmé porté |

---

## Mes Itinéraires (`/mes-itineraires`)

| Feature | Statut | Notes |
|---|---|---|
| Page entière | ✅ | DB uniquement, connexion requise (`fc84181`) |
| Liste des itinéraires sauvegardés | ✅ | Liens vers créateur `?id=`, delete |

---

## Mes Favoris (`/mes-favoris`)

| Feature | Statut | Notes |
|---|---|---|
| Page entière | ✅ | DB via `/api/favorites`, connexion requise (`9e055b3`) |
| Bouton cœur sur les activités | ✅ | `FavoriteButton.tsx` sur pages lieu (pas confirmé sur pages ville) |

---

## SEO & Analytics

| Feature | Statut | Notes |
|---|---|---|
| Plausible Analytics | ✅ | Même script que site statique |
| JSON-LD ItemList homepage | 🔜 | Pas confirmé |
| OG tags par page | ✅ | P1, via generateMetadata |
| Canonical URL | ✅ | P1 |
| Sitemap | ✅ | `/sitemap.xml` dynamique (route.ts) |
| noindex sur pages user-generated | 🔜 | Pas confirmé (`/creer-itineraire`, `/mes-itineraires`, `/mes-favoris`) |

---

## Note sur ce fichier (2026-09-11)

Ce fichier était significativement en retard sur l'état réel du projet — plusieurs lignes
marquées 🔜/⏳ étaient déjà faites (villes, maps, favoris DB, itinéraires DB-only, SEO P1).
Corrigé après vérification croisée avec `frontend_nextjs.md`, `architecture_future.md` et
l'historique git. Les lignes ❓ restent à vérifier concrètement (lire le code, pas juste
supposer) avant de les traiter comme faites ou manquantes.

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
