# Photos sous-dimensionnées — à re-sourcer

Relevé du 2026-09-14 par `frontend/scripts/images.mjs verifie` : **133 photos sur 327**
sont plus petites que l'emplacement où elles s'affichent. Rendues en `object-cover`, elles
ne sont donc pas déformées mais **agrandies, donc floues**.

Aucun script ne peut les réparer : une image de 200×200 ne contient pas l'information d'une
image de 960×640. Il faut retrouver une meilleure source sur Wikimedia Commons, selon le
procédé décrit dans `CLAUDE.md` (regarder la photo avant de la retenir, recadrer aux
dimensions cibles, créditer dans `/credits`).

Relancer `cd frontend && node scripts/images.mjs verifie` pour une liste à jour.

## Les plus urgentes

Triées par ratio largeur réelle / largeur cible — les premières sont les plus dégradées.

| Ratio | Fichier | Actuel | Cible |
|---|---|---|---|
| 0.21 | `lieux/coaraze-cadrans-solaires/act-1.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/coaraze-cadrans-solaires/act-2.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/coaraze-cadrans-solaires/act-3.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/coaraze-cadrans-solaires/act-4.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/coaraze-cadrans-solaires/act-5.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/falicon-village/act-1.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/falicon-village/act-2.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/falicon-village/act-3.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/falicon-village/act-4.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/falicon-village/act-5.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/golfe-juan/act-1.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/golfe-juan/act-2.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/golfe-juan/act-3.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/golfe-juan/act-4.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/golfe-juan/act-5.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/gorbio-village/act-1.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/gorbio-village/act-2.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/gorbio-village/act-3.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/gorbio-village/act-4.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/gorbio-village/act-5.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/luceram-village/act-1.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/luceram-village/act-2.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/luceram-village/act-3.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/luceram-village/act-4.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/luceram-village/act-5.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/parc-mont-boron/act-1.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/parc-mont-boron/act-2.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/parc-mont-boron/act-3.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/parc-mont-boron/act-4.jpg` | 200×200 | 960×640 |
| 0.21 | `lieux/peira-cava/act-1.jpg` | 200×200 | 960×640 |

*(30 premières sur 133.)*

## Répartition par lieu

| Lieu | Photos concernées |
|---|---|
| `villa-ephrussi-rothschild` | 7 |
| `vieux-vallauris-ceramique` | 6 |
| `rue-obscure-villefranche` | 6 |
| `eze-village` | 6 |
| `coaraze-cadrans-solaires` | 5 |
| `falicon-village` | 5 |
| `golfe-juan` | 5 |
| `gorbio-village` | 5 |
| `luceram-village` | 5 |
| `peira-cava` | 5 |
| `plage-pampelonne` | 5 |
| `sainte-agnes-village` | 5 |
| `saorge-village` | 5 |
| `vieille-ville-sospel` | 5 |
| `vieux-menton` | 5 |

*(37 lieux concernés au total.)*
