// Logique pure (pas de DOM) du créateur d'itinéraire à la volée : lecture de
// data/lieux.json, estimation de durées/trajets, algorithme de génération jour par jour,
// et persistance en localStorage. Partagé par itineraire-builder.js (page de création) et
// itineraire-liste.js (page "Mes itinéraires").
//
// Principe repris du reste du site : un itinéraire sauvegardé ne stocke jamais le nom,
// l'image, les coordonnées ou la durée d'un lieu — seulement son `slug`. Tout le reste est
// relu dans data/lieux.json au moment de l'affichage (cf. data/itineraires.json).
window.ItinData = (function () {
  const STORAGE_KEY = 'riviera-secrete:itineraires-custom';

  const DUREE_META = {
    'demi-journee': { label: 'Demi-journée', dayBudgets: [240] },
    'journee': { label: 'Journée', dayBudgets: [480] },
    '2-jours': { label: '2 jours', dayBudgets: [480, 480] },
    '3-jours': { label: '3 jours', dayBudgets: [480, 480, 480] },
  };

  // Mirroir de BADGE_DEFS dans scripts/render/lieu.mjs — à garder synchronisé si le
  // vocabulaire de badges change (pas de bundler pour partager le module Node ESM ici).
  const BADGE_DEFS = {
    plage: { icon: '🏖️', label: 'Plage' },
    randonnee: { icon: '🥾', label: 'Randonnée' },
    vtt: { icon: '🚵', label: 'VTT' },
    plongee: { icon: '🤿', label: 'Plongée' },
    restaurant: { icon: '🍽️', label: 'Restaurant' },
  };

  function fetchLieux() {
    return fetch('data/lieux.json').then((r) => r.json());
  }

  // Extrait une estimation en minutes depuis la pill "⏱️ Durée" d'un lieu (ex. "1 h 30 à 2 h
  // aller-retour", "15-20 min", "2 à 3 h avec la fondation Maeght", "Demi-journée par île").
  // Moyenne les bornes trouvées ; repli à 90 min si rien n'est reconnu.
  function parseVisitMinutes(lieu) {
    const pill = (lieu.metaPills || []).find((p) => /urée/.test(p.label));
    const val = pill ? pill.valeur || '' : '';
    if (/journée/i.test(val)) return /demi/i.test(val) ? 240 : 480;
    const nums = [];
    const re = /(\d+)\s*h(?:\s*(\d+))?|(\d+)\s*min/gi;
    let m;
    while ((m = re.exec(val))) {
      nums.push(m[3] ? parseInt(m[3], 10) : parseInt(m[1], 10) * 60 + (m[2] ? parseInt(m[2], 10) : 0));
    }
    if (!nums.length) return 90;
    return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
  }

  function haversineKm(a, b) {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  // Estimation grossière (pas un vrai calcul d'itinéraire routier) : vitesse moyenne 35
  // km/h sur ces routes sinueuses côtières/montagneuses + 10 min forfaitaires de
  // stationnement/orientation à chaque arrêt.
  function travelMinutes(a, b) {
    return Math.round((haversineKm(a, b) / 35) * 60 + 10);
  }

  function numDays(dureeKey) {
    return (DUREE_META[dureeKey] || DUREE_META.journee).dayBudgets.length;
  }

  function dayBudgetMinutes(dureeKey, dayIndex) {
    const meta = DUREE_META[dureeKey] || DUREE_META.journee;
    return meta.dayBudgets[dayIndex] ?? meta.dayBudgets[meta.dayBudgets.length - 1];
  }

  // Construction gloutonne jour par jour : part du candidat le plus à l'est (cohérent avec
  // l'ordre Menton → Saint-Tropez déjà utilisé ailleurs sur le site), puis choisit à chaque
  // étape le candidat non visité le plus proche qui tient encore dans le budget du jour
  // (temps de trajet + temps de visite estimés). Le tout premier arrêt d'un jour est
  // toujours accepté même s'il dépasse seul le budget, pour ne jamais laisser un jour vide
  // tant qu'il reste des candidats. Retourne aussi les lieux exclus faute de temps.
  function generateItineraire(candidates, dureeKey) {
    if (!candidates.length) return { days: [], excluded: [] };
    const pool = candidates.slice();
    const days = [];
    let currentPos = pool.reduce((a, b) => (b.lng > a.lng ? b : a));

    for (let d = 0; d < numDays(dureeKey) && pool.length; d++) {
      let budget = dayBudgetMinutes(dureeKey, d);
      const day = [];
      while (pool.length) {
        let best = null;
        let bestCost = Infinity;
        for (const cand of pool) {
          const cost = travelMinutes(currentPos, cand) + parseVisitMinutes(cand);
          if (cost < bestCost) {
            bestCost = cost;
            best = cand;
          }
        }
        if (bestCost > budget && day.length > 0) break;
        pool.splice(pool.indexOf(best), 1);
        day.push(best);
        budget -= bestCost;
        currentPos = best;
      }
      days.push(day);
    }
    return { days, excluded: pool };
  }

  function buildMapLinks(lat, lng, nom) {
    const coords = `${lat},${lng}`;
    return [
      { label: 'Google Maps', icon: '🗺️', url: `https://www.google.com/maps/search/?api=1&query=${coords}` },
      { label: 'Waze', icon: '🚗', url: `https://waze.com/ul?ll=${coords}&navigate=yes` },
      { label: 'Plans', icon: '📍', url: `https://maps.apple.com/?ll=${coords}&q=${encodeURIComponent(nom)}` },
    ];
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function listSaved() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function getSaved(id) {
    return listSaved().find((it) => it.id === id) || null;
  }

  // `days` : tableau de tableaux d'objets lieu (hydratés) — converti en slugs avant stockage.
  function saveItineraire({ id, nom, dureeKey, days }) {
    const all = listSaved();
    const daySlugs = days.map((day) => day.map((l) => l.slug));
    const idx = id ? all.findIndex((it) => it.id === id) : -1;
    const finalId = id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
    const entry = {
      id: finalId,
      nom,
      dureeKey,
      days: daySlugs,
      createdAt: idx >= 0 ? all[idx].createdAt : new Date().toISOString(),
    };
    if (idx >= 0) all[idx] = entry;
    else all.push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return finalId;
  }

  function deleteSaved(id) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(listSaved().filter((it) => it.id !== id)));
  }

  return {
    DUREE_META,
    BADGE_DEFS,
    fetchLieux,
    parseVisitMinutes,
    haversineKm,
    travelMinutes,
    generateItineraire,
    buildMapLinks,
    escapeHtml,
    listSaved,
    getSaved,
    saveItineraire,
    deleteSaved,
  };
})();
