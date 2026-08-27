# Ajouter des activités à un lieu

Ajoute des activités à un lieu de Riviera Secrète.

**Source de vérité : `data/lieux.json`.** Ne jamais éditer `lieux/*.html` à la main — ces
fichiers sont générés par `node scripts/build.mjs` à partir des données. Toute édition
HTML directe sera écrasée au prochain build, et casse la règle du site : un lieu possède
ses activités, chaque fait (prix, durée, url, image) n'existe qu'à un seul endroit — dans
`data/lieux.json`. Les itinéraires (`data/itineraires.json`) référencent ces activités par
`{ lieuSlug, activiteId }`, jamais en recopiant leurs prix/durées.

## Ce que tu dois recevoir de l'utilisateur

- Le lieu cible (slug, ex: `eze-village` — repérable via `data/lieux.json`)
- La liste des activités, chacune avec :
  - Nom de l'activité
  - Type : `gratuit` ou `payant`
  - Durée (ex: "45 min – 1 h 15")
  - Prix (ex: "8 – 10 € / adulte" ou "Accès libre")
  - URL de réservation ou d'information
  - Seed picsum pour la photo (ex: `jardin-eze`) — inventer un seed descriptif si non fourni

Si des infos manquent, demande-les avant de coder.

## Étapes

1. Ouvrir `data/lieux.json`, trouver l'objet dont `slug` correspond au lieu cible.
2. Ajouter un objet à son tableau `activites` :

```json
{
  "id": "kebab-case-du-nom",
  "nom": "[NOM]",
  "badge": "gratuit|payant",
  "duree": "[DURÉE]",
  "prix": "[PRIX]",
  "url": "[URL]",
  "image": "https://picsum.photos/seed/[SEED]/200/200",
  "alt": "[ALT]",
  "linkText": "Réserver →|En savoir plus →"
}
```

3. Lancer `node scripts/build.mjs` (ou `npm run build`) pour régénérer `lieux/<slug>.html`
   et tous les `itin/*.html` qui pourraient référencer une de ses activités.

## Règles

- `id` : kebab-case dérivé du nom, doit être unique dans le tableau `activites` de ce lieu
  (c'est la clé que les itinéraires utiliseront pour pointer vers cette activité)
- `badge: "gratuit"` → `linkText: "En savoir plus →"` ; `badge: "payant"` → `linkText: "Réserver →"`
- Si le prix est "Accès libre" ou "Gratuit" → mettre quand même `"prix": "Accès libre"`
- Seed picsum : nom descriptif en kebab-case (ex: `jardin-eze`, `bateau-mer`, `sentier-forêt`)
- `alt` : description courte en français de la photo
- Ne jamais dupliquer une activité qui existe déjà ailleurs sous une URL identique — si une
  URL existe déjà dans un autre lieu, vérifier avec l'utilisateur si c'est la même activité
  (dans ce cas ne rien ajouter, l'itinéraire pourra la référencer directement) ou une
  coïncidence

## Vérification finale

Après édition du JSON et build :
1. `git diff lieux/<slug>.html` ne montre que l'ajout attendu
2. Aucun autre fichier `lieux/*.html` ou `itin/*.html` n'a bougé de façon inattendue
3. Les URLs sont exactement celles fournies par l'utilisateur (pas raccourcies)
