// Computes index.html's two other lieu-data duplicates from data/lieux.json:
// the JSON-LD ItemList and the region-grouped card grid (#lieux). Array order in
// data/lieux.json IS the canonical display/listing order (grouped by region below).

const REGION_ORDER = ['menton-monaco', 'nice', 'arriere-pays', 'antibes-cannes', 'golfe-st-tropez'];

function truncate(str, len) {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export function buildItemList(lieux) {
  return lieux.map((l, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `https://riviera-secrete.netlify.app/lieux/${l.slug}.html`,
    name: l.nom,
  }));
}

function renderCard(l) {
  return `      <a class="card" href="lieux/${l.slug}.html">
        <div class="card-media">
          <img src="${l.thumbImage}" alt="${l.heroAlt}" loading="lazy">
          <span class="stamp">${l.lat.toFixed(2)}°N<br>${l.lng.toFixed(2)}°E</span>
        </div>
        <div class="card-body">
          <span class="card-region">${l.commune}</span>
          <h3>${l.nom}</h3>
          <p>${truncate(l.description, 95)}</p>
        </div>
      </a>`;
}

function renderRegionSection(regionSlug, lieuxInRegion) {
  const { regionLabel } = lieuxInRegion[0];
  return `  <section class="region-section" id="${regionSlug}">
    <div class="wrap">
      <details class="region-toggle">
        <summary>
          <h2>${regionLabel}</h2>
          <span class="region-toggle-meta"><span class="region-count">${lieuxInRegion.length} lieux</span><span class="region-toggle-icon">+</span></span>
        </summary>
        <div class="grid">
${lieuxInRegion.map(renderCard).join('\n\n')}
      </div>
      </details>
    </div>
  </section>`;
}

export function buildRegionSectionsHtml(lieux) {
  return REGION_ORDER
    .map(region => renderRegionSection(region, lieux.filter(l => l.regionSlug === region)))
    .join('\n\n');
}
