# Audit UX / UI — Riviera Secrète

- **Site audité** : https://frontend-two-plum-92.vercel.app/
- **Date** : 17 septembre 2026
- **Viewports** : desktop 1280×800 · mobile 375×812
- **Langues** : EN (servie par défaut à un navigateur non francophone) puis FR
- **Comptes** : parcours public + compte test connecté (test@test.fr)
- **Version interactive** (avec maquettes rendues) : https://claude.ai/artifact/5A7LJnTQrSXwJznAMjmg98
- **Cahier des maquettes** : `maquettes-riviera-secrete.md` (même dossier)

---

## Verdict

**Note globale : 5,4 / 10.**

Le produit a une idée forte (un planificateur de journée qui respecte horaires d'ouverture et temps de trajet) et un contenu éditorial rare. Mais le parcours principal est fragile, l'interface mobile fait défiler des écrans de réglages avant de montrer un seul lieu, et plusieurs bugs visibles cassent la confiance. Le site est utilisable sur desktop par un visiteur patient ; sur mobile, là où un voyageur l'utilisera vraiment, il demande trop d'efforts avant de livrer sa valeur.

| Axe | Note /10 |
|---|---|
| Proposition de valeur & contenu | 7 |
| Parcours « Composer » (cœur du produit) | 4 |
| Expérience mobile | 4 |
| Hiérarchie visuelle & lisibilité | 5 |
| Robustesse (bugs visibles, i18n) | 4 |
| Accessibilité | 6 |

### Les cinq problèmes à traiter en premier

1. **Le sélecteur « Starting from » du composeur est écrasé à 26 px de large** : la ville de départ est invisible, desktop comme mobile.
2. **Textes cassés en pleine page** : « 3 placex », clé brute `composer.lieuxTrouves`, 5 erreurs de pluralisation en console.
3. **La recherche du header ne fait rien** : aucune suggestion, Entrée inerte, URL de recherche en 404 (en français).
4. **Sur mobile, un mur de filtres précède le contenu** : premier lieu à 1 342 px dans le composeur, 946 px dans l'explorateur (écran de 812 px).
5. **Le résultat d'itinéraire gâche l'écran desktop** : deux tiers vides, carte sous la ligne de flottaison, réordonnancement par flèches de 20 px.

---

## Méthode et périmètre

Audit manuel dans un navigateur. Chaque page parcourue en desktop et en mobile, avec mesures DOM (taille des cibles tactiles, position du premier contenu utile, débordements, polices, images sans `alt`), lecture de la console et du réseau.

- **Parcours testés** : accueil → composeur → résultat → sauvegarde ; explorer → filtre → fiche lieu → ajout à l'itinéraire → favori ; itinéraires prêts → détail ; recherche ; connexion ; carnet ; bascule FR/EN.
- **Hors périmètre** : SEO, performance réseau fine (cache actif), sécurité, code source.
- **Gravité** : **Critique** bloque ou trompe l'utilisateur · **Majeur** coûte des abandons · **Mineur** finition. **[Mobile]** signale un constat propre au mobile.

### Ce qui fonctionne et doit être conservé

- La promesse « La Côte d'Azur avant les cars » et le ton éditorial.
- La sélection persistée dans l'URL (« votre sélection est gardée dans ce lien »).
- La barre « Get directions » collée en bas des fiches lieu sur mobile.
- Les liens Google Maps / Waze / Apple Maps par étape.
- La rubrique « À réserver avant de partir » avec horaires réels et prix.
- Le toggle « View on map » de l'explorateur mobile.
- Les états vides du carnet avec appel à l'action.
- La boîte « Name your itinerary » pré-remplie à la sauvegarde.

---

## 1 · Composer un itinéraire

Cœur du produit et premier appel à l'action du site. Le formulaire d'accueil (durée, départ, envie) fonctionne et transmet ses paramètres dans l'URL (`/en/composer?badge=randonnee&depart=nice&date=…`). Les problèmes commencent sur la page du composeur.

### 1.1 · Critique · [Mobile] — La ville de départ est invisible : le `select` est réduit à un chevron
Dans la barre « Starting from », le sélecteur mesure **26 px de large** (mesuré à 375 px, identique à 1280 px) : seul le chevron s'affiche, à côté du champ heure qui prend toute la place. La valeur « Nice » est bien dans le DOM mais illisible.
**Correctif** : `min-width: 0` sur le conteneur flex, `flex: 1 1 160px` sur le select, champ heure en largeur fixe. Sur mobile, départ et heure sur deux lignes.

### 1.2 · Critique — Textes techniques et pluriels cassés
- Panneau de sélection : « **3 placex**, 6 h 15 » (règle de pluriel française appliquée à l'anglais).
- Titre de la liste : clé brute **`composer.lieuxTrouves`**.
- Console : 5 × `FORMATTING_ERROR: The intl string context variable "plural" was not provided to the string "{count} place{plural} of {total}"`.
**Correctif** : syntaxe ICU `{count, plural, one {place} other {places}}` ; ajouter la clé manquante ; test automatisé qui échoue sur toute clé absente dans l'une des deux langues.

### 1.3 · Majeur · [Mobile] — Deux écrans de réglages avant de voir un seul lieu
À 375 px, le premier lieu apparaît à **1 342 px** : titre, sous-titre, 4 chips de durée sur deux lignes, départ, date, transport, champ de recherche, 5 zones, 5 activités, « Clear all ». Page totale : **5 917 px**. L'utilisateur vient de répondre à ces questions sur l'accueil ; on lui redemande tout avant de montrer quoi que ce soit.
**Correctif** : replier les réglages dans une barre récapitulative éditable (« Journée · Nice · 9 h · Voiture · Modifier ») + un tiroir « Filtres ». Les lieux commencent sous le titre. → **Maquette M1**.

### 1.4 · Majeur · [Mobile] — Cartes en deux colonnes, titres tronqués sur 10 cartes sur 10
« The Cap Ferrat coasta… », « The village of Roqueb… », « The Jardin Exotiq… ». La grille à deux colonnes ne laisse que ~160 px au titre. La case à cocher en haut à droite est un carré de 20 px sans étiquette ; la carte entière est cliquable mais rien ne le suggère.
**Correctif** : une colonne sur mobile, vignette à gauche, titre sur deux lignes, durée et badges à droite ; toute la ligne bascule la sélection, état « Ajouté ✓ » coloré.

### 1.5 · Majeur — Le panneau « Your selection » ment avant la première sélection
Sans lieu choisi : quatre tirets, mais aussi la suggestion « There's room left for The Rue Obscure (20 min, 15 min drive) » et un bouton « Compose the itinerary » **actif**, suivi de « Choose at least one place ».
**Correctif** : état vide explicite (« Choisissez vos lieux ci-dessous. Nous les ordonnerons avec les horaires du jour. »), bouton désactivé tant que la sélection est vide, suggestion affichée à partir du premier lieu.

### 1.6 · Majeur — « Entry fees to plan : 131 € » pour trois lieux dont deux gratuits
Le chiffre additionne apparemment toutes les activités optionnelles des fiches (atelier parfum 30 €, déjeuner 20–30 €, jardin 8–10 €…). Un sentier côtier et une colline publique à 131 € de frais d'entrée : faux et dissuasif.
**Correctif** : distinguer « Entrées » (sites payants obligatoires) et « Options » (ateliers, repas). Afficher « à partir de » avec lien vers le détail.

### 1.7 · Mineur — Vingt chips à plat, durées qui débordent
Zones, activités et « Clear all » : 20 boutons de même poids. « 2 days / 3 days » passent à la ligne à 1280 px. Vocabulaire changeant (« Walking » sur l'accueil devient « Hiking » ici).
**Correctif** : durées en segmented control sur une ligne ; zones et activités regroupées sous deux libellés courts ; un seul vocabulaire.

---

## 2 · Résultat d'itinéraire

Le moteur produit un plan crédible (horaires, trajets, pause déjeuner, rubrique « À réserver »). La restitution ne lui rend pas justice.

### 2.1 · Majeur — Sur desktop, deux tiers de l'écran sont vides
À 1280 px, la colonne « Day 1 » occupe le tiers gauche ; à droite, rien. La carte arrive dessous en pleine largeur, puis le détail horaire encore plus bas.
**Correctif** : deux colonnes — timeline détaillée à gauche, carte collante + récapitulatif + actions à droite. → **Maquette M2**.

### 2.2 · Majeur · [Mobile] — Réordonner avec des flèches de 20 × 20 px
« ▲ ✕ ▼ » en caractères typographiques, **20 px de côté** (recommandation : 44 px). Suppression accidentelle facile, aucun glisser-déposer, aucune annulation.
**Correctif** : poignée de glisser-déposer, bouton « Retirer » de 44 px avec toast « Étape retirée · Annuler », lien « Optimiser l'ordre ».

### 2.3 · Majeur — Le déjeuner tombe après 14 h et personne ne le signale
Èze (1 h 45) puis Cap Ferrat (2 h 30) le matin : la « Break · Lunch » est insérée après 14 h, avant la colline du Château à 15 h 30. Le moteur respecte les durées mais pas le rythme d'une journée.
**Correctif** : fenêtre de déjeuner paramétrable (12 h–14 h par défaut) + alerte visible dans la timeline : « Déjeuner tardif (14 h 10). Inverser Cap Ferrat et Èze ? ».

### 2.4 · Mineur — Actions dispersées, sauvegarde muette
« ← Choose other places », « 🖨 Export as PDF », « 🔗 Share link », « Save » : même poids, deux lignes à 375 px. Connecté, « Save » ouvre une boîte « Name your itinerary » pré-remplie (bon), mais après validation rien ne confirme : pas de toast, le bouton reste « Save », seule l'URL change (`?id=…`). Pas d'export agenda (.ics) alors que le produit calcule des horaires.
**Correctif** : action primaire « Enregistrer » → « Enregistré ✓ · Voir dans mon carnet » ; les autres dans un menu « Partager » (lien, PDF, agenda). Toast après toute action réussie.

### 2.5 · Mineur — Finitions
- Deux `h1` « Full day itinerary » sur la même page.
- « Book →· affiliate link » : ponctuation collée.
- Rubrique « Nearby » en français sur la page anglaise (« Le Trophée d'Auguste », « La Rue Obscure »).
- 18 images sur 26 sans `alt`.
- 85 éléments de texte en 12 px : taille dominante de la page.

---

## 3 · Explorer

### 3.1 · Majeur · [Mobile] — Un mur de 21 filtres avant le premier lieu
À 375 px, premier lieu à **946 px** : 5 zones, 5 activités, 7 types de lieux, 3 menus déroulants, « Near me », « Surprise me ». Pour 43 lieux. Catégories qui se recouvrent : « Beach » / « Cove », « Restaurant » / « Dining », « Hiking » / « Trail ».
**Correctif** : ligne de chips défilante (zones) + bouton « Filtres (n) » ouvrant un panneau. Une seule taxonomie. → **Maquette M3**.

### 3.2 · Majeur · [Mobile] — La liste défile dans une boîte interne
Conteneur à défilement interne de **650 px** (mobile) / **640 px** (desktop), suivi de « See 19 more places ». Deux défilements imbriqués sur tactile.
**Correctif** : sur mobile, la liste défile avec la page ; la carte devient un bouton flottant « Carte » plein écran. Sur desktop : liste à hauteur de fenêtre à gauche, carte collante à droite.

### 3.3 · Mineur — Les émojis remplacent icônes et libellés
« 🏖️ 🤿 🍽️ » sans texte sur chaque lieu. Rendu variable selon l'appareil, lecture d'écran peu fiable, perte de contour sur fond sombre.
**Correctif** : icônes vectorielles monochromes avec libellé court (« Baignade », « Sentier »), maximum trois par carte, le reste en « +2 ».

---

## 4 · Fiche lieu

Le contenu est le meilleur du site (accès, meilleure heure, choses à faire avec horaires et prix, lieux à moins de 20 min). La mise en page l'enterre.

### 4.1 · Majeur · [Mobile] — Titre sous la ligne de flottaison, description encore plus bas
Desktop 1280×800 : carrousel à gauche, carte à droite, `h1` vers **710 px**. Mobile : fil d'Ariane, carrousel 218 px, `h1` à **454 px**, six boutons sur quatre lignes, description à **1 027 px**.
**Correctif** : titre et accroche d'une ligne au-dessus de la photo sur mobile ; métadonnées en tableau compact ; actions uniquement dans la barre collante. → **Maquette M4**.

### 4.2 · Majeur — Le favori déconnecté renvoie vers une connexion en français, sans un mot
Sur la fiche anglaise, « ♡ Add to favorites » sans session redirige vers `/connexion?callbackUrl=…` (page « Connexion », en français). Pas de message, changement de langue. Connecté, le clic fonctionne (cœur plein, `aria-pressed=true`) mais aucun toast.
**Correctif** : feuille contextuelle « Enregistrez ce lieu dans votre carnet · Continuer avec Google · Email » dans la langue courante, retour sur la fiche avec le favori posé, toast « Ajouté à vos favoris · Voir le carnet ».

### 4.3 · Mineur — Métadonnées brutes et doublons
- « 📍 43.7298°N, 7.3619°E » : coordonnées décimales inutiles pour l'utilisateur.
- 6 boutons dans le corps (Google Maps, Waze, Maps, favoris, partager, ajouter) + les mêmes dans la barre collante.
- `alt` des images en français sur la page anglaise.
- Carrousel « 1 / 3 » : trois fois la même image de 678 px, ni variantes ni haute densité.

---

## 5 · Accueil et navigation

### 5.1 · Majeur · [Mobile] — Le CTA principal est sous la ligne de flottaison
À 375×812, titre de 40 px sur trois lignes + sous-titre + formulaire : « Compose my itinerary » arrive à **853 px**. Sur desktop 1280×800, il touche le bord inférieur. Header collant de **77 px** (9,5 % de l'écran mobile).
**Correctif** : titre 32 px sur deux lignes, formulaire réduit à deux questions visibles (durée, départ), bouton dans le premier écran, « I feel like » en étape suivante. Header 56 px qui se masque au défilement.

### 5.2 · Mineur — Deux « Composer » et un « Notebook » qui n'en est pas un
Header « Compose an itinerary », hero « Compose my itinerary ». « The notebook » demande une connexion : lien principal qui mène à un mur pour 100 % des nouveaux visiteurs. Footer sans contact ni réseaux, alors que la section confiance met en avant « Written by Maxime Jouard ».
**Correctif** : un seul libellé ; « Carnet » dans la navigation seulement connecté ; footer avec À propos, contact, méthode.

### 5.3 · Mineur — Section « Itineraries » sans porte d'entrée par besoin
Six cartes de même poids, descriptions tronquées, « Day trip » et « Full day » utilisés comme deux catégories. Page dédiée sans filtre (durée, zone, voiture/train).

---

## 6 · Recherche

### 6.1 · Critique — Le champ de recherche du header ne fait rien
Taper « eze » : aucune suggestion. Entrée : rien. Le formulaire n'a ni `action` ni `name`. `/en/recherche?q=eze` → **404** en français, sans header ni `<title>`.
**Correctif** : retirer le champ tant qu'il n'est pas branché, ou overlay de recherche instantanée sur les 43 lieux et 6 itinéraires (nom, commune, activité, accents ignorés). → **Maquette M5**. Page 404 localisée avec header.

---

## 7 · Compte et carnet

### 7.1 · Mineur — Fonctionnel, sans feedback
Page de connexion sobre et correcte. Connecté, le header affiche « test · Log out » comme un seul bouton : le nom n'ouvre rien. Le carnet liste favoris (1) et itinéraires (1) avec « View / Delete » (« Delete » non testé). `/api/auth/session` appelé ≈ 20 fois par session.
**Correctif** : menu compte (Carnet, Mes itinéraires, Se déconnecter). Confirmation avant suppression. Toasts sur favori et sauvegarde.

---

## 8 · Langues

### 8.1 · Majeur — Le français est instable
- `/fr` ouvert depuis un navigateur anglophone redirige vers `/en` (cookie `NEXT_LOCALE` absent) : un lien partagé ne s'ouvre pas dans la langue voulue.
- Le lien « FR » pointe vers `/fr` mais le site français vit à la racine `/` : deux adresses pour la même page.
- Page 404 toujours en français, y compris sous `/en/`.
- Sur les pages anglaises : « Nearby » en français, `alt` en français, redirection de connexion en français.
- Date « 09/17/2026 » et « 09:00 AM » : format américain.
**Correctif** : respecter la locale explicite de l'URL ; un chemin canonique par langue ; passer la locale à toutes les redirections et données ; format de date de la locale.

---

## 9 · Système visuel et accessibilité

### 9.1 · Majeur — Sombre uniquement, pour un site consulté en plein soleil
Un seul thème sombre, `prefers-color-scheme` ignoré. L'usage réel (téléphone sur un sentier à 14 h) est le pire cas pour un fond noir.
**Correctif** : thème clair par défaut le jour ou selon le système, bascule dans le menu, mode « Sur place » à fort contraste pour les pages itinéraire. → **Maquette M6**.

### 9.2 · Mineur — Typographie, iconographie, accessibilité
- 12 px est la taille la plus fréquente sur le résultat (85 occurrences) ; 14 px domine l'accueil mobile. Corps à 16 px, métadonnées 14 px minimum.
- Quatre familles (Fraunces, Inter, Karla, monospace) ; chiffres en monospace dans la section confiance.
- Émojis comme icônes partout, y compris dans des titres (« 🎁 Nearby »).
- Pas de lien d'évitement ; deux `h1` sur le résultat ; images sans `alt` (7/19 fiche lieu, 18/26 résultat) ; boutons « ▲ ✕ ▼ » avec libellé accessible mais 20 px de cible.
- Contraste globalement correct (un libellé de commune bleu à 4,2:1 sur fond sombre, sous AA pour du 14 px).

---

## Feuille de route proposée

### Semaine 1 · réparer
1. Largeur du select « Starting from » (1.1)
2. Pluriels ICU, clé `composer.lieuxTrouves`, « placex » (1.2)
3. Retirer ou brancher la recherche ; 404 localisée (6.1)
4. Bouton « Compose » désactivé sans sélection, état vide (1.5)
5. Toasts sur favori et sauvegarde (2.4, 4.2)
6. Redirection connexion dans la langue courante (4.2, 8.1)
7. Un seul `h1`, `alt` sur toutes les images (2.5)

### Mois 1 · restructurer le mobile
1. Composeur : récapitulatif éditable + tiroir filtres, cartes une colonne (M1)
2. Explorer : chips défilantes + panneau filtres, liste plein écran, carte flottante (M3)
3. Fiche lieu : titre en tête, une barre d'actions (M4)
4. Hero : CTA dans le premier écran, header 56 px (5.1)
5. Réordonnancement par glisser-déposer, cibles 44 px (2.2)
6. Icônes vectorielles à la place des émojis (3.3)

### Trimestre · différencier
1. Résultat desktop en deux colonnes, carte collante (M2)
2. Alerte déjeuner et « Optimiser l'ordre » (2.3)
3. Thème clair et mode « Sur place » (M6)
4. Export agenda .ics, partage riche
5. Filtres sur les itinéraires prêts (durée, zone, train)
6. Menu compte et confirmation de suppression (7.1)

**Indicateurs à suivre** : taux de passage accueil → composeur → résultat ; part des visiteurs mobiles qui ajoutent au moins un lieu ; taux de sauvegarde ou de partage d'un résultat ; erreurs console en production.

---

## Annexe · mesures relevées

| Page · viewport | Mesure | Valeur | Repère |
|---|---|---|---|
| Composeur · 375 & 1280 | Largeur du select « Starting from » | 26 px | Illisible |
| Composeur · 375 | Position du premier lieu | 1 342 px | Écran = 812 px |
| Composeur · 375 | Hauteur totale de page | 5 917 px | 7,3 écrans |
| Composeur · 375 | Titres de cartes tronqués | 10 / 10 | 0 attendu |
| Explorer · 375 | Position du premier lieu | 946 px | Écran = 812 px |
| Explorer · 375 | Chips de filtre avant la liste | 21 | Pour 43 lieux |
| Explorer · 375 / 1280 | Boîte de défilement interne | 650 / 640 px | Scroll imbriqué |
| Résultat · 1280 | Boutons « Move up / Remove / Move down » | 20 × 20 px | Minimum 44 px |
| Résultat · 1280 | Éléments texte en 12 px | 85 | Taille dominante |
| Résultat · 1280 | Images sans `alt` | 18 / 26 | 0 attendu |
| Résultat · 1280 | Balises `h1` | 2 | 1 attendu |
| Fiche lieu · 375 | Position du `h1` / de la description | 454 / 1 027 px | Écran = 812 px |
| Fiche lieu · 375 | Boutons d'action corps + barre collante | 6 + 4 | Doublon |
| Accueil · 375 | Position du bouton « Compose my itinerary » | 853 px | Sous la flottaison |
| Accueil · 375 | Hauteur du header collant | 77 px | 9,5 % de l'écran |
| Toutes pages | Erreurs console `FORMATTING_ERROR` (pluriel) | 5 | 0 attendu |
| Session connectée | Appels à `/api/auth/session` | ≈ 20 | 1 à 2 attendus |
| Header | Recherche : suggestions / navigation sur Entrée | 0 / aucune | Non fonctionnelle |
| Accueil · 1280 | Texte sous 4,5:1 de contraste | 1 style (4,2:1) | Bon dans l'ensemble |

**Limites** : certaines captures d'écran mobiles n'ont pas pu être prises (rendu en arrière-plan) ; les valeurs proviennent alors du DOM et sont reproductibles dans les outils de développement. Le mot de passe du compte test n'a pas été saisi par l'auditeur (connexion faite par le propriétaire). « Delete » du carnet non testé.
