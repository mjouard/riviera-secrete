---
name: project-overview
description: "Vue d'ensemble du projet Riviera Secrète — ce que c'est, état actuel de la stack, URLs, structure du dépôt"
metadata: 
  node_type: memory
  type: project
  originSessionId: 52dd96aa-badc-4607-83f8-5de46933687d
---

## Ce qu'est le projet

Guide des lieux méconnus de la Côte d'Azur (Menton → Saint-Tropez). 27 lieux, 22 villes, 6 itinéraires éditoriaux. Ton : carnet de repérage, sobre, pas de superlatifs touristiques. Voix directe, textes courts, descriptions concrètes.

**Dépôt GitHub** : `mjouard/riviera-secrete` (monorepo, branche `main`)

---

## Stack actuelle (2026-09-11)

Le projet est en transition entre un site statique (historique) et une stack complète :

```
/                        ← Site statique HTML/CSS/JS (Netlify, legacy)
/backend/                ← ASP.NET Core Web API (.NET 10, Railway)
/frontend/               ← Next.js 16 App Router (Vercel)
/data/                   ← JSON sources de vérité (lieux, villes, itinéraires)
/scripts/                ← Build du site statique (node scripts/build.mjs)
/assets/                 ← CSS/JS/images partagés par le site statique
/lieux/ /itin/           ← Pages HTML générées (ne pas éditer à la main)
```

### Sites déployés

| Couche | URL | Hébergement |
|---|---|---|
| Site statique (legacy) | https://riviera-secrete.vercel.app | Vercel (projet `riviera-secrete`, migré depuis Netlify — `riviera-secrete.netlify.app` 404 désormais, vérifié 2026-09-12) |
| Frontend Next.js | https://frontend-two-plum-92.vercel.app | Vercel (projet `frontend`) |
| API .NET | https://api-production-19623.up.railway.app | Railway (service `api`) |
| PostgreSQL | interne Railway | Railway (projet `fearless-happiness`) |

Le site statique sera progressivement remplacé par le frontend Next.js, qui est le stack
prioritaire pour tout travail en cours (décidé et confirmé par l'utilisateur le 2026-09-11).
Ne pas investir dans le site statique au-delà des corrections urgentes. Certains champs
internes (`data/lieux.json`'s `ogImage`, canonicals dans `scripts/render/*.mjs`) référencent
encore `netlify.app` en dur malgré la migration — tâche différée existante dans
`ROADMAP.md`, pas encore corrigée.

---

## Données éditoriales

**Source de vérité** : `data/lieux.json`, `data/villes.json`, `data/itineraires.json`

- 27 lieux (était 30, 3 ont été "démotés" en activités d'un lieu voisin)
- 22 villes
- 6 itinéraires

Ces JSON sont lus par :
1. `scripts/build.mjs` → génère les pages HTML statiques
2. `DatabaseSeeder.cs` → seed la PostgreSQL Railway (fait une fois, données en DB)

**Ne jamais éditer** `lieux/*.html`, `itin/*.html` — générés, écrasés au prochain build.

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
- `<title>` utilise `&` nu, tout le reste utilise `&amp;`
