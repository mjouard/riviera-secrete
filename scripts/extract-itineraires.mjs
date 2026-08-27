// One-time extraction: parses itin/*.html into data/itineraires.json.
// Each stop/pill/booking-card is resolved to a { lieuSlug, activiteId } pointing into
// data/lieux.json, so price/durée/url/image live in exactly one place (the lieu's
// activité) — the itinéraire only keeps its own display copy (pill/card label) on top.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const ITIN_DIR = join(ROOT, 'itin');
const OUT = join(ROOT, 'data', 'itineraires.json');

const lieux = JSON.parse(readFileSync(join(ROOT, 'data', 'lieux.json'), 'utf8'));
const lieuBySlug = new Map(lieux.map(l => [l.slug, l]));
const lieuByHref = new Map(lieux.map(l => [`../lieux/${l.slug}.html`, l]));
// url -> { lieuSlug, activiteId } across every lieu's activités
const activiteByUrl = new Map();
for (const l of lieux) for (const a of l.activites) {
  if (!activiteByUrl.has(a.url)) activiteByUrl.set(a.url, { lieuSlug: l.slug, activiteId: a.id });
}

function resolveActivite(url, ctx) {
  const hit = activiteByUrl.get(url);
  if (!hit) {
    console.warn(`  ! url non résolue vers une activité (${ctx}): ${url}`);
    return null;
  }
  return hit;
}

function extractOne(html, slug) {
  const m = (re, fallback = null) => { const r = html.match(re); return r ? r[1] : fallback; };

  const titre = m(/<h1>(.*?)<\/h1>/s);
  const description = m(/<meta name="description" content="(.*?)">/s);
  const badge = m(/<span class="card-region">(.*?)<\/span>\s*<h1>/s); // ex: "6 étapes · 2 jours"

  const heroImgTag = m(/<div class="detail-hero">\s*(<img[\s\S]*?>)\s*<div class="detail-hero-caption">/);

  const metaPills = [...html.matchAll(/<span class="meta-pill">(.*?)<strong>(.*?)<\/strong><\/span>/gs)]
    .map(([, label, valeur]) => ({ label: label.trim(), valeur }));

  const intro = m(/<p style="color:var\(--text-muted\);font-size:1rem;max-width:68ch;margin-bottom:24px;">(.*?)<\/p>/s);

  const stripBlock = m(/<div class="itin-strip">(.*?)<\/div>/s, '');
  const strip = [...stripBlock.matchAll(/<img src="(.*?)" alt="(.*?)"[^>]*>/gs)]
    .map(([, src, alt]) => ({ src, alt }));

  const mapLabel = m(/class="itin-map" role="application" aria-label="(.*?)">/s);

  const stopsBlock = m(/<ol class="itin-stops">(.*?)<\/ol>/s, '');
  const liRe = /<li class="(itin-stop itin-sleep|itin-stop|itin-transit)"[^>]*>([\s\S]*?)<\/li>/g;
  const items = [];
  let liMatch;
  while ((liMatch = liRe.exec(stopsBlock))) {
    const [, cls, inner] = liMatch;
    if (cls === 'itin-transit') {
      const desc = inner.match(/<span class="transit-info">(.*?)<\/span>/s)[1];
      items.push({ type: 'transit', desc });
    } else if (cls === 'itin-stop itin-sleep') {
      const [, dormirA, commune, desc] = inner.match(
        /<span class="itin-stop-name itin-sleep-label">(.*?)<\/span>\s*<span class="itin-stop-commune">(.*?)<\/span>\s*<p>(.*?)<\/p>/s
      );
      items.push({ type: 'sleep', dormirA, commune, desc });
    } else {
      const [, heure, href, nom, commune, desc] = inner.match(
        /<span class="itin-time">(.*?)<\/span>\s*<div class="itin-stop-body">\s*<a href="(.*?)" class="itin-stop-name">(.*?)<\/a>\s*<span class="itin-stop-commune">(.*?)<\/span>\s*<p>(.*?)<\/p>/s
      );
      const lieu = lieuByHref.get(href);
      if (!lieu) console.warn(`  ! stop href non résolu vers un lieu: ${href}`);
      const actsBlock = inner.match(/<div class="stop-acts">([\s\S]*?)<\/div>/);
      const activites = actsBlock ? [...actsBlock[1].matchAll(
        /<a class="stop-act (stop-act--paid|stop-act--free)" href="(.*?)" target="_blank" rel="noopener">(.*?)<\/a>/g
      )].map(([, cls, url, label]) => ({ label, cls, ...(resolveActivite(url, `${slug} stop-act`) || { url }) })) : [];
      items.push({ type: 'stop', heure, lieuSlug: lieu?.slug, nom, commune, desc, activites });
    }
  }

  const bookingBlock = m(/<section class="itin-booking">(.*?)<\/section>/s, '');
  const booking = [...bookingBlock.matchAll(
    /<div class="itin-booking-card">\s*<div class="itin-booking-img">\s*<img src="(.*?)" alt="(.*?)"[^>]*>\s*<\/div>\s*<div class="itin-booking-body">\s*<span class="itin-booking-lieu">(.*?)<\/span>\s*<span class="itin-booking-name">(.*?)<\/span>\s*<div class="itin-booking-meta">([\s\S]*?)<\/div>\s*<a class="itin-booking-link" href="(.*?)"[^>]*>(.*?)<\/a>\s*<\/div>\s*<\/div>/gs
  )].map(([, img, alt, lieuLabel, nomLabel, metaBlock, url, linkText]) => {
    const spans = [...metaBlock.matchAll(/<span>(.*?)<\/span>/gs)].map(([, s]) => s);
    const duree = spans[0]?.replace(/^⏱ /, '');
    const prix = spans[1]?.replace(/^💶 /, '');
    const extraSpans = spans.slice(2);
    const resolved = resolveActivite(url, `${slug} booking`);
    const base = { lieuLabel, nomLabel, linkText, extraSpans };
    return resolved ? { ...base, ...resolved } : { ...base, img, alt, duree, prix, url };
  });

  const suggestBlock = m(/<section class="itin-suggest">(.*?)<\/section>/s, '');
  const suggestions = [...suggestBlock.matchAll(
    /<a class="itin-suggest-card" href="(.*?)">\s*<div class="itin-suggest-img">\s*<img src="(.*?)" alt="(.*?)"[^>]*>\s*<\/div>\s*<div class="itin-suggest-body">\s*<span class="itin-suggest-badge">(.*?)<\/span>\s*<h3>(.*?)<\/h3>\s*<\/div>\s*<\/a>/gs
  )].map(([, href, img, alt, badge, titre]) => ({ href, img, alt, badge, titre }));

  return { slug, titre, description, badge, heroImgTag, metaPills, intro, strip, mapLabel, items, booking, suggestions };
}

const files = readdirSync(ITIN_DIR).filter(f => f.endsWith('.html')).sort();
const itineraires = files.map(f => {
  const slug = basename(f, '.html');
  console.log(`extraction ${slug}`);
  const html = readFileSync(join(ITIN_DIR, f), 'utf8');
  return extractOne(html, slug);
});

writeFileSync(OUT, JSON.stringify(itineraires, null, 2) + '\n');
console.log(`${itineraires.length} itinéraires extraits -> ${OUT}`);
