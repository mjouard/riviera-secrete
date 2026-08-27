# Construire / enrichir un itinéraire

Enrichit un itinéraire de Riviera Secrète avec :
1. Des **pills d'activités inline** dans chaque étape
2. Une **sélection "À réserver avant de partir"**
3. Une **cohérence géographique et temporelle** des horaires
4. Un marqueur **"Dormir à…"** si l'itinéraire s'étend sur plusieurs jours

**Source de vérité : `data/itineraires.json` + `data/lieux.json`.** Ne jamais éditer
`itin/*.html` à la main — ces fichiers sont générés par `node scripts/build.mjs`. Le
HTML/CSS des pills, blocs de trajet, marqueurs "Dormir à…" et cartes "à réserver" est déjà
géré par `scripts/render/itin.mjs` : cette commande ne touche qu'aux données, jamais au
gabarit.

Règle centrale du modèle de données : un itinéraire ne recopie **jamais** le prix, la
durée, l'url ou l'image d'une activité. Il pointe vers elle avec `{ "lieuSlug": "...",
"activiteId": "..." }` (l'`id` vient du tableau `activites` du lieu dans `data/lieux.json`)
et n'ajoute que sa propre copie d'affichage (`label` du pill, `nomLabel`/`lieuLabel` de la
carte "à réserver"). Si l'activité voulue n'existe pas encore sur le lieu, ajoute-la
d'abord via `/add-activities` — n'invente jamais un prix/durée directement dans
`itineraires.json`.

---

## Ce que tu dois recevoir de l'utilisateur

- L'itinéraire cible (slug, ex: `menton-eze-monaco` — repérable via `data/itineraires.json`)
- Optionnel : indication si l'itinéraire doit être 1, 2 ou 3 jours

Si l'utilisateur ne précise pas le nombre de jours, **évalue toi-même** en fonction du nombre d'étapes, des distances et des durées d'activités (voir règles ci-dessous).

---

## Étape 1 — Lire l'itinéraire et les lieux associés

Dans `data/itineraires.json`, trouver l'objet dont `slug` correspond, et lire son tableau
`items` (stops / transits / sleep marqueurs), `booking` et `metaPills`.

Pour chaque `item.lieuSlug` référencé, lire l'objet correspondant dans `data/lieux.json`
et son tableau `activites` (id, nom, badge, durée, prix, url) — c'est dans cette liste que
les pills et la sélection "à réserver" doivent piocher.

---

## Étape 2 — Vérifier la cohérence géographique

Analyser l'ordre des `items` de type `stop` par position (lat/lng du lieu référencé) :
- Les étapes doivent suivre un axe cohérent (ex: est→ouest, côte→arrière-pays, boucle)
- Si deux étapes consécutives créent un **backtrack** évident (revenir sur ses pas de >5 km), les inverser dans le tableau `items`

Le tableau `STOPS` utilisé par la carte Leaflet n'existe plus comme donnée séparée : il est
recalculé par le build directement depuis `items` + les lat/lng des lieux référencés. Il
suffit donc de réordonner `items` — pas besoin de synchroniser un second tableau.

---

## Étape 3 — Vérifier et ajuster les horaires

Pour chaque transition entre étapes, calculer :
- Durée de visite de l'étape précédente (somme des activités prévues ou description)
- Temps de trajet réaliste selon le mode de transport :
  - Voiture : ~1 min/km sur route côtière, ~1.5 min/km en montagne sinueuse
  - Bateau : heure de départ fixe, vérifier les navettes
  - Marche : ~20 min/km

Règles horaires :
- Commencer entre 08:30 et 09:30
- Prévoir **déjeuner ~12:30–13:00** (1 h minimum) — l'assigner à une étape appropriée
- Dernière étape : arrivée avant 19:00 pour un itinéraire 1 jour
- Si la journée dépasse 10 h actives : **passer à 2 jours**

### Philosophie du rythme — ne pas rusher les lieux

L'objectif est de **vivre les lieux**, pas de les cocher. Quelques règles :
- **3 à 4 étapes par jour** maximum ; au-delà, les visites se font en mode "check-list"
- Une étape avec une activité payante longue (musée 2h, sentier 1h30+) compte pour une demi-journée — ne pas enchaîner deux de ce type le même après-midi
- Prévoir du temps "mou" : 20–30 min de flânerie par étape ne figure pas dans le planning mais doit y tenir
- Pour les villes (Monaco, Nice, Villefranche) : 3h minimum sur place pour en sentir l'atmosphère
- **Un lieu qui mérite une nuit sur place** (Monaco, Saint-Tropez) : le placer en fin de Jour 1 ou Jour 2 et l'indiquer dans le marqueur `sleep`, pas en étape rapide

Pour les itinéraires multi-jours, répartir les étapes de façon **asymétrique si besoin** : Jour 1 plus chargé (route à faire, énergie fraîche), Jour 2 plus léger (flânerie, après-midi libre, baignade). L'idéal n'est pas 3+3 mais peut être 4+2 si le Jour 2 a un lieu qui se "déguste" lentement.

### Blocs de trajet entre les étapes

Entre chaque paire d'étapes consécutives, insérer un item de type `transit` dans le tableau `items` :

```json
{ "type": "transit", "desc": "🚗 [DURÉE] — [DESCRIPTION ROUTE]" }
```

Règles :
- Description courte (route ou axe principal, ex: `Grande Corniche`, `bord de mer, souvent chargé`)
- Durée estimée réaliste (pas GPS optimiste — ajouter 20–30 % pour parking/feux)

### Itinéraire multi-jours

Si l'itinéraire couvre 2 ou 3 jours, insérer un item de type `sleep` entre les jours :

```json
{
  "type": "sleep",
  "dormirA": "Dormir à [COMMUNE]",
  "commune": "[COMMUNE]",
  "desc": "[Suggestion courte : type d'hébergement, ambiance du soir, pourquoi dormir ici]"
}
```

---

## Étape 4 — Ajouter les pills d'activités inline

Sur chaque item de type `stop`, remplir son tableau `activites` avec 1 à 2 entrées choisies
parmi les `activites` du lieu référencé (prioriser les plus emblématiques ou les payantes
qui se réservent) :

```json
{
  "label": "[Nom abrégé · Prix · Durée]",
  "cls": "stop-act--paid",
  "lieuSlug": "[SLUG DU LIEU]",
  "activiteId": "[ID DE L'ACTIVITÉ DANS CE LIEU]"
}
```

Règles :
- `cls` : `stop-act--paid` si l'activité référencée est `payant`, `stop-act--free` si `gratuit`
- Texte du `label` payant : `[Nom abrégé · Prix · Durée]` (ex: `Jardin exotique · 8–10 € · 45 min`)
- Texte du `label` gratuit : `[Nom abrégé · Libre]` (ex: `Chemin Nietzsche · Libre`)
- Le `label` est une copie d'affichage abrégée : le prix/la durée réels restent uniquement
  dans `data/lieux.json` — ne pas t'inquiéter si le `label` abrège différemment
- Maximum 2 pills par étape pour ne pas surcharger
- Ne pas répéter la même activité dans la sélection "à réserver" ET dans la même étape (choisir l'un ou l'autre)

---

## Étape 5 — Ajouter la sélection "À réserver avant de partir"

Remplir le tableau `booking` de l'itinéraire avec 3 à 4 activités payantes choisies parmi
les plus emblématiques (1 par lieu max, prioriser les entrées qui se réservent à l'avance) :

```json
{
  "lieuLabel": "[COMMUNE]",
  "nomLabel": "[NOM ACTIVITÉ, éventuellement reformulé pour la carte]",
  "linkText": "Réserver →",
  "extraSpans": [],
  "lieuSlug": "[SLUG DU LIEU]",
  "activiteId": "[ID DE L'ACTIVITÉ DANS CE LIEU]"
}
```

Règles :
- Prix/durée/image/url viennent automatiquement de l'activité référencée — ne pas les
  saisir ici
- `extraSpans` : tableau optionnel pour une info courte supplémentaire (ex: `["Mardi &
  jeudi"]` pour des horaires d'ouverture restreints) — laisser `[]` sinon
- `linkText` : `"Réserver →"` par défaut ; utiliser un texte différent seulement si le lien
  ne mène pas à une réservation directe (ex: `"Vérifier les horaires →"`)
- Le nombre de cartes détermine automatiquement le nombre de colonnes de la grille (géré
  par le build) — pas besoin d'y penser

---

## Étape 6 — Build et vérification finale

Lancer `node scripts/build.mjs` (ou `npm run build`) pour régénérer `itin/<slug>.html`.

Puis vérifier :
1. `git diff itin/<slug>.html` correspond aux changements attendus, rien d'autre n'a bougé
2. L'ordre des étapes est géographiquement logique
3. Les horaires sont cohérents (durée visite + trajet = heure de départ suivante)
4. Le déjeuner est bien placé (~12:30)
5. Chaque étape a ses pills (1–2 max)
6. Si multi-jours : les marqueurs `sleep` sont présents entre chaque journée
7. Le `metaPills` reflète le bon nombre de jours/étapes (ex: "2 jours · rythme serein")
8. `intro` reflète la logique de la route (ex: "est → ouest via les corniches")
