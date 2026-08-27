// One-time extraction: parses lieux/*.html (hand-authored) into data/lieux.json,
// so lieu + activité facts have a single source of truth.
// Safe to re-run, but data/lieux.json becomes the source of truth once build.mjs exists —
// re-running this after hand-editing lieux/*.html would overwrite JSON edits.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const LIEUX_DIR = join(import.meta.dirname, '..', 'lieux');
const OUT = join(import.meta.dirname, '..', 'data', 'lieux.json');

function slugify(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractOne(html, slug) {
  const m = (re, fallback = null) => {
    const r = html.match(re);
    return r ? r[1] : fallback;
  };

  const nom = m(/<h1>(.*?)<\/h1>/s);
  const commune = m(/<span class="card-region">(.*?)<\/span>\s*<h1>/s);
  const [, regionSlug, regionLabel] = html.match(/<li><a href="\.\.\/index\.html#([\w-]+)">(.*?)<\/a><\/li>\s*<li>/s) || [];
  const description = m(/<meta name="description" content="(.*?)">/s);
  const lat = parseFloat(m(/"latitude":\s*([\d.]+)/s));
  const lng = parseFloat(m(/"longitude":\s*([\d.]+)/s));
  const ogImage = m(/<meta property="og:image" content="(.*?)">/s);

  const [, heroSrc, heroAlt, , heroSlides] = html.match(/<div class="detail-hero">\s*<img src="(.*?)" alt="(.*?)" loading="eager"( data-slides="(\d+)")?>/s) || [];

  const metaPills = [...html.matchAll(/<span class="meta-pill">(.*?)<strong>(.*?)<\/strong><\/span>/gs)]
    .map(([, label, valeur]) => ({ label: label.trim(), valeur }));

  const [, para1, para2] = html.match(/<div class="article-body">\s*<p>(.*?)<\/p>\s*<p>(.*?)<\/p>\s*<\/div>/s) || [];

  const tips = [...html.matchAll(/<li><strong>(.*?)<\/strong>(.*?)<\/li>/gs)]
    .map(([, label, texte]) => ({ label, texte }));

  const activitiesBlock = m(/<section class="activities">(.*?)<\/section>/s, '');
  const activites = [...activitiesBlock.matchAll(
    /<div class="activity-card">\s*<div class="activity-thumb">\s*<img src="(.*?)" alt="(.*?)"[^>]*>\s*<\/div>\s*<div class="activity-content">\s*<div class="activity-header">\s*<span class="activity-name">(.*?)<\/span>\s*<span class="activity-badge (gratuit|payant)">.*?<\/span>\s*<\/div>\s*<div class="activity-meta">\s*<span>⏱ (.*?)<\/span>\s*<span>💶 (.*?)<\/span>\s*<\/div>\s*<a class="activity-link( free)?" href="(.*?)"[^>]*>(.*?)<\/a>/gs
  )].map(([, image, alt, nom, badge, duree, prix, , url, linkText]) => ({
    id: slugify(nom),
    nom, badge, duree, prix, url, image, alt, linkText,
  }));

  const relatedBlock = m(/<section class="related">(.*?)<\/section>/s, '');
  const related = [...relatedBlock.matchAll(
    /<a class="card" href="(.*?)">\s*<div class="card-media">\s*<img src="(.*?)" alt="(.*?)"[^>]*>\s*<span class="stamp">(.*?)<\/span>\s*<\/div>\s*<div class="card-body">\s*<span class="card-region">(.*?)<\/span>\s*<h3>(.*?)<\/h3>\s*<p>(.*?)<\/p>\s*<\/div>\s*<\/a>/gs
  )].map(([, href, img, alt, stamp, region, titre, blurb]) => ({ href, img, alt, stamp, region, titre, blurb }));

  return {
    slug, nom, commune, regionSlug, regionLabel,
    lat, lng, description, ogImage,
    heroImage: heroSrc, heroAlt, heroSlides: heroSlides ? parseInt(heroSlides, 10) : null,
    metaPills,
    description1: para1, description2: para2,
    tips,
    activites,
    related,
  };
}

const files = readdirSync(LIEUX_DIR).filter(f => f.endsWith('.html')).sort();
const lieux = files.map(f => {
  const slug = basename(f, '.html');
  const html = readFileSync(join(LIEUX_DIR, f), 'utf8');
  const data = extractOne(html, slug);
  const OPTIONAL = new Set(['heroSlides']);
  const missing = Object.entries(data).filter(([k, v]) => !OPTIONAL.has(k) && (v === null || v === undefined || (Array.isArray(v) && v.length === 0 && k !== 'related')));
  if (missing.length) console.warn(`[${slug}] champs manquants:`, missing.map(([k]) => k).join(', '));
  return data;
});

writeFileSync(OUT, JSON.stringify(lieux, null, 2) + '\n');
console.log(`${lieux.length} lieux extraits -> ${OUT}`);
