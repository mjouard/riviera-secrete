---
name: project-html-patterns
description: "Patterns HTML complets des pages lieux et itinéraires — structure, ordre des sections, JSON-LD, JS Leaflet"
metadata: 
  node_type: memory
  type: project
  originSessionId: 763b5aa5-5cff-449e-8ca5-4e9e3dabe91d
---

## Page lieu (`lieux/[slug].html`)

### Structure dans l'ordre

1. `<head>` — meta SEO (description, og:*, twitter:card), JSON-LD `TouristAttraction`, 3 fonts Google + style.css + leaflet.css + `<style>` inline mini-map
2. `<header>` — logo + nav (Carte, Itinéraires, Les 30 lieux)
3. `.wrap.breadcrumb` — ol > li : Accueil → Région → Nom du lieu
4. `.wrap > .detail-hero` — img 1200×800 + `.detail-hero-caption` (span.card-region + h1)  
   → main.js transforme l'img en carousel 5 slides (seeds: `seed`, `seed-2` … `seed-5`)
5. `.wrap > .meta-bar` — pills : coordonnées, saison, durée, difficulté
6. `.wrap > .article` — grid 2 col → `.article-body` (2–3 §) + `aside.tips` (mini-map Leaflet 200px + h2 "Bon à savoir" + ul)
7. `section.activities` — activités (ajoutées via skill `/add-activities`)
8. `section.related` — 3 cards lieux liés (`.grid > a.card`)
9. `<footer>` + `<script src="../assets/main.js">` + `<script>` Leaflet mini-map

### JSON-LD type lieu

```json
{
  "@context": "https://schema.org",
  "@type": "TouristAttraction",
  "name": "[Nom]",
  "description": "...",
  "image": "https://picsum.photos/seed/[seed]/1200/800",
  "address": { "@type": "PostalAddress", "addressLocality": "[Commune]", "addressRegion": "Alpes-Maritimes / Var", "addressCountry": "FR" },
  "geo": { "@type": "GeoCoordinates", "latitude": X, "longitude": Y }
}
```

### JS Leaflet mini-map (page lieu)

```js
const map = L.map('mini-map-[slug]', { scrollWheelZoom: false, zoomControl: false, dragging: !L.Browser.mobile });
map.setView([lat, lng], 13);
// tileLayer OSM + L.control.zoom bottomright
// marker divIcon rond 18px #E8A33D
map.on('focus', () => map.scrollWheelZoom.enable());
map.on('blur', () => map.scrollWheelZoom.disable());
```

---

## Page itinéraire (`itin/[slug].html`)

### Structure dans l'ordre

1. `<head>` — meta SEO, fonts, `../assets/style.css`, leaflet.css, `<style>` inline (itin-body, itin-map, itin-stop, stop-acts, itin-transit, itin-booking, etc.)
2. `<header>` — logo + nav (Carte, Itinéraires, Les 30 lieux)
3. `.wrap.breadcrumb` — Accueil → Itinéraires → Titre
4. `.wrap > .detail-hero` — img 1200×800 + caption (badge étapes + h1)
5. `.wrap > .meta-bar` — pills : durée totale, mode transport, nombre d'étapes
6. `.wrap > p` — description intro de l'axe de la route
7. `.wrap > .itin-strip` — 3 imgs 600×400 liées aux étapes phares
8. `.wrap > .itin-body` — grid 1.3fr + 1fr :
   - `ol.itin-stops` — liste des stops ET transits intercalés
   - `div#map-[slug].itin-map` — carte Leaflet sticky (420px)
9. `section.itin-booking` — 3 ou 4 activités payantes à réserver
10. `section.itin-suggest` — 3 autres itinéraires suggérés
11. `<footer>` + scripts (main.js, leaflet.js, script Leaflet inline)

### Structure d'un stop

```html
<li class="itin-stop">
  <span class="itin-time">09:00</span>
  <div class="itin-stop-body">
    <a href="../lieux/[slug].html" class="itin-stop-name">[Nom du lieu]</a>
    <span class="itin-stop-commune">[Commune]</span>
    <p>[Description courte]</p>
    <div class="stop-acts">
      <a class="stop-act stop-act--paid" href="[URL]" target="_blank" rel="noopener">[Nom · Prix · Durée]</a>
      <a class="stop-act stop-act--free" href="[URL]" target="_blank" rel="noopener">[Nom · Libre]</a>
    </div>
  </div>
</li>
```

### Structure d'un transit (entre chaque stop)

```html
<li class="itin-transit" aria-hidden="true">
  <span class="transit-arrow">↓</span>
  <span class="transit-info">🚗 [Xmin] — [description route]</span>
</li>
```

Le transit n'a pas de `border-top`. La `border-top` de l'`itin-stop` suivant crée la séparation visuelle.

### Marqueur nuit (itinéraire multi-jours)

```html
<li class="itin-stop itin-sleep">
  <span class="itin-time">Nuit</span>
  <div class="itin-stop-body">
    <span class="itin-stop-name itin-sleep-label">Dormir à [Commune]</span>
    <span class="itin-stop-commune">[Commune]</span>
    <p>[Suggestion hébergement / ambiance]</p>
  </div>
</li>
```

### JS Leaflet itinéraire

```js
const STOPS = [
  { n:1, name:"...", lat:X, lng:Y },
  // ...
];
const map = L.map('map-[slug]', { scrollWheelZoom: false, zoomControl: false });
// tileLayer OSM, zoom bottomright
L.polyline(latlngs, { color:'#E8A33D', weight:2, opacity:0.7, dashArray:'4 6' }).addTo(map);
// markers divIcon 22px avec numéro, popup avec nom
map.fitBounds(L.latLngBounds(latlngs), { padding:[24,24] });
```

Les `n:` du tableau `STOPS` doivent rester séquentiels et correspondre à l'ordre HTML des stops (pas des transits).

---

## Règles globales de cohérence

- **Chemins** : pages lieux → `../assets/`, `../lieux/`. Pages itin → `../assets/`, `../lieux/`, autres itins sans `../`
- **Liens nav** : pages lieux → `../carte.html`, `../itineraires.html`, `../index.html#lieux`. Pages itin → identique.
- **`first-child` stop** : `.itin-stop:first-child{ border-top:none }` — si le 1er enfant d'`.itin-stops` est un transit, cette règle ne s'applique plus correctement. Toujours commencer par un `itin-stop`.
- **CSS inline** : ajouter seulement si la classe n'existe pas déjà dans `assets/style.css`.
