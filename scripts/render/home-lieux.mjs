// Computes index.html's two other data-derived blocks from data/villes.json:
// the JSON-LD ItemList and the region-grouped card grid (#lieux). Array order in
// data/villes.json IS the canonical display/listing order (grouped by region below).

const REGION_ORDER = ['menton-monaco', 'nice', 'arriere-pays', 'antibes-cannes', 'golfe-st-tropez'];

function truncate(str, len) {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export function buildItemList(villes) {
  return villes.map((v, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `https://riviera-secrete.netlify.app/villes/${v.slug}.html`,
    name: v.nom,
  }));
}

function renderCard(v) {
  const lieuxCount = v.lieux.length;
  const lieuxLabel = lieuxCount === 1 ? '1 lieu' : `${lieuxCount} lieux`;
  return `      <a class="card" href="villes/${v.slug}.html">
        <div class="card-media">
          <img src="${v.thumbImage}" alt="${v.nom}" loading="lazy">
          <span class="stamp">${v.lat.toFixed(2)}°N<br>${v.lng.toFixed(2)}°E</span>
        </div>
        <div class="card-body">
          <span class="card-region">${lieuxLabel}</span>
          <h3>${v.nom}</h3>
          <p>${truncate(v.description, 95)}</p>
        </div>
      </a>`;
}

function renderRegionSection(regionSlug, villesInRegion) {
  const { regionLabel } = villesInRegion[0];
  const count = villesInRegion.length;
  const countLabel = count === 1 ? '1 ville' : `${count} villes`;
  return `  <section class="region-section" id="${regionSlug}">
    <div class="wrap">
      <details class="region-toggle">
        <summary>
          <h2>${regionLabel}</h2>
          <span class="region-toggle-meta"><span class="region-count">${countLabel}</span><span class="region-toggle-icon">+</span></span>
        </summary>
        <div class="grid">
${villesInRegion.map(renderCard).join('\n\n')}
      </div>
      </details>
    </div>
  </section>`;
}

export function buildRegionSectionsHtml(villes) {
  return REGION_ORDER
    .map(region => renderRegionSection(region, villes.filter(v => v.regionSlug === region)))
    .join('\n\n');
}
