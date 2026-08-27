# Ajouter des activités à une page lieu

Ajoute une section "Activités" à une page lieu de Riviera Secrète, juste avant la section `<section class="related">`.

## Ce que tu dois recevoir de l'utilisateur

- Le fichier cible (ex: `lieux/eze-village.html`)
- La liste des activités, chacune avec :
  - Nom de l'activité
  - Type : `gratuit` ou `payant`
  - Durée (ex: "45 min – 1 h 15")
  - Prix (ex: "8 – 10 € / adulte" ou "Accès libre")
  - URL de réservation ou d'information
  - Seed picsum pour la photo (ex: `jardin-eze`) — inventer un seed descriptif si non fourni

Si des infos manquent, demande-les avant de coder.

## CSS déjà disponible dans `assets/style.css`

Toutes les classes sont définies, ne pas les réécrire :
`.activities`, `.activities h2`, `.activities-grid`, `.activity-card`, `.activity-thumb`, `.activity-content`, `.activity-header`, `.activity-name`, `.activity-badge`, `.activity-badge.gratuit`, `.activity-badge.payant`, `.activity-meta`, `.activity-link`, `.activity-link.free`

## Structure HTML à insérer

Trouver le lieu dans le fichier pour le titre de la section (ex: "Activités à Èze").
Insérer **avant** `<section class="related">` :

```html
<section class="activities">
  <div class="wrap">
    <h2>Activités à [NOM_DU_LIEU]</h2>
    <div class="activities-grid">

      <!-- Répéter ce bloc pour chaque activité -->
      <div class="activity-card">
        <div class="activity-thumb">
          <img src="https://picsum.photos/seed/[SEED]/200/200" alt="[ALT]" loading="lazy">
        </div>
        <div class="activity-content">
          <div class="activity-header">
            <span class="activity-name">[NOM]</span>
            <span class="activity-badge [gratuit|payant]">[Gratuit|Payant]</span>
          </div>
          <div class="activity-meta">
            <span>⏱ [DURÉE]</span>
            <span>💶 [PRIX]</span>
          </div>
          <a class="activity-link [free si gratuit]" href="[URL]" target="_blank" rel="noopener">[Réserver →|En savoir plus →]</a>
        </div>
      </div>

    </div>
  </div>
</section>
```

## Règles

- Badge `gratuit` → classe CSS `gratuit` + lien avec classe `free` + texte "En savoir plus →"
- Badge `payant` → classe CSS `payant` + lien sans classe `free` + texte "Réserver →"
- Si le prix est "Accès libre" ou "Gratuit" → afficher quand même la ligne `💶 Accès libre`
- Seed picsum : utiliser un nom descriptif en kebab-case (ex: `jardin-eze`, `bateau-mer`, `sentier-forêt`)
- Alt text : description courte en français de la photo
- Utiliser l'outil `Edit` avec `old_string` = `<section class="related">` et `new_string` = la section activités + `<section class="related">`

## Vérification finale

Après l'édition, confirmer que :
1. La section apparaît bien avant `.related`
2. Chaque card a ses 4 éléments : thumb, header, meta, link
3. Les URLs sont exactement celles fournies par l'utilisateur (pas raccourcies)
