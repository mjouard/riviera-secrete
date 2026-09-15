---
name: project-lot3-donnees
description: "Chantier TERMINÉ (2026-09-15) côté code/données : tags des 43 lieux, communeSlug/surPlace et lienType/partenaire sur les 208 activités — reste bloqué sur la synchro vers la base de prod (mot de passe PostgreSQL compromis, rotation en attente)"
metadata:
  type: project
---

## Statut : code et données terminés le 2026-09-15, synchro prod bloquée

Chantier de nuit (session sans supervision, plusieurs agents en parallèle sur des branches
séparées) qui finit le Lot 3 de la refonte UI (`ROADMAP.md`, section "Lot 3 — Données").
Travail livré sur la branche `worktree-agent-af973d59e253c9c11`, **pas encore mergée dans
`main`** — à relire et fusionner par l'utilisateur.

## Ce qui a été fait

**1. Tags des 43 lieux** — vocabulaire fermé imposé par le spec : `village | sentier | crique
| jardin | monument | panorama | table`. Les 43 lieux ont tous au moins un tag, aucun trou.
Répartition : village 25, panorama 9, monument 9, sentier 7, crique 7, jardin 4 (un lieu peut
porter plusieurs tags). Champ full-stack : `Lieu.Tags` (backend), `Lieu.tags` (frontend
`types.ts`), consommé par les nouvelles chips de type sur `/explorer`
(`ExplorerFilterBar.tsx`), même pattern visuel que les chips de zone déjà en place.

**2. `communeSlug`/`surPlace` sur les 208 activités** — distingue une activité pratiquée sur
place d'une activité à proximité mais pas au même endroit (l'exemple cité par le spec :
« Sortie kayak de mer » sous « La Rue Obscure », une rue couverte du XIIIe siècle — ce n'est
pas sur place). Les 208 activités ont les deux champs renseignés ; seulement 3 sont marquées
`surPlace: false` — la réalité du jeu de données est qu'une écrasante majorité des activités
listées sont effectivement sur place, le cas « à proximité » est rare mais bien réel. Affichage
mis à jour partout où une activité s'affiche (fiche lieu, itinéraires, créateur d'itinéraire,
grille d'activités).

**3. `lienType`/`partenaire` en remplacement de `linkText`** — deux valeurs contrôlées au lieu
d'un texte libre à trois variantes : `reservation` (67 activités) → « Réserver »,
`officiel` (141 activités) → « Site officiel ». 19 activités marquées `partenaire: true` →
`rel="sponsored nofollow"` + mention « lien partenaire ». `linkText` est entièrement retiré de
`data/lieux.json` **et** `data/itineraires.json` (le `BookingRef` d'un itinéraire dérive
maintenant son libellé de l'activité référencée, comme le fait déjà `horaires`/`fermeJours`
depuis le nettoyage d'`extraSpans` — même principe : une seule source de vérité, pas de copie
qui peut diverger).

## Full-stack, dans l'ordre des commits

Entités backend (`backend/RivieraSecrete.Domain/Entities/Lieu.cs` et `Activite.cs`) → migration
EF (`AddLot3Champs`, générée et vérifiée par `dotnet build`, **jamais appliquée à une base**) →
`DatabaseSeeder.cs` mis à jour pour lire ces champs depuis le JSON → `frontend/src/lib/types.ts`
→ chips de type sur `/explorer` → remplacement de `cleLinkText`/`linkText` dans les 5 endroits
qui l'affichaient (`BookingSection.tsx`, `itineraires/[slug]/page.tsx`, `lieux/[slug]/page.tsx`,
`ActivitesGrid.tsx`, `activites-data.ts`).

## Reste à faire — bloqué, pas oublié

**La synchronisation vers la base de PostgreSQL de production n'a pas été faite** et ne pouvait
pas l'être cette nuit : le mot de passe de cette base a fuité dans l'historique git d'un dépôt
public (voir l'item 🔴 en tête de `ROADMAP.md`) et sa rotation par l'utilisateur est toujours en
attente. Tant que ce n'est pas fait, ces champs existent dans le code et dans `data/*.json` mais
**pas dans la base réellement servie en prod** — `/explorer` ne montrera aucune chip de type
fonctionnelle tant que la synchro n'a pas eu lieu, même une fois cette branche mergée et
déployée.

Chaîne complète à faire une fois le mot de passe tourné : `railway variables` (nouvelle
`SYNC_CONNECTION_STRING`) → `dotnet ef database update` (applique `AddLot3Champs`) →
`RivieraSecrete.Tools` pour synchroniser `data/*.json` vers la base → vérifier `/explorer` en
prod.
