# Cahier des maquettes — Riviera Secrète

Ce document décrit six maquettes basse fidélité (wireframes) issues de l'audit UX/UI du 17 septembre 2026. Il est écrit pour qu'un autre agent (Claude ou humain) puisse **reproduire chaque écran à l'identique** en HTML/CSS, Figma ou directement dans le code du site (Next.js + Tailwind, thème sombre existant).

Fichiers liés, dans le même dossier :
- `audit-ux-riviera-secrete.md` — l'audit complet, dont les constats numérotés (1.1, 2.2…) référencés ci-dessous.
- `audit-riviera-secrete.html` — la page HTML publiée contenant le rendu exact des six wireframes (section `#maquettes`). C'est la référence visuelle : ouvrir ce fichier dans un navigateur pour voir le rendu attendu.
- Version en ligne : https://claude.ai/artifact/5A7LJnTQrSXwJznAMjmg98

---

## 0 · Conventions communes

### 0.1 Niveau de fidélité
Wireframes **basse fidélité** : blocs gris pour les images, traits pour le texte non significatif, texte réel pour les libellés qui comptent (boutons, titres, chiffres). Pas de couleur de marque sauf l'accent, pas de photo, pas d'ombre sauf indication. Le but est de fixer **structure, ordre, dimensions, libellés et états**, pas le style final.

### 0.2 Viewports
- **Mobile** : 375 × 812 px (iPhone 13 mini / X). Le cadre du wireframe est un rectangle 9 : 18,5 avec coins arrondis 28 px et bordure 6 px.
- **Desktop** : 1280 × 800 px. Cadre rectangulaire, bordure 3 px, coins 8 px.
- La **ligne de flottaison** (fold) est à 812 px sur mobile, 800 px sur desktop, header compris.

### 0.3 Jetons de couleur des wireframes
| Jeton | Rôle | Clair | Sombre |
|---|---|---|---|
| `wf-bg` | fond d'écran | `#E9ECE8` | `#242B2F` |
| `wf-blk` | bloc image | `#C9D0CB` | `#3A444B` |
| `wf-line` | traits de texte, bordures | `#B4BDB6` | `#4C575F` |
| `wf-ink` | texte, cadre du téléphone | `#3A444D` | `#D5DDE2` |
| `wf-acc` | accent (boutons primaires, sélection) | `#0E6C8A` | `#5CB8D6` |
| `wf-acc-soft` | fond de chip sélectionnée, récap | `#BFDCE6` | `#2A4C58` |
| `wf-bad` | annotation « problème », alerte | `#B3261E` | `#F0847A` |
| `wf-ok` | annotation « corrigé », état ajouté | `#2F7A57` | `#7BCB9E` |
| `panel` | fond de carte / barre collante | `#FFFFFF` | `#1A2023` |

Pour une implémentation dans le site réel, remplacer par les jetons existants : fond `#0C1116` (navy), accent orange (`--azure`/orange des CTA actuels), crème pour le texte titre (Fraunces).

### 0.4 Composants de wireframe (vocabulaire)
| Nom | Description | Dimensions |
|---|---|---|
| **Header** | barre supérieure, logo à gauche, icônes à droite | mobile 22 px de haut dans le wireframe (56 px réels recommandés, 77 px actuels) |
| **Bloc image** (`blk`) | rectangle plein `wf-blk`, coins 4 px | selon écran |
| **Ligne de texte** (`ln`) | trait `wf-line` 6 px de haut, coins 3 px ; variante titre `ln.t` = 10–16 px, couleur `wf-ink` | largeur en % indiquée |
| **Chip** | pilule bordée 1 px `wf-line`, hauteur 16 px, padding 0 7 px, texte 8 px ; état `on` = fond `wf-acc-soft`, bordure `wf-acc` | — |
| **Rangée de chips défilante** (`chips.row`) | chips sur une seule ligne, débordement masqué avec dégradé de transparence sur les 20 % droits (indique qu'on peut faire défiler) | — |
| **Bouton primaire** (`btn`) | fond `wf-acc`, texte blanc 9 px semi-gras, hauteur 22 px, coins 5 px | pleine largeur sauf mention |
| **Bouton secondaire** (`btn.o`) | transparent, bordure 1 px `wf-acc`, texte `wf-acc` | — |
| **Bouton petit** (`btn.sm`) | hauteur 18 px, texte 8 px | — |
| **Sélecteur** (`sel`) | champ 20 px de haut, bordure `wf-line`, fond `panel`, texte 9 px, chevron à droite | — |
| **Carte** (`card`) | fond `panel`, bordure 1 px `wf-line`, coins 6 px, padding 6 px, disposition en ligne : vignette 40 × 32 à gauche, texte à droite | — |
| **Barre collante** (`sticky-b`) | fixée en bas de l'écran, fond `panel`, bordure haute 1 px, padding 6 × 10 px | hauteur 34–52 px |
| **Étiquette d'annotation** (`badge`) | petit rectangle rouge (`wf-bad`) ou vert (`wf-ok`), texte mono 8 px blanc ; sert à annoter le wireframe, ne fait pas partie de l'écran | — |
| **Ligne de flottaison** (`fold`) | trait pointillé rouge horizontal pleine largeur avec libellé à droite ; annotation | — |
| **Carte géographique** (`map`) | rectangle à hachures diagonales 45° (`wf-blk`/`wf-bg` alternés 6 px), bordure `wf-line`, libellé centré | — |
| **Paire clé/valeur** (`kv`) | grille 2 colonnes (clé en `muted` 8 px, valeur 8 px) | — |

### 0.5 Règles d'annotation
- Chaque paire de wireframes est présentée **Avant** (gauche) puis **Après** (droite), même viewport, même hauteur.
- Sur « Avant », une étiquette rouge pointe le défaut mesuré et la ligne de flottaison indique où commence le contenu utile.
- Sur « Après », une étiquette verte donne la nouvelle position du contenu utile.
- Le texte des wireframes « Après » est **en français** (langue cible principale), celui des « Avant » reprend l'anglais du site actuel.

---

## M1 · Composeur mobile — les lieux d'abord, les réglages en récapitulatif

**Constats corrigés** : 1.1, 1.2, 1.3, 1.4, 1.5, 1.7.
**Viewport** : mobile 375 × 812.
**Page** : `/composer` (avec paramètres venus de l'accueil : durée, départ, date, envie).

### Avant (état actuel, ordre vertical exact)
1. Header (logo « Riviera Secrète », icônes 🔍 ☰).
2. Titre « Compose my itinerary » (ligne titre 14 px, 70 %) + sous-titre (55 %).
3. Libellé « Duration » + 4 chips « Half day · **Full day** (on) · 2 days · 3 days » sur deux lignes.
4. Libellé « Starting from » + rangée : **sélecteur écrasé de 22 px de large ne montrant qu'un chevron** (annotation rouge « 26 px ») + champ heure « 09:00 AM ◷ » qui prend le reste.
5. Libellé « Date » + champ « 09/17/2026 ▦ ».
6. Libellé « Transport » + chips « 🚗 Car (on) · 🚆 Train + walking ».
7. Champ « 🔍 Name, town… ».
8. Chips zones : « Menton · Monaco · Nice · Hinterland · Antibes · Cannes · Grasse · Saint-Tropez · Clear all ».
9. Chips activités : « 🏖️ Beach · **🥾 Hiking** (on) · 🚵 Mountain biking · 🤿 Diving ».
10. **Ligne de flottaison** annotée « ligne de flottaison · 1er lieu à 1 342 px ».
11. Barre collante bas : texte « 2 placex, 5 h » à gauche (bug de pluriel volontairement reproduit), bouton petit « Compose the itinerary → » à droite.

### Après (cible, ordre vertical exact)
1. Header identique (logo, 🔍 ☰) — 56 px réels.
2. Titre « Composer ma journée » (ligne titre 14 px, 60 %).
3. **Barre récapitulative** : carte pleine largeur, fond `wf-acc-soft`, bordure `wf-acc`, padding 6 × 8 px. Texte gauche semi-gras : « Journée · Nice · 9 h · Voiture ». Texte droit en accent, semi-gras : « Modifier ». Au tap : ouvre un tiroir (bottom sheet) avec les quatre réglages (durée en segmented control sur une ligne, départ = sélecteur pleine largeur **≥ 160 px**, heure sur sa propre ligne, date, transport).
4. Rangée : champ « 🔍 Nom, commune, activité » (flex 1) + bouton secondaire petit « Filtres · 1 » (le chiffre = nombre de filtres actifs).
5. **Rangée de chips défilante** (une seule ligne, dégradé à droite) : « **Randonnée** (on) · Menton · Monaco · Nice · Arrière-pays · Antibes ». Le filtre activité venu de l'accueil apparaît ici, déjà sélectionné.
6. Ligne de texte 40 % (compteur, ex. « 36 lieux correspondent »).
7. **Liste de lieux sur une colonne**, cartes en ligne (vignette 40 × 32 à gauche, texte au centre, bouton à droite) :
   - « Sentier du Cap Ferrat » — kv : « Saint-Jean » / « 2 h 30 · Sentier · Baignade » — bouton **« Ajouté ✓ »** fond `wf-ok`, bordure de carte `wf-ok`.
   - « Èze, le village perché » — « Èze » / « 1 h 45 · Village · Vue » — « Ajouté ✓ » (idem).
   - « Le Trophée d'Auguste » — « La Turbie » / « 1 h · Monument · 7 € » — bouton secondaire « Ajouter ».
   - « Village de Roquebrune-Cap-Martin » — « Roquebrune » / « 1 h 30 · Village » — « Ajouter ».
   - « Colline du Château » — « Nice » / « 1 h · Vue · Gratuit » — « Ajouter ».
   Le titre est en 8–9 px semi-gras, **sur deux lignes si nécessaire, jamais tronqué**. Toute la carte est tappable ; le bouton reflète l'état.
8. Annotation verte à droite du titre : « 1er lieu à 210 px ».
9. **Barre collante bas** (deux lignes, 52 px) :
   - Ligne 1 : gauche « **2 lieux · 4 h 15 sur place** · 45 min de route » ; droite en vert « Il reste 3 h ✓ » (si la journée est dépassée : rouge « Dépasse de 40 min »).
   - Ligne 2 : bouton primaire pleine largeur « Composer ma journée → ». **Désactivé** (opacité 50 %, non cliquable) tant qu'aucun lieu n'est sélectionné ; dans ce cas la ligne 1 affiche « Choisissez vos lieux ci-dessous. Nous les ordonnerons avec les horaires du jour. »

### États à prévoir
- Sélection vide : barre collante en mode texte d'aide, bouton désactivé, aucune suggestion.
- Sélection ≥ 1 : suggestion « Il reste 3 h : ajouter la Rue Obscure ? (20 min, 15 min de route) » sous le compteur, en carte accentuée.
- Filtres actifs : « Filtres · n » avec n en accent ; le tiroir a un bouton « Tout effacer ».

---

## M2 · Résultat desktop — timeline et carte côte à côte

**Constats corrigés** : 2.1, 2.2, 2.3, 2.4, 2.5.
**Viewport** : desktop 1280 × 800.
**Page** : `/composer?jours=…` (résultat) et `/composer?id=…` (sauvegardé).

### Avant
1. Header : « Riviera Secrète · Explore · Itineraries · The notebook » | « Compose an itinerary ».
2. Rangée : titre (ligne 30 %) à gauche ; à droite 4 chips de même poids : « ← Choose other places · 🖨 Export as PDF · 🔗 Share link · **Save** (on) ».
3. Grille 2 colonnes **1fr / 2fr** :
   - Gauche : sous-titre « Day 1 — 3 places » puis 3 cartes (vignette, deux lignes de texte, « ▲ ✕ ▼ » en 8 px à droite).
   - Droite : **zone vide** encadrée en pointillé rouge, texte centré rouge « vide (≈ 2/3 de la largeur) », hauteur ≥ 110 px.
4. Carte géographique pleine largeur, 60 px, libellé « carte pleine largeur, sous la ligne de flottaison ».
5. Trois lignes de texte (début du « Detailed itinerary »).

### Après
1. Header : « Riviera Secrète · Explorer · Itinéraires » | « 👤 Maxime ▾ » (menu compte).
2. Rangée d'en-tête : gauche titre (160 px) + sous-titre (110 px) ; droite deux boutons : secondaire « Partager ▾ » (menu : Copier le lien · PDF · Ajouter à l'agenda) et primaire vert « Enregistré ✓ » (avant sauvegarde : « Enregistrer » en accent ; après : vert, cliquable → carnet).
3. Grille 2 colonnes **3fr / 2fr**, gap 8 px :
   - **Colonne gauche : timeline**. Chaque étape est une grille `28px | 1fr` : heure en mono accent 9 px semi-gras à gauche, carte à droite (fond `panel`, bordure, coins 5 px, padding 5 px).
     - « 09:00 » — « Départ de Nice · 🚗 25 min » (carte sans titre).
     - « 09:25 » — carte avec **bordure gauche 3 px accent** (étape courante/sélectionnée) : titre gras « 1 · Èze, le village perché », poignée « ⋮⋮ » à droite ; ligne « 1 h 45 · Jardin exotique 10 € · réserver en ligne » ; rangée de deux boutons secondaires petits « Google Maps » « Waze ».
     - Ligne de trajet (8 px, `muted`, décalée de 34 px) : « 🚗 20 min · Moyenne Corniche ».
     - « 11:30 » — « 2 · Sentier du Cap Ferrat » + « ⋮⋮ » ; « 2 h 30 · gratuit · baignade possible ».
     - « 14:10 » — **carte d'alerte** : bordure `wf-bad`, fond ambre clair (`#F8EBD4` / sombre `#3B2F17`) ; titre rouge « ⚠ Déjeuner tardif » ; texte « Inverser Èze et Cap Ferrat pour déjeuner à 12 h 45 ? » + lien accent gras « Optimiser ».
     - « 15:30 » — « 3 · Colline du Château » + « ⋮⋮ » ; « 1 h · gratuit ».
   - **Colonne droite (sticky, top 0)** :
     - Carte géographique 120 px : « carte collante · étapes 1 2 3 · trajet ».
     - Bloc kv (fond `panel`, bordure, padding 6) : « Sur place | 5 h 15 », « Route | 1 h », « Entrées | 10 € · options dès 30 € », « Fin estimée | 16 h 30 ».
     - Bouton secondaire petit pleine largeur « Ajouter à mon agenda (.ics) ».

### Interactions
- « ⋮⋮ » = poignée de glisser-déposer sur toute la hauteur de la carte ; au survol, le curseur `grab`.
- « Retirer » n'apparaît qu'au survol/focus de la carte, bouton 44 px ; après clic, toast « Étape retirée · Annuler » 6 s.
- « Optimiser » réordonne pour respecter la fenêtre déjeuner 12 h–14 h et fait défiler jusqu'à l'étape modifiée.
- En dessous de 900 px : la colonne droite passe sous l'en-tête, la carte fait 240 px, la timeline suit.

---

## M3 · Explorer mobile — filtres compacts, liste plein écran, carte à la demande

**Constats corrigés** : 3.1, 3.2, 3.3.
**Viewport** : mobile 375 × 812.
**Page** : `/explorer`.

### Avant
1. Header.
2. Fil d'Ariane (ligne 30 %) + titre « Explore » (ligne 40 %, 14 px).
3. Champ « 🔍 Name, town, activity… ».
4. **Bloc de 17 chips** sur 5–6 lignes : « Menton · Monaco, Nice, Hinterland, Antibes · Cannes, Grasse · Saint-Tropez, 🏖️ Beach, 🥾 Hiking, 🚵 Mountain biking, 🤿 Diving, 🍽️ Restaurant, 🏘️ Village, 🥾 Trail, 🏖️ Cove, 🌿 Garden, 🏛️ Monument, 🌄 Viewpoint, 🍽️ Dining ».
5. Rangée de deux sélecteurs « Any season ⌄ » « Any duration ⌄ ».
6. Rangée « Any level ⌄ » « 📍 Near me ».
7. Sélecteur « 🎲 Surprise me ».
8. Ligne 35 % (« 43 of 43 places »).
9. Bouton secondaire petit « View on map ».
10. **Ligne de flottaison** annotée « 1er lieu à 946 px ».
11. Une carte de lieu à 50 % d'opacité (hors écran).

### Après
1. Header.
2. Rangée : titre « Explorer » (40 %, 14 px) à gauche, compteur « 43 lieux » à droite (9 px).
3. Rangée : champ « 🔍 Nom, commune, activité » (flex 1) + bouton secondaire petit « Filtres » (devient « Filtres · 2 » quand actif).
4. **Rangée de chips défilante 1 — zones** : « **Toute la côte** (on) · Menton · Monaco · Nice · Arrière-pays · Antibes · Cannes ».
5. **Rangée de chips défilante 2 — types** (taxonomie fusionnée, sans émoji) : « Baignade · Sentier · Village · Vue · Jardin · Monument · Table ».
   - Fusion imposée : Beach + Cove → **Baignade** ; Hiking + Trail → **Sentier** ; Restaurant + Dining → **Table** ; Viewpoint → **Vue** ; Garden → **Jardin** ; Monument ; Village ; Mountain biking et Diving passent dans le panneau « Filtres » (activités secondaires).
6. **Liste de lieux pleine page** (défile avec la page, pas de boîte interne). Carte en ligne : vignette **64 × 48**, texte : titre 9 px gras, kv « Commune | durée · prix », ligne 8 px `muted` avec les tags texte (max 3, puis « +2 ») :
   - « La Rue Obscure » — « Villefranche | 30 min · gratuit » — « Ruelle · Baignade · Table »
   - « Sentier du Cap Ferrat » — « Saint-Jean | 2 h 30 · gratuit » — « Sentier · Baignade · Plongée »
   - « Villa Kérylos » — « Beaulieu | 1 h 15 · 14 € » — « Monument · Table »
   - « Èze, le village perché » — « Èze | 1 h 45 · jardin 10 € » — « Village · Vue · Sentier »
   - « Le Trophée d'Auguste » — « La Turbie | 1 h · 7 € »
7. **Bouton flottant** centré en bas (position absolue, bottom 14 px, centré) : primaire, pilule (coins 14 px, hauteur 28 px, padding 0 14 px), ombre `0 4px 12px rgba(0,0,0,.25)`, texte « 🗺 Carte ». Ouvre la carte en plein écran avec les marqueurs filtrés ; un bouton symétrique « ☰ Liste » permet de revenir.
8. Annotation verte : « 1er lieu à 190 px ».

### Panneau « Filtres » (bottom sheet, non dessiné)
Sections : Saison (chips 4), Durée (chips 4), Niveau (chips 2), Activités secondaires (VTT, Plongée), Options (Près de moi, Surprise-moi). Pied : « Tout effacer » + « Voir 12 lieux » (compteur vivant).

### Desktop (dérivé, non dessiné)
Liste à gauche (40 %) à hauteur de fenêtre, carte collante à droite (60 %). Les filtres tiennent en une rangée + bouton « Filtres ». Pas de « See 19 more » : défilement continu ou pagination classique.

---

## M4 · Fiche lieu mobile — dire ce qu'est l'endroit avant de proposer d'y aller

**Constats corrigés** : 4.1, 4.2, 4.3, 3.3.
**Viewport** : mobile 375 × 812.
**Page** : `/lieux/[slug]` (exemple : Èze).

### Avant
1. Header.
2. Fil d'Ariane (ligne 60 %, 5 px).
3. **Carrousel** : bloc image 100 px avec compteur « 1 / 3 » en bas à gauche (fond noir 50 %, texte blanc 8 px).
4. Sur-titre (ligne 45 %).
5. Titre (ligne 90 %, 16 px).
6. Chips « 🥾 Hiking · 🚵 Mountain biking · 🍽️ Restaurant ».
7. Quatre lignes de métadonnées (85 %, 60 %, 50 %, 70 %) = saison, durée, niveau, coordonnées GPS.
8. **Six chips d'action** sur plusieurs lignes : « 🗺️ Google Maps · 🚗 Waze · 📍 Maps · ♡ Add to favorites · 🔗 Share · ➕ Add to an itinerary ».
9. **Ligne de flottaison** annotée « description à 1 027 px ».
10. Deux lignes de description à 50 % d'opacité.
11. Barre collante : bouton petit « Get directions » + « ♡ 🔗 ➕ ».

### Après
1. Header contextuel : gauche « ‹ Explorer » (retour), droite « ♡ ⇪ » (favori, partager). Le favori posé passe en cœur plein ; toast « Ajouté à vos favoris · Voir le carnet ». Déconnecté : bottom sheet « Enregistrez ce lieu dans votre carnet · Continuer avec Google · Email », dans la langue courante, retour sur la fiche avec le favori posé.
2. **Sur-titre** en capitales accent 8 px semi-gras : « ÈZE · MENTON, MONACO & FRONTIÈRE ».
3. **Titre** 15 px, famille display (Fraunces dans le site réel), interligne 1,1 : « Èze, le village perché ».
4. **Accroche** 9 px, une à deux lignes : « 400 m au-dessus de la mer, des ruelles si étroites que les maisons se touchent. Y aller avant 10 h. »
5. **Photo** : bloc image 96 px, étiquette « 3 photos » en bas à droite (ouvre la galerie plein écran ; pas de carrousel en ligne).
6. **Tableau de métadonnées** (kv 4 colonnes `auto 1fr auto 1fr`, fond `panel`, bordure, padding 6) : « Durée | 1 h 30 à 2 h », « Niveau | Facile, pentu », « Saison | Toute l'année », « Parking | Payant, en bas ». **Pas de coordonnées GPS.**
7. Chips de type texte (sans émoji) : « Village · Vue · Sentier · Table ».
8. Carte contextuelle bordure accent : « 🧭 **Sur l'itinéraire « Corniches »** · étape 3 · 12 h 30 » (lien vers l'itinéraire prêt qui passe ici).
9. Sous-titre de section (ligne 40 %, 8 px, `wf-ink`) puis trois lignes de description (100 %, 90 %, 75 %).
10. Annotation verte : « titre à 60 px ».
11. **Barre collante unique** : bouton primaire flex 1 « ➕ Ajouter à ma journée » + bouton secondaire « Y aller ▾ » (menu : Google Maps · Waze · Apple Maps). Après ajout, le primaire devient « Ajouté · Voir ma journée (3) ».

### Sections suivantes (hors wireframe, ordre recommandé)
Description complète → « Le bon moment » (accès, meilleure heure) → « À faire ici » (gratuit / payant, horaires, prix, lien) → carte → « À moins de 20 minutes » → « Vous aimerez aussi ».

---

## M5 · Recherche — overlay instantané

**Constat corrigé** : 6.1.
**Viewport** : mobile 375 × 812 (identique en desktop, centré, 560 px de large).
**Déclencheur** : icône 🔍 du header, ou raccourci `/` et `Ctrl/Cmd+K` sur desktop.

### Écran (un seul état dessiné : requête « eze »)
1. Header de l'overlay : « Riviera Secrète » à gauche, « ✕ » à droite.
2. Champ de saisie en focus : hauteur 26 px, bordure accent, texte « 🔍 eze », indication « esc » en `muted` à droite.
3. Libellé de groupe 8 px `muted` espacé : « LIEUX ».
4. Deux cartes résultat (vignette 32 × 28) :
   - « **Èze**, le village perché » (partie correspondante soulignée) — « Èze · 1 h 45 · Village ».
   - « Col d'**Èze**, boucles VTT » — « Èze · 2 à 3 h · gratuit ».
5. Libellé « ITINÉRAIRES » + carte sans vignette : « Roquebrune, **Èze** & Monaco : les corniches » — « 6 étapes · 2 jours ».
6. Libellé « ACTIVITÉS » + chips : « Jardin exotique d'Èze · Chemin de Nietzsche ».
7. Espace flexible.
8. Pied 8 px `muted` : « Rien trouvé ? **Voir les 43 lieux** » (lien accent).

### Règles fonctionnelles
- Recherche côté client sur l'index des 43 lieux, 6 itinéraires et activités : nom, commune, tags, texte d'accroche.
- Insensible aux accents et à la casse (« eze » → « Èze »), résultats dès le premier caractère, 300 ms de debounce.
- Groupes vides masqués. Max 5 résultats par groupe.
- Entrée ouvre le premier résultat ; flèches pour naviguer ; `aria-activedescendant` géré.
- État vide (aucun résultat) : « Aucun lieu pour « xyz ». Essayez une commune ou une activité. » + « Voir les 43 lieux ».
- Aucune page `/recherche` à maintenir. Si une URL `/recherche?q=` est conservée, elle ouvre l'explorateur avec le champ pré-rempli.

---

## M6 · Mode « Sur place » — thème clair pour l'usage en extérieur

**Constat corrigé** : 9.1 (et 2.2, 2.3 par extension).
**Viewport** : mobile 375 × 812.
**Page** : vue « Ma journée » d'un itinéraire (résultat ou sauvegardé), déclenchée par le bouton « ☀ Sur place » ou automatiquement le jour de l'itinéraire.

### Palette spécifique (thème clair fort contraste)
| Rôle | Valeur |
|---|---|
| Fond | `#F6F3EC` (crème très clair) |
| Texte | `#1E2A33` |
| Texte secondaire | `#5B6672` |
| Accent | `#0E6C8A` |
| Bordures | `#D8D2C4` |
| Cartes | `#FFFFFF` |

Contraste texte/fond ≥ 12:1. Corps de texte réel : **18 px**, boutons **52 px** de haut.

### Écran
1. Header : « ‹ Ma journée » à gauche, « ☀ Sur place » à droite (état actif).
2. Rangée : titre display 13 px « Maintenant · 11 h 30 » ; droite « Étape 2 / 3 » en secondaire.
3. **Carte d'étape courante** (fond blanc, bordure 2 px accent, padding 8, colonne) :
   - Titre 12 px gras « Sentier du Cap Ferrat ».
   - « Jusqu'à 14 h · 2 h 30 · boucle 7 km ».
   - « Parking : plage de Passable, 3 €/h ».
   - Bouton primaire 28 px (52 px réels), texte 11 px : « Lancer la navigation » (ouvre l'app GPS par défaut de l'utilisateur, choisie une fois).
4. Carte suivante (fond blanc, bordure claire) : « **Puis** 14 h 10 · Déjeuner ~1 h · Saint-Jean ».
5. Carte suivante : « **15 h 30** · Colline du Château · 1 h ».
6. Espace flexible.
7. Barre collante : gauche « 🔋 Mode clair · gros caractères » (9 px), droite lien accent « Mode nuit ».

### Règles
- Une seule étape développée à la fois (la courante, déterminée par l'heure). Les autres sont repliées en une ligne.
- Bascule Sur place / Nuit mémorisée par appareil. Le thème sombre reste le thème de préparation.
- Respecter `prefers-color-scheme` pour le reste du site (thème clair standard à définir, non dessiné ici).

---

## Annexe A · Reproduire les wireframes en HTML

Le fichier `audit-riviera-secrete.html` contient le CSS complet des composants listés en 0.4 (classes `.ph`, `.dk`, `.wf-hdr`, `.blk`, `.ln`, `.chips`, `.btn`, `.sel`, `.card`, `.sticky-b`, `.badge`, `.fold`, `.map`, `.kv`, `.timeline`, `.stop`, `.drive`, `.grid2`) et le HTML des six maquettes dans la section `id="maquettes"`. Pour reproduire :

1. Copier le bloc `<style>` (jetons `--wf-*` et classes ci-dessus).
2. Un écran mobile = `<div class="ph">…</div>` ; un écran desktop = `<div class="dk">…</div>`.
3. Empiler les composants dans l'ordre vertical donné pour chaque maquette ; `.spacer` pousse la barre collante en bas ; `.sticky-b` est en position absolue dans le cadre.
4. Les annotations sont `.badge` (rouge) / `.badge.ok` (vert) positionnées en absolu, et `.fold` pour la ligne de flottaison.
5. Présenter Avant/Après dans `<div class="mock"><div class="pair"><figure>…<figcaption><b>Avant</b>…</figcaption></figure><figure>…</figure></div></div>`.

## Annexe B · Reproduire en Figma
- Frames : « Mobile 375×812 » et « Desktop 1280×800 ». Grille 8 px.
- Styles de couleur : créer les jetons du 0.3 en deux modes (clair/sombre).
- Composants : Chip (variantes default/on), Button (primary/secondary, sm/md), Card (row/column), StickyBar, Annotation (bad/ok), FoldLine, MapPlaceholder.
- Textes : titres en Bricolage Grotesque ou Fraunces (site), corps IBM Plex Sans ou Inter (site), chiffres et heures en IBM Plex Mono.
- Nommer les frames `M1-Avant`, `M1-Après`, … et placer les paires côte à côte avec 80 px d'écart.
