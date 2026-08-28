/**
 * Cherche une photo Wikimedia Commons pour chaque activité avec un placeholder picsum,
 * la télécharge dans assets/images/lieux/[slug]/, met à jour data/lieux.json,
 * et écrit les crédits dans scripts/act-images-credits.json.
 *
 * Usage : node scripts/fetch-act-images.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.resolve(__dirname, '..');

const lieux = JSON.parse(fs.readFileSync(path.join(BASE, 'data/lieux.json'), 'utf-8'));

// Requêtes Wikimedia spécifiques pour chaque activité
const SEARCH_OVERRIDES = {
  'sentier-du-littoral-tour-complet':    'Sentier littoral Cap Ferrat côte mer',
  'location-de-velos':                   'vélo promenade bord mer Nice Côte Azur',
  'visite-villa-kerylos':                'Villa Kerylos Beaulieu-sur-Mer',
  'promenade-gustave-eiffel':            'Beaulieu-sur-Mer promenade bord de mer',
  'chemin-de-nietzsche':                 'Chemin Nietzsche Eze sentier corniche',
  'sentier-le-corbusier':                'Sentier Le Corbusier Cap Martin Roquebrune',
  'cabanon-le-corbusier-visite-guidee':  'Cabanon Le Corbusier Cap Martin',
  'cascade-et-parc-du-chateau':          'Parc château Nice cascade fontaine',
  'vieux-nice-visite-guidee':            'Vieux Nice ruelles colorées baroque',
  'montee-en-ascenseur-colline':         'Colline château Nice panorama baie',
  'marche-du-cours-saleya':              'Cours Saleya marché fleurs Nice',
  'tour-gastronomique-vieux-nice':       'Socca cuisine niçoise street food',
  'cours-de-cuisine-nicoise':            'Pissaladière cuisine niçoise recette',
  'explorer-le-vieux-village':           'Peillon medieval village France',
  'dejeuner-sur-la-plage-arnulf':        'plage Nice baie des anges galets',
  'eglise-chapelle-des-penitents-blancs':'Chapelle pénitents blancs Peillon fresques',
  'balades-randonnees':                  'sentier colline arrière-pays Nice Alpes-Maritimes',
  'exploration-du-village-medieval':     'Peille village médiéval ruelle',
  'randonnee-peille-peillon':            'sentier randonnée arrière-pays niçois',
  'chapelle-saint-martin':               'chapelle romane Alpes-Maritimes ruine',
  'panorama-depuis-la-falaise':          'Gourdon falaise panorama gorges Loup',
  'chateau-musee-de-gourdon':            'Château Gourdon musée Alpes-Maritimes',
  'randonnee-gorges-du-loup':            'Gorges du Loup sentier randonnée',
  'escalade-et-via-ferrata':             'via ferrata escalade gorges canyon',
  'cascade-de-courmes':                  'Cascade Courmes gorges Loup',
  'confiserie-florian-visite-gratuite':  'Confiserie Florian Pont-du-Loup usine',
  'randonnee-viaduc-et-gorges':          'Viaduc Pont-du-Loup arche ruine gorges',
  'atelier-confitures-artisanales':      'confiture artisanale Provence pots bocaux',
  'visite-de-la-cite-des-violettes':     'village perché Alpes-Maritimes ruelle provençal',
  'atelier-ceramique-artisanale':        'atelier céramique poterie artisan Provence',
  'festival-des-violettes-fevrier-mars': 'violette fleur Alpes-Maritimes champ bouquet',
  'fondation-maeght':                    'Fondation Maeght Saint-Paul-de-Vence art',
  'balade-sur-les-remparts':             'remparts Saint-Paul-de-Vence chemin créneau',
  'ateliers-d-artistes-galeries':        'galerie art peinture Saint-Paul-de-Vence',
  'chapelle-du-rosaire-matisse':         'Chapelle Rosaire Matisse Vence vitraux',
  'vieille-ville-de-vence':              'Vence vieille ville cathédrale ruelle',
  'randonnee-baous-de-vence':            'Baous Vence rocher falaise randonnée',
  'verrerie-de-biot-demonstration':      'Verrerie Biot soufflage verre atelier',
  'atelier-soufflage-de-verre':          'soufflage verre artisan bulle atelier',
  'musee-national-fernand-leger':        'Musée Fernand Léger Biot mosaïque',
  'chateau-musee-grimaldi':              'Château Grimaldi Haut-de-Cagnes musée',
  'musee-renoir':                        'Musée Renoir Cagnes-sur-Mer maison atelier',
  'balade-village-medieval':             'Haut-de-Cagnes village médiéval ruelle escalier',
  'sentier-du-littoral-tirepoil':        'Sentier littoral Cap Antibes Tirepoil mer',
  'musee-picasso-d-antibes':             'Musée Picasso château Antibes',
  'location-de-velos-electriques':       'vélo électrique bord mer Côte Azur piste',
  'festival-jazz-a-juan':                'Festival Jazz Juan-les-Pins pinède concert',
  'location-paddle-sup':                 'paddle SUP stand up paddleboard mer',
  'plage-de-juan-les-pins':              'plage Juan-les-Pins sable pins parasols',
  'traversee-en-bateau-depuis-cannes':   'bateau traversée îles Lérins Cannes ferry',
  'abbaye-de-lerins-saint-honorat':      'Abbaye Lérins Saint-Honorat moines',
  'randonnee-ile-sainte-marguerite':     'Île Sainte-Marguerite forêt eucalyptus sentier',
  'randonnee-pic-du-cap-roux':           'Pic Cap Roux Estérel randonnée roches rouges',
  'vtt-dans-l-esterel':                  'VTT vélo tout terrain Estérel piste',
  'randonnee-esterel-cotiere':           'Estérel sentier côtier mer rouge',
  'kayak-de-mer-calanques':              'kayak de mer calanques Estérel rouge',
  'snorkeling-calanques-rouges':         'snorkeling méditerranée poissons calanque',
  'randonnee-cotiere-calanques':         'calanques Théoule Estérel sentier roches rouges',
  'visite-parfumerie-fragonard':         'Parfumerie Fragonard Grasse visite',
  'musee-international-de-la-parfumerie':'Musée parfumerie Grasse collection flacons',
  'atelier-creation-de-parfum':          'atelier création parfum Grasse nez essences',
  'citadelle-amp-musee-naval':           'Citadelle Saint-Tropez tour musée naval',
  'balade-au-port-de-saint-tropez':      'port Saint-Tropez bateaux quai vieux',
  'location-de-bateau':                  'location voilier bateau Méditerranée côte',
  'randonnee-panorama-des-barri':        'Gassin panorama golfe Saint-Tropez vue',
  'degustation-vins-du-golfe':           'dégustation vin Provence cave vignoble verre',
  'visite-du-village-classe':            'Gassin village perché plus beau France ruelle',
};

async function downloadImage(url, filepath) {
  const r = await fetch(url, { headers: { 'User-Agent': 'RivieraSecrete/1.0 (educational)' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const buffer = await r.arrayBuffer();
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filepath, Buffer.from(buffer));
}

function nextActNum(lieuSlug) {
  const dir = path.join(BASE, `assets/images/lieux/${lieuSlug}`);
  if (!fs.existsSync(dir)) return 1;
  const nums = fs.readdirSync(dir)
    .map(f => { const m = f.match(/^act-(\d+)\./i); return m ? parseInt(m[1]) : 0; })
    .filter(n => n > 0);
  return nums.length ? Math.max(...nums) + 1 : 1;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchWithRetry(url, opts, maxRetries = 4) {
  let delay = 2000;
  for (let i = 0; i <= maxRetries; i++) {
    const r = await fetch(url, opts);
    if (r.status === 429) {
      const wait = delay * (i + 1);
      process.stdout.write(`[rate-limit, attente ${wait/1000}s] `);
      await sleep(wait);
      continue;
    }
    return r;
  }
  throw new Error('Trop de requêtes (429) après plusieurs tentatives');
}

async function searchCommonsR(query) {
  const url = `https://commons.wikimedia.org/w/api.php?` +
    `action=query&list=search` +
    `&srsearch=${encodeURIComponent(query)}` +
    `&srnamespace=6&format=json&srlimit=8` +
    `&origin=*`;
  const r = await fetchWithRetry(url, { headers: { 'User-Agent': 'RivieraSecrete/1.0 (educational)' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('Réponse non-JSON'); }
  return (data.query?.search || []).filter(s =>
    !s.title.match(/\.(svg|gif|tif|tiff|webm|ogv|ogg)$/i)
  );
}

async function getImageInfoR(title) {
  const url = `https://commons.wikimedia.org/w/api.php?` +
    `action=query&titles=${encodeURIComponent(title)}` +
    `&prop=imageinfo&iiprop=url|user|extmetadata&iiurlwidth=700` +
    `&format=json&origin=*`;
  const r = await fetchWithRetry(url, { headers: { 'User-Agent': 'RivieraSecrete/1.0 (educational)' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('Réponse non-JSON'); }
  const pages = data.query?.pages || {};
  const page = Object.values(pages)[0];
  const info = page?.imageinfo?.[0];
  if (!info?.thumburl) return null;

  const meta = info.extmetadata || {};
  const license  = meta.LicenseShortName?.value || meta.License?.value || 'Unknown';
  const rawAuthor = meta.Artist?.value || meta.Attribution?.value || info.user || 'Unknown';
  const author = rawAuthor.replace(/<[^>]+>/g, '').trim().substring(0, 120);

  return {
    thumbUrl: info.thumburl,
    author,
    license,
    pageUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
    title,
  };
}

const creditsPath = path.join(BASE, 'scripts/act-images-credits.json');
const credits = fs.existsSync(creditsPath) ? JSON.parse(fs.readFileSync(creditsPath, 'utf-8')) : [];
let downloaded = 0, skipped = 0, failed = 0;

for (const lieu of lieux) {
  for (const act of (lieu.activites || [])) {
    if (!act.image.startsWith('http')) continue; // déjà une image locale

    const query = SEARCH_OVERRIDES[act.id] || `${act.nom} ${lieu.commune} France`;
    process.stdout.write(`  [${lieu.slug}] ${act.id}\n    → "${query}" ... `);

    await sleep(1500);

    try {
      const results = await searchCommonsR(query);
      if (!results.length) {
        await sleep(1500);
        const fb = await searchCommonsR(`${lieu.nom} ${lieu.commune}`);
        if (!fb.length) { process.stdout.write('aucun résultat\n'); skipped++; continue; }
        results.push(...fb);
      }

      let info = null;
      for (const result of results.slice(0, 5)) {
        await sleep(800);
        info = await getImageInfoR(result.title);
        if (info) break;
      }
      if (!info) { process.stdout.write('pas d\'info image\n'); skipped++; continue; }

      const num = nextActNum(lieu.slug);
      const ext = info.thumbUrl.match(/\.(jpe?g|png)/i)?.[1]?.replace('jpeg','jpg') || 'jpg';
      const filename = `act-${num}.${ext}`;
      const absPath  = path.join(BASE, `assets/images/lieux/${lieu.slug}/${filename}`);
      const relPath  = `../assets/images/lieux/${lieu.slug}/${filename}`;

      await downloadImage(info.thumbUrl, absPath);
      act.image = relPath;
      downloaded++;

      credits.push({
        activite: act.nom,
        lieu: lieu.nom,
        fichier: `assets/images/lieux/${lieu.slug}/${filename}`,
        auteur: info.author,
        licence: info.license,
        source: info.pageUrl,
      });

      process.stdout.write(`✓ ${filename} (${info.license})\n`);
    } catch (err) {
      process.stdout.write(`✗ ${err.message}\n`);
      failed++;
    }
  }
}

fs.writeFileSync(path.join(BASE, 'data/lieux.json'), JSON.stringify(lieux, null, 2));
fs.writeFileSync(creditsPath, JSON.stringify(credits, null, 2));

console.log(`\n✅ Terminé : ${downloaded} téléchargées, ${skipped} ignorées, ${failed} erreurs.`);
console.log(`   lieux.json mis à jour.`);
console.log(`   Crédits → scripts/act-images-credits.json`);
