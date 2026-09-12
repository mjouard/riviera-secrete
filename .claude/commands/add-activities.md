# Ajouter des activités à un lieu

Ajoute des activités à un lieu de Riviera Secrète.

**Source de vérité : `data/lieux.json`.** Chaque fait (prix, durée, url, image) n'existe
qu'à un seul endroit — dans `data/lieux.json`. Les itinéraires (`data/itineraires.json`)
référencent ces activités par `{ lieuSlug, activiteId }`, jamais en recopiant leurs
prix/durées.

**Ce fichier JSON est la source de seed du backend** (`backend/RivieraSecrete.Infrastructure/Data/DatabaseSeeder.cs`),
consommé par le frontend Next.js via l'API — il n'y a plus de site statique généré à partir
de ce JSON (supprimé le 2026-09-12). **Éditer ce fichier ne met à jour ni le frontend
Next.js ni la DB automatiquement** : le seeder est idempotent (ne fait rien si la table
`Villes` contient déjà des lignes), donc une édition JSON reste invisible sur le site en
prod tant que quelqu'un n'a pas appliqué le changement en base manuellement (pas d'outillage
pour ça aujourd'hui — signaler ce point à l'utilisateur après l'édition plutôt que de
supposer que c'est automatique).

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

3. Dire clairement à l'utilisateur que cette édition ne sera visible en prod qu'après une
   mise à jour de la base de données (hors scope de ce skill) — ne pas prétendre que c'est
   déjà fait juste parce que le JSON est modifié.

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
- **Un lieu ne doit jamais apparaître comme "activité" d'un autre lieu.** Si l'activité que
  tu t'apprêtes à ajouter EST en fait un des 27 autres lieux du site (même village, même
  sentier, même monument avec sa propre fiche `/lieux/<slug>`) — pas une visite ponctuelle
  DANS ce lieu — ne l'ajoute pas à `activites`. Ajoute plutôt ce lieu au tableau `related`
  du lieu courant (voir les autres entrées de `related` pour le format de la card). C'était
  la source du plus gros lot de doublons trouvés dans ce dataset (ex: "Villa Ephrussi de
  Rothschild" ou "Village médiéval de Roquebrune" listés comme simples activités d'un lieu
  voisin, alors qu'ils ont chacun leur propre fiche).

## Vérification finale

Après édition du JSON :
1. `git diff data/lieux.json` ne montre que l'ajout attendu
2. Les URLs sont exactement celles fournies par l'utilisateur (pas raccourcies)
3. Rappeler à l'utilisateur que la DB de prod n'est pas mise à jour automatiquement
