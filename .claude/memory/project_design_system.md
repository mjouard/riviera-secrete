---
name: project-design-system
description: "Design system de Riviera Secrète — variables CSS, typographies, couleurs, composants clés, images picsum"
metadata: 
  node_type: memory
  type: project
  originSessionId: 763b5aa5-5cff-449e-8ca5-4e9e3dabe91d
---

Tout le CSS est dans `assets/style.css` (partagé par toutes les pages). Les pages peuvent ajouter un bloc `<style>` inline pour du CSS page-spécifique — **ne jamais réécrire les classes globales**.

## Variables CSS (`:root`)

```css
--bg: #0C1116          /* fond principal, quasi-noir */
--surface: #151B22     /* cartes, panneaux */
--surface-hover: #1C242D
--text: #ECEEF1        /* texte principal */
--text-muted: #8B96A1  /* texte secondaire, descriptions */
--terracotta: #E8A33D  /* accent chaud : badges, boutons, liens actifs, markers carte */
--azure: #4FC3C9       /* accent froid : labels région, badges lieu */
--line: rgba(255,255,255,0.08)  /* bordures subtiles */
```

## Typographies (Google Fonts)

- **Fraunces** (serif, opsz 9–144) — titres h1/h2/h3, noms de lieux, éléments éditoriaux. `font-weight:600` normal, `font-style:italic font-weight:500` pour l'italique expressif.
- **Inter** — corps de texte, descriptions, contenu principal.
- **IBM Plex Mono** — labels techniques, coordonnées, badges, horaires, pills d'activités, navigation, boutons.

Règle : `h1 em, h2 em` → italic terracotta (utilisé pour mettre en valeur un mot dans les titres).

## Conteneur

`.wrap` → `max-width:1140px; margin:0 auto; padding:0 24px`

## Images

Toutes les images utilisent **picsum.photos** avec un seed descriptif en kebab-case :
- `https://picsum.photos/seed/[seed]/[largeur]/[hauteur]`
- Hero page lieu : `1200/800`
- Hero itinéraire : `1200/800`
- Cards index : `500/375`
- Thumbnails activités : `200/200`
- Cards booking itinéraire : `400/300`
- Cards suggestions itinéraires : `600/338`

Seed = nom descriptif du lieu (ex: `eze-village`, `itin-menton`, `jardin-eze`). Variantes carousel : `seed`, `seed-2`, `seed-3`, etc. (générées automatiquement par main.js).

## Carte (Leaflet)

- Lib CDN : `leaflet/1.9.4` (CSS + JS)
- **Dark mode** : `filter:invert(100%) hue-rotate(180deg)` sur `.leaflet-tile-pane`
- Tuiles OSM standard : `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Marker custom : `L.divIcon` rond 18px (lieux) ou 22px avec numéro (itinéraires), couleur `#E8A33D`, bordure `#0C1116`
- Scroll wheel : désactivé par défaut, activé on focus / désactivé on blur
- Popup styles : `.leaflet-popup-content-wrapper` → `background:var(--surface); color:var(--text)`

## Composants clés (classes CSS globales disponibles)

### Header
`.header` sticky, blur backdrop, `border-bottom:1px solid var(--line)`. Logo `.logo` Fraunces.

### Breadcrumb
`.wrap.breadcrumb ol li a` — navigation hiérarchique.

### Cards lieux (index)
`.card` → `.card-media` (img + `.stamp` coordonnées) + `.card-body` (`.card-region`, h3, p). Animation scroll via IntersectionObserver (classe `visible` ajoutée).

### Meta-bar
`.meta-bar` → `.meta-pill` — pills d'info pratique (coordonnées, saison, durée, difficulté).

### Page lieu — article
`.article` grid 2 colonnes → `.article-body` (texte) + `aside.tips` (mini-map + liste "Bon à savoir").

### Activités (pages lieux)
`.activities` → `.activities-grid` → `.activity-card` (.activity-thumb img 200×200 + .activity-content avec .activity-header, .activity-badge [payant|gratuit], .activity-meta, .activity-link [.free]).

### Section related
`.related` → `.grid` avec 3 cards `.card`.

### Pills itinéraires (dans itin-stops)
`.stop-acts` → `.stop-act.stop-act--paid` (fond terracotta 10%) | `.stop-act--free` (fond azure 8%). IBM Plex Mono 0.71rem.

### Booking (section itinéraire)
`.itin-booking` → `.itin-booking-grid` (4 colonnes) → `.itin-booking-card` (.itin-booking-img + .itin-booking-body avec .itin-booking-lieu, .itin-booking-name, .itin-booking-meta, .itin-booking-link).

### Suggestions itinéraires
`.itin-suggest` → `.itin-suggest-grid` → `.itin-suggest-card`.

### Transits itinéraires
`.itin-transit` grid 70px + 1fr → `.transit-arrow` (↓, muted 40%) + `.transit-info` (IBM Plex Mono 0.68rem, italic, muted). Mobile : arrow masquée, colonne unique.
