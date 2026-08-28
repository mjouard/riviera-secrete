// Computes the SPOTS_MAP_HOME dataset embedded in index.html's homepage map, straight
// from data/villes.json — no separate hand-typed copy of name/commune/lat/lng/intro/thumb.
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

export function buildSpotsMapHome(villes) {
  return villes.map(v => ({
    name: v.nom,
    commune: v.nom,
    lat: v.lat,
    lng: v.lng,
    region: v.regionSlug,
    color: REGION_COLORS[v.regionSlug],
    url: `villes/${v.slug}.html`,
    img: v.thumbImage,
    intro: truncate(v.description, 100),
  }));
}
