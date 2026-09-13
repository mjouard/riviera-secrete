---
name: project-villes-expansion
description: "Chantier en cours : recherche et ajout de villes/lieux/activités manquants dans les 5 régions existantes, avec photos placeholder à remplacer plus tard — méthodologie, mécanisme de sync DB, et suivi de progression"
metadata:
  type: project
---

## Contexte & objectif

Demandé par l'utilisateur le 2026-09-13 : le site (22 villes / 27 lieux au départ) a des
trous évidents, en particulier dans l'arrière-pays. Objectif : fouiller chaque région
existante au peigne fin, ajouter les villes intéressantes manquantes, puis pour chaque
ville ses lieux, puis pour chaque lieu ses activités — badges, coordonnées, tips, related —
au même niveau d'exigence que le reste du site.

**Mandat donné par l'utilisateur** (à respecter tel quel, ne pas redemander) :
- Jugement éditorial (quelles villes/lieux ajouter) : confiance totale, pas besoin de
  validation préalable.
- Photos : **placeholders volontaires** (picsum.photos), pas de vraie recherche/curation
  photo cette nuit — voir "Politique photo" ci-dessous. C'est la seule raison pour laquelle
  ce chantier peut tourner sans l'utilisateur : la règle habituelle ("ne jamais sourcer de
  photo réelle sans demander à chaque session", voir `feedback_dont-autopick-photos.md`)
  n'est pas contournée, juste pas engagée cette nuit.
- Budget : si le travail s'arrête (contexte épuisé, session coupée), c'est acceptable —
  documenter l'état exact et l'agent suivant (ou l'utilisateur) reprend avec ce fichier.

## Périmètre : ne pas dupliquer / ne pas casser les invariants existants

Avant d'ajouter quoi que ce soit, relire dans `CLAUDE.md` à la racine du repo (section
"Data model") les règles suivantes — elles s'appliquent identiquement aux nouvelles
entrées :
- **Un lieu doit avoir un vrai lieu physique distinct** — si un "lieu" candidat est en fait
  une activité/visite à l'intérieur d'un lieu déjà existant (ou nouvellement créé), c'est une
  `activité`, pas un lieu séparé. Ne pas reproduire l'erreur historique (voir "known
  duplication" dans CLAUDE.md).
- **Badges** (`plage`, `randonnee`, `vtt`, `plongee`, `restaurant`) : uniquement si
  practicable *à cet endroit précis*, pas juste dans la commune. Vérifier par WebSearch
  avant d'assigner un badge, ne jamais deviner.
- **Coordonnées lat/lng** : vérifier par WebSearch contre les coordonnées réelles (le site a
  déjà eu 3 lieux avec des coordonnées fausses de 2-6km, corrigées après coup — ne pas
  répéter).
- **`villeSlug` d'un lieu doit exister dans `data/villes.json`** — pas de validation
  applicative, une faute de frappe est silencieuse (voir CLAUDE.md).
- Vérifier que la ville/le lieu n'existe pas déjà avant de l'ajouter (grep le nom dans
  `data/villes.json`/`lieux.json`).
- Respecter le schéma JSON exact des fichiers existants (mêmes clés, mêmes types) — copier
  la structure d'une entrée existante plutôt que de la deviner.
- Activités : angle éditorial "secret/atypique", pas les incontournables déjà sur tous les
  guides (voir la règle du skill `/add-activities`).

## Ville vs. lieu — bien distinguer avant d'ajouter

Un candidat n'est pas forcément une nouvelle **ville** :
- Si c'est une **commune distincte** qui n'a aucune entrée dans `data/villes.json` → nouvelle
  `Ville` + au moins un `Lieu` dedans.
- Si c'est un **endroit physique dans une commune qui a déjà une ville** (ex. un hameau, un
  quartier, un site à part comme "Èze-sur-Mer" qui est dans la commune d'Èze mais un lieu
  totalement différent d'`eze-village`) → **juste un nouveau `Lieu`** avec le `villeSlug`
  existant, pas une ville en double. Vérifier `regionSlug` de la ville existante concernée
  (`menton-monaco`, `nice`, `arriere-pays`, `antibes-cannes`, `golfe-st-tropez`) avant de
  choisir.

**Trou déjà repéré, à traiter en priorité** : la région "Menton, Monaco & la frontière"
(`menton-monaco`) n'a **aucune ville nommée "Menton"** dans `data/villes.json` — 7 villes
alentour (Villefranche, Saint-Jean-Cap-Ferrat, Beaulieu, Èze, La Turbie, Monaco,
Roquebrune-Cap-Martin) mais pas Menton elle-même, alors que c'est la ville qui donne son nom
au site entier ("de Menton à Saint-Tropez"). À combler en premier.

## Politique photo — placeholders assumés

Pour chaque nouveau lieu :
- `heroImage`: `https://picsum.photos/seed/<slug-du-lieu>/1200/800`
- `thumbImage`: `https://picsum.photos/seed/<slug-du-lieu>/500/375`
- `ogImage`: même URL que `heroImage` (champ de toute façon mort, voir CLAUDE.md)
- Ne **pas** ajouter d'entrée dans `frontend/src/app/[locale]/credits/page.tsx` pour un
  placeholder (picsum ne requiert pas d'attribution) — une entrée credits n'est nécessaire
  que le jour où une vraie photo Wikimedia la remplace.
- **Ajouter le slug à la table "Photos à remplacer" ci-dessous** à chaque lieu créé, pour
  qu'une session future (avec l'utilisateur, pour le choix éditorial des photos) puisse
  traiter le lot d'un coup, exactement comme le chantier photo de 2026-08-28 (CLAUDE.md).
- Pour une **ville** (`thumbImage` uniquement), même logique : `https://picsum.photos/seed/<slug-de-la-ville>/500/375`.

## Mécanisme de sync DB — IMPORTANT, lire avant de commencer

Éditer `data/villes.json`/`lieux.json` ne suffit **pas** à faire apparaître le contenu sur
le site en production : `DatabaseSeeder.SeedAsync` est un no-op dès que la table `Villes` a
une seule ligne (déjà le cas). Un nouvel outil a été créé pour ce chantier :
`backend/RivieraSecrete.Tools` (`DatabaseSeeder.SyncNewContentAsync`) — **additif
uniquement**, n'insère que les villes/lieux/activités dont le slug n'existe pas encore en
base, ne modifie/supprime jamais une ligne existante. Idempotent, safe à ré-exécuter.

Après chaque lot de modifications à `data/villes.json`/`lieux.json` :

```bash
export DOTNET_ROOT=~/.dotnet
export PATH="$HOME/.dotnet:$HOME/.dotnet/tools:$PATH"
cd backend

RAW_URL=$(railway variable --service Postgres --kv | grep '^DATABASE_PUBLIC_URL=' | cut -d= -f2-)
export SYNC_CONNECTION_STRING=$(python3 - "$RAW_URL" <<'PYEOF'
import sys
from urllib.parse import urlparse
u = urlparse(sys.argv[1])
print(f"Host={u.hostname};Port={u.port};Database={u.path.lstrip('/')};Username={u.username};Password={u.password};SSL Mode=Require;Trust Server Certificate=true")
PYEOF
)

dotnet run --project RivieraSecrete.Tools
unset RAW_URL SYNC_CONNECTION_STRING
```

**Ne jamais utiliser `DATABASE_URL`** (variable interne, résolvable uniquement depuis le
réseau Railway) — toujours `DATABASE_PUBLIC_URL`. Ne jamais logguer/afficher la connection
string en clair dans un fichier commité ou dans une sortie qui finirait quelque part de
persistant.

Le frontend (`api.ts`) fait de l'ISR `revalidate: 3600` sur les listes (villes, lieux) — un
nouveau contenu peut mettre jusqu'à 1h à apparaître sans redéploiement, ou apparaît
immédiatement après un `vercel --prod --yes`. Les pages de détail lieu/itinéraire sont
rendues à la demande (pas de `generateStaticParams`), donc un nouveau lieu est servable dès
que la sync DB est faite, sans attendre un build Next.js.

## Cadence commit / sync / deploy

Pour rester dans l'esprit "petit à petit" demandé :
1. Terminer une ville complète (ville + tous ses lieux + toutes leurs activités) avant de
   committer — pas de commit à moitié fini.
2. `git add data/villes.json data/lieux.json && git commit` (message français, décrire la
   ville/les lieux ajoutés et pourquoi) `&& git push`.
3. Lancer la sync DB (commande ci-dessus).
4. Déployer le frontend (`cd frontend && npx vercel --prod --yes`) **au moins une fois par
   région terminée** (pas obligatoire après chaque ville isolée, pour ne pas multiplier les
   déploiements inutilement — mais un `git push` + sync DB à chaque ville, oui).
5. Mettre à jour la table de progression ci-dessous avant de passer à la ville suivante.

## Table de progression

| Région | Statut | Villes ajoutées | Notes |
|---|---|---|---|
| Menton, Monaco & la frontière | fait | `menton` (lieu `cimetiere-vieux-chateau-menton`) | Trou du nom du site comblé. Commit `beca24a`, syncé en DB (1 ville/1 lieu/5 activités). |
| Nice et ses environs immédiats | fait | `falicon` (lieu `falicon-village`) + `parc-mont-boron` (nouveau lieu sur la ville `nice` existante) | Commits `51b7c12`/`840cabc`, syncés en DB. Autres candidats envisagés et écartés pour cette nuit : Aspremont (redondant avec Falicon — même angle "village perché vue sur Nice"), Bellet/Cimiez (gardés pour une session future, moins prioritaires). |
| L'arrière-pays : villages perchés & gorges | fait | `sainte-agnes`, `coaraze`, `sospel`, `gorbio`, `luceram`, `saorge` (un lieu chacun) | Commits `50baf07`/`e97cde1`/`c45e7a8`, syncés en DB. Vence (centre) et Castellar non traités cette nuit (candidats restants, voir "Prochaine étape") — le reste de la liste pressentie est fait. |
| Antibes, Cannes & le massif de l'Estérel | fait | `mougins` (lieu `vieux-mougins`), `vallauris` (lieu `vieux-vallauris-ceramique`) | Commits `1eb2386`/`22ff6e4`, syncés en DB. Angle éditorial : art vivant/artisanat plutôt que le seul nom "Picasso" (déjà connu partout) — galeries habitées à Mougins, ateliers de céramistes à Vallauris. |
| Grasse & le golfe de Saint-Tropez | fait | `grimaud` (lieu `vieux-village-grimaud`), `ramatuelle` (lieu `vieux-village-ramatuelle`) | Commits `a811b98`/`86f6858`, syncés en DB. Mougins traité sous `antibes-cannes` (géographiquement plus cohérent, voir cette ligne) plutôt qu'ici. Valbonne non traité cette nuit (candidat restant, voir "Prochaine étape"). |

*(Mettre à jour "Statut" en `en cours` / `fait` / `interrompu — voir note`, et lister les
villes réellement ajoutées avec leur slug au fil de l'eau.)*

## Photos à remplacer (placeholders picsum → vraie photo, session future avec l'utilisateur)

*(Table à remplir au fil de l'ajout — un lieu par ligne, slug + nom.)*

| Slug lieu | Nom | Type (hero/thumb) |
|---|---|---|
| `menton` (ville) | Menton | thumb |
| `cimetiere-vieux-chateau-menton` | Le Cimetière du Vieux-Château | hero + thumb |
| `falicon` (ville) | Falicon | thumb |
| `falicon-village` | Falicon | hero + thumb |
| `parc-mont-boron` | Le Parc du Mont Boron | hero + thumb |
| `mougins` (ville) | Mougins | thumb |
| `vieux-mougins` | Le Vieux Mougins | hero + thumb |
| `vallauris` (ville) | Vallauris | thumb |
| `vieux-vallauris-ceramique` | Le Vieux Vallauris, cité de la céramique | hero + thumb |
| `grimaud` (ville) | Grimaud | thumb |
| `vieux-village-grimaud` | Le Vieux Village de Grimaud | hero + thumb |
| `ramatuelle` (ville) | Ramatuelle | thumb |
| `vieux-village-ramatuelle` | Le Vieux Village de Ramatuelle | hero + thumb |
| `sainte-agnes` (ville) | Sainte-Agnès | thumb |
| `sainte-agnes-village` | Sainte-Agnès | hero + thumb |
| `coaraze` (ville) | Coaraze | thumb |
| `coaraze-cadrans-solaires` | Coaraze, le village aux cadrans solaires | hero + thumb |
| `sospel` (ville) | Sospel | thumb |
| `vieille-ville-sospel` | La Vieille Ville de Sospel | hero + thumb |
| `gorbio` (ville) | Gorbio | thumb |
| `gorbio-village` | Gorbio | hero + thumb |
| `luceram` (ville) | Lucéram | thumb |
| `luceram-village` | Lucéram | hero + thumb |
| `saorge` (ville) | Saorge | thumb |
| `saorge-village` | Saorge | hero + thumb |

## Si le travail s'arrête en cours de route

Avant de stopper (contexte épuisé, erreur bloquante, fin de nuit) :
1. S'assurer que le dernier commit est dans un état cohérent (ville complète, pas à moitié
   remplie) — si une ville est en cours, soit la finir, soit la retirer du JSON avant de
   commit/push (ne jamais laisser un état incohérent sur `main`).
2. Mettre à jour la table de progression avec le statut exact.
3. Écrire une section "Prochaine étape" en toutes lettres ci-dessous (quelle région, quel
   village, quoi faire exactement) pour qu'une reprise soit immédiate sans redérivation de
   contexte.

### Prochaine étape

**Toutes les 5 régions ont été couvertes cette nuit (2026-09-13), pas d'état incohérent —
chaque ville/lieu committé est complet.** Récapitulatif : 12 nouvelles villes, 13 nouveaux
lieux (dont `parc-mont-boron`, seul lieu ajouté sur une ville déjà existante — `nice`), 56
nouvelles activités, tous syncés en DB de prod et déployés sur Vercel. Le site compte
maintenant 34 villes / 40 lieux (contre 22/27 au départ).

Rien n'est en cours ni à moitié fini. S'il y a une suite à donner :

1. **Session photo dédiée (prioritaire)** — les 24 lignes de la table "Photos à remplacer"
   ci-dessus (12 villes + 12 lieux, comptant les deux lieux ajoutés sur `nice`) sont
   actuellement en placeholder picsum.photos. Reprendre le processus documenté dans
   `CLAUDE.md` ("Hero images") : Wikimedia Commons d'abord, vérifier la photo avant de la
   choisir, crop `hero.jpg` (1200×800) + `thumb.jpg` (500×375), déposer dans
   `frontend/public/assets/images/lieux/<slug>/`, ajouter le crédit dans
   `frontend/src/app/[locale]/credits/page.tsx`. **Redemander l'autorisation "carte blanche" à
   l'utilisateur avant de sourcer** (règle habituelle, voir
   `feedback_dont-autopick-photos.md` — le mandat photo placeholder de cette nuit ne vaut
   que pour cette session).
2. **Candidats confirmés par l'utilisateur le 2026-09-14, à traiter dans un futur chantier**
   (pas de date fixée, mais l'intention est actée — ne pas les re-proposer comme "peut-être",
   juste les faire) :
   - **Castellar** — petit village au-dessus de Menton, région `arriere-pays`.
   - **Bellet** (vignoble AOC dans les collines de Nice) et **Cimiez** (arènes romaines,
     monastère, oliveraie) — à ajouter comme nouveaux lieux sur la ville `nice` déjà
     existante (même schéma que `parc-mont-boron` cette nuit), pas de nouvelle ville.
   - Reprendre la même méthodologie que cette nuit (coordonnées vérifiées, badges vérifiés
     un par un, activités angle secret) — voir le reste de ce document.
   - Question ouverte pour la session qui fera ce travail : Bellet et Cimiez sont-ils deux
     lieux séparés ou un seul (ce sont deux endroits assez distincts géographiquement dans
     Nice) ? À trancher au moment de la recherche, pas figé ici.
   - Photos : suivre la même politique placeholder que cette nuit sauf indication contraire
     de l'utilisateur à ce moment-là.
3. **Candidats non confirmés, mentionnés par l'agent mais pas retenus par l'utilisateur** —
   à ne traiter que si quelqu'un les redemande explicitement :
   - `arriere-pays` : Vence (centre historique, distinct de Saint-Paul-de-Vence déjà
     couvert) — jugé moins prioritaire que Castellar par l'utilisateur (implicitement, en ne
     le citant pas).
   - `golfe-st-tropez`/`antibes-cannes` : Valbonne (bastide Renaissance à plan en damier,
     géographiquement plus proche d'Antibes/Sophia-Antipolis que du golfe — si ajoutée un
     jour, la rattacher à `antibes-cannes` par cohérence géographique, comme Mougins l'a été
     cette nuit).
4. **Aucune ville/lieu/activité existant(e) n'a été modifié(e) ou supprimé(e)** cette nuit —
   uniquement des ajouts, conformément au garde-fou. Seule exception au sens strict :
   l'ajout de `"parc-mont-boron"` au tableau `lieux` de la ville `nice` déjà existante dans
   `data/villes.json` (append pur, aucun champ existant touché — ce tableau n'est de toute
   façon pas consommé par le backend, voir `BuildVille` dans `DatabaseSeeder.cs`).
5. **Vérification prod faite** : chaque lieu ajouté a été testé avec un `curl` sur
   `https://frontend-two-plum-92.vercel.app/lieux/<slug>` (200 partout) après chaque
   déploiement Vercel. Le dernier déploiement date de la fin de la région Antibes-Cannes ;
   un déploiement final a eu lieu après le lot golfe-St-Tropez et arrière-pays — revérifier
   au réveil que `https://frontend-two-plum-92.vercel.app/lieux/saorge-village` répond bien
   200 si un doute subsiste (c'est le tout dernier lieu ajouté).
