// Renders villes/<slug>.html from a ville object (data/villes.json) plus the
// array of lieux belonging to that ville (already filtered by build.mjs).
// Follows the same patterns as lieu.mjs: no framework, plain JS template literals.
import { renderBadgePills, renderMapLinks } from './lieu.mjs';

function truncate(str, len) {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

function renderActivityCard(a) {
  const linkClass = a.badge === 'gratuit' ? ' free' : '';
  const imgSrc = a.image.startsWith('http') ? a.image : '../' + a.image.replace(/^\.\.\//, '');
  return `        <div class="activity-card">
          <div class="activity-thumb">
            <img src="${imgSrc}" alt="${a.alt}" loading="lazy">
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

function renderLieuSection(lieu) {
  const badges = renderBadgePills(lieu.badges, '        ');
  const badgesBlock = badges ? `\n        <div class="lieu-badges">\n${badges}\n        </div>` : '';
  const activitesBlock = (lieu.activites || []).length > 0
    ? `\n      <div class="activities-grid">\n${lieu.activites.map(renderActivityCard).join('\n\n')}\n      </div>` : '';
  return `    <div class="ville-lieu-section">
      <div class="ville-lieu-header">
        <div class="ville-lieu-thumb">
          <img src="../${lieu.thumbImage}" alt="${lieu.heroAlt}" loading="lazy">
        </div>
        <div class="ville-lieu-meta">
          <h2>${lieu.nom}</h2>
          <p>${truncate(lieu.description, 120)}</p>${badgesBlock}
          <a class="ville-lieu-link" href="../lieux/${lieu.slug}.html">Voir la fiche complète →</a>
        </div>
      </div>${activitesBlock}
    </div>`;
}

export function renderVille(ville, lieux, itinTitles = {}) {
  const { slug, nom, regionSlug, regionLabel, lat, lng, description, thumbImage } = ville;

  const firstLieu = lieux[0];
  const heroImage = firstLieu.heroImage;
  const heroAlt = firstLieu.heroAlt;
  const heroSlidesAttr = firstLieu.heroSlides ? ` data-slides="${firstLieu.heroSlides}"` : '';

  const lieuxCountLabel = lieux.length === 1 ? '1 lieu' : `${lieux.length} lieux`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="../favicon.svg">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>${nom} — Côte d'Azur | Riviera Secrète</title>
<meta name="description" content="${description}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://riviera-secrete.netlify.app/villes/${slug}.html">

<meta property="og:type" content="article">
<meta property="og:title" content="${nom} — Riviera Secrète">
<meta property="og:description" content="${description}">
<meta property="og:url" content="https://riviera-secrete.netlify.app/villes/${slug}.html">
<meta property="og:image" content="${firstLieu.ogImage}">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="Riviera Secrète">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${nom} — Riviera Secrète">
<meta name="twitter:description" content="${description}">

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "TouristDestination",
  "name": "${nom}",
  "description": "${description}",
  "image": "${firstLieu.ogImage}",
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": ${lat},
    "longitude": ${lng}
  },
  "url": "https://riviera-secrete.netlify.app/villes/${slug}.html"
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
  .popup-name{ font-family:'Fraunces', serif; font-weight:600; font-size:1.02rem; margin-bottom:6px; display:block; }
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
    <li>${regionLabel}</li>
    <li>${nom}</li>
  </ol>
</div>

<div class="wrap">
  <div class="detail-hero">
    <img src="${heroImage}" alt="${heroAlt}" loading="eager"${heroSlidesAttr}>
    <div class="detail-hero-caption">
      <span class="card-region">${regionLabel}</span>
      <h1>${nom}</h1>
    </div>
  </div>
</div>

<div class="wrap">
  <div class="article">
    <div class="article-body">
      <p>${description}</p>
      <p class="meta-pill" style="margin-top:12px;">📍 ${lieuxCountLabel} à explorer</p>
    </div>
    <aside class="tips">
      <div id="mini-map-${slug}" class="mini-map" role="application" aria-label="Localisation de ${nom}"></div>
      <div class="map-links">
${renderMapLinks(lat, lng, nom)}
      </div>
    </aside>
  </div>
</div>

<section class="ville-lieux">
  <div class="wrap">
    <h2>À découvrir à ${nom}</h2>
${lieux.map(renderLieuSection).join('\n\n')}
  </div>
</section>

<footer>
  <div class="wrap">
    <p>© 2026 Riviera Secrète — carnet de repérage, pas un guide officiel.</p>
    <p><a href="../index.html">← Retour à l'accueil</a></p>
  </div>
</footer>

<script src="../assets/main.js"></script>
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
${lieux.map(l => `    L.marker([${l.lat}, ${l.lng}], { icon }).addTo(map).bindPopup('<span class="popup-name">${l.nom.replace(/'/g, "\\'")}</span><br><a class="popup-link" href="../lieux/${l.slug}.html">Voir la fiche →</a>');`).join('\n')}
    map.on('focus', () => map.scrollWheelZoom.enable());
    map.on('blur', () => map.scrollWheelZoom.disable());
  })();
</script>

</body>
</html>
`;
}
