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
| Menton, Monaco & la frontière | à faire | — | |
| Nice et ses environs immédiats | à faire | — | 1 seule ville existante (Nice) aujourd'hui, probablement le plus gros trou |
| L'arrière-pays : villages perchés & gorges | à faire | — | Candidats pressentis à vérifier : Sainte-Agnès, Coaraze, Sospel, Saorge, Lucéram, Gorbio, Vence (centre), Castellar |
| Antibes, Cannes & le massif de l'Estérel | à faire | — | |
| Grasse & le golfe de Saint-Tropez | à faire | — | Candidats pressentis : Mougins, Valbonne, Ramatuelle |

*(Mettre à jour "Statut" en `en cours` / `fait` / `interrompu — voir note`, et lister les
villes réellement ajoutées avec leur slug au fil de l'eau.)*

## Photos à remplacer (placeholders picsum → vraie photo, session future avec l'utilisateur)

*(Table à remplir au fil de l'ajout — un lieu par ligne, slug + nom.)*

| Slug lieu | Nom | Type (hero/thumb) |
|---|---|---|

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

*(à remplir par l'agent)*
