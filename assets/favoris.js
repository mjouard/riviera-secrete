var Favoris = (function() {
  var KEY = 'riviera-secrete:favoris';

  function getAll() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch(e) { return []; }
  }

  function saveAll(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  function isFavori(lieuSlug, activiteId) {
    var list = getAll();
    for (var i = 0; i < list.length; i++) {
      if (list[i].lieuSlug === lieuSlug && list[i].activiteId === activiteId) return true;
    }
    return false;
  }

  function toggleFavori(lieuSlug, activiteId) {
    var list = getAll();
    var idx = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].lieuSlug === lieuSlug && list[i].activiteId === activiteId) { idx = i; break; }
    }
    if (idx === -1) {
      list.push({ lieuSlug: lieuSlug, activiteId: activiteId });
    } else {
      list.splice(idx, 1);
    }
    saveAll(list);
    return idx === -1;
  }

  function getCount() { return getAll().length; }

  return { getAll: getAll, isFavori: isFavori, toggleFavori: toggleFavori, getCount: getCount };
})();
