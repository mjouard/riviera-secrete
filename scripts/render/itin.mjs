// Renders itin/<slug>.html from an itinéraire object (data/itineraires.json) plus
// the lieux it references (data/lieux.json). An itinéraire never stores an activité's
// price/durée/url/image itself — it only keeps a lieuSlug+activiteId pointer and its
// own display copy (pill label, booking card name) on top of the lieu's data. A stop's
// badges are the referenced lieu's own `badges[]` — never duplicated here either.
import { renderBadgePills } from './lieu.mjs';

function findActivite(lieuBySlug, lieuSlug, activiteId) {
  const lieu = lieuBySlug.get(lieuSlug);
  return lieu?.activites.find(a => a.id === activiteId);
}

function renderMetaPills(metaPills) {
  return metaPills.map(p => `    <span class="meta-pill">${p.label} <strong>${p.valeur}</strong></span>`).join('\n');
}

function renderStopAct(lieuBySlug, a) {
  const url = a.activiteId ? findActivite(lieuBySlug, a.lieuSlug, a.activiteId).url : a.url;
  return `            <a class="stop-act ${a.cls}" href="${url}" target="_blank" rel="noopener">${a.label}</a>`;
}

function renderItem(lieuBySlug, item) {
  if (item.type === 'transit') {
    return `      <li class="itin-transit" aria-hidden="true">
        <span class="transit-arrow">↓</span>
        <span class="transit-info">${item.desc}</span>
      </li>`;
  }
  if (item.type === 'sleep') {
    return `      <li class="itin-stop itin-sleep">
        <span class="itin-time">Nuit</span>
        <div class="itin-stop-body">
          <span class="itin-stop-name itin-sleep-label">${item.dormirA}</span>
          <span class="itin-stop-commune">${item.commune}</span>
          <p>${item.desc}</p>
        </div>
      </li>`;
  }
  const lieu = lieuBySlug.get(item.lieuSlug);
  const acts = item.activites.length
    ? `\n          <div class="stop-acts">\n${item.activites.map(a => renderStopAct(lieuBySlug, a)).join('\n')}\n          </div>` : '';
  const badgePills = renderBadgePills(lieu.badges, '            ');
  const badges = badgePills ? `\n          <div class="lieu-badges">\n${badgePills}\n          </div>` : '';
  return `      <li class="itin-stop">
        <span class="itin-time">${item.heure}</span>
        <div class="itin-stop-body">
          <a href="../lieux/${lieu.slug}.html" class="itin-stop-name">${item.nom}</a>
          <span class="itin-stop-commune">${item.commune}</span>${badges}
          <p>${item.desc}</p>${acts}
        </div>
      </li>`;
}

function renderBookingCard(lieuBySlug, b) {
  const activite = b.activiteId ? findActivite(lieuBySlug, b.lieuSlug, b.activiteId) : null;
  const img = activite ? activite.image : b.img;
  const alt = activite ? activite.alt : b.alt;
  const duree = activite ? activite.duree : b.duree;
  const prix = activite ? activite.prix : b.prix;
  const url = activite ? activite.url : b.url;
  const extraSpans = (b.extraSpans || []).map(s => `\n            <span>${s}</span>`).join('');
  return `      <div class="itin-booking-card">
        <div class="itin-booking-img">
          <img src="${img}" alt="${alt}" loading="lazy">
        </div>
        <div class="itin-booking-body">
          <span class="itin-booking-lieu">${b.lieuLabel}</span>
          <span class="itin-booking-name">${b.nomLabel}</span>
          <div class="itin-booking-meta">
            <span>⏱ ${duree}</span>
            <span>💶 ${prix}</span>${extraSpans}
          </div>
          <a class="itin-booking-link" href="${url}" target="_blank" rel="noopener">${b.linkText}</a>
        </div>
      </div>`;
}

function renderSuggestCard(s) {
  return `      <a class="itin-suggest-card" href="${s.href}">
        <div class="itin-suggest-img">
          <img src="${s.img}" alt="${s.alt}" loading="lazy">
        </div>
        <div class="itin-suggest-body">
          <span class="itin-suggest-badge">${s.badge}</span>
          <h3>${s.titre}</h3>
        </div>
      </a>`;
}

function computeStops(itin, lieuBySlug) {
  let n = 0;
  return itin.items
    .filter(i => i.type === 'stop')
    .map(i => {
      n++;
      const lieu = lieuBySlug.get(i.lieuSlug);
      return `      { n:${n}, name:"${i.nom.replace(/"/g, '\\"')}", lat:${lieu.lat}, lng:${lieu.lng} }`;
    });
}

export function renderItin(itin, lieuBySlug) {
  const { slug, titre, description, badge, heroImgTag, metaPills, intro, strip, mapLabel, items, booking, suggestions } = itin;
  const titrePlain = titre.replace(/&amp;/g, '&');
  const hasSleep = items.some(i => i.type === 'sleep');
  const hasExtraSpans = booking.some(b => (b.extraSpans || []).length > 0);
  const bookingCols = booking.length;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="../favicon.svg">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${titrePlain} | Riviera Secrète</title>
<meta name="description" content="${description}">
<meta name="robots" content="index, follow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/style.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
<style>
.leaflet-tile-pane{ filter:invert(100%) hue-rotate(180deg); }
.itin-body{ display:grid; grid-template-columns:1.3fr 1fr; gap:32px; margin-top:8px; align-items:start; }
.itin-map{ width:100%; height:420px; border-radius:3px; border:1px solid var(--line); position:sticky; top:88px; }
.itin-stops{ list-style:none; margin:0; padding:0; }
.itin-stop{ display:grid; grid-template-columns:70px 1fr; gap:18px; padding:18px 0; border-top:1px solid var(--line); }
.itin-stop:first-child{ border-top:none; }
.itin-time{ font-family:'IBM Plex Mono',monospace; font-size:0.82rem; color:var(--terracotta); font-weight:500; padding-top:2px; }
.itin-stop-name{ font-family:'Fraunces',serif; font-weight:600; font-size:1.08rem; text-decoration:none; color:var(--text); display:inline-block; }
.itin-stop-name:hover{ color:var(--terracotta); }
.itin-stop-commune{ font-family:'IBM Plex Mono',monospace; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--azure); display:block; margin:2px 0 6px; }
.itin-stop-body p{ color:var(--text-muted); font-size:0.94rem; max-width:56ch; margin:0; }
.lieu-badges{ display:flex; flex-wrap:wrap; gap:6px; margin:6px 0 8px; }
.lieu-badge{ font-family:'IBM Plex Mono',monospace; font-size:0.68rem; letter-spacing:0.02em; padding:3px 9px; border-radius:2px; border:1px solid var(--line); color:var(--text-muted); display:inline-flex; align-items:center; gap:4px; white-space:nowrap; }
.leaflet-popup-content-wrapper{ border-radius:3px; font-family:'Inter',sans-serif; background:var(--surface); color:var(--text); }
.leaflet-popup-tip{ background:var(--surface); }
.popup-name{ font-family:'Fraunces',serif; font-weight:600; font-size:1rem; display:block; }
@media (max-width:900px){ .itin-body{ grid-template-columns:1fr; } .itin-map{ height:260px; position:static; order:-1; } }
@media (max-width:600px){ .itin-stop{ grid-template-columns:1fr; gap:4px; } }
.stop-acts{ display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
.stop-act{ font-family:'IBM Plex Mono',monospace; font-size:0.71rem; letter-spacing:0.02em; padding:4px 10px; border-radius:2px; text-decoration:none; white-space:nowrap; transition:opacity 0.15s; }
.stop-act:hover{ opacity:0.7; }
.stop-act--paid{ background:rgba(232,163,61,0.1); color:var(--terracotta); border:1px solid rgba(232,163,61,0.22); }
.stop-act--free{ background:rgba(74,144,185,0.08); color:var(--azure); border:1px solid rgba(74,144,185,0.18); }
.itin-transit{ display:grid; grid-template-columns:70px 1fr; gap:18px; padding:2px 0; }
.transit-arrow{ font-size:0.75rem; color:var(--text-muted); opacity:0.4; text-align:center; }
.transit-info{ font-family:'IBM Plex Mono',monospace; font-size:0.68rem; color:var(--text-muted); font-style:italic; display:flex; align-items:center; }
@media (max-width:600px){ .itin-transit{ grid-template-columns:1fr; } .transit-arrow{ display:none; } }${hasSleep ? `
.itin-sleep .itin-time{ color:var(--text-muted); }
.itin-sleep-label{ font-family:'Fraunces',serif; font-weight:600; font-size:1.08rem; color:var(--text); display:inline-block; font-style:italic; }
.itin-sleep .itin-stop-body p{ font-style:normal; }` : ''}
.itin-booking{ padding:56px 0 32px; border-top:1px solid var(--line); }
.itin-booking h2{ font-family:'Fraunces',serif; font-size:1.5rem; font-weight:600; margin:0 0 4px; }
.itin-booking > .wrap > p{ color:var(--text-muted); font-size:0.9rem; margin:0 0 28px; }
.itin-booking-grid{ display:grid; grid-template-columns:repeat(${bookingCols},1fr); gap:16px; }
@media (max-width:900px){ .itin-booking-grid{ grid-template-columns:repeat(2,1fr); } }
@media (max-width:500px){ .itin-booking-grid{ grid-template-columns:1fr; } }
.itin-booking-card{ border:1px solid var(--line); border-radius:3px; overflow:hidden; }
.itin-booking-img{ aspect-ratio:4/3; overflow:hidden; }
.itin-booking-img img{ width:100%; height:100%; object-fit:cover; display:block; transition:transform 0.3s; }
.itin-booking-card:hover .itin-booking-img img{ transform:scale(1.04); }
.itin-booking-body{ padding:12px 14px 14px; }
.itin-booking-lieu{ font-family:'IBM Plex Mono',monospace; font-size:0.67rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--azure); display:block; margin-bottom:4px; }
.itin-booking-name{ font-family:'Fraunces',serif; font-weight:600; font-size:0.95rem; display:block; margin-bottom:8px; line-height:1.3; }
.itin-booking-meta{ font-size:0.8rem; color:var(--text-muted); margin-bottom:10px; display:flex; gap:10px;${hasExtraSpans ? ' flex-wrap:wrap;' : ''} }
.itin-booking-link{ font-family:'IBM Plex Mono',monospace; font-size:0.73rem; color:var(--terracotta); text-decoration:none; font-weight:500; letter-spacing:0.03em; }
.itin-booking-link:hover{ text-decoration:underline; }
</style>
</head>
<body>

<header>
  <div class="wrap">
    <a class="logo" href="../index.html">Côte <em>d'Azur</em></a>
    <nav aria-label="Navigation principale">
      <a href="../carte.html">Carte</a>
      <a href="../itineraires.html">Itinéraires</a>
      <a href="../index.html#lieux">Lieux</a>
    </nav>
  </div>
</header>

<div class="wrap breadcrumb">
  <ol>
    <li><a href="../index.html">Accueil</a></li>
    <li><a href="../itineraires.html">Itinéraires</a></li>
    <li>${titre}</li>
  </ol>
</div>

<div class="wrap">
  <div class="detail-hero">
    ${heroImgTag}
    <div class="detail-hero-caption">
      <span class="card-region">${badge}</span>
      <h1>${titre}</h1>
    </div>
  </div>
</div>

<div class="wrap">
  <div class="meta-bar">
${renderMetaPills(metaPills)}
  </div>
  <p style="color:var(--text-muted);font-size:1rem;max-width:68ch;margin-bottom:24px;">${intro}</p>

  <div class="itin-strip">
${strip.map(s => `    <img src="${s.src}" alt="${s.alt}" loading="lazy">`).join('\n')}
  </div>

  <div class="itin-body">
    <ol class="itin-stops">
${items.map(i => renderItem(lieuBySlug, i)).join('\n')}
    </ol>
    <div id="map-itin-${slug}" class="itin-map" role="application" aria-label="${mapLabel}"></div>
  </div>
</div>

<section class="itin-booking">
  <div class="wrap">
    <h2>À réserver avant de partir</h2>
    <p>Ces expériences demandent un peu d'anticipation, surtout en haute saison.</p>
    <div class="itin-booking-grid">

${booking.map(b => renderBookingCard(lieuBySlug, b)).join('\n\n')}

    </div>
  </div>
</section>

<section class="itin-suggest">
  <div class="wrap">
    <h2>Autres itinéraires</h2>
    <div class="itin-suggest-grid">
${suggestions.map(renderSuggestCard).join('\n')}
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
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script>
  (function() {
    const STOPS = [
${computeStops(itin, lieuBySlug).join(',\n')}
    ];
    const map = L.map('map-itin-${slug}', { scrollWheelZoom: false, zoomControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    L.control.zoom({ position:'bottomright' }).addTo(map);
    const latlngs = STOPS.map(s => [s.lat, s.lng]);
    L.polyline(latlngs, { color:'#E8A33D', weight:2, opacity:0.7, dashArray:'4 6' }).addTo(map);
    STOPS.forEach(s => {
      const icon = L.divIcon({
        className:'',
        html:\`<div style="width:22px;height:22px;border-radius:50%;background:#E8A33D;color:#0C1116;border:2px solid #0C1116;box-shadow:0 1px 4px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;">\${s.n}</div>\`,
        iconSize:[22,22], iconAnchor:[11,11],
      });
      L.marker([s.lat,s.lng],{icon}).bindPopup(\`<span class="popup-name">\${s.n}. \${s.name}</span>\`).addTo(map);
    });
    map.fitBounds(L.latLngBounds(latlngs),{padding:[24,24]});
    map.on('focus',()=>map.scrollWheelZoom.enable());
    map.on('blur',()=>map.scrollWheelZoom.disable());
  })();
</script>
</body>
</html>
`;
}
