---
name: project-skills
description: "Skills Claude disponibles pour Riviera Secrète — ce que chaque skill fait, quand l'utiliser, fichiers concernés"
metadata: 
  node_type: memory
  type: project
  originSessionId: 763b5aa5-5cff-449e-8ca5-4e9e3dabe91d
---

Les skills sont dans `.claude/commands/`. Les invoquer avec `/nom-du-skill`.

## `/add-activities` → `.claude/commands/add-activities.md`

**Quand** : ajouter une section "Activités" à une page lieu qui n'en a pas encore.

**Ce qu'il fait** : insère `<section class="activities">` juste avant `<section class="related">` sur un fichier `lieux/*.html`.

**Ce que l'utilisateur doit fournir** : fichier cible + liste d'activités (nom, type gratuit/payant, durée, prix, URL, seed picsum optionnel).

**CSS** : toutes les classes `.activities*` et `.activity-*` sont déjà dans `assets/style.css` — ne pas les réécrire.

**Règles clés** :
- Badge `payant` → classe `payant` + lien "Réserver →" (sans classe `free`)
- Badge `gratuit` → classe `gratuit` + lien "En savoir plus →" + classe `free` sur le lien
- Afficher `💶 Accès libre` même pour les gratuits

---

## `/build-itinerary` → `.claude/commands/build-itinerary.md`

**Quand** : enrichir une page `itin/*.html` existante (pills d'activités, section booking, horaires cohérents, transits de trajet).

**Ce qu'il fait** (7 étapes) :
1. Lit le fichier itin cible
2. Lit les pages `lieux/*.html` de chaque étape pour extraire les activités
3. Vérifie la cohérence géographique (ordre est→ouest ou logique de route, pas de backtrack >5km)
4. Vérifie/ajuste les horaires (durée visite + temps trajet voiture) + ajoute blocs `.itin-transit`
5. Ajoute les pills `.stop-acts` (max 2 par étape) dans chaque `itin-stop`
6. Ajoute la section `.itin-booking` (3–4 activités payantes phares, avant `.itin-suggest`)
7. Vérification finale (ordre, horaires, déjeuner ~12h30, STOPS JS, etc.)

**Temps de trajet voiture** : ~1 min/km côtier, ~1.5 min/km montagne sinueuse. Ajouter 20–30% marge pour parking/feux.

**Blocs transit** : `li.itin-transit[aria-hidden]` avec `transit-arrow` (↓) + `transit-info` (🚗 Xmin — description route). CSS dans le `<style>` inline de la page.

**État actuel des itinéraires** :
- `menton-eze-monaco.html` — **complet** (pills + booking + 5 transits, 2 jours avec sleep marker)
- `nice-peillon-peille.html` — **complet** (pills + booking 3 items + 3 transits)
- `villages-perches.html` — **complet** (pills + booking 4 items + 5 transits)
- `antibes-biot-juan.html` — **complet** (pills + booking 3 items + 3 transits)
- `lerins-esterel.html` — **complet** (pills + booking 3 items + 2 transits, transit mixte ⛵+🚗)
- `grasse-saint-tropez.html` — **complet** (pills + booking 3 items + 2 transits)

---

## Patterns à retenir pour créer de nouveaux skills

- Les skills lisent le fichier cible, puis les fichiers `lieux/` associés
- Toujours vérifier si le CSS est déjà dans `assets/style.css` avant d'ajouter du CSS inline
- Utiliser `Edit` avec `old_string` précis pour éviter les collisions
- Les URLs externes (réservations) doivent être celles fournies par l'utilisateur, jamais inventées
