# Construire / enrichir une page itinéraire

Enrichit une page itinéraire de Riviera Secrète avec :
1. Des **pills d'activités inline** dans chaque étape
2. Une **section visuelle "À réserver avant de partir"**
3. Une **cohérence géographique et temporelle** des horaires
4. Un marqueur **"Dormir à…"** si l'itinéraire s'étend sur plusieurs jours

---

## Ce que tu dois recevoir de l'utilisateur

- Le fichier cible (ex: `itin/menton-eze-monaco.html`)
- Optionnel : indication si l'itinéraire doit être 1, 2 ou 3 jours

Si l'utilisateur ne précise pas le nombre de jours, **évalue toi-même** en fonction du nombre d'étapes, des distances et des durées d'activités (voir règles ci-dessous).

---

## Étape 1 — Lire le fichier itinéraire

Extraire :
- La liste des étapes (`itin-stop`) : heure, lieu, commune, description, lien vers le fichier `lieux/`
- Le tableau JS `STOPS` (coordonnées lat/lng de chaque étape)
- Le mode de transport (meta-bar)
- Le nombre de jours annoncé

---

## Étape 2 — Lire les pages lieux associées

Pour chaque étape, lire le fichier `lieux/` correspondant et extraire toutes les activités (`activity-card`) :
- Nom, badge (gratuit/payant), durée (⏱), prix (💶), URL, seed picsum

---

## Étape 3 — Vérifier la cohérence géographique

Analyser l'ordre des étapes par longitude (ou logique de route) :
- Les étapes doivent suivre un axe cohérent (ex: est→ouest, côte→arrière-pays, boucle)
- Si deux étapes consécutives créent un **backtrack** évident (revenir sur ses pas de >5 km), les inverser
- Corriger l'ordre dans le HTML **et** dans le tableau JS `STOPS` (les `n:` numéros doivent rester séquentiels)

---

## Étape 4 — Vérifier et ajuster les horaires

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
- **Un lieu qui mérite une nuit sur place** (Monaco, Saint-Tropez) : le placer en fin de Jour 1 ou Jour 2 et l'indiquer dans le sleep marker, pas en étape rapide

Pour les itinéraires multi-jours, répartir les étapes de façon **asymétrique si besoin** : Jour 1 plus chargé (route à faire, énergie fraîche), Jour 2 plus léger (flânerie, après-midi libre, baignade). L'idéal n'est pas 3+3 mais peut être 4+2 si le Jour 2 a un lieu qui se "déguste" lentement.

### Blocs de trajet entre les étapes

Insérer un élément `.itin-transit` entre chaque paire d'étapes consécutives pour afficher la durée et la route :

```html
<li class="itin-transit" aria-hidden="true">
  <span class="transit-arrow">↓</span>
  <span class="transit-info">🚗 [DURÉE] — [DESCRIPTION ROUTE]</span>
</li>
```

**CSS à ajouter dans le `<style>` de la page** (seulement si pas déjà présent) :

```css
.itin-transit{ display:grid; grid-template-columns:70px 1fr; gap:18px; padding:2px 0; }
.transit-arrow{ font-size:0.75rem; color:var(--text-muted); opacity:0.4; text-align:center; }
.transit-info{ font-family:'IBM Plex Mono',monospace; font-size:0.68rem; color:var(--text-muted); font-style:italic; display:flex; align-items:center; }
@media (max-width:600px){ .itin-transit{ grid-template-columns:1fr; } .transit-arrow{ display:none; } }
```

Règles :
- Description courte (route ou axe principal, ex: `Grande Corniche`, `bord de mer, souvent chargé`)
- Durée estimée réaliste (pas GPS optimiste — ajouter 20–30 % pour parking/feux)
- Le bloc `.itin-transit` n'a pas de `border-top` : il s'appuie visuellement sur la bordure de l'étape suivante
- Sur mobile, la flèche est masquée et le bloc passe en colonne unique

### Itinéraire multi-jours

Si l'itinéraire couvre 2 ou 3 jours, insérer un marqueur **"Dormir à…"** entre les jours :

```html
<li class="itin-stop itin-sleep">
  <span class="itin-time">Nuit</span>
  <div class="itin-stop-body">
    <span class="itin-stop-name itin-sleep-label">Dormir à [COMMUNE]</span>
    <span class="itin-stop-commune">[COMMUNE]</span>
    <p>[Suggestion courte : type d'hébergement, ambiance du soir, pourquoi dormir ici]</p>
  </div>
</li>
```

Ajouter dans le bloc `<style>` de la page :

```css
.itin-sleep .itin-time{ color:var(--text-muted); }
.itin-sleep-label{ font-family:'Fraunces',serif; font-weight:600; font-size:1.08rem;
  color:var(--text); display:inline-block; font-style:italic; }
.itin-sleep .itin-stop-body p{ font-style:normal; }
```

---

## Étape 5 — Ajouter les pills d'activités inline

Dans chaque `itin-stop`, ajouter **après le `<p>` de description** un bloc `.stop-acts` avec 1 à 2 activités choisies parmi celles du lieu (prioriser les plus emblématiques ou les payantes qui se réservent).

```html
<div class="stop-acts">
  <a class="stop-act stop-act--paid" href="[URL]" target="_blank" rel="noopener">[Nom · Prix · Durée]</a>
  <a class="stop-act stop-act--free" href="[URL]" target="_blank" rel="noopener">[Nom · Libre]</a>
</div>
```

**CSS à ajouter dans le `<style>` de la page** (seulement si pas déjà présent) :

```css
.stop-acts{ display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
.stop-act{ font-family:'IBM Plex Mono',monospace; font-size:0.71rem; letter-spacing:0.02em;
  padding:4px 10px; border-radius:2px; text-decoration:none; white-space:nowrap; transition:opacity 0.15s; }
.stop-act:hover{ opacity:0.7; }
.stop-act--paid{ background:rgba(232,163,61,0.1); color:var(--terracotta); border:1px solid rgba(232,163,61,0.22); }
.stop-act--free{ background:rgba(74,144,185,0.08); color:var(--azure); border:1px solid rgba(74,144,185,0.18); }
```

Règles :
- Texte du pill payant : `[Nom abrégé · Prix · Durée]` (ex: `Jardin exotique · 8–10 € · 45 min`)
- Texte du pill gratuit : `[Nom abrégé · Libre]` (ex: `Chemin Nietzsche · Libre`)
- Maximum 2 pills par étape pour ne pas surcharger
- Ne pas répéter la même activité dans la section visuelle ET dans la même étape (choisir l'un ou l'autre)

---

## Étape 6 — Ajouter la section "À réserver avant de partir"

Insérer **avant** `<section class="itin-suggest">` une section avec 3 à 4 activités payantes choisies parmi les plus emblématiques de l'itinéraire (1 par lieu max, prioriser les entrées qui se réservent à l'avance).

```html
<section class="itin-booking">
  <div class="wrap">
    <h2>À réserver avant de partir</h2>
    <p>Ces expériences demandent un peu d'anticipation, surtout en haute saison.</p>
    <div class="itin-booking-grid">

      <!-- Répéter pour chaque activité sélectionnée -->
      <div class="itin-booking-card">
        <div class="itin-booking-img">
          <img src="https://picsum.photos/seed/[SEED]/400/300" alt="[ALT]" loading="lazy">
        </div>
        <div class="itin-booking-body">
          <span class="itin-booking-lieu">[COMMUNE]</span>
          <span class="itin-booking-name">[NOM ACTIVITÉ]</span>
          <div class="itin-booking-meta">
            <span>⏱ [DURÉE]</span>
            <span>💶 [PRIX]</span>
          </div>
          <a class="itin-booking-link" href="[URL]" target="_blank" rel="noopener">Réserver →</a>
        </div>
      </div>

    </div>
  </div>
</section>
```

**CSS à ajouter dans le `<style>` de la page** (seulement si pas déjà présent) :

```css
.itin-booking{ padding:56px 0 32px; border-top:1px solid var(--line); }
.itin-booking h2{ font-family:'Fraunces',serif; font-size:1.5rem; font-weight:600; margin:0 0 4px; }
.itin-booking > .wrap > p{ color:var(--text-muted); font-size:0.9rem; margin:0 0 28px; }
.itin-booking-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
@media (max-width:900px){ .itin-booking-grid{ grid-template-columns:repeat(2,1fr); } }
@media (max-width:500px){ .itin-booking-grid{ grid-template-columns:1fr; } }
.itin-booking-card{ border:1px solid var(--line); border-radius:3px; overflow:hidden; }
.itin-booking-img{ aspect-ratio:4/3; overflow:hidden; }
.itin-booking-img img{ width:100%; height:100%; object-fit:cover; display:block; transition:transform 0.3s; }
.itin-booking-card:hover .itin-booking-img img{ transform:scale(1.04); }
.itin-booking-body{ padding:12px 14px 14px; }
.itin-booking-lieu{ font-family:'IBM Plex Mono',monospace; font-size:0.67rem; text-transform:uppercase;
  letter-spacing:0.08em; color:var(--azure); display:block; margin-bottom:4px; }
.itin-booking-name{ font-family:'Fraunces',serif; font-weight:600; font-size:0.95rem;
  display:block; margin-bottom:8px; line-height:1.3; }
.itin-booking-meta{ font-size:0.8rem; color:var(--text-muted); margin-bottom:10px; display:flex; gap:10px; }
.itin-booking-link{ font-family:'IBM Plex Mono',monospace; font-size:0.73rem; color:var(--terracotta);
  text-decoration:none; font-weight:500; letter-spacing:0.03em; }
.itin-booking-link:hover{ text-decoration:underline; }
```

Si l'itinéraire a 3 activités (pas 4), utiliser `grid-template-columns:repeat(3,1fr)` à la place.

---

## Étape 7 — Vérification finale

1. L'ordre des étapes est géographiquement logique
2. Les horaires sont cohérents (durée visite + trajet = heure de départ suivante)
3. Le déjeuner est bien placé (~12:30)
4. Chaque étape a ses pills (1–2 max)
5. Un bloc `.itin-transit` est inséré entre chaque paire d'étapes consécutives
6. La section `.itin-booking` est bien **avant** `.itin-suggest`
7. Le tableau JS `STOPS` a les `n:` dans le bon ordre correspondant aux étapes HTML
8. Si multi-jours : les marqueurs `.itin-sleep` sont présents entre chaque journée
9. Le meta-bar reflète le bon nombre de jours (ex: "2 jours · 8 étapes")
10. La description intro reflète la logique de la route (ex: "est → ouest via les corniches")
