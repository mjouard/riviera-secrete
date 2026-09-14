# Tests utilisateurs — 2026-09-13

**Cible** : https://frontend-two-plum-92.vercel.app
**Méthode** : parcours pilotés en navigateur (desktop 1440×900 + mobile 375×812), FR et EN,
état déconnecté, croisés avec une vérification des données (API prod, `data/*.json`,
géocodage OSM/Nominatim, contrôle des 195 URL de réservation et des 304 images référencées).

---

## ⚠️ Nature des personas — à lire avant de citer quoi que ce soit

Les huit personas de la section 4 et **tous les verbatims entre guillemets sont simulés**.
Ils proviennent d'une évaluation experte menée par un agent automatisé, **pas d'entretiens
avec de vraies personnes**. Ils servent à incarner une friction réellement constatée dans le
navigateur — jamais à représenter l'opinion d'un utilisateur réel.

**Ne pas les citer en externe comme des retours terrain, ne pas les agréger comme des
données d'enquête.** En revanche, chaque constat technique est reproductible : URL et étapes
fournies systématiquement.

## Limite de couverture

L'état **connecté n'a pas pu être testé** (favoris persistés, `/mes-itineraires` peuplée,
édition/suppression d'un itinéraire sauvegardé) : la consigne imposait de commencer
déconnecté, et la reconnexion passe par Google, donc par une saisie d'identifiants que
l'agent ne fait pas. Tout ce rapport concerne l'état déconnecté.

Le partage d'itinéraire par lien n'a pas été testé (développé mais pas encore déployé au
moment de l'audit).

---

## 1. Bloquants

### B1 — Èze géolocalisé en pleine mer ✅ corrigé (`6f1a201`)

`/lieux/eze-village` affichait `📍 43.6579°N, 7.3616°E`. Un reverse-geocoding sur ce point
ne renvoyait **aucune entité terrestre** (`addresstype: region`, signature d'un point en
mer). Le vrai village est à `43.7299, 7.3611` : **8,04 km plein sud**, dans la Méditerranée
au large d'Èze-Bord-de-Mer. Les trois liens de navigation de la fiche (Google Maps, Waze,
Plans) sont construits depuis ce point : **un conducteur appuyant sur « 🚗 Waze » était
guidé vers la mer**.

Aggravant : `/a-propos` affirme « Les coordonnées GPS de chaque lieu sont vérifiées une par
une contre des sources réelles ».

**Deux erreurs supplémentaires trouvées en croisant `lieux.json` et `villes.json`**, absentes
de l'audit initial : la ville `eze` portait **le même point faux** (marqueur de commune en
mer sur la carte d'accueil), et la ville `cannes` avait reçu les coordonnées des îles de
Lérins, son unique lieu (marqueur au large également). Six corrections au total, plus
`scripts/verifie-coordonnees.py` — voir §M9.

### B2 — Impossible de sauvegarder un itinéraire ✅ corrigé (`7af58eb`)

`/creer-itineraire` → durée + lieux → « Générer » → « Sauvegarder ». Une modale s'ouvrait
avec un champ vide et un bouton turquoise **« Connexion requise »**. Le clic **ne produisait
rien** : pas de navigation, pas de message, pas de surlignage. Le bouton n'était pourtant
pas désactivé.

Cause : `handleSave()` commençait par `const nom = saveInput.trim(); if (!nom) return;`.

Double faute : (1) « Connexion requise » est un **état, pas une action** — l'utilisateur le
lit comme « il faut être connecté », clique pour aller se connecter, et n'obtient rien ;
(2) l'étape réellement bloquante (nommer) n'était signalée nulle part. C'était la fin d'un
parcours de 6–7 étapes.

### B3 — « Générer mon itinéraire » sans sélection ❌ constat inexact

Vérification faite : le message « Sélectionne au moins un lieu. » **s'affichait bien**
(`showEmptyNote`). Il n'était simplement pas annoncé aux lecteurs d'écran — corrigé
(`role="alert"`, `aria-describedby`), sans prétendre avoir réparé un bouton mort.

### B4 — Une page anglaise recommandait de réserver un château fermé au public ⚠️ non corrigé

`/en/itineraires/villages-perches`, section « To book » : une 4ᵉ carte, absente de la version
française, proposait *Gourdon Castle-Museum — 6 € / adult — **Book →*** vers
`https://www.chateaudegourdon.com/`. Le château est **privatisé et fermé au public depuis
2015**, et ce domaine est un **domaine viticole de la vallée du Rhône sans rapport**.

L'API de prod était propre (3 réservations seulement) : Vercel servait un **rendu figé au
dernier build** (`x-vercel-cache: PRERENDER`, `age: 0`). Après la visite, la page a été
revalidée et la carte a disparu.

**Ce n'est pas un incident isolé mais un mécanisme structurel** : les pages itinéraire et
ville sont en ISR, les corrections de contenu passent uniquement par la base, et rien ne
déclenche de revalidation. Une page `/en` peu fréquentée sert donc du contenu figé au dernier
déploiement, et le premier visiteur anglophone « paie » la purge. Ici, le contenu périmé
était l'information la plus dangereuse du jeu de données : un tarif, un bouton « Book » et un
lien vers le mauvais site.

**Correctif proposé** : `revalidatePath()`/`revalidateTag` déclenché depuis le backend à
chaque écriture de contenu ; à défaut, redéployer après chaque synchro DB et abaisser
`revalidate`. Et : **un correctif de contenu « supprimé partout » doit être vérifié sur les
pages rendues, pas seulement dans l'API.**

---

## 2. Irritants majeurs

| # | Constat | Statut |
|---|---|---|
| **M1** | **« Partir de cet itinéraire » dégrade silencieusement l'itinéraire (4 cas sur 6).** `lerins-esterel` : 3 étapes éditoriales → **1** générée. `villages-perches` : 5 → 3 (perd les Gorges du Loup *et* Gourdon au coucher du soleil). `grasse-saint-tropez` : 3 → 2. `antibes-biot-juan` : 4 → 3. Cause : budget dur de 480 min/jour sans marge, et `dureeKeyDepuisBadge()` mappe « Journée complète » sur le même budget que « Journée ». Le bouton promet « je pars de CET itinéraire » et livre une version amputée sans jamais dire qu'elle diffère. | ⚠️ arbitrage produit |
| **M2** | **La recherche promet « une activité… » et n'en indexait aucune.** `kayak`, `snorkeling`, `parapente`, `musée`, `vélo`, `gratuit` → 0 résultat, alors que ces activités existent et sont affichées sur la page d'accueil elle-même. | ✅ `59b056a` |
| **M3** | **Les 208 activités ne sont pas navigables.** L'accueil affiche 36 activités curées sur 208 sans le signaler ; le filtre « Gratuit seulement » s'applique à cet extrait (12 résultats, contre **120 activités gratuites** réelles). Aucune page ni filtre ne permet de parcourir les activités : il faut ouvrir les 43 fiches une à une. C'est la donnée la plus actionnable du site (nom, durée, prix, horaires, lien) et elle est enfermée. | ⚠️ nouvelle fonctionnalité |
| **M4** | **Contradiction sur les jours d'ouverture, dans la même page.** `/itineraires/villages-perches` : la carte de la Chapelle du Rosaire affichait « Mardi & jeudi », la fiche du même lieu « Fermée le dimanche et le lundi… ». Cause : un `extraSpans` figé qui n'avait pas suivi la migration vers `fermeJours`/`horaires`. Bonus : `extraSpansEn` valait aussi « Mardi & jeudi » — **seule chaîne française restante sur tout le site anglais**. | ✅ `68a78a8` |
| **M5** | **« Fermé aujourd'hui » absent des pages itinéraire.** La fiche lieu le calcule très bien côté client ; l'itinéraire — précisément le document qu'on consulte le matin même — démarrait à 09:00 sur la Chapelle Matisse un dimanche, sans avertissement. | ✅ `8db74bc` |
| **M6** | **Mobile : la carte Leaflet bloquait le défilement.** `touch-action: none`, 487 px (60 % du viewport), pleine largeur, placée entre le haut de page et la recherche. Un `touchmove` vertical était absorbé par la carte : piège de défilement classique, on croit que la page est finie. | ✅ `d9ef3a6` |
| **M7** | **Mobile : les 43 lieux dans un carrousel horizontal de 9 438 px.** 1,8 carte visible, ~25 balayages latéraux, aucun indicateur de position, en concurrence avec le défilement vertical. C'est le catalogue principal du site. | ✅ `8e88475` |
| **M8** | **Sous-titre du hero illisible** : `--text-muted` (pensé pour fond sombre) au-dessus du point le plus faible du scrim (0,52). Contraste **≈ 2,0:1** sur les visuels clairs (AA exige 4,5:1), et le hero enchaîne 8 images : la lisibilité changeait toutes les 5 s. C'est la phrase qui porte la proposition de valeur. | ✅ `a68e607` |
| **M9** | **Trois autres lieux mal géolocalisés** : `sentier-corbusier-cap-martin` 3,6 km (côté Menton, pas la presqu'île), `saorge-village` 3,0 km (route de montagne), `pic-cap-roux-esterel` 2,6 km (rue résidentielle au niveau de la mer, pour un sommet à 452 m). 35 des 43 lieux sont à moins de 1 km — la base est bonne. | ✅ `6f1a201` |
| **M10** | **Poids des pages** : `/lieux/eze-village` = **2 305 Ko**, `saint-paul-de-vence` 1 840 Ko, accueil 700 Ko de RSC + 696 Ko de JS/CSS, 8 visuels de hero = 2,0 Mo. Deux vignettes hors gabarit (`eze-village/thumb.jpg` 1024×683 / 368 Ko, `roquebrune-cap-martin-village` 384 Ko). **Zéro `srcset`, zéro WebP/AVIF** : le même JPEG 1200×800 est servi à un écran de 375 px. En contradiction directe avec la thèse du produit — le site cible les lieux mal couverts en réseau et y sert 2 Mo par fiche (30–45 s en 4G faible). | ⚠️ chantier images |
| **M11** | **L'export PDF ne contient ni adresse, ni coordonnées, ni carte.** `.no-print` marque la carte Leaflet *et* toutes les rangées de liens de navigation. Or l'export est présenté comme l'artefact « hors ligne sur le terrain » : sur papier le lien est inutile, mais les coordonnées et les horaires sont exactement ce qu'on emporte. | ⚠️ à faire |
| **M12** | **Une rue couverte porte les badges « Plage » et « Plongée »** : `rue-obscure-villefranche` (rue médiévale entièrement couverte, 15–20 min) sort **en tête** du filtre plage, devant la Villa Kerylos (un musée) et la Colline du Château (un parc à 90 m). `/a-propos` énonce explicitement la règle inverse. Repasser aussi les cas limites `villa-kerylos` et `colline-du-chateau-nice`. | ⚠️ à faire |
| **M13** | **`/robots.txt` renvoyait une 500.** Google interprète un 5xx sur ce fichier comme « ne pas explorer » et **suspend l'exploration du site** — le sitemap (86 URL, correct) et les `hreflang` s'en trouvaient neutralisés. Symptôme plus large : tout chemin manquant portant une extension renvoyait 500 au lieu de 404. | ✅ `1b1dffa` |
| **M14** | **Aucun « Mot de passe oublié »**, ni page ni endpoint. Un compte créé par mot de passe et oublié est **définitivement perdu**, avec ses favoris et ses itinéraires. Le mécanisme de jeton à expiration de la confirmation d'email est réutilisable tel quel. | ⚠️ à faire |
| **M15** | **« N lieux non inclus faute de temps » alors que les journées s'arrêtent vers 16h.** Sur un 2 jours / 13 lieux : « 5 lieux non inclus », Jour 1 fini à ~16:05, Jour 2 à ~16:20, pour un budget de 8 h. Parmi les exclus, Èze et le Cap Ferrat, **géographiquement entre les étapes retenues**. L'algorithme est glouton et dépendant de l'ordre, pas optimisant. | ⚠️ arbitrage produit |

---

## 3. Irritants mineurs

| # | Constat | Statut |
|---|---|---|
| m1 | **Titre trompeur** : « Menton, Èze & Monaco » — **Menton n'est pas une étape** (Roquebrune, La Turbie, Èze, Monaco, Cap-Ferrat, Villefranche). La description ne la mentionne pas non plus. | ⚠️ |
| m2 | Pas d'en-têtes « Jour 1 / Jour 2 » sur les itinéraires éditoriaux multi-jours, alors que le créateur les affiche : incohérence entre les deux rendus. | ⚠️ |
| m3 | **Badge amputé dans « Autres itinéraires »** : « 3 étapes » au lieu de « 3 étapes · Journée complète ». La durée disparaît exactement au moment du choix (18 divergences, les 6 itinéraires). | ⚠️ |
| m4 | **Le site se contredit sur un temps de trajet** : l'itinéraire éditorial annonce « 🚗 60 min » Grasse → golfe, le générateur du même site calcule **« ~1 h 33 min »** sur le même segment. La seconde est la réaliste (~95 km). | ⚠️ |
| m5 | 5 pages partageaient le titre générique de l'accueil (`/creer-itineraire`, `/mes-itineraires`, `/mes-favoris`, `/connexion`, `/confirmer-email`). | ✅ `3c7fe11` |
| m6 | `/credits` affirmait encore que certains lieux « affichent temporairement une image de substitution » — plus aucun placeholder depuis le 2026-09-14. | ✅ `fb8d130` |
| m7 | **« Signaler une erreur » sans canal** : `/a-propos` conseille « note-le — ça sera corrigé au prochain passage ». Aucun formulaire, aucune adresse. Un titre de section qui ne tient pas sa promesse est pire que pas de section. | ⚠️ bloqué par le domaine |
| m8 | **Un lien « Réserver » réellement cassé** : `laparte-villefranche-sur-mer.com` (« Dîner au restaurant L'Aparté », 29–50 €) — échec TLS, 404 en HTTP. *Sur 195 URL testées, la seule vraiment morte* — les autres échecs sont des 403 anti-bot GetYourGuide/TheFork, fonctionnels en vrai navigateur. | ⚠️ |
| m9 | **11 liens « Réserver » pointent vers des pages génériques** GetYourGuide (`/nice-l314/`, `/antibes-l5075/`…) au lieu de l'activité nommée. | ⚠️ |
| m10 | **Zones géographiques trop larges** : « L'arrière-pays » = **54 km** de diamètre (13 communes), « Grasse & le golfe » = **55 km**. Ces zones pilotent le filtre de la carte **et** les cases du créateur : cocher une zone sélectionne des lieux à 1 h 30 de route, ce qui alimente directement M15. | ⚠️ |
| m11 | `/hors-ligne.html` n'avait **aucun** lien ni bouton : ni « Réessayer », ni retour à l'accueil. | ✅ `392a0a9` |
| m12 | **Recherche à 3,4 écrans de défilement** sur mobile, et c'est **la seule du site** : rien dans l'en-tête, rien sur les fiches lieu, rien sur `/villes`. | ⚠️ partiellement atténué par `8e88475` |
| m13 | **Ni « Lieux » ni « Itinéraires » dans la navigation** : depuis une fiche lieu, revenir au catalogue impose logo → accueil → défiler. | ⚠️ |
| m14 | **Le lien du sélecteur de langue bascule en anglais** : le bouton « FR » émet `href="/fr/…"`, or `/fr/x` redirige vers `/x`, qui redirige vers `/en/x` si le cookie `NEXT_LOCALE=en` est posé. Le clic *dans* l'app fonctionne ; c'est le lien copié/partagé qui trahit. | ⚠️ |
| m15 | **Accessibilité** : cases de zone sans nom accessible, `outline-none` sans remplacement sur la modale. *Le constat sur les radios de durée était faux* (`input.labels` renvoie bien « Demi-journée »). **Pire que décrit** : les 5 autres champs n'avaient *aucun* indicateur de focus, le `focus:border-white/30` étant neutralisé par un `borderColor` inline ; et les 3 champs de `/connexion` n'avaient pas de `<label>` associé. | ✅ `36c120a` |
| m16 | Prix au format français sur `/en` : « 20 € / adult » dans les cartes, « €7 » dans les pastilles de la même page. | ✅ `08356cb` |
| m17 | Pas de `rel=canonical`, et `?itin=` génère ~25 URL dupliquées sans canonique ni `noindex`. | ✅ `fb8d130` |
| m18 | Route Google Maps unique pour un séjour de 2 jours : un seul trajet à 6 points qui ignore la nuit à Beaulieu. | ⚠️ |
| m19 | Le créateur n'a pas ce bouton du tout : parité manquante avec les itinéraires éditoriaux. | ⚠️ |
| m20 | **« À faire sur place » propose une autre commune** : la fiche Saint-Paul-de-Vence liste trois activités à Vence (~4 km), commune qui n'a pas de page sur le site. | ⚠️ |
| m21 | **« À réserver » non curé dans le créateur** : 18 entrées pour 8 étapes, dont 3 restaurants pour la seule étape de Menton et un « Dîner au Petit Port » rattaché à l'étape de **09:00**. Les itinéraires éditoriaux en curent 3–4. | ⚠️ |
| m22 | **Ordre géographique discutable** : sur un 2 jours, le Jour 2 fait Cap-Ferrat → Villefranche → **Èze**, en repassant deux fois devant Èze. | ⚠️ |
| m23 | `/credits` était en `noindex` alors que c'est une page d'attribution CC BY / CC BY-SA. | ✅ `fb8d130` |
| m24 | Manifeste PWA figé en français : un anglophone installant depuis `/en` obtenait une icône et un nom français. | ✅ `392a0a9` |

---

## 4. Personas (simulés — voir l'avertissement en tête)

| # | Persona | Objectif | Résultat |
|---|---|---|---|
| P1 | Le curieux — desktop, FR | Comprendre le site, ouvrir une fiche qui donne envie | **Réussi** (2 clics) |
| P2 | Touriste à Nice 2 jours — desktop, FR | Composer et sauvegarder un plan | **Échoué** — bloqué à l'étape 7 sur B2 |
| P3 | Famille, sortie gratuite — mobile, FR | 3 idées gratuites en < 2 min | **Échoué** — M2 + M3 |
| P4 | Randonneur hors saison — desktop, FR | Vérifier les ouvertures | **Réussi avec difficulté** — info contradictoire (M4/M5) |
| P5 | Anglophone — `/en` | Préparer une journée sans revenir au français | **Réussi** — très bonne traduction, 2 accrocs (M4, m16) |
| P6 | Local, idée pour dimanche — desktop, FR | 3 idées à < 30 min | **Réussi** — meilleur parcours du site |
| P7 | Retrouver un lieu vu hier — mobile, FR | < 60 s | **Réussi avec difficulté** — M6 + m12 |
| P8 | Sur le terrain, 4G faible — mobile, FR | Adresse + navigation en < 30 s | **Échoué** — B1 + M10 + M11 |

Quelques réactions marquantes (rappel : **formulations simulées**) :

- P2 : « Je clique sur Sauvegarder, on me demande un nom, et il y a un bouton "Connexion
  requise". Je clique — rien. Je reclique — rien. Là je serais parti. »
- P3 : « Je vais dans Culture & Visites : **un seul** résultat. Je me dis que le site ne
  propose presque rien de gratuit. » *(réalité : 120 activités gratuites sur 208)*
- P4 : « La fiche dit "fermée dimanche et lundi", la carte dit "Mardi & jeudi". Les deux ne
  peuvent pas être vraies. Je ne sais plus quoi croire, j'appellerai. »
- P5 : « Honnêtement je n'aurais pas deviné que c'est un site français traduit. »
- P7 : « Je balaie et c'est la carte qui bouge, pas la page. J'ai cru que c'était la fin du
  site. »
- P8 : « J'appuie sur Waze, il me lance une navigation… en mer. »

---

## 5. Lecture produit

**Ce qui tient.** La promesse « hors des sentiers battus » est réelle : Peillon, Falicon,
Coaraze, Saorge, le Mont Boron, les cadrans solaires — de vrais choix de repérage, pas un
best-of recopié. Le ton (« carnet de repérage, pas un guide officiel ») est juste et sobre.
Les descriptions donnent un angle concret. `/a-propos` est honnête sur ses limites et affiche
l'absence de liens affiliés — vérifiable et vérifié.

**Ce qui l'entame.**

1. **Tension de marque.** L'itinéraire vitrine s'appelle « la route des **classiques** » et
   enchaîne Monaco, le Musée Océanographique, Èze et la Villa Ephrussi — exactement les dix
   endroits que `/a-propos` promet d'éviter. Il porte en plus dans son titre une ville où il
   ne passe pas (m1).
2. **Le trésor est enfermé.** 208 activités avec durée, prix, horaires et lien : c'est la
   vraie différenciation face à un guide générique. Ni cherchables (M2, corrigé depuis), ni
   parcourables (M3). Le site exposait 36 vignettes et cachait 172 fiches actionnables.
3. **Ce qui manque pour se décider et partir.** Aucun **budget total** sur un itinéraire (un
   2 jours implique ~50 €/pers. de réservations, jamais additionnés). Aucune information
   d'**hébergement**, alors que le site écrit « Dormir à Beaulieu-sur-Mer ». Aucune option
   **transports en commun** (tout suppose une voiture et un stationnement payant). Aucune
   **preuve sociale** — zéro avis, zéro note, zéro photo de visiteur, dans une catégorie où
   l'on vérifie systématiquement avant de se déplacer. Aucun **angle famille**.
4. **Contrat de fiabilité.** Trois affirmations de `/a-propos` étaient contredites par le site
   lui-même : les coordonnées « vérifiées une par une » (B1/M9), la règle des badges
   « praticable à cet endroit précis » (M12), et « Signaler une erreur » sans moyen de
   signaler (m7). Ce sont les trois à traiter en priorité : elles touchent la page dont le
   rôle est d'établir la confiance.
5. **Cadre légal.** Aucune page de mentions légales ni de politique de confidentialité
   (`/mentions-legales`, `/confidentialite`, `/cgu` → 404), alors que le site collecte email
   et prénom, dépose un cookie de session et charge Plausible. Le formulaire d'inscription ne
   présente aucune mention RGPD. **À régler avant l'achat du domaine, pas après.**

---

## 6. Ce qui fonctionne bien — à ne pas casser

- **La qualité éditoriale.** Les « Conseils pratiques » (Accès / Photo / À combiner /
  Affluence) sont le genre de détail qu'un vrai repérage produit.
- **La version anglaise.** Sur 55 pages `/en` scannées, **une seule chaîne française
  résiduelle** (corrigée depuis). Contenu réellement traduit, pas du mot-à-mot.
- **« ⚠️ Fermé aujourd'hui »**, calculé côté client pour survivre à l'ISR. Excellente idée.
- **« Près de moi »** : tri instantané, distance sur chaque vignette, libellé du bouton qui
  change, trois états d'erreur distincts et actionnables. **Le meilleur composant du site.**
- **« Surprends-moi »**, qui respecte les filtres actifs et reste dans la locale.
- **La recherche**, insensible aux accents dans les deux sens, état vide explicite.
- **Le fil d'Ariane contextuel `?itin=`** : arriver depuis un itinéraire change le fil pour y
  revenir.
- **Le bouton favori déconnecté** : redirection immédiate vers `/connexion?callbackUrl=…`,
  sans cul-de-sac — exactement ce que la modale de sauvegarde aurait dû faire.
- **L'intégrité des données croisées** (vérifiée programmatiquement) : 0 pastille orpheline,
  0 carte de réservation pointant vers une activité inexistante, 0 dérive de prix entre
  pastille et activité source, 300 images valides sur 304, 194 liens de réservation
  fonctionnels sur 195.
- **Le générateur d'itinéraire** : pauses déjeuner, marqueurs de nuit, blocs de transit,
  réarrangement, en-têtes de jour. La mécanique est bonne — ce sont ses bords qui pèchent.
- **Le socle SEO** : `hreflang` complets et croisés, sitemap à 86 URL conforme, `og:*`
  corrects avec dimensions.
- **La stratégie PWA** : cache à l'usage plutôt que précache (58 Mo d'images, le choix est
  juste), plafonds LRU, exclusion des routes privées, page hors-ligne bilingue. Il manque
  surtout de le **dire** à l'utilisateur.
- **`/a-propos`**, qui dit franchement ce que le site n'est pas et que les prix vieillissent.
