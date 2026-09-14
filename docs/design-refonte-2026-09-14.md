# Spec refonte — Riviera Secrète (maquettes 14 septembre 2026)

Extrait des 8 artboards du canvas `refonte-riviera-secrete.html`.
Chaque section est une instruction d'implémentation, pas une description.

---

## 1. Design system (`Systeme.dc.html`)

### Palette — un rôle par teinte, strictement

| Token | Hex | Rôle |
|-------|-----|------|
| Nuit | `#0C1A29` | Fond |
| Nuit haute | `#142A3E` | Surface, cartes |
| Calcaire | `#F0E9DC` | Texte principal, état sélectionné |
| Brume | `#A9BCCB` | Texte secondaire (contraste 8,7:1) |
| Aube | `#F2A25C` | **Action uniquement** — aucune autre usage |
| Pin | `#7FA98A` | Sémantique gratuit uniquement |
| Mer (5 valeurs) | `#4A7C9B` et déclinaisons | Zones de carte uniquement |

Le bleu-vert actuel cumule "clique ici", "gratuit" et "zone Nice" — à décomposer en ces trois teintes distinctes.

### Typographie — 5 crans, corps plancher à 16 px

| Cran | Police | Taille | Usage |
|------|--------|--------|-------|
| Display | Bodoni Moda | 40–56 px | Titres d'écran |
| Section | Bodoni Moda | 28 px | Titres de section |
| Carte | Karla 700 | 20 px | Titres de cartes cliquables |
| Corps | Karla | 16 px | **Plancher absolu** |
| Méta | Karla | 14 px | Métadonnées (commune, durée, prix) |
| Donnée | IBM Plex Mono | 12 px | Labels, données chiffrées, étiquettes |

Ajouter Google Fonts : `Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,600;1,6..96,400` et `Karla:wght@400;700`.

### Boutons — 3 variantes, 2 tailles

| Variante | Taille | Usage |
|----------|--------|-------|
| Primaire (fond Aube) | 48 px | Action principale de la page |
| Secondaire (contour Aube) | 44 px | Action secondaire |
| Discret (texte seul) | 44 px | Liens non-critiques |

Supprimer toutes les variantes intermédiaires actuelles. L'état sélectionné d'un filtre s'inverse en Calcaire (fond clair), jamais en Aube.

### Filtres & badges

Format : `Villages perchés · Sentiers · Criques · Jardins` en mode filtre. Sélectionné = fond Calcaire, texte Nuit. Badge prix : `Gratuit` en Pin, `8–10 €` en Brume. Badge `Fermé aujourd'hui` en rouge discret.

### Texture altitude

L'altitude est une donnée réelle (400 m Èze, 760 m Gourdon, 780 m Sainte-Agnès). Afficher sous le nom du lieu en Plex Mono 12 avec le symbole `m`. Peut aussi servir de texture graphique en arrière-plan (courbes de niveau SVG).

---

## 2. Accueil desktop (`Main.dc.html`)

### Navigation

```
Riviera Secrète    Explorer · Itinéraires · Le carnet    [champ recherche]    Composer un itinéraire
```

- 4 entrées seulement (vs 9 actuelles)
- « Composer un itinéraire » en bouton primaire dans la nav, pas dans une liste
- Champ de recherche ouvert en surcouche (pas une ancre vers #lieux)
- « Activités » et « Villes » disparaissent de la nav — deviennent des filtres dans Explorer

### Héros — qualificateur, pas vitrine

Remplacer le carrousel ambiant par trois contrôles + un bouton :

```
La Côte d'Azur avant les cars
Les villages, les sentiers et les criques que les guides expédient en une ligne.
Dis-nous combien de temps tu as — on compose le parcours,
avec les horaires et les temps de trajet.

J'ai        [1/2 journée] [1 jour] [2 jours] [3 jours]
Je pars de  [Nice] ou [ma position]
J'ai envie  [Marcher] [Visiter] [Me baigner] [Manger]

[Composer mon itinéraire]   ou explorer les 43 lieux ↓
```

Le sous-texte "On place tes lieux dans l'ordre, avec les horaires d'ouverture du jour et les temps de trajet réels." remplace l'accroche algorithmique actuelle.

### Ordre des sections

1. Héros qualificateur (ci-dessus)
2. **Explorer** — carte + liste synchronisées (voir §4)
3. **Déjà composés** — les 6 itinéraires éditoriaux avec sous-titre : "Six parcours, si tu préfères qu'on choisisse"
4. **La méthode** — bloc de confiance (voir ci-dessous)
5. Footer

La section Activités disparaît de l'accueil. Les activités sont dans les fiches lieu et accessibles via le filtre "envie" du générateur.

### Bloc "La méthode"

```
Un lieu entre dans la liste s'il tient debout sans la foule
Pas de classement, pas de partenariat. Chaque fiche est visitée, datée,
et retirée si l'endroit devient impraticable.
Les liens de réservation partenaires sont signalés comme tels.

Lieux vérifiés sur place   43 / 43
Dernière passe             Août 2026
Lieux retirés depuis 2024  6
Écrit par                  [VOTRE NOM]
```

Ces compteurs sont des champs à renseigner — pas calculés dynamiquement pour l'instant.

---

## 3. Accueil mobile (`AccueilMobile.dc.html`)

Le héros qualificateur est identique, adapté en colonne. Différences mobiles :

- « ou explorer les 43 lieux » devient le bouton secondaire juste sous le bouton primaire
- La carte de la section Explorer est masquée par défaut — bouton « Ouvrir la carte » au-dessus de la liste
- Les 6 itinéraires : 1 carte visible, scroll horizontal (pas de grille)
- Le bloc "La méthode" est condensé : date de vérification + nom, sans les compteurs

---

## 4. Page Explorer — desktop + mobile (`Explorer.dc.html`, `ExplorerMobile.dc.html`)

Page dédiée `/explorer` (ou section d'accueil selon décision architecture).

### Filtres (une seule barre, pilote carte ET liste)

```
[Villages perchés] [Sentiers] [Criques] [Jardins]   Moins de 2 h ▾   Tous niveaux ▾   [Ouvert aujourd'hui]   Tout effacer
```

Compteur dynamique : `18 lieux dans cette vue` mis à jour à chaque changement de filtre ou déplacement de carte.

### Layout desktop

Carte à gauche (60 %), liste à droite (40 %), côte à côte. La carte réagit aux filtres (`fitBounds` sur les marqueurs filtrés). La liste défile indépendamment de la carte.

### Layout mobile

Liste en plein écran par défaut. Bouton « Voir sur la carte » en bas d'écran → bascule en vue carte plein écran avec bouton retour liste.

### Format de carte de lieu (dans la liste)

```
[Photo 3:2]
Èze, le village perché
Ruelles si étroites que les maisons se touchent au-dessus de la tête.
400 M · 1 H 30   Gratuit   [Fermé aujourd'hui]
```

- Altitude toujours affichée en Plex Mono
- Badge `Fermé aujourd'hui` calculé côté client (ISR)
- Tri disponible : « Les plus proches » (géolocalisation, tri dans la vue filtrée)

---

## 5. Fiche lieu (`FicheLieu.dc.html`)

### Nouveaux blocs à ajouter en bas de fiche

**Bloc 1 — L'itinéraire qui passe par ici**
```
Cet itinéraire passe par ici
6 étapes · 2 jours
Roquebrune, Èze & Monaco : la Riviera des corniches
ÉTAPE 3 · 12 H 30
```
Source : `data/itineraires.json` — chercher les stops dont `lieuSlug` correspond au lieu courant. Afficher le nom de l'itinéraire, le nombre d'étapes, la durée, le numéro et l'heure de l'étape.

**Bloc 2 — À moins de 20 minutes**
```
Le Trophée d'Auguste   La Turbie · 480 m   15 MIN
La Rue Obscure         Villefranche-sur-Mer  18 MIN
Villa Kerylos          Beaulieu-sur-Mer · 14 €  19 MIN
```
Calculé depuis les coordonnées (distance à vol d'oiseau convertie en temps estimé voiture). Montrer les 3 lieux les plus proches à moins de ~25 km.

### Badge de vérification

```
VÉRIFIÉ SUR PLACE EN AOÛT 2026
```
Champ à ajouter dans `data/lieux.json` : `"verifieSurPlace": "Août 2026"`. Affiché en Plex Mono 12 en fin de fiche.

### Bouton fixe mobile

Barre d'action en `position: fixed; bottom: 0` sur mobile :
- « Y aller » (bouton primaire, ouvre Maps/Waze/Plans) à gauche
- Icône ♡ favori à droite
- Disparaît en desktop (les liens Maps restent en statique dans la fiche)

### Compteur de slides

`1 / 6` en Plex Mono dans le coin du hero carousel — affiché si `heroSlides > 1`.

---

## 6. Générateur (`Generateur.dc.html`)

### Étape 1 — Qualificateur (avant la sélection de lieux)

Ajouter avant l'accordéon de sélection actuel :

```
Durée       [1 jour] ← sélecteur existant
Départ      [Nice] ← champ texte libre ou sélecteur de commune
Heure       [08:30]
Date        [Sam. 19 sept.] ← date picker
Transport   [Voiture] [Train + marche]
```

Ces champs alimentent directement le calcul des temps de trajet et les alertes de fermeture (la date du voyage, pas la date du jour).

### Sélection de lieux — améliorations

- Barre de recherche dans le sélecteur (actuellement absent)
- Filtre rapide par zone : `[Menton & la frontière] [Nice] [Arrière-pays]`
- Bouton **« Depuis mes favoris (N) »** en tête — pré-coche tous les favoris de l'utilisateur
- Chaque ligne de lieu : nom + altitude + durée + commune + badge `Fermé samedi` si applicable

### Résumé en temps réel (panneau latéral ou bas d'écran mobile)

```
Ta sélection · 3 lieux, 5 h 40
  Temps sur place  3 h 50
  Trajets          1 h 50 · 61 km
  Entrées          7 €
  Reste            2 h 20
```

Mis à jour à chaque coche/décoche. Si de la place reste : « Il te reste de la place pour Villa Kerylos (1 h, 19 min de route). »

### Persistance sans compte

```
Ta sélection est conservée dans le lien — tu peux fermer l'onglet.
```

L'URL encode la sélection (`?duree=journee&depart=nice&date=2026-09-19&lieux=eze,...`) — reconstruction au montage, indépendamment de la sauvegarde.

---

## 7. Itinéraire généré (`Itineraire.dc.html`)

### En-tête

```
[riviera-secrete.fr/i/3f7a2c]   Samedi 19 septembre · départ de Nice à 08:30 · en voiture
Les corniches en une journée
[Modifier] [PDF] [Lien copié ✓] [Garder dans mon carnet]
```

- URL courte `/i/<id>` pour les itinéraires sauvegardés (vs `?jours=` pour les non-sauvegardés)
- « Lien copié » avec état visuel (toast ou changement de libellé) — actuellement rien ne se passe
- « Garder dans mon carnet » remplace « Sauvegarder » — plus proche de l'usage réel

### Lieu écarté — inline avec actions

Remplacer le message générique "N lieux non inclus" par un bloc inline :

```
⚠ Villa Kerylos n'entre pas dans la journée : il resterait 40 minutes, l'entrée en demande 60.
  [Passer à 2 jours]  [Remplacer une étape]  [Garder pour plus tard]
```

Affiché à l'endroit où le lieu aurait été inséré dans le programme, pas en bas de page.

### Profil de journée

Graphique SVG de l'altitude traversée : points d'altitude de chaque étape sur un axe horizontal (temps) vs vertical (mètres). Optionnel mais distinctif.

### Format du programme

```
08:30  Départ de Nice
       ↳ 22 MIN — MOYENNE CORNICHE

09:00  Le Trophée d'Auguste
       La Turbie · vue plongeante sur Monaco
       1 H · 7 €   Ouvert 10 h–18 h
       ↳ 16 MIN — DESCENTE SUR ÈZE

10:20  Èze, le village perché
       Les ruelles avant les cars, puis le Jardin exotique
       1 H 45 · 8–10 €   Billet en ligne

12:20  Déjeuner au village — la Taverne d'Antan
       20–30 € · 1 H 30
       ↳ 15 MIN — BASSE CORNICHE

14:05  La Rue Obscure
       Puis la citadelle et la plage des Marinières
       2 H 05   Gratuit
```

- Déjeuner intégré comme étape (avec restauration tirée des activités `restaurant` du lieu)
- Indication de route nommée sur les blocs transit (`MOYENNE CORNICHE`, `BASSE CORNICHE`)
- Bouton « Réordonner » (drag-and-drop des étapes)
- En-tête du programme : `08:30 – 16:10 · 61 km · 7 €`

---

## Récapitulatif — ce qui ne change pas

- Thème sombre conservé, contrastes AA maintenus
- Leaflet pour les cartes (même configuration : scroll désactivé, 2 doigts sur mobile)
- ISR + revalidation par tags
- Structure des données `data/*.json` inchangée
- Auth NextAuth + backend Railway inchangé
- Slugs et URLs inchangés (`/lieux/[slug]`, `/itineraires/[slug]`)
