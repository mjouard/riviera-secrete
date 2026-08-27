// Contrôleur de creer-itineraire.html : rend le picker zones/lieux, lance l'algorithme de
// génération (assets/itineraire-data.js), affiche le résultat jour par jour avec
// glisser-déposer et carte Leaflet, et sauvegarde en localStorage sur action explicite.
document.addEventListener('DOMContentLoaded', () => {
  const D = window.ItinData;
  const REGION_ORDER = ['menton-monaco', 'nice', 'arriere-pays', 'antibes-cannes', 'golfe-st-tropez'];

  const pickerSection = document.getElementById('picker');
  const resultsSection = document.getElementById('results');
  const zonesEl = document.getElementById('builder-zones');
  const btnGenerate = document.getElementById('btn-generate');
  const btnBack = document.getElementById('btn-back-picker');
  const emptyNote = document.getElementById('picker-empty-note');
  const excludedNote = document.getElementById('excluded-note');
  const daysEl = document.getElementById('builder-days');
  const btnSave = document.getElementById('btn-save');
  const saveModal = document.getElementById('save-modal');
  const saveInput = document.getElementById('save-name-input');
  const saveConfirmBtn = document.getElementById('save-confirm');
  const saveCancelBtn = document.getElementById('save-cancel');
  const saveBanner = document.getElementById('save-banner');

  let lieuBySlug = new Map();
  let currentDays = [];
  let currentDureeKey = 'journee';
  let currentId = null;
  let currentNom = '';
  let leafletMap = null;
  let mapLayerGroup = null;

  D.fetchLieux()
    .then((lieux) => {
      lieuBySlug = new Map(lieux.map((l) => [l.slug, l]));
      renderPicker(lieux);

      const params = new URLSearchParams(location.search);
      const loadId = params.get('id');
      if (loadId) {
        const saved = D.getSaved(loadId);
        if (saved) {
          currentId = saved.id;
          currentNom = saved.nom;
          currentDureeKey = saved.dureeKey;
          currentDays = saved.days.map((day) => day.map((slug) => lieuBySlug.get(slug)).filter(Boolean));
          precheckPicker(saved.days.flat());
          const radio = document.querySelector(`input[name="duree"][value="${currentDureeKey}"]`);
          if (radio) radio.checked = true;
          showResults();
        }
      }
    })
    .catch((err) => {
      console.error('Échec du chargement de data/lieux.json', err);
      zonesEl.innerHTML =
        '<p class="builder-load-error">Impossible de charger la liste des lieux. Si tu as ouvert ce fichier directement (chemin en <code>file://</code>), passe par le site en ligne ou lance un petit serveur local (<code>python3 -m http.server</code> depuis le dossier du site) — les navigateurs bloquent le chargement de données JSON en ouvrant un fichier HTML directement.</p>';
      btnGenerate.disabled = true;
    });

  function renderPicker(lieux) {
    const byRegion = new Map();
    lieux.forEach((l) => {
      if (!byRegion.has(l.regionSlug)) byRegion.set(l.regionSlug, []);
      byRegion.get(l.regionSlug).push(l);
    });

    zonesEl.innerHTML = REGION_ORDER.filter((r) => byRegion.has(r))
      .map((regionSlug) => {
        const regionLieux = byRegion.get(regionSlug);
        const regionLabel = regionLieux[0].regionLabel;
        const lieuxHtml = regionLieux
          .map(
            (l) => `<label class="builder-lieu-check">
            <input type="checkbox" class="lieu-checkbox" data-slug="${l.slug}" data-region="${regionSlug}">
            <span>${l.nom}</span>
          </label>`
          )
          .join('\n');
        return `<details class="builder-zone" data-region="${regionSlug}">
          <summary>
            <span class="builder-zone-check-wrap">
              <input type="checkbox" class="zone-checkbox" data-region="${regionSlug}" aria-label="Sélectionner toute la zone ${regionLabel}">
              <span>${regionLabel}</span>
            </span>
            <span class="builder-zone-meta"><span class="builder-zone-count">${regionLieux.length} lieux</span><span class="builder-zone-icon">Affiner ▾</span></span>
          </summary>
          <div class="builder-zone-lieux">
            ${lieuxHtml}
          </div>
        </details>`;
      })
      .join('\n');

    // Empêche le clic sur la case zone de (dé)plier le <details>.
    zonesEl.querySelectorAll('.zone-checkbox').forEach((cb) => {
      cb.addEventListener('click', (e) => e.stopPropagation());
      cb.addEventListener('change', () => {
        const region = cb.dataset.region;
        zonesEl
          .querySelectorAll(`.lieu-checkbox[data-region="${region}"]`)
          .forEach((lcb) => (lcb.checked = cb.checked));
      });
    });
    zonesEl.querySelectorAll('.lieu-checkbox').forEach((cb) => {
      cb.addEventListener('click', (e) => e.stopPropagation());
      cb.addEventListener('change', () => syncZoneCheckbox(cb.dataset.region));
    });
  }

  function syncZoneCheckbox(region) {
    const lieuCbs = Array.from(zonesEl.querySelectorAll(`.lieu-checkbox[data-region="${region}"]`));
    const zoneCb = zonesEl.querySelector(`.zone-checkbox[data-region="${region}"]`);
    const checkedCount = lieuCbs.filter((cb) => cb.checked).length;
    zoneCb.checked = checkedCount === lieuCbs.length;
    zoneCb.indeterminate = checkedCount > 0 && checkedCount < lieuCbs.length;
  }

  function precheckPicker(slugs) {
    const set = new Set(slugs);
    zonesEl.querySelectorAll('.lieu-checkbox').forEach((cb) => {
      cb.checked = set.has(cb.dataset.slug);
    });
    REGION_ORDER.forEach(syncZoneCheckbox);
  }

  btnGenerate.addEventListener('click', () => {
    const dureeKey = document.querySelector('input[name="duree"]:checked').value;
    const slugs = Array.from(zonesEl.querySelectorAll('.lieu-checkbox:checked')).map((cb) => cb.dataset.slug);
    if (!slugs.length) {
      emptyNote.hidden = false;
      return;
    }
    emptyNote.hidden = true;
    currentDureeKey = dureeKey;
    currentId = null;
    currentNom = '';
    const candidates = slugs.map((s) => lieuBySlug.get(s)).filter(Boolean);
    const result = D.generateItineraire(candidates, dureeKey);
    currentDays = result.days;
    renderExcluded(result.excluded);
    showResults();
  });

  btnBack.addEventListener('click', () => {
    resultsSection.hidden = true;
    pickerSection.hidden = false;
    saveBanner.hidden = true;
  });

  function renderExcluded(excluded) {
    if (!excluded.length) {
      excludedNote.hidden = true;
      return;
    }
    excludedNote.hidden = false;
    excludedNote.textContent = `${excluded.length} lieu${excluded.length > 1 ? 'x' : ''} non inclus faute de temps : ${excluded.map((l) => l.nom).join(', ')}.`;
  }

  function showResults() {
    pickerSection.hidden = true;
    resultsSection.hidden = false;
    saveBanner.hidden = true;
    renderDays();
  }

  function renderDays() {
    daysEl.innerHTML = currentDays
      .map((day, dayIndex) => {
        const stopsHtml = day.length
          ? day.map((l) => renderStopCard(l, dayIndex)).join('\n')
          : '';
        return `<div class="builder-day">
          <h3>Jour ${dayIndex + 1} <span class="builder-day-count mono">${day.length} lieu${day.length > 1 ? 'x' : ''}</span></h3>
          <ul class="builder-day-stops" data-day-index="${dayIndex}">${stopsHtml}</ul>
          <p class="builder-day-empty" ${day.length ? 'hidden' : ''}>Glisse un lieu ici.</p>
        </div>`;
      })
      .join('\n');

    wireDragAndDrop();
    daysEl.querySelectorAll('.builder-stop-remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        btn.closest('.builder-stop-card').remove();
        syncFromDom();
      });
    });
    updateMap();
  }

  function renderStopCard(l, dayIndex) {
    const badgePills = (l.badges || [])
      .map((id) => {
        const def = D.BADGE_DEFS[id];
        return def ? `<span class="lieu-badge">${def.icon} ${def.label}</span>` : '';
      })
      .join('');
    const badgesHtml = badgePills ? `<div class="lieu-badges">${badgePills}</div>` : '';
    const mapLinksHtml = D.buildMapLinks(l.lat, l.lng, l.nom)
      .map((link) => `<a class="map-link" href="${link.url}" target="_blank" rel="noopener">${link.icon} ${link.label}</a>`)
      .join('');
    const minutes = D.parseVisitMinutes(l);
    const dureeLabel = minutes >= 60 ? `~${(minutes / 60).toFixed(minutes % 60 ? 1 : 0)} h` : `~${minutes} min`;
    return `<li class="builder-stop-card" draggable="true" data-slug="${l.slug}" data-day-index="${dayIndex}">
      <div class="builder-stop-drag" aria-hidden="true">⠿</div>
      <div class="builder-stop-media"><img src="${l.thumbImage}" alt="" loading="lazy"></div>
      <div class="builder-stop-body">
        <a class="builder-stop-name" href="lieux/${l.slug}.html" target="_blank" rel="noopener">${l.nom}</a>
        <span class="builder-stop-commune mono">${l.commune}</span>
        ${badgesHtml}
        <span class="builder-stop-duree mono">⏱ ${dureeLabel}</span>
        <div class="map-links">${mapLinksHtml}</div>
      </div>
      <button class="builder-stop-remove" aria-label="Retirer ${l.nom}" title="Retirer">✕</button>
    </li>`;
  }

  function wireDragAndDrop() {
    daysEl.querySelectorAll('.builder-stop-card').forEach((card) => {
      card.addEventListener('dragstart', () => card.classList.add('dragging'));
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        syncFromDom();
      });
    });
    daysEl.querySelectorAll('.builder-day-stops').forEach((ul) => {
      ul.addEventListener('dragover', (e) => {
        e.preventDefault();
        const dragging = daysEl.querySelector('.dragging');
        if (!dragging) return;
        const after = getDragAfterElement(ul, e.clientY);
        if (after == null) ul.appendChild(dragging);
        else ul.insertBefore(dragging, after);
      });
    });
  }

  function getDragAfterElement(container, y) {
    const items = Array.from(container.querySelectorAll('.builder-stop-card:not(.dragging)'));
    return items.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset, element: child };
        return closest;
      },
      { offset: -Infinity, element: null }
    ).element;
  }

  function syncFromDom() {
    currentDays = Array.from(daysEl.querySelectorAll('.builder-day-stops')).map((ul) =>
      Array.from(ul.querySelectorAll('.builder-stop-card'))
        .map((card) => lieuBySlug.get(card.dataset.slug))
        .filter(Boolean)
    );
    daysEl.querySelectorAll('.builder-day').forEach((dayEl, i) => {
      const count = currentDays[i].length;
      dayEl.querySelector('.builder-day-count').textContent = `${count} lieu${count > 1 ? 'x' : ''}`;
      dayEl.querySelector('.builder-day-empty').hidden = count > 0;
    });
    updateMap();
  }

  function ensureMap() {
    if (leafletMap) return;
    leafletMap = L.map('builder-map', { scrollWheelZoom: false, zoomControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(leafletMap);
    L.control.zoom({ position: 'bottomright' }).addTo(leafletMap);
    mapLayerGroup = L.layerGroup().addTo(leafletMap);
    leafletMap.on('focus', () => leafletMap.scrollWheelZoom.enable());
    leafletMap.on('blur', () => leafletMap.scrollWheelZoom.disable());
  }

  function updateMap() {
    ensureMap();
    mapLayerGroup.clearLayers();
    const allStops = currentDays.flat();
    if (!allStops.length) return;
    const latlngs = allStops.map((l) => [l.lat, l.lng]);
    L.polyline(latlngs, { color: '#E8A33D', weight: 2, opacity: 0.7, dashArray: '4 6' }).addTo(mapLayerGroup);
    allStops.forEach((l, i) => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:22px;height:22px;border-radius:50%;background:#E8A33D;color:#0C1116;border:2px solid #0C1116;box-shadow:0 1px 4px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;">${i + 1}</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      L.marker([l.lat, l.lng], { icon }).bindPopup(`<span class="popup-name">${i + 1}. ${D.escapeHtml(l.nom)}</span>`).addTo(mapLayerGroup);
    });
    leafletMap.invalidateSize();
    leafletMap.fitBounds(L.latLngBounds(latlngs), { padding: [24, 24] });
  }

  btnSave.addEventListener('click', () => {
    saveInput.value = currentNom;
    saveModal.hidden = false;
    saveInput.focus();
  });
  saveCancelBtn.addEventListener('click', () => (saveModal.hidden = true));
  saveModal.addEventListener('click', (e) => {
    if (e.target === saveModal) saveModal.hidden = true;
  });
  saveConfirmBtn.addEventListener('click', () => {
    const nom = saveInput.value.trim();
    if (!nom) {
      saveInput.focus();
      return;
    }
    currentNom = nom;
    currentId = D.saveItineraire({ id: currentId, nom, dureeKey: currentDureeKey, days: currentDays });
    saveModal.hidden = true;
    history.replaceState(null, '', `creer-itineraire.html?id=${encodeURIComponent(currentId)}`);
    saveBanner.hidden = false;
  });
});
