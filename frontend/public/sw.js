/**
 * Service worker de Riviera Secrète — écrit à la main, volontairement.
 *
 * Pourquoi pas Serwist / next-pwa : l'apport principal de ces outils est de générer un
 * manifeste de précache au build. Or la stratégie ici est l'inverse — on cache **à
 * l'usage, jamais par anticipation** : les images du site pèsent 58 Mo (dont 37 Mo rien
 * qu'en vignettes d'activités), précacher serait hostile sur un forfait mobile. Sans
 * besoin de précache, ces outils n'apportaient que leur incompatibilité avec Turbopack
 * (que Next 16 utilise par défaut au build). Ce fichier est donc statique : aucune étape
 * de build, aucune dépendance, compatible quel que soit le bundler.
 *
 * Scénario visé : on prépare sa sortie au wifi, on part ensuite sans réseau. Ce qu'on a
 * consulté reste consultable.
 *
 * ⚠️ Bump CACHE_VERSION à chaque modification de ce fichier : c'est ce qui déclenche la
 * purge des anciens caches dans `activate`.
 */
const CACHE_VERSION = "v3";
const PAGES_CACHE = `rs-pages-${CACHE_VERSION}`;
const IMAGES_CACHE = `rs-images-${CACHE_VERSION}`;
const TILES_CACHE = `rs-map-tiles-${CACHE_VERSION}`;
const STATIC_CACHE = `rs-static-${CACHE_VERSION}`;
const OFFLINE_URL = "/hors-ligne.html";

/** Plafonds LRU — empêchent le cache de gonfler indéfiniment sur le téléphone. */
const LIMITS = {
  [PAGES_CACHE]: 80,
  [IMAGES_CACHE]: 120,
  [TILES_CACHE]: 250,
  [STATIC_CACHE]: 120,
};

const CURRENT_CACHES = [PAGES_CACHE, IMAGES_CACHE, TILES_CACHE, STATIC_CACHE];

/**
 * Éviction FIFO approximative : les entrées d'un Cache sont ordonnées par insertion, on
 * supprime les plus anciennes au-delà du plafond. Volontairement lancé sans await par les
 * handlers pour ne pas retarder la réponse.
 */
async function trimCache(cacheName) {
  const limit = LIMITS[cacheName];
  if (!limit) return;
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= limit) return;
  await Promise.all(keys.slice(0, keys.length - limit).map((k) => cache.delete(k)));
}

/** Réponses propres à un utilisateur (Bearer token) ou d'auth : jamais mises en cache. */
function isPrivatePath(pathname) {
  return (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/favorites") ||
    pathname.startsWith("/api/my-itineraires")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((n) => n.startsWith("rs-") && !CURRENT_CACHES.includes(n))
            .map((n) => caches.delete(n))
        )
      )
      .then(() => self.clients.claim())
  );
});

/**
 * Cherche une page en cache en tolérant le préfixe de locale.
 *
 * Nécessaire parce que le proxy next-intl redirige les URL non préfixées : une visite à
 * /lieux/eze-village renvoie un 307 vers /en/lieux/eze-village, et c'est cette dernière
 * qui finit en cache (un 307 n'étant pas `ok`, il n'est jamais mis en cache). Hors ligne,
 * la navigation redemande l'URL non préfixée — sans cette tolérance, une page pourtant
 * déjà consultée tomberait sur la page « pas de réseau ».
 */
async function matchPageIgnoringLocale(request) {
  const exact = await caches.match(request);
  if (exact) return exact;

  const { pathname, search, origin } = new URL(request.url);
  const bare = pathname.replace(/^\/(fr|en)(?=\/|$)/, "") || "/";
  const candidates = [bare, `/fr${bare === "/" ? "" : bare}`, `/en${bare === "/" ? "" : bare}`];

  for (const candidate of candidates) {
    const hit = await caches.match(`${origin}${candidate}${search}`);
    if (hit) return hit;
  }
  return undefined;
}

/** Réseau d'abord, cache en secours. Pour le contenu qui évolue (pages, API publique). */
async function networkFirst(request, cacheName) {
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, fresh.clone());
      trimCache(cacheName);
    }
    return fresh;
  } catch {
    const isNavigation = request.mode === "navigate";
    const cached = isNavigation
      ? await matchPageIgnoringLocale(request)
      : await caches.match(request);
    if (cached) return cached;
    if (isNavigation) {
      const offline = await caches.match(OFFLINE_URL);
      if (offline) return offline;
    }
    throw new Error("offline and not cached");
  }
}

/** Cache d'abord. Pour l'immuable (assets hashés) et le lourd (images, tuiles). */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const fresh = await fetch(request);
  if (fresh && (fresh.ok || fresh.type === "opaque")) {
    const cache = await caches.open(cacheName);
    cache.put(request, fresh.clone());
    trimCache(cacheName);
  }
  return fresh;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Tuiles OpenStreetMap : uniquement celles réellement affichées pendant la navigation.
  // La Tile Usage Policy d'OSM interdit le téléchargement en masse — donc pas de
  // préchargement de zone, et un plafond bas.
  if (/(^|\.)tile\.openstreetmap\.org$/.test(url.hostname)) {
    event.respondWith(cacheFirst(request, TILES_CACHE));
    return;
  }

  // Hors de notre origine (analytics, CDN de polices…) : on laisse passer sans toucher.
  if (url.origin !== self.location.origin) return;

  if (isPrivatePath(url.pathname)) return;

  // Assets de build Next : URL hashées donc immuables, cache d'abord sans risque de péremption.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (request.destination === "image" && url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirst(request, IMAGES_CACHE));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGES_CACHE));
    return;
  }

  // Lectures publiques de l'API (lieux/villes/itinéraires) faites côté client.
  if (/\/api\/(lieux|villes|itineraires)/.test(url.pathname)) {
    event.respondWith(networkFirst(request, PAGES_CACHE));
  }
});
