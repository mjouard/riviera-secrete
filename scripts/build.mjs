// Regenerates lieux/*.html (and, once ported, itin/*.html) from data/*.json.
// data/lieux.json and data/itineraires.json are now the source of truth for
// lieu/activité/itinéraire facts — edit the JSON, then run this, not the HTML.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderLieu } from './render/lieu.mjs';
import { renderItin } from './render/itin.mjs';

const ROOT = join(import.meta.dirname, '..');
const lieux = JSON.parse(readFileSync(join(ROOT, 'data', 'lieux.json'), 'utf8'));
const itineraires = JSON.parse(readFileSync(join(ROOT, 'data', 'itineraires.json'), 'utf8'));
const lieuBySlug = new Map(lieux.map(l => [l.slug, l]));

for (const lieu of lieux) {
  writeFileSync(join(ROOT, 'lieux', `${lieu.slug}.html`), renderLieu(lieu));
}
for (const itin of itineraires) {
  writeFileSync(join(ROOT, 'itin', `${itin.slug}.html`), renderItin(itin, lieuBySlug));
}

console.log(`${lieux.length} pages lieux + ${itineraires.length} pages itinéraires régénérées.`);
