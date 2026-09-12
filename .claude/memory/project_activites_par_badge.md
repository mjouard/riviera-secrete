---
name: project-activites-par-badge
description: "Chantier TERMINÉ (2026-09-12) : enrichi data/lieux.json avec des activités par badge manquant sur les 27 lieux, lieu par lieu, avec vraies photos Wikimedia — process et pièges à réutiliser pour un chantier similaire"
metadata:
  type: project
  originSessionId: 24767a28-abd9-41f0-9385-80f67dd8db6d
---

## Statut : terminé le 2026-09-12

Les 23 lieux qui avaient un gap ont tous été traités (49 activités ajoutées en tout). Un
script heuristique de correspondance mot-clé (voir plus bas) confirme **0 gap restant sur
les 27 lieux**. Ce fichier reste utile comme référence de process pour un futur chantier
similaire (ex. si de nouveaux lieux/badges sont ajoutés plus tard), pas comme suivi
d'avancement actif.

## Le chantier

Item de `ROADMAP.md` ("Enrichir les activités de chaque lieu"), démarré 2026-09-12. Chaque
lieu portant un badge (`plage`, `randonnee`, `vtt`, `plongee`, `restaurant`) doit avoir au
moins une activité en rapport direct avec ce badge dans `lieu.activites[]`.

**Processus établi** (décisions explicites de l'utilisateur, à respecter à la lettre) :
- Un lieu à la fois, on construit un panel d'activités assez complet pour ce lieu (pas
  juste le minimum pour fermer les gaps de badges), puis on demande avant de continuer.
- Chaque nouvelle activité a une vraie photo Wikimedia Commons (recherchée, vue en entier
  avant de choisir, license vérifiée, recadrée si besoin, créditée dans
  `frontend/src/app/credits/page.tsx`) — jamais de placeholder `picsum.photos` malgré ce que
  dit encore `.claude/commands/add-activities.md` (stale, pas corrigé).
- Chaque URL d'activité est vérifiée (curl + WebFetch, deux réseaux différents) avant
  d'être utilisée — un 403 corroboré par ailleurs (site connu pour bloquer les bots comme
  GetYourGuide ou AllTrails) est accepté ; un vrai lien mort ne l'est pas.
- Après commit+push du JSON/images/credits, toujours demander confirmation avant de
  synchroniser manuellement vers la DB prod Railway (l'édition de `data/lieux.json` seule
  ne se propage jamais automatiquement, voir `project_overview.md`).
- Après la sync DB, redéployer aussi le frontend (`cd frontend && npx vercel --prod --yes`)
  — un `git push` seul ne suffit pas, voir le piège ci-dessous.

## Lieux traités (23, dans l'ordre) — tous synchronisés en prod

`rue-obscure-villefranche`, `sentier-cap-ferrat`, `villa-kerylos`, `eze-village`,
`trophee-auguste-la-turbie`, `tourrettes-sur-loup`, `iles-de-lerins`, `gourdon-village`,
`roquebrune-cap-martin-village`, `colline-du-chateau-nice`, `peille-village`,
`gorges-du-loup-cascade-courmes`, `sentier-cap-antibes`, `calanques-esterel-theoule`,
`biot-village-verrier`, `citadelle-saint-tropez`, `jardin-exotique-monaco`,
`cours-saleya-vieux-nice`, `pont-du-loup`, `saint-paul-de-vence`, `haut-de-cagnes`,
`pinede-gould-juan-les-pins`, `vieille-ville-grasse`, `gassin-plus-beau-village`.

(23 lieux listés car `gassin-plus-beau-village` a été le dernier — le compte total de lieux
*touchés* est 23, mais certains avaient déjà un panel partiel ; voir les commits Git
individuels, un par lieu, pour le détail exact de ce qui a été ajouté à chacun.)

## Script heuristique de vérification (à réutiliser si besoin)

Un script Python inline (badges vs mots-clés dans `activites[].nom`/`alt`, normalisation
accents) a servi tout du long à détecter les gaps et à confirmer la fin du chantier — il a
deux angles morts connus, trouvés en pratique :
- **Faux positif** : une activité peut contenir un mot-clé sans vraiment couvrir le badge
  (ex. "Montée par l'escalier Rossetti" ne contient aucun mot-clé "randonnee" bien que ce
  soit une vraie activité de marche — repéré sur `colline-du-chateau-nice`, resté tel quel
  car déjà réellement couvert).
- **Faux négatif inverse** : un mot-clé peut matcher une activité qui ne couvre PAS
  vraiment le badge (ex. "dégustation" matchait la liste de mots-clés `restaurant`, alors
  qu'une dégustation de vin sans repas n'est pas un restaurant — repéré sur
  `gassin-plus-beau-village`, corrigé en ajoutant une vraie activité restaurant en plus).
Toujours relire le résultat du script avec un œil critique, pas seulement compter les 0.

## Pièges trouvés pendant ce chantier

Un premier passage sur `rue-obscure-villefranche` avait été marqué "terminé" alors qu'un
badge (`plage`) restait sans activité, et une activité déjà ajoutée en JSON
(`restaurant-laparte`) n'avait jamais été répliquée dans la DB prod (sync manuelle oubliée
ou ratée silencieusement). Toujours re-vérifier via le script heuristique + une requête SQL
directe sur la table `Activites` avant de considérer un lieu vraiment complet, ne pas se
fier uniquement au souvenir d'avoir "déjà fait ce lieu".

Plus tard dans le même chantier, l'utilisateur a signalé une photo manquante en prod (VTT du
Col d'Èze) : la DB était bien synchronisée mais **le frontend n'avait jamais été redéployé**
sur 9 lieux d'affilée — `git push` seul ne suffit pas sur ce projet (voir
`feedback_vercel_deploy.md`, git integration Vercel désactivée). Un `cd frontend && npx
vercel --prod --yes` explicite est maintenant fait après chaque lieu synchronisé, pas
seulement en fin de session.

## Bug trouvé en passant, pas corrigé (hors scope de ce chantier)

`roquebrune-cap-martin-village.heroImage` contient une valeur corrompue
(`"...hero.jpg\" data-slides=\"5"`) et `heroSlides` est `null` alors que 5 fichiers
`hero.jpg`…`hero-5.jpg` existent bien sur le disque. Signalé comme tâche séparée (chip
spawn_task), pas encore traité.
