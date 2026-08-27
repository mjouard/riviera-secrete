// Regenerates lieux/*.html (and, once ported, itin/*.html) from data/*.json.
// data/lieux.json and data/itineraires.json are now the source of truth for
// lieu/activité/itinéraire facts — edit the JSON, then run this, not the HTML.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderLieu } from './render/lieu.mjs';
import { renderItin } from './render/itin.mjs';
import { buildSpotsMapHome } from './render/home-map.mjs';
import { buildItemList, buildRegionSectionsHtml } from './render/home-lieux.mjs';

const ROOT = join(import.meta.dirname, '..');
const lieux = JSON.parse(readFileSync(join(ROOT, 'data', 'lieux.json'), 'utf8'));
const itineraires = JSON.parse(readFileSync(join(ROOT, 'data', 'itineraires.json'), 'utf8'));
const lieuBySlug = new Map(lieux.map(l => [l.slug, l]));
const itinTitles = Object.fromEntries(itineraires.map(i => [i.slug, i.titre.replace(/&amp;/g, '&')]));

for (const lieu of lieux) {
  writeFileSync(join(ROOT, 'lieux', `${lieu.slug}.html`), renderLieu(lieu, itinTitles));
}
for (const itin of itineraires) {
  writeFileSync(join(ROOT, 'itin', `${itin.slug}.html`), renderItin(itin, lieuBySlug));
}

// index.html stays hand-authored HTML; only three data-derived blocks are generated
// in place: the homepage map, the JSON-LD ItemList, and the region-grouped card grid.
function injectOrThrow(html, pattern, replacement, label) {
  if (!pattern.test(html)) throw new Error(`${label} marker not found in index.html`);
  return html.replace(pattern, replacement);
}

const indexPath = join(ROOT, 'index.html');
let indexHtml = readFileSync(indexPath, 'utf8');

indexHtml = injectOrThrow(
  indexHtml,
  /const SPOTS_MAP_HOME = \[.*?\];/s,
  `const SPOTS_MAP_HOME = ${JSON.stringify(buildSpotsMapHome(lieux))};`,
  'SPOTS_MAP_HOME',
);

const itemListLines = buildItemList(lieux)
  .map((item, i, arr) => `    ${JSON.stringify(item)}${i < arr.length - 1 ? ',' : ''}`)
  .join('\n');
indexHtml = injectOrThrow(
  indexHtml,
  /"itemListElement": \[.*?\]/s,
  `"itemListElement": [\n${itemListLines}\n  ]`,
  'JSON-LD itemListElement',
);

indexHtml = injectOrThrow(
  indexHtml,
  /  <section class="region-section" id="menton-monaco">[\s\S]*?<\/section>\n<\/div>\n\n<footer>/,
  `${buildRegionSectionsHtml(lieux)}\n</div>\n\n<footer>`,
  'region sections (#lieux)',
);

writeFileSync(indexPath, indexHtml);

console.log(`${lieux.length} pages lieux + ${itineraires.length} pages itinéraires régénérées, index.html à jour.`);
