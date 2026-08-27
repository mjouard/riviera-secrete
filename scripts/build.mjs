// Regenerates lieux/*.html (and, once ported, itin/*.html) from data/*.json.
// data/lieux.json and data/itineraires.json are now the source of truth for
// lieu/activité/itinéraire facts — edit the JSON, then run this, not the HTML.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderLieu } from './render/lieu.mjs';
import { renderItin } from './render/itin.mjs';
import { buildSpotsMapHome } from './render/home-map.mjs';

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

// index.html stays hand-authored HTML; only its SPOTS_MAP_HOME data array is generated.
const indexPath = join(ROOT, 'index.html');
const indexHtml = readFileSync(indexPath, 'utf8');
if (!/const SPOTS_MAP_HOME = \[.*?\];/s.test(indexHtml)) throw new Error('SPOTS_MAP_HOME marker not found in index.html');
const newIndexHtml = indexHtml.replace(
  /const SPOTS_MAP_HOME = \[.*?\];/s,
  `const SPOTS_MAP_HOME = ${JSON.stringify(buildSpotsMapHome(lieux))};`
);
writeFileSync(indexPath, newIndexHtml);

console.log(`${lieux.length} pages lieux + ${itineraires.length} pages itinéraires régénérées, index.html map data à jour.`);
