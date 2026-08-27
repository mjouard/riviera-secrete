// Computes the SPOTS_MAP_HOME dataset embedded in index.html's homepage map, straight
// from data/lieux.json — no separate hand-typed copy of name/commune/lat/lng/intro/thumb.
const REGION_COLORS = {
  'menton-monaco': '#E8A33D',
  'nice': '#4FC3C9',
  'arriere-pays': '#8FBF6B',
  'antibes-cannes': '#E88B4F',
  'golfe-st-tropez': '#C97FA0',
};

function truncate(str, len) {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export function buildSpotsMapHome(lieux) {
  return lieux.map(l => ({
    name: l.nom,
    commune: l.commune,
    lat: l.lat,
    lng: l.lng,
    region: l.regionSlug,
    color: REGION_COLORS[l.regionSlug],
    url: `lieux/${l.slug}.html`,
    img: l.thumbImage,
    intro: truncate(l.description, 100),
  }));
}
