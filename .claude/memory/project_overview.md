---
name: project-overview
description: "Vue d'ensemble du projet Riviera Secrète — ce que c'est, stack unique Next.js+ASP.NET Core (site statique supprimé 2026-09-12), URLs, structure du dépôt"
metadata: 
  node_type: memory
  type: project
  originSessionId: 52dd96aa-badc-4607-83f8-5de46933687d
---

## Ce qu'est le projet

Guide des lieux méconnus de la Côte d'Azur (Menton → Saint-Tropez). 27 lieux, 22 villes, 6 itinéraires éditoriaux. Ton : carnet de repérage, sobre, pas de superlatifs touristiques. Voix directe, textes courts, descriptions concrètes.

**Dépôt GitHub** : `mjouard/riviera-secrete` (monorepo, branche `main`)

---

## Stack actuelle (2026-09-12)

Stack unique — le site statique historique (HTML/CSS/JS généré depuis `data/*.json`) a été
supprimé du repo le 2026-09-12, une fois le frontend Next.js arrivé à parité fonctionnelle
(portage suivi jusqu'au bout dans `ROADMAP.md`). Structure actuelle :

```
/backend/                ← ASP.NET Core Web API (.NET 10, Railway)
/frontend/                ← Next.js 16 App Router (Vercel) — le site
/data/                   ← JSON sources de vérité (lieux, villes, itinéraires), consommées
                            uniquement par le seeder backend désormais
```

### Sites déployés

| Couche | URL | Hébergement |
|---|---|---|
| Site (Next.js) | https://frontend-two-plum-92.vercel.app | Vercel (projet `frontend`) — c'est le vrai site |
| API .NET | https://api-production-19623.up.railway.app | Railway (service `api`) |
| PostgreSQL | interne Railway | Railway (projet `fearless-happiness`) |

Le projet Vercel `riviera-secrete` (`riviera-secrete.vercel.app`) a existé pour l'ancien
site statique — son code source a été supprimé du repo, donc si ce projet Vercel est encore
connecté au repo, son prochain déploiement échouera ou servira du contenu périmé/cassé ;
ignore cette URL, ce n'est plus le site. Aucun nom de domaine personnalisé n'est encore
acheté/pointé (tâche `ROADMAP.md` toujours ouverte).

---

## Données éditoriales

**Source de vérité** : `data/lieux.json`, `data/villes.json`, `data/itineraires.json`

- 27 lieux (était 30, 3 ont été "démotés" en activités d'un lieu voisin)
- 22 villes
- 6 itinéraires

Ces JSON sont lus uniquement par `DatabaseSeeder.cs` (backend) pour peupler la PostgreSQL
Railway — idempotent, ne se relance pas tout seul, voir `backend_dotnet.md`. Éditer ces
fichiers ne met donc rien à jour automatiquement en prod (ni la DB, ni a fortiori le
frontend, qui ne lit que la DB via l'API).

---

## Les 27 lieux (par région, ordre d'affichage)

**menton-monaco** : rue-obscure-villefranche, sentier-cap-ferrat, villa-kerylos, eze-village, trophee-auguste-turbie, sentier-corbusier-cap-martin, roquebrune-cap-martin-village, peille-village, peillon-village

**nice** : vieux-nice-cours-saleya, colline-chateau-nice

**arriere-pays** : gourdon-village, gorges-loup-cascade-courmes, tourrettes-sur-loup, saint-paul-de-vence

**antibes-cannes** : sentier-cap-antibes, pinede-gould-juan-les-pins, biot-village-verrier, haut-de-cagnes, iles-lerins, pic-cap-roux-esterel, calanques-esterel-theoule

**golfe-st-tropez** : vieille-ville-grasse, gassin-plus-beau-village, citadelle-saint-tropez

## Les 6 itinéraires

| Slug | Titre |
|---|---|
| `antibes-biot-juan` | Antibes, Biot & la pinède de Juan-les-Pins |
| `grasse-saint-tropez` | Grasse et la presqu'île de Saint-Tropez |
| `lerins-esterel` | Îles de Lérins & Estérel sauvage |
| `menton-eze-monaco` | Menton, Èze & Monaco |
| `nice-peillon-peille` | Nice, Peillon & Peille |
| `villages-perches` | La route des villages perchés |

---

## Règles éditoriales importantes

- Descriptions courtes et concrètes, jamais de superlatifs touristiques
- Un lieu ne doit jamais apparaître en `activites[]` d'un autre lieu (→ `related[]` à la place)
- Coordonnées vérifiées via WebSearch (3 corrigées en 2026-08-27)
- Badges (`plage`, `randonnee`, `vtt`, `plongee`, `restaurant`) = practicable à l'emplacement exact du lieu, pas dans la commune
- `data/*.json` contient des `&amp;` littéraux hérités de l'ancien rendu HTML — le frontend
  les décode uniformément (`decodeDeep`/`decodeEntities`), aucune règle de split à retenir
