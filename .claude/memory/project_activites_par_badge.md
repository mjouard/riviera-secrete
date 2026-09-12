---
name: project-activites-par-badge
description: "Chantier en cours : enrichir data/lieux.json avec des activités par badge manquant, lieu par lieu, avec vraies photos Wikimedia — état d'avancement et prochain lieu"
metadata:
  type: project
  originSessionId: 24767a28-abd9-41f0-9385-80f67dd8db6d
---

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

## État d'avancement (voir `ROADMAP.md` pour la liste à jour)

12 lieux traités et synchronisés en prod au 2026-09-12 (28 activités ajoutées) :
`rue-obscure-villefranche`, `sentier-cap-ferrat`, `villa-kerylos`, `eze-village`,
`trophee-auguste-la-turbie`, `tourrettes-sur-loup`, `iles-de-lerins`, `gourdon-village`,
`roquebrune-cap-martin-village`, `colline-du-chateau-nice`, `peille-village`,
`gorges-du-loup-cascade-courmes`.

Reste ~13 lieux avec des badges non couverts (liste précise dans `ROADMAP.md`, détectée via
un script heuristique de correspondance mot-clé sur `activites[].nom`/`alt` — à re-lancer
pour confirmer la liste avant de continuer, elle peut avoir légèrement bougé).

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
