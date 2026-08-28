// Renders lieux/<slug>.html from a lieu object (see data/lieux.json).
// The lieu owns its activités — this template is the only place lieu+activité
// facts turn into markup; itin.mjs reads the same objects instead of re-typing them.

// Badges are generic tags ("can you do X here?"), unlike activités which are unique
// to one lieu (e.g. "Le Jardin exotique" only exists at eze-village). A lieu only lists
// the badges that actually apply — this is not a fixed checklist rendered as on/off.
export const BADGE_DEFS = {
  plage: { icon: '🏖️', label: 'Plage' },
  randonnee: { icon: '🥾', label: 'Randonnée' },
  vtt: { icon: '🚵', label: 'VTT' },
  plongee: { icon: '🤿', label: 'Plongée' },
  restaurant: { icon: '🍽️', label: 'Restaurant' },
};

export function renderBadgePills(badges, indent = '    ') {
  if (!badges || badges.length === 0) return '';
  return badges.map(id => {
    const def = BADGE_DEFS[id];
    if (!def) throw new Error(`badge inconnu: ${id}`);
    return `${indent}<span class="lieu-badge">${def.icon} ${def.label}</span>`;
  }).join('\n');
}

function renderBadges(badges) {
  const pills = renderBadgePills(badges);
  if (!pills) return '';
  return `\n  <div class="lieu-badges">\n${pills}\n  </div>\n`;
}

// "Ouvrir dans" — built from a lieu's own lat/lng, nothing hand-typed per lieu. Shared by
// lieu.mjs (own page, under the mini-map) and itin.mjs (one per stop — Waze/Plans have no
// official multi-stop URL scheme, so each stop links to its own point, not the whole trip).
export function renderMapLinks(lat, lng, nom, indent = '        ') {
  const coords = `${lat},${lng}`;
  const links = [
    { label: 'Google Maps', icon: '🗺️', url: `https://www.google.com/maps/search/?api=1&query=${coords}` },
    { label: 'Waze', icon: '🚗', url: `https://waze.com/ul?ll=${coords}&navigate=yes` },
    { label: 'Plans', icon: '📍', url: `https://maps.apple.com/?ll=${coords}&q=${encodeURIComponent(nom)}` },
  ];
  return links.map(l => `${indent}<a class="map-link" href="${l.url}" target="_blank" rel="noopener">${l.icon} ${l.label}</a>`).join('\n');
}

// The 📍 coordinates pill is always first and computed from lat/lng — data/lieux.json's
// metaPills only holds the other three (saison/durée/niveau), so a coordinate fix can't
// leave a stale duplicate string on display anywhere.
function renderMetaPills(metaPills, lat, lng) {
  const coordPill = { label: '📍', valeur: `${lat}°N, ${lng}°E` };
  return [coordPill, ...metaPills]
    .map(p => `    <span class="meta-pill">${p.label} <strong>${p.valeur}</strong></span>`)
    .join('\n');
}

function renderTips(tips) {
  return tips.map(t => `          <li><strong>${t.label}</strong>${t.texte}</li>`).join('\n');
}

function renderActivityCard(a) {
  const linkClass = a.badge === 'gratuit' ? ' free' : '';
  return `      <div class="activity-card">
        <div class="activity-thumb">
          <img src="${a.image}" alt="${a.alt}" loading="lazy">
        </div>
        <div class="activity-content">
          <div class="activity-header">
            <span class="activity-name">${a.nom}</span>
            <span class="activity-badge ${a.badge}">${a.badge === 'gratuit' ? 'Gratuit' : 'Payant'}</span>
          </div>
          <div class="activity-meta">
            <span>⏱ ${a.duree}</span>
            <span>💶 ${a.prix}</span>
          </div>
          <a class="activity-link${linkClass}" href="${a.url}" target="_blank" rel="noopener">${a.linkText}</a>
        </div>
      </div>`;
}

function renderRelatedCard(r) {
  return `      <a class="card" href="${r.href}">
        <div class="card-media">
          <img src="${r.img}" alt="${r.alt}" loading="lazy">
          <span class="stamp">${r.stamp}</span>
        </div>
        <div class="card-body">
          <span class="card-region">${r.region}</span>
          <h3>${r.titre}</h3>
          <p>${r.blurb}</p>
        </div>
      </a>`;
}

export function renderLieu(lieu, itinTitles = {}, villeBySlug = new Map()) {
  const {
    slug, nom, commune, regionSlug, regionLabel, lat, lng,
    description, ogImage, heroImage, heroAlt, heroSlides,
    metaPills, description1, description2, tips, activites, related, badges,
    villeSlug,
  } = lieu;

  const ville = villeBySlug.get(villeSlug);
  const villeNom = ville ? ville.nom : commune;
  const villeHref = ville ? `../villes/${villeSlug}.html` : `../index.html#${regionSlug}`;

  const ogTitle = `${nom} — ${commune}`;
  const heroSlidesAttr = heroSlides ? ` data-slides="${heroSlides}"` : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="../favicon.svg">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>${nom} — ${commune} | Riviera Secrète</title>
<meta name="description" content="${description}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://riviera-secrete.netlify.app/lieux/${slug}.html">

<meta property="og:type" content="article">
<meta property="og:title" content="${ogTitle}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="https://riviera-secrete.netlify.app/lieux/${slug}.html">
<meta property="og:image" content="${ogImage}">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="Riviera Secrète">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${ogTitle}">
<meta name="twitter:description" content="${description}">

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "TouristAttraction",
  "name": "${nom}",
  "description": "${description}",
  "image": "${ogImage}",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "${commune}",
    "addressRegion": "Alpes-Maritimes / Var",
    "addressCountry": "FR"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": ${lat},
    "longitude": ${lng}
  }
}
</script>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/style.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
<style>
  .mini-map{
    width:100%; height:200px; border-radius:3px;
    border:1px solid var(--line); margin-bottom:20px;
  }
  .leaflet-tile-pane{ filter:invert(100%) hue-rotate(180deg); }

  .leaflet-popup-content-wrapper{
    border-radius:3px; font-family:'Inter', sans-serif;
    background:var(--surface); color:var(--text);
  }
  .leaflet-popup-tip{ background:var(--surface); }
  .leaflet-popup-close-button{ color:var(--text-muted) !important; }
  .leaflet-container a.leaflet-popup-close-button:hover{ color:var(--terracotta) !important; }
  .popup-region{
    font-family:'IBM Plex Mono', monospace; font-size:0.68rem; text-transform:uppercase;
    letter-spacing:0.08em; color:var(--azure); display:block; margin-bottom:4px;
  }
  .popup-name{ font-family:'Fraunces', serif; font-weight:600; font-size:1.02rem; margin-bottom:6px; display:block; }
  .popup-intro{ font-size:0.85rem; color:var(--text-muted); margin-bottom:10px; }
  .popup-link{
    font-family:'IBM Plex Mono', monospace; font-size:0.75rem; letter-spacing:0.03em;
    color:var(--terracotta); text-decoration:none; font-weight:500;
  }
  .popup-link:hover{ text-decoration:underline; }

</style>
</head>
<body>

<header>
  <div class="wrap">
    <a class="logo" href="../index.html">Côte <em>d'Azur</em></a>
    <nav aria-label="Navigation principale">
      <a href="../index.html#itineraires">Itinéraires</a>
      <a href="../index.html#lieux">Villes</a>
      <a href="../mes-itineraires.html">Mes itinéraires</a>
    </nav>
    <button class="nav-toggle" aria-label="Menu" aria-expanded="false">☰</button>
  </div>
</header>

<div class="wrap breadcrumb">
  <ol>
    <li><a href="../index.html">Accueil</a></li>
    <li><a href="${villeHref}" id="breadcrumb-parent">${villeNom}</a></li>
    <li>${nom}</li>
  </ol>
</div>

<div class="wrap">
  <div class="detail-hero">
    <img src="${heroImage}" alt="${heroAlt}" loading="eager"${heroSlidesAttr}>
    <div class="detail-hero-caption">
      <span class="card-region">${commune}</span>
      <h1>${nom}</h1>
    </div>
  </div>
</div>

<div class="wrap">${renderBadges(badges)}
  <div class="meta-bar">
${renderMetaPills(metaPills, lat, lng)}
  </div>

  <div class="article">
    <div class="article-body">
      <p>${description1}</p>
      <p>${description2}</p>
    </div>
    <aside class="tips">
      <div id="mini-map-${slug}" class="mini-map" role="application" aria-label="Localisation de ${nom}"></div>
      <div class="map-links">
${renderMapLinks(lat, lng, nom)}
      </div>
      <h2>Bon à savoir</h2>
      <ul>
${renderTips(tips)}
      </ul>
    </aside>
  </div>
</div>

<section class="activities">
  <div class="wrap">
    <h2>Activités à ${commune}</h2>
    <div class="activities-grid">

${activites.map(renderActivityCard).join('\n\n')}

    </div>
  </div>
</section>

<section class="related">
  <div class="wrap">
    <h2>D'autres lieux à découvrir</h2>
    <div class="grid">
${related.map(renderRelatedCard).join('\n\n')}
    </div>
  </div>
</section>

<footer>
  <div class="wrap">
    <p>© 2026 Riviera Secrète — carnet de repérage, pas un guide officiel.</p>
    <p><a href="../index.html">← Retour à l'accueil</a></p>
  </div>
</footer>

<script src="../assets/main.js"></script>
<script>
  (function() {
    const ITIN_TITLES = ${JSON.stringify(itinTitles)};
    const itinSlug = new URLSearchParams(location.search).get('itin');
    if (itinSlug && ITIN_TITLES[itinSlug]) {
      const crumb = document.getElementById('breadcrumb-parent');
      if (crumb) {
        crumb.href = '../itin/' + itinSlug + '.html';
        crumb.textContent = ITIN_TITLES[itinSlug];
      }
    }
  })();
</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script>
  (function() {
    const map = L.map('mini-map-${slug}', { scrollWheelZoom: false, zoomControl: false, dragging: !L.Browser.mobile });
    map.setView([${lat}, ${lng}], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    const icon = L.divIcon({
      className: '',
      html: \`<div style="width:18px;height:18px;border-radius:50%;background:#E8A33D;border:2px solid #0C1116;box-shadow:0 1px 4px rgba(0,0,0,0.5);"></div>\`,
      iconSize: [18, 18], iconAnchor: [9, 9],
    });
    L.marker([${lat}, ${lng}], { icon }).addTo(map);
    map.on('focus', () => map.scrollWheelZoom.enable());
    map.on('blur', () => map.scrollWheelZoom.disable());
  })();
</script>

</body>
</html>
`;
}
