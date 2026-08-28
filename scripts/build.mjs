// Regenerates lieux/*.html, itin/*.html and villes/*.html from data/*.json.
// data/lieux.json, data/itineraires.json and data/villes.json are now the source of truth —
// edit the JSON, then run this, not the HTML.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderLieu } from './render/lieu.mjs';
import { renderItin } from './render/itin.mjs';
import { renderVille } from './render/ville.mjs';
import { buildSpotsMapHome } from './render/home-map.mjs';
import { buildItemList, buildRegionSectionsHtml } from './render/home-lieux.mjs';

const ROOT = join(import.meta.dirname, '..');
const lieux = JSON.parse(readFileSync(join(ROOT, 'data', 'lieux.json'), 'utf8'));
const itineraires = JSON.parse(readFileSync(join(ROOT, 'data', 'itineraires.json'), 'utf8'));
const villes = JSON.parse(readFileSync(join(ROOT, 'data', 'villes.json'), 'utf8'));
const lieuBySlug = new Map(lieux.map(l => [l.slug, l]));
const villeBySlug = new Map(villes.map(v => [v.slug, v]));
const itinTitles = Object.fromEntries(itineraires.map(i => [i.slug, i.titre.replace(/&amp;/g, '&')]));

for (const lieu of lieux) {
  const ville = villeBySlug.get(lieu.villeSlug);
  if (!ville) throw new Error(`villeSlug "${lieu.villeSlug}" not found in villes.json for lieu ${lieu.slug}`);
  writeFileSync(join(ROOT, 'lieux', `${lieu.slug}.html`), renderLieu(lieu, itinTitles, villeBySlug));
}
for (const itin of itineraires) {
  writeFileSync(join(ROOT, 'itin', `${itin.slug}.html`), renderItin(itin, lieuBySlug));
}
for (const ville of villes) {
  const lieuxDeVille = lieux.filter(l => l.villeSlug === ville.slug);
  writeFileSync(join(ROOT, 'villes', `${ville.slug}.html`), renderVille(ville, lieuxDeVille, itinTitles));
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
  `const SPOTS_MAP_HOME = ${JSON.stringify(buildSpotsMapHome(villes))};`,
  'SPOTS_MAP_HOME',
);

const itemListLines = buildItemList(villes)
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
  /  <section class="region-section" id="menton-monaco">[\s\S]*?<\/section>\r?\n<\/div>\r?\n\r?\n<footer>/,
  `${buildRegionSectionsHtml(villes)}\n</div>\n\n<footer>`,
  'region sections (#lieux)',
);

writeFileSync(indexPath, indexHtml);

console.log(`${lieux.length} pages lieux + ${itineraires.length} pages itinéraires + ${villes.length} pages villes régénérées, index.html à jour.`);
