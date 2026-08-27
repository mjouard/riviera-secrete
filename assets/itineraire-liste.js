// Contrôleur de mes-itineraires.html : liste les itinéraires sauvegardés en localStorage
// (assets/itineraire-data.js), avec suppression et lien vers la vue détaillée.
document.addEventListener('DOMContentLoaded', () => {
  const D = window.ItinData;
  const grid = document.getElementById('mes-itineraires-grid');
  const empty = document.getElementById('mes-itineraires-empty');

  function render() {
    const all = D.listSaved().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (!all.length) {
      grid.hidden = true;
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    grid.hidden = false;
    grid.innerHTML = all
      .map((it) => {
        const nbLieux = it.days.reduce((n, day) => n + day.length, 0);
        const dureeLabel = (D.DUREE_META[it.dureeKey] || {}).label || it.dureeKey;
        const date = new Date(it.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        return `<div class="mes-itin-card">
          <div class="mes-itin-body">
            <h3>${D.escapeHtml(it.nom)}</h3>
            <div class="mes-itin-meta mono">
              <span>${dureeLabel}</span>
              <span>📍 ${nbLieux} lieu${nbLieux > 1 ? 'x' : ''}</span>
              <span>${date}</span>
            </div>
          </div>
          <div class="mes-itin-actions">
            <a class="btn-secondary" href="creer-itineraire.html?id=${encodeURIComponent(it.id)}">Voir</a>
            <button class="mes-itin-delete" data-id="${it.id}" aria-label="Supprimer ${D.escapeHtml(it.nom)}">Supprimer</button>
          </div>
        </div>`;
      })
      .join('\n');

    grid.querySelectorAll('.mes-itin-delete').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (confirm('Supprimer cet itinéraire ?')) {
          D.deleteSaved(btn.dataset.id);
          render();
        }
      });
    });
  }

  render();
});
