# Roadmap — Riviera Secrète

## Suites des audits du 2026-09-14

Trois audits menés dans la nuit du 13 au 14 (sécurité backend, tests utilisateurs, UX
mobile/web) — rapports complets dans **`docs/audits/`**. **Tout est corrigé, poussé et
déployé le 2026-09-14** — deux tournées : d'abord les correctifs de sécurité, d'UX et les
coordonnées, puis le générateur d'itinéraire, la page `/activites` et le lot fiabilité.
Base de prod synchronisée à chaque fois. Sauf ce qui est listé ci-dessous.

### À faire par l'utilisateur — bloquant

- [ ] 🔴 **Rotation du mot de passe PostgreSQL de prod.** Il est dans l'historique d'un
      dépôt **public** (commit `7f25aea`, poussé), sur le proxy public Railway : accès
      `postgres` complet pour quiconque lit le dépôt — comptes, hashs, tokens de
      confirmation d'email en clair. Le retirer du fichier (fait, `7f57c21`) **ne suffit
      pas**. Rotation via Railway, puis mise à jour de
      `ConnectionStrings__DefaultConnection` sur le service `api` et de
      l'`appsettings.Development.json` local. Inspecter les lignes de `Users` non reconnues.
      `scripts/sync-coordonnees.sh` relit la chaîne à chaque exécution, donc il restera
      valable après la rotation.
- [x] **`ASPNETCORE_ENVIRONMENT`** — vérifié le 2026-09-14 : vaut `Production`, donc
      `POST /api/seed` n'est pas exposé (confirmé en direct, 404). `Jwt__Secret` est bien
      défini côté Railway, ce qui a permis de déployer le nouveau garde-fou de démarrage
      sans risque de crash-loop.
- [x] **Coordonnées synchronisées en base** — fait le 2026-09-14 via
      `./scripts/sync-coordonnees.sh` (7 points : 5 lieux + 2 villes). Vérifié en prod,
      `--verifie` renvoie « Prod à jour », et le lien Waze de la fiche Èze pointe désormais
      sur `43.7298,7.3619` au lieu d'un point en pleine mer.
- [x] **Déployé** — backend `railway up --service api` puis frontend `vercel --prod --yes`,
      le 2026-09-14. Vérifié en ligne : `/health` 200, `/api/seed` 404, endpoint protégé 401
      sans token, **rate limiter actif (20 × 401 puis 429)**, `register` avec payload vide
      en 400 (et non plus 500), `/robots.txt` 200 avec la ligne `Sitemap:`, `/foo.txt` 404,
      `rel=canonical` présent, plus aucune chaîne française dans les réservations de
      `/en/itineraires/villages-perches`, et les 4 photos d'activités de Gourdon en 200.

### Arbitrages produit en attente

- [ ] **Durée de vie du JWT** — 30 jours, aucune denylist de `jti`, pas de refresh token :
      un token volé reste valable 30 jours, et une rotation du secret déconnecte tout le
      monde.
- [ ] **`409` de `register`** — « Un compte existe déjà avec cet email » permet d'énumérer
      les comptes. Le corriger change l'UX du frontend.
- [x] **« Partir de cet itinéraire » n'ampute plus rien** — **fait le 2026-09-14**
      (`03f820c` + `0eb8566`). Les 6 itinéraires conservent désormais 100 % de leurs étapes
      (4/4, 3/3, 3/3, 6/6, 4/4, 5/5, vérifié sur les données réelles), le clic ouvre
      directement la vue résultat avec un bandeau « Basé sur : … », et les deux vraies
      longues journées affichent « Journée dense : fin estimée vers 20h05 ».

      Deux causes, pas une. **(1)** `parseVisitMinutes` surestimait toute durée écrite
      « X à Y h » : son motif exige une unité, donc « 2 à 4 h » ne lui montrait que « 4 h ».
      Six libellés sur vingt-trois étaient touchés, tous vers le haut. **(2)** Le budget
      restait intenable même corrigé — relever « Journée complète » à 600 min n'aurait pas
      suffi, `lerins-esterel` pesant 540 min de visites *avant* les trajets. D'où l'option
      `garderTous` : on conserve tout et on annonce une journée dense, plutôt que de
      prétendre que ça rentre.

      Deux choix de conception à connaître : le seuil de densité est exprimé **à l'horloge**
      (fin après 19 h) et non en dépassement du budget de `DUREE_META`, parce que ce budget
      est un outil de planification interne alors que le visiteur juge à l'heure de fin ; et
      le calcul horaire est remonté dans `construirePlanning()` pour que l'avertissement et
      le programme détaillé ne puissent pas diverger.
- [x] **Générateur moins conservateur** — **fait le 2026-09-14**. Deux causes traitées
      ensemble : la coupure gloutonne s'arrêtait au **premier** candidat qui ne rentrait pas,
      or c'est le plus proche géographiquement, pas le moins coûteux — un lieu suivant, plus
      court, aurait tenu. Et le budget de `DUREE_META` était traité comme une limite dure
      alors que c'est un repère de planification : une étape était écartée à quinze minutes
      près, sur une journée qui se terminait à **15h10**.

      Une seconde passe replace désormais chaque exclu dans la journée où il coûte le moins
      de trajet supplémentaire — en l'insérant entre deux arrêts voisins quand c'est moins
      cher que de rallonger la fin de journée — avec une tolérance d'un quart de budget.
      Au-delà, c'est l'avertissement « journée dense », exprimé à l'horloge, qui prend le
      relais plutôt qu'un retrait silencieux.

      Mesuré sur les données réelles : `antibes-biot-juan` 3/4 → **4/4**,
      `grasse-saint-tropez` 2/3 → **3/3**, `villages-perches` 3/5 → **4/5**. Sur une sélection
      libre de 13 lieux : 3 jours passe de 11 à **13/13**, 2 jours de 8 à 10. La journée la
      plus tardive jamais générée finit à 18h50, donc sous le seuil d'avertissement — les
      deux mécanismes restent cohérents. Vérifié aussi : aucun doublon, aucun lieu perdu.
- [x] **« N lieux non inclus faute de temps » redevenu crédible** — corrigé par la seconde
      passe ci-dessus. Sur le cas exact de l'audit (2 jours, 13 lieux) : **5 exclus → 3**, et
      les journées se terminent maintenant vers 17h25 et 18h20 au lieu de 16h. Le message dit
      donc quelque chose de vrai, ce qui n'était pas le cas.

### Fiabilité — contredit `/a-propos`, donc prioritaire

- [~] **Badges de `rue-obscure-villefranche` — le constat de l'audit ne tient pas**
      (vérifié le 2026-09-14, **aucun changement fait**). L'audit signalait qu'une « rue
      couverte » portant `plage` et `plongee` sortait en tête du filtre plage. Mais la règle
      du projet dit « praticable **à cet endroit précis**, pas ailleurs dans la commune », et
      le précédent `roquebrune-cap-martin-village` garde `plage` pour des plages à ~10 min à
      pied. Or la plage des Marinières est à 3-5 min de la Rue Obscure, et le lieu porte
      lui-même « Baignade à la plage des Marinières » et « Plongée snorkeling » dans ses
      activités : retirer les badges rendrait la fiche incohérente avec son propre contenu.
      Même conclusion pour `villa-kerylos` (la villa est bâtie sur les rochers de la baie des
      Fourmis) et `colline-du-chateau-nice` (plage des Ponchettes à son pied).
      **Le vrai problème est un écart de périmètre, pas de badge** : le lieu s'appelle « La
      Rue Obscure » mais couvre en fait tout le vieux Villefranche — citadelle, kayak,
      snorkeling, plage. C'est le nom qui devrait être élargi (« Le Vieux Villefranche et la
      Rue Obscure »), ce qui rendrait le résultat du filtre plage compréhensible. Décision
      éditoriale laissée à l'utilisateur ; le renommage d'affichage est désormais possible
      sans toucher au slug, `refresh-lieu-fields` recopiant `Nom` depuis le 2026-09-14.
- [x] **Revalidation ISR après écriture en base** — **faite le 2026-09-14**. Les lectures
      publiques sont étiquetées (`lieux`/`villes`/`itineraires`), une route `/api/revalidate`
      protégée par secret purge par étiquette, et `RivieraSecrete.Tools` l'appelle après
      chaque écriture réussie.

      Étiquettes plutôt que chemins : un lieu apparaît sur sa fiche, l'accueil, sa ville,
      `/activites` et les itinéraires qui le citent, en deux langues — énumérer ces chemins
      serait un inventaire à tenir à jour, donc un inventaire qui finirait faux. Et
      `{ expire: 0 }` plutôt que le profil `"max"` recommandé par défaut, qui sert encore le
      contenu périmé le temps de régénérer : on invalide justement parce qu'une information
      était fausse.

      L'échec d'invalidation n'est jamais bloquant — la base, elle, a bien été écrite — mais
      il est signalé bruyamment, et `revalidate: 3600` reste le filet.

      **À configurer** : `REVALIDATE_SECRET` sur Vercel, et `FRONTEND_URL` +
      `REVALIDATE_SECRET` dans l'environnement où tourne l'outil. Sans ça, l'outil prévient
      et le contenu se rafraîchit au bout d'une heure comme avant.
- [ ] **L'invalidation ne couvre pas une écriture directe en base** — si le contenu est
      modifié hors de `RivieraSecrete.Tools` (psql, console Railway), rien ne purge le cache.
      Acceptable tant que l'outil reste le seul chemin ; à revoir si une interface
      d'administration apparaît.
- [x] **`extraSpans`/`extraSpansEn` purgés** — **fait le 2026-09-14**. Retirés du record
      `BookingRef`, du type TS et des 20 occurrences de `data/itineraires.json`, puis les
      6 itinéraires resynchronisés.
      **Aucune migration EF, contrairement à ce qui était prévu ici** : `Itineraire.Booking`
      est une colonne `jsonb` avec convertisseur, les clés disparues sont simplement ignorées
      à la lecture et retirées à la réécriture. Bon à retenir pour `ogImage`, qui est dans le
      même cas.
- [x] **`prixEn` normalisés dans les données** — **fait le 2026-09-14**. 85 prix réécrits
      au format anglais (« 35–50 € / person » → « €35–50 / person ») et synchronisés en base.
      `formatEuroAnglais` reste en place comme filet : elle est idempotente, et une activité
      ajoutée plus tard à la française serait sinon affichée telle quelle sur `/en`.
- [ ] **Couvrir l'état connecté en test** — non testé par l'audit (la reconnexion Google
      exige une saisie d'identifiants) : favoris persistés, `/mes-itineraires` peuplée,
      édition et suppression d'un itinéraire sauvegardé.

## Retours audits UX/UI — 14 septembre 2026

Deux rapports externes reçus le 2026-09-14 : `audit-ux-riviera-secrete.html` («  Un très bon
fond dans une coquille qui fuit ») et `audit-ux-ui-riviera-secrete.html` (« Coupe de la page
d'accueil »). Codes de référence entre parenthèses pour retrouver le détail dans les rapports.

### Bugs bloquants — à corriger en priorité

- [ ] **L'itinéraire non sauvegardé disparaît au rechargement** (PR-01) — après génération,
      l'URL reste `/creer-itineraire` sans paramètre ; un F5 ou un retour arrière efface tout
      le travail. La mécanique existe déjà pour les itinéraires sauvegardés (`?id=`). **Piste** :
      encoder la sélection et la durée dans l'URL (`?duree=journee&lieux=eze,la-turbie`) et
      reconstruire au montage — couvre les visiteurs sans compte, le retour arrière et le
      bookmark.
- [ ] **« Ajouter à un itinéraire » efface le lieu précédent** (PR-02) — fiche Èze puis fiche
      Gourdon : `?add=gourdon-village`, Èze a disparu. Le verbe « ajouter » promet un panier,
      il n'y en a pas. **Piste** : accumuler dans l'URL ou `sessionStorage`, afficher un
      compteur visible, retour immédiat sur la fiche (« Ajouté — 3 lieux ») sans naviguer.
- [ ] **La 404 est celle de Next.js, en anglais** (PR-03) — `/lieux/page-qui-nexiste-pas` →
      écran noir « 404 — This page could not be found. », sans en-tête ni pied de page.
      **Piste** : un `not-found.tsx` localisé avec la mise en page du site et deux ou trois
      suggestions de lieux (le bouton « Surprends-moi » existe déjà).
- [ ] **« Partager le lien » d'un itinéraire sauvegardé produit un lien privé** (EC-01) —
      le lien copié est `/creer-itineraire?id=<uuid>` ; sans authentification, l'API renvoie
      405 et la page retombe silencieusement sur le formulaire vide, sans message. Le partage
      par `?jours=` (fait le 2026-09-13) couvre les itinéraires non sauvegardés — c'est
      le cas des sauvegardés qui reste cassé. **Piste** : un endpoint de lecture publique sur
      un identifiant non devinable, ou encoder le contenu dans l'URL comme pour `?jours=` ;
      plus un message explicite quand l'itinéraire est introuvable, et un retour visible après
      copie (toast « Lien copié »).
- [ ] **Champs de saisie en 12–14 px → zoom automatique Safari iOS** (MO-02) — sous 16 px,
      Safari iOS zoome à la mise au point d'un champ et ne dézoome pas. **Piste** :
      `font-size: 16px` sur tous les `input`, `select` et `textarea` — correctif trivial,
      fort impact mobile.

### Correctifs UX — effort faible à moyen

- [ ] **Suppression d'itinéraire via `window.confirm()`** (EC-03) — la modale de nommage
      juste à côté est soignée (`role="dialog"`, focus auto, nom pré-rempli) ; la suppression
      ouvre une boîte système non stylée, boutons en langue du navigateur. **Piste** : réutiliser
      le composant de modale existant avec « Supprimer » en bouton destructif et « Annuler »
      par défaut ; ajouter un « Annuler » de quelques secondes après suppression.
- [ ] **Resauvegarder un itinéraire existant redemande le nom** (EC-04) — modifier un
      itinéraire déjà sauvegardé et cliquer « Sauvegarder » rouvre la modale de nommage,
      champ pré-rempli. La mise à jour se fait bien en place, mais l'étape est superflue.
      **Piste** : ne demander le nom qu'à la première sauvegarde ; ensuite « Enregistrer les
      modifications » directement, avec un « Renommer » séparé.
- [ ] **Les cartes `/mes-itineraires` n'ont pas de lien** (EC-05) — « Voir » et « Supprimer »
      sont des `<button>` ; la carte ne porte aucun `href` vers `?id=…`. Impossible d'ouvrir
      un itinéraire dans un nouvel onglet ou de le mettre en favori. **Piste** : rendre la
      carte cliquable via un vrai lien vers `?id=…` ; ajouter renommer / dupliquer.
- [ ] **Échap ne ferme ni la modale ni le menu burger** (EC-07) — la modale est un
      `<div role="dialog">` non natif (pas de piège à focus ni d'arrière-plan inerte). **Piste** :
      `<dialog>` natif avec `showModal()` pour avoir Échap et le piège à focus gratuitement ;
      écouter `Escape` sur le menu.
- [ ] **Lieu écarté « faute de temps » non nommé dans l'alerte** (PR-06) — l'alerte dit
      « 1 lieu non inclus faute de temps — à voir en bas de page » sans nommer le lieu, et sans
      action proposée. **Piste** : nommer le lieu dans l'alerte et proposer « Étendre à 2 jours »
      ou « Remplacer une étape » à côté.
- [ ] **Durées formatées incohérentes dans le générateur** (DC-05) — « ~1 h », « ~18 min »
      et « ~1.8 h » (point décimal anglais) cohabitent. **Piste** : un seul formateur de durée
      (`1 h 45`, `20 min`), arrondi au quart d'heure au-delà d'une heure.
- [ ] **Clic sur « Favoris » éjecte sans contexte** (PR-07) — déconnecté, le cœur redirige
      vers `/connexion?callbackUrl=…` mais la page de connexion affiche son texte générique.
      **Piste** : un titre contextuel (« Connecte-toi pour épingler Èze ») et un retour vers
      la page d'origine plutôt que l'accueil.
- [ ] **L'inscription n'a pas d'URL propre** (PR-08) — « Créer un compte » est un `<button>`
      qui bascule le contenu de `/connexion` sans changer l'URL ; idem « Mot de passe
      oublié ». Impossible d'envoyer un lien direct ni de mesurer le funnel. **Piste** :
      `/inscription` et `/mot-de-passe-oublie` comme routes à part entière.
- [ ] **Message d'erreur de connexion non annoncé** (AC-01) — « Email ou mot de passe
      incorrect. » est dans un `<p class="text-xs">` sans `role="alert"` ni `aria-live` — un
      lecteur d'écran n'annonce rien. **Piste** : `role="alert"` sur le conteneur, taille de
      texte alignée sur le corps de page, focus déplacé sur le message après échec.
- [ ] **Liens Maps/Waze/Plans à 16 px de haut sur mobile** (MO-01) — c'est l'action
      principale d'un site de destination consulté sur place, et c'est la plus petite cible
      de la fiche lieu. **Piste** : passer les trois liens en boutons de 44 px minimum avec
      espacement suffisant entre eux.
- [ ] **Libellés de sortie des activités inconsistants** (DC-03) — « En savoir plus → »,
      « Réserver → », « Voir les offres → » cohabitent sans règle ; certains liens « Réserver »
      ouvrent une page générique de ville ou le site vitrine d'un restaurant sans réservation.
      **Piste** : deux libellés seulement — « Réserver » quand le lien mène à une page de
      réservation de cette activité précise, « Site officiel » sinon.
- [ ] **Carte et liste de lieux filtrées indépendamment** (AI-04 / NF-01) — filtrer une zone
      sur la carte (34 → 26 marqueurs) ne change pas la liste (reste à 43), et inversement.
      Les deux systèmes de filtres de la homepage ne se parlent pas. **Piste** : un seul jeu
      de filtres pilotant carte et liste simultanément, avec un compteur unique.
- [ ] **Favoris : mise à jour non optimiste et `/mes-favoris` sans lien vers le générateur**
      (EC-06) — 416 ms entre le clic et le changement de libellé, sans indicateur de
      chargement ni `aria-busy`. Et un utilisateur qui a épinglé huit lieux a fait exactement
      la sélection que demande le générateur — rien ne relie les deux pages. **Piste** : mise
      à jour optimiste + `aria-pressed` sur le bouton cœur ; ajouter « Créer un itinéraire à
      partir de mes favoris » sur `/mes-favoris`.
- [ ] **Compte proposé au mauvais moment** (PA-04) — la seule invitation à créer un compte
      est le redirect au clic sur un cœur. Rien après la génération d'un itinéraire, là où
      l'utilisateur a quelque chose à perdre. **Piste** : proposer la sauvegarde sous
      l'itinéraire fraîchement généré, et ajouter « Créer un itinéraire à partir de mes
      favoris » (voir EC-06 ci-dessus).

### Chantiers structurels — décisions produit à prendre d'abord

- [ ] **Page `/villes` : générer uniquement pour les communes à 2 lieux ou plus** (DC-04) —
      28 pages villes sur 34 affichent « 1 lieu », une carte et une phrase — un clic de plus
      pour rien, et deux pages qui se concurrencent sur la même requête. **Piste** : ne
      générer une page que pour les communes à ≥ 2 lieux, rediriger les autres directement
      vers la fiche du lieu.
- [ ] **Sélection de lieux dans le générateur sans vignette ni info** (PR-05) — 43 noms
      dans des accordéons, sans photo, sans commune, sans durée. Le site vend des lieux
      confidentiels : le visiteur ne les connaît pas. **Piste** : réutiliser la carte-lieu
      compacte (photo + commune + durée) dans les accordéons.
- [ ] **Le générateur ne demande jamais d'où on part** (PR-04) — départ figé à 09:00, voiture
      implicite, aucune date, aucun point de départ. Les alertes « Fermé aujourd'hui » se
      calculent sur la date du jour, pas sur la date du voyage. **Piste** : trois champs —
      commune de départ, date, voiture / transports — la date seule rendrait les alertes
      d'ouverture honnêtes.
- [ ] **Rebond manquant sur la fiche lieu : l'itinéraire qui passe par ici** (PA-03) —
      c'est la page sur laquelle on arrive depuis Google, et celle qui offre le moins de
      suites. L'information existe (visible sur `/villes/eze` : « 1 itinéraire qui passe par
      ici »), pas sur la fiche elle-même. **Piste** : trois rebonds sous la fiche — l'itinéraire
      qui passe par ici, les autres lieux de la commune, « à moins de 20 minutes ».
- [ ] **Carte Leaflet : regroupement des marqueurs superposés** (NF-03) — 13 paires de
      marqueurs à moins de 18 px l'une de l'autre au zoom par défaut, sur des pastilles de
      25 px. Inopérable au doigt autour de Nice et Monaco. **Piste** : `leaflet.markercluster`,
      `fitBounds` aux marqueurs visibles plutôt qu'un centre fixe.
- [ ] **Système visuel : hiérarchie typographique et couleurs multi-sens** (SV-01/02/03) —
      204 nœuds de texte sur 224 en 12 ou 14 px, le gris secondaire plus présent que le blanc ;
      le même bleu-vert dit « clique ici », « c'est gratuit » et « c'est à Nice » ; 12 variantes
      de bouton sur la seule page d'accueil. **Piste** : une échelle à cinq crans réellement
      utilisée (12 / 14 / 16 / 20 / 28), une teinte réservée à l'action, trois variantes de
      bouton (primaire / secondaire / discret).
- [ ] **Architecture de l'information : 4 entrées au même poids pour le même contenu** (AI-01)
      — Lieux / Activités / Itinéraires / Villes sont quatre projections des mêmes objets, avec
      le même poids dans le menu, mais deux sont des ancres d'accueil et deux sont de vraies
      pages. **Piste** : deux objets — un espace d'exploration (carte + liste + filtres) et une
      collection éditoriale (itinéraires) ; communes et activités deviennent des filtres.

## Refonte UI — spécifications du 2026-09-14

Spécifications complètes dans `Downloads/riviera-refonte-specs/` (10 fichiers `.md`).
Maquettes de référence dans `Downloads/refonte-riviera-secrete.html` (8 artboards, à ouvrir dans un navigateur).
Audits sources dans `Downloads/audit-ux-riviera-secrete.html` et `Downloads/audit-ux-ui-riviera-secrete.html`.
Les codes entre parenthèses (`PR-`, `SV-`, `AI-`, `DC-`, `EC-`, `MO-`, `NF-`, `PF-`, `AC-`, `PA-`) renvoient aux constats détaillés de ces audits.

Migration en **5 lots indépendants**, chacun livrable seul. Ordre imposé : les lots suivants supposent que le précédent est fait.

### Lot 1 — Fondations *(aucun changement visible pour l'utilisateur)*

**Les fichiers `01-tokens.md`/`02-composants.md` cités ci-dessous n'existent plus sur disque**
(ils vivaient dans `Downloads/riviera-refonte-specs/`, jamais versionnés) — la seule spec
encore disponible est `docs/design-refonte-2026-09-14.md`, extraite des maquettes le même
jour. **Écart réel constaté entre les deux** : `01-tokens.md` décrivait une échelle
typographique à 7 crans (`--rs-` préfixés) alors que `docs/design-refonte-2026-09-14.md`
n'en décrit que 6, non préfixés (Nuit/Calcaire/Aube/…, Display/Section/Card/Body/Meta/Data).
Le sous-lot ci-dessous suit `docs/design-refonte-2026-09-14.md` (seule source disponible) —
si les 7 crans de `01-tokens.md` reflétaient une décision plus récente, il faudra réconcilier
au moment du Lot 4.

- [~] **Tokens CSS + composants partagés** — **fait le 2026-09-14, système visuel seulement**
      (le cache CDN et la sécurité `apiToken` ci-dessous restent à faire, traités à part —
      voir aussi `.claude/plans/luminous-hugging-sundae.md`). Palette Nuit/Nuit haute/
      Calcaire/Brume/Aube/Pin + 5 teintes Mer (provisoires, faute du fichier maquette
      source), rayons (`--radius` 3px / `--radius-sm` 2px / `--radius-full` 50%), ombre
      `--shadow-float`, typographie à 6 crans (`.text-display/-section/-card-title/-body/
      -meta/-data`, Bodoni Moda + Karla + IBM Plex Mono chargées via `next/font/google`) —
      tout dans `frontend/src/app/globals.css`, **additif** : les anciens tokens
      (`--azure`, `--terracotta`, `.focus-ring`) restent inchangés et pilotent encore toutes
      les pages existantes, `--azure`/`--terracotta` étant chacun surchargés de 2-3 sens
      différents sans équivalent 1:1 dans la nouvelle palette (migration écran par écran au
      Lot 4). Composants neufs dans `frontend/src/components/ui/` : `Button` (3 variantes),
      `Chip`, `Badge` (gratuit/prix/fermé), `Field`/`SelectField`/`TextareaField`, `Modal`
      (natif `<dialog>`, Échap + piège à focus gratuits — vérifié par dispatch d'événement,
      l'appui clavier simulé par l'outil de navigation ne déclenchant pas l'action native du
      navigateur), `Toast`, plus un jeu minimal de 8 icônes SVG (`frontend/src/components/ui/
      Icons.tsx`) en remplacement futur des emojis d'interface — non substituées dans le code
      existant. Mapping zones carte dans `frontend/src/lib/mer-colors.ts` (non
      branché sur `HomeMap.tsx`). Aucune page existante n'a changé d'apparence, à une
      exception : la modale de sauvegarde de `creer-itineraire/page.tsx` migrée sur `Modal`
      (décision explicite, gain réel — Échap/piège à focus manquaient avant).
      **Reste hors périmètre** (voir le plan pour le détail) : migration `rounded-lg`/
      `rounded-full` sur les ~25 fichiers existants (74 occurrences), application de
      `.focus-ring`/`.focus-ring-aube` aux 44 fichiers qui n'en ont aucune, les deux cibles
      tactiles de 28px trouvées (`HomeMap.tsx:140`, `HomeLieuxGrid.tsx:316`), branchement de
      `mer-colors.ts` sur la carte, règle de rareté du bouton primaire, accessibilité (hors
      Modal), cibles tactiles générales — tout ça suppose de toucher des écrans existants,
      donc réservé au Lot 4.
- [ ] **Rayons et ombres — application aux ~25 fichiers existants** — tokens posés (ci-dessus), reste à retirer `rounded-lg`/`rounded-full` du code applicatif (74 occurrences) et les remplacer par les tokens/composants. Corrige : 59 éléments à 12 px + 39 pilules = plus rien ne ressort (→ SV-05).
- [ ] **Règle de rareté** — un seul bouton primaire ambre visible par zone d'écran. Si deux boutons primaires cohabitent, l'un passe en secondaire. C'est ce qui libère l'aube pour l'action seule (→ SV-02).
- [ ] **Accessibilité** — `aria-pressed` sur chips et cœurs de favori ; `role="alert"` sur les messages d'erreur de formulaire ; `alt` sur toutes les images, `alt=""` explicite sur le décoratif (30 images sur 115 sans `alt` → AC-02) ; lien « Aller au contenu » en tête de `<body>` (nav de 9 entrées répétée partout, absent → AC-02) ; `.focus-ring` appliqué sur tous les éléments (la classe existe dans le CSS mais n'est posée sur aucun élément, → AC-02) ; focus `outline: 2px solid var(--rs-aube)` ; Échap ferme menu/modale/panneau (→ EC-07).
- [ ] **Cibles tactiles** — 44 px minimum pour tout élément interactif, 8 px d'écart entre deux cibles voisines. 20 boutons sur 20 sous ce seuil sur l'accueil mobile actuel (→ MO-01).
- [ ] **Cache CDN** (`09-donnees-api-migration.md` § 2.3) — sortir la lecture de session du layout racine (composant client sur l'en-tête uniquement), rendre les routes éditoriales statiques avec ISR. Cible : `x-vercel-cache: HIT` sur `/lieux/*` au lieu de TTFB 1 960 ms à froid (→ PF-01). Meilleur rapport effort/gain de toute la liste.
- [ ] **Sécurité apiToken** (`09` § 2.2) — proxifier les appels via des route handlers Next (`app/api/**/route.ts`), garder le JWT dans un cookie `httpOnly Secure SameSite=Lax`. Le navigateur n'appelle plus Railway directement. À défaut : réduire fortement la durée de vie du token (→ EC-02).

*Recette :* aucun `<input>/<select>` sous 16 px ; aucune cible tactile sous 44 px ; `x-vercel-cache: HIT` sur `/lieux/*` ; `/api/auth/session` ne contient plus `apiToken`.

### Lot 2 — Contrat d'URL

- [ ] **Filtres dans l'URL sur toutes les listes** (`03-architecture-routes-url.md` § 5.1) — `router.replace(url, { scroll: false })` à chaque changement ; `useSearchParams()` au montage. Un état vide = paramètre absent (jamais `?zone=`). Format : `/explorer?zone=menton-monaco&type=village,sentier&duree=court&niveau=facile&ouvert=1&q=eze&sort=proximite`. Corrige PR-01 pour les filtres.
- [ ] **`/composer` avec état complet dans l'URL** (`03` § 5.2) — `/composer?duree=journee&depart=nice&date=2026-09-19&transport=voiture&lieux=eze-village,la-turbie,rue-obscure`. Paramètre `lieux` **cumulatif** : « Ajouter à un itinéraire » depuis une fiche *ajoute* le slug, ne le remplace pas. Corrige PR-02 (un lieu écrase le précédent).
- [ ] **Routes `/inscription` et `/mot-de-passe-oublie`** — deux routes à part entière avec leur propre URL, pas des bascules sur `/connexion` sans changement d'URL. La route `/reinitialiser-mot-de-passe` existe déjà (2026-09-14), garder. Corrige PR-08.
- [ ] **Page 404 localisée** (`03` § 7) — `app/not-found.tsx` avec la mise en page du site, un champ de recherche et trois lieux tirés au hasard (le bouton « Surprends-moi » existe déjà dans le code). Corrige la 404 Next.js en anglais sans en-tête ni lien (→ PR-03).

*Recette :* une vue filtrée se partage et se recharge à l'identique ; Précédent défait un filtre ; un F5 sur un itinéraire composé ne perd rien ; ajouter trois lieux depuis trois fiches donne `lieux=lieu1,lieu2,lieu3`.

### Lot 3 — Données

- [ ] **Tags des 43 lieux nettoyés** (`09` § 1.1) — passe manuelle sur les 43 fiches, `tags: TagLieu[]` propre au lieu, jamais dérivé de la commune. Vocabulaire figé : `village | sentier | crique | jardin | monument | panorama | table`. Demi-journée de travail, meilleur rapport effort/crédibilité. Tant que ce n'est pas fait, les filtres d'Explorer mentent (→ DC-01).
- [ ] **`commune_slug` sur les activités** (`09` § 1.2) — nouveau champ ; affichage : commune en sous-titre, « à proximité de X » seulement si `lieu_slug` renseigné et `sur_place === false`. Corrige « Sortie kayak de mer · La Rue Obscure » — on ne fait pas de kayak dans une rue couverte du XIII siècle (→ DC-02).
- [ ] **`lien_type` et `partenaire`** (`09` § 1.3) — deux libellés seulement : `reservation` → « Réserver », `officiel` → « Site officiel ». Un lien n'est `reservation` que s'il mène à la page de réservation de cette activité précise. Liens partenaires : `rel="sponsored nofollow"` + mention mono 12 `--rs-brume` « lien partenaire ». Corrige DC-03.
- [ ] **Formateur de durée unique** (`08-ecran-itineraire.md` § 4) — < 60 min → `45 min` arrondi à 5 ; ≥ 60 min → `1 h 45` arrondi au quart d'heure. Jamais de décimale, jamais de `~`. La chaîne `~1.8 h` ne doit plus pouvoir exister (→ DC-05).
- [ ] **Horaires calculés sur la date de visite** (`09` § 3) — `estOuvert(horaires, dateVisite, heureVisite)` ; `dateVisite` vient toujours du paramètre `date` de l'écran Composer, jamais de `new Date()`. Les alertes « Fermé aujourd'hui » deviennent vraies pour un voyage dans le futur.

*Recette :* filtrer « Criques » ne remonte aucun village ; aucune carte d'activité n'affiche un lieu parent comme adresse ; la chaîne `1.8 h` n'existe plus nulle part.

### Lot 4 — Écrans

Dans cet ordre — chacun indépendant. La fiche lieu en premier : c'est la page d'atterrissage n° 1 depuis Google, et elle a le meilleur ratio effort/valeur. L'accueil en dernier : il pointe vers les autres écrans, autant qu'ils existent d'abord.

#### 4a. Fiche lieu (`06-ecran-fiche-lieu.md`)

La composition actuelle est bonne (galerie → identité → infos pratiques → carte → récit → conseils → activités → rebonds). Elle change de peau et gagne trois blocs.

- [ ] **Barre d'action fixe mobile** (`02-composants.md` § 7) — ancrée en bas : bouton primaire « Y aller » 52 px `flex-grow` + icône épingle 19 px + 3 carrés 52 × 52 (favori/partage/ajouter). `padding-bottom: max(20px, env(safe-area-inset-bottom))`. Le contenu réserve 112 px en bas. Corrige MO-05 (actions disparaissent au défilement sur mobile) et MO-01 (liens Maps/Waze/Plans à 16 px de haut).
- [ ] **Trois rebonds sous la fiche** (`06` § 2.6) — ① « Cet itinéraire passe par ici » : carte de liste avec sur-titre `6 ÉTAPES · 2 JOURS` en aube, étape et heure en mono ; ② « À moins de 20 minutes » : 3 lieux en lignes 44 px avec distance estimée en aube ; ③ ligne de confiance mono 12 `VÉRIFIÉ SUR PLACE EN AOÛT 2026 · PHOTO [CRÉDIT]`. Corrige PA-03 (la fiche qui reçoit 100 % du trafic organique offre le moins de suites).
- [ ] **Favori optimiste** — bascule immédiate, retour arrière en cas d'échec réseau ; `aria-pressed` ; déconnecté → feuille contextuelle « Connecte-toi pour épingler Èze » avec bouton primaire de connexion (pas redirection sèche → PR-07) ; appliquer le favori automatiquement au retour.
- [ ] **« Ajouter à un itinéraire » sans quitter la page** — ajoute le slug à `lieux=` de `/composer` de façon cumulative ; toast « Ajouté — 3 lieux » avec action « Composer ». Corrige PR-02 (navigue vers `/creer-itineraire?add=<slug>` et remplace la sélection précédente).
- [ ] **Encadré « Le bon moment »** (`06` § 2.3) — reprend les « Conseils pratiques » existants en forme tabulaire scannable (Y aller / Saison / Stationner). Surface `--rs-nuit-haute`, bordure `--rs-trait`, icône horloge aube.
- [ ] **Composition desktop** (`06` § 3) — deux colonnes ≥ 1024 px : gauche (62 %) galerie/identité/récit, droite (38 %, collante) carte/actions/rebonds. Largeur de lecture du récit : 66 caractères max. Fil d'Ariane : supprimer la redondance quand le nom du lieu commence par le nom de la commune.
- [ ] **JSON-LD `TouristAttraction`** (`06` § 4) — nom, description, `geo`, `address`, `isAccessibleForFree`, `openingHours` quand la donnée existe. Gain SEO direct sur 43 pages.

#### 4b. Explorer (`05-ecran-explorer.md`) — nouvelle page `/explorer`

Remplace la section `#lieux` + la carte de l'accueil + `/activites`. Un seul écran, plein viewport, filtres uniques en tête, carte et liste synchronisées.

- [ ] **Barre de filtres unique** pilotant carte ET liste — chips de type, chips déroulants durée/niveau, chip bascule « Ouvert aujourd'hui », « Tout effacer » mono 12 aube. Hors zone défilante (pas sticky — elle est fixe, la liste défile). Chaque changement réécrit l'URL. Corrige AI-04/NF-01 (deux jeux de filtres indépendants).
- [ ] **Corps en grille `1fr 468px`** — carte à gauche (pleine hauteur, pas de défilement propre), liste à droite (zone défilante 24 px, `gap: 10`, cartes compactes).
- [ ] **Carte et liste synchronisées** — survol carte → marqueur aube + étiquette ; survol marqueur → carte bordurée + scrollée ; clic marqueur → `/lieux/[slug]` ; déplacement/zoom → recalcul liste + `bbox` dans l'URL (débounce 400 ms) ; changement de filtre → `fitBounds`.
- [ ] **Amas obligatoires** (`leaflet.markercluster`) — pastille 32–36 px, fond `--rs-nuit-3`, bordure `--rs-zone-3`, chiffre 14/700. 13 paires de marqueurs se superposent autour de Nice/Monaco au zoom par défaut (→ NF-03).
- [ ] **Marqueurs** — 15 px (13 sur mobile), couleur = zone (`--rs-zone-{1-5}`), bordure 2 px `--rs-nuit`. Marqueur sélectionné : aube, étiquette rattachée par un trait 1 px de 16 px, fond aube, texte nuit 15/700.
- [ ] **Légende d'altitude** — cartouche 40 px ancré en haut à gauche (20 px), mono `ALTITUDE`, barre dégradé 92 × 8 (`--rs-zone-1` → `--rs-zone-5`), mono `0 — 800 m`.
- [ ] **Contrôles de zoom** — 44 × 44 (actuellement 30 × 30), fond `--rs-nuit`, bordure `--rs-trait`, rayon 3, en bas à gauche. Bouton « Recentrer sur ma position » en bas à droite, secondaire 44. Corrige MO-01.
- [ ] **Pagination** — chargement progressif par 24 au défilement + bouton secondaire « Voir 24 lieux de plus ».
- [ ] **Mobile** — vue liste par défaut avec filtres collants (`position: sticky; top: 0`, corrige NF-04) ; bouton flottant primaire 52 « Voir sur la carte » sur dégradé 96 px ; tap sur un marqueur → feuille basse (hauteur ≈ 180) avec bouton « Voir la fiche ».
- [ ] **États** — squelettes sans animation de brillance pendant le chargement ; état vide avec bouton secondaire « Tout effacer » ; bouton flottant « Chercher dans cette zone » si bbox sans résultat.
- [ ] **`/activites` redirige en 301** vers `/explorer?type=activites` — les 208 activités vivent dans la fiche lieu (« À faire sur place ») et dans Explorer, pas dans une page-catalogue de 57 000 px (→ NF-04).

#### 4c. Composer (`07-ecran-composer.md`) — `/composer` remplace `/creer-itineraire`

Le moteur algorithmique est bon. L'entrée et la sortie le desservent.

- [ ] **Bandeau de 4 paramètres** — grille 4 colonnes : DURÉE / DÉPART + heure `08:30` / DATE / TRANSPORT (voiture ou train + marche). La date rend les alertes d'ouverture honnêtes pour un voyage dans le futur (→ PR-04). Les trois premiers sont les paramètres qui manquent aujourd'hui.
- [ ] **Sélection sur vignettes** (`02` § 5.3) — grille 3 colonnes, cartes avec image 3:2, case d'état 28 × 28 (non sélectionnée : carré bordé `--rs-brume` ; sélectionnée : fond aube + coche nuit ; fermée : `opacity .6` + voile + badge « Fermé samedi » calculé sur la `date`). Remplace les 43 noms nus dans des accordéons sans photo ni info (→ PR-05).
- [ ] **Recherche + filtre de zone** — champ 44 + chips de zone (défilement horizontal) + lien « Depuis mes favoris (N) ». Ce dernier est le pont manquant entre les favoris et le générateur (→ PA-04).
- [ ] **Récapitulatif vivant** (colonne droite 500 px) — carte avec pastilles numérotées en aube reliées par un trait ambre pointillé (l'ordre est celui du moteur, pas celui du clic) ; panneau : titre Bodoni « 3 lieux, 5 h 40 » + 4 chiffres (temps sur place / trajets / entrées à prévoir / reste dans la journée — en `--rs-pin` si positif, en aube si négatif) ; encadré de suggestion ; bouton primaire pleine largeur 52 désactivé si 0 lieu + mention « Choisis au moins un lieu. » avant le clic.
- [ ] **Tout dans l'URL** via `router.replace` — fermer l'onglet et revenir recharge l'état complet. La mention « Ta sélection est conservée dans le lien » n'est écrite que si l'URL est effectivement synchronisée.
- [ ] **Mobile** — barre fixe en bas (ligne 1 : récap chiffres, ligne 2 : bouton primaire pleine largeur 52).
- [ ] **Micro-copie** — « On place tes lieux dans l'ordre, avec les horaires et les temps de trajet. » remplace « l'algorithme compose le meilleur itinéraire possible » ; « Composer l'itinéraire » remplace « Générer » (→ MC-02).

#### 4d. Itinéraire composé (`08-ecran-itineraire.md`) — route `/i/[id]` (nouvelle, publique)

- [ ] **Lecture publique** (`09` § 2.1) — `GET /api/itineraires/:id` public sans auth (200/404) ; `POST /api/itineraires` sans compte → `{ id, editToken }`, `id` nanoid ≥ 8 non devinable, champ `visibilite: 'lien'` par défaut. `PATCH`/`DELETE` par session OU `editToken`. Corrige EC-01 (le lien partagé retourne 405/404 sans auth, puis retombe silencieusement sur le formulaire vide).
- [ ] **Persistance dans l'URL** — état complet dans `/composer?…` pour le cas anonyme : F5 reconstruit l'itinéraire, Précédent revient à la sélection. Corrige PR-01.
- [ ] **Partage avec retour visible** — après copie : texte « Lien copié », bordure et texte `--rs-pin`, coche SVG, 4 s. `navigator.share` en mobile (repli : copie). Corrige EC-01 (aucun retour visuel aujourd'hui).
- [ ] **Bandeau d'arbitrage nommé** (`08` § 2.3) — quand un lieu est écarté : nommer le lieu, donner le delta en minutes, proposer « Passer à 2 jours » / « Remplacer une étape » / « Garder pour plus tard » (→ favori). Bordure aube. Corrige PR-06 (« 1 lieu non inclus » sans nom ni action).
- [ ] **Mise en page desktop** — grille `1fr 596px` : carte collante à gauche avec tracé ambre pointillé (`stroke-dasharray: 10 8`), pastilles numérotées 26 px, profil d'altitude en cartouche ; programme à droite en chronologie `60px 1fr`.
- [ ] **URL de partage dans l'en-tête** — mono 12 `--rs-brume` : `riviera-secrete.fr/i/3f7a2c`. Pas décoratif : signale que l'itinéraire existe, se partage, survit au F5.
- [ ] **Mode Modifier** — contrôles 44 × 44 minimum (actuellement 20 × 20, → MO-01) ; « Retirer » séparé des flèches de réordonnement ; toast « Annuler » 7 s après retrait (→ `02` § 10) ; « Enregistrer les modifications » ne rouvre pas la modale de nommage si l'itinéraire existe déjà (→ EC-04).
- [ ] **Modale de suppression** — `<dialog>` natif remplace `window.confirm()` (→ EC-03), bouton destructif à droite, « Annuler » par défaut.
- [ ] **`/i/[id]` introuvable** — vraie page 404 with titre « Cet itinéraire n'existe plus », explication, bouton primaire « En composer un ».
- [ ] **Open Graph** sur `/i/[id]` — `title` = nom de l'itinéraire, `image` = photo de la première étape.
- [ ] **Export PDF** — conserver, adapter à la nouvelle mise en page.

#### 4e. Accueil (`04-ecran-accueil.md`)

L'accueil vient en dernier : il pointe vers les autres écrans.

- [ ] **Héros** — une seule image 1440 × 660 WebP+JPEG `fetchpriority="high"` `<link rel="preload">` (vs. cinq images actuelles, → PF-02). Voile gradient vertical. Sur-titre `.lbl` aube, titre Bodoni 74 px desktop / 44 mobile `max-width: 16ch`, accroche 19 px `max-width: 52ch`.
- [ ] **Panneau de qualification** posé à cheval sur le héros — surface `--rs-nuit-haute`, ombre flottante, 3 contrôles (J'AI / JE PARS DE / J'AI ENVIE DE), séparateur, bouton primaire grand « Composer mon itinéraire » + lien discret « Ou explorer les 43 lieux ». Le premier champ interactif remonte dans le héros au lieu d'attendre à 2 623 px (→ AI-02/03).
- [ ] **Section Explorer** — aperçu carte + liste synchronisés (470 px de haut, grille 1.45fr/1fr), 5 chips de filtre, compteur unique « 26 lieux dans la vue », bouton secondaire « Voir les 26 lieux » → `/explorer`. Corrige AI-04.
- [ ] **Section « Déjà composés »** — 3 cartes verticales 3:2, sur-titre mono aube, titre/description. Les itinéraires viennent *après* l'outil : ils sont le raccourci pour qui ne veut pas répondre aux trois questions.
- [ ] **Section « La méthode »** — titre Bodoni + paragraphe éditorial + 4 lignes tabulaires (lieux vérifiés sur place / dernière passe / lieux retirés / auteur). Corrige PA-05 (rien ne dit qui trie aujourd'hui).
- [ ] **Suppression de la section Activités de l'accueil** — elle présentait les feuilles avant l'arbre, le rattachement au lieu parent devenait incompréhensible (→ AI-05).
- [ ] **Performance** — objectif < 900 Ko et < 60 requêtes (actuellement 1 768 Ko et 142 requêtes dont 45 préchargements RSC dupliqués, → PF-02) ; `srcset` sur toutes les vignettes, deux largeurs 700w/1000w WebP + repli JPEG (aucun `srcset` aujourd'hui sur les 208 images d'activités, → MO-03).
- [ ] **Mobile** — panneau de qualification avec les 3 contrôles empilés ; bouton primaire pleine largeur 52 ; section Explorer avec carte 208 px + bouton flottant « Ouvrir la carte » ; 1 carte itinéraire pleine largeur.

### Lot 5 — Navigation et nettoyage

- [ ] **Menu à 4 entrées + 1 bouton + recherche globale** (`03-architecture-routes-url.md` § 2) — `Explorer · Itinéraires · Le carnet [recherche 250 px] [Composer un itinéraire] (compte)`. La recherche est un vrai champ dans l'en-tête, disponible partout (la loupe actuelle navigue vers `/#lieu-search`, recharge l'accueil et saute à 2 672 px → AI-06). « Composer un itinéraire » est un bouton primaire dans l'en-tête, pas la 5e entrée sur 9 (→ PA-02). Mobile : logo + loupe 44 × 44 + burger 44 × 44, panneau déroulant.
- [ ] **`/carnet`** — fusionne `/mes-favoris` et `/mes-itineraires` en une seule entrée à deux onglets. Corrige NF-05 (deux entrées cul-de-sac pour 100 % des nouveaux visiteurs).
- [ ] **Redirections 301** (`03` § 3) à poser côté Next.js + équivalents `/en/…` :
  - `/creer-itineraire` → `/composer`
  - `/mes-favoris` → `/carnet?onglet=favoris`
  - `/mes-itineraires` → `/carnet?onglet=itineraires`
  - `/activites` → `/explorer?type=activites`
  - `/villes` → `/explorer`
  - `/villes/[slug]` → `/communes/[slug]`
  - `/#lieux` → `/explorer`
  - `/#itineraires` → `/itineraires`
- [ ] **Pages communes** (`03` § 4) — ≥ 2 lieux → page conservée sous `/communes/[slug]`, retirée du menu, accessible via fil d'Ariane ; 1 lieu → redirection 301 vers `/lieux/[slug-du-lieu]`. 28 communes sur 34 n'ont qu'un seul lieu (→ DC-04).
- [ ] **Page `/itineraires`** — index des 6 itinéraires éditoriaux (ancre `#itineraires` de l'accueil devient une vraie page), grille de cartes verticales 3:2.
- [ ] **Vocabulaire figé partout** (`03` § 8) — *lieu* / *commune* / *activité* / *itinéraire* / *itinéraire composé* dans l'interface, le contenu, les balises, les slugs et les noms de variables. Corrige MC-01 (4 mots pour 2 objets : *spots* / *lieux* / *villes* / *communes*).
- [ ] **Pied de page** — cibles ≥ 15 px minimum (actuellement 17 px de haut → MO-01) ; liens : La méthode · Crédits photo · Mentions légales · Confidentialité ; FR · EN à droite.

### Critères de recette globaux

| # | Critère | Vérification |
|---|---|---|
| 1 | Un itinéraire composé survit à un F5 et à Précédent, sans compte | Manuel |
| 2 | Un lien `/i/[id]` s'ouvre en navigation privée | Manuel |
| 3 | Une vue filtrée se partage et se recharge à l'identique | Manuel |
| 4 | Aucun élément interactif sous 44 px sur les 8 écrans | Script DOM |
| 5 | Aucun `input`/`select`/`textarea` sous 16 px | Script DOM |
| 6 | Tout texte atteint 4,5:1 de contraste | Script DOM |
| 7 | Chaque image a un `alt` (vide si décoratif) | Script DOM |
| 8 | Échap ferme menu, modale et feuille | Manuel |
| 9 | Aucun `window.confirm` / `alert` dans le code | `grep -r "window.confirm\|window.alert"` |
| 10 | Toute action > 150 ms a un état visible | Manuel |
| 11 | `x-vercel-cache: HIT` sur les routes éditoriales | `curl -I /lieux/eze-village` |
| 12 | Accueil < 900 Ko et < 60 requêtes | DevTools Network |
| 13 | Aucun filtre ne remonte un lieu hors catégorie | Revue des 43 fiches |
| 14 | Un seul bouton primaire ambre visible par zone d'écran | Revue visuelle |

---

## Priorité contenu

- [x] Enrichir les activités de chaque lieu — angle éditorial : activités secrètes, atypiques,
      intimes ou bon-plans (pas les incontournables déjà sur tous les guides). Règle de
      cohérence à respecter : tout lieu portant un badge doit avoir au moins une activité en
      rapport direct avec ce badge (ex. badge `randonnee` → au moins un itinéraire de randonnée
      proposé ; badge `plage` → au moins une activité plage/baignade ; badge `plongee` → au
      moins un spot ou sortie plongée/snorkeling, etc.). Fait via `/add-activities` (dont le
      placeholder image `picsum.photos` reste **obsolète** dans le fichier de la commande
      lui-même — vraies photos Wikimedia utilisées à la place tout du long, voir ci-dessous).
      **Terminé le 2026-09-12** — les 23 lieux qui avaient un gap sont tous traités (49
      activités ajoutées en tout sur ce chantier), et un script heuristique de correspondance
      mot-clé confirme 0 gap restant sur les 27 lieux. Détail complet (process, pièges,
      lieu-par-lieu) dans `.claude/memory/project_activites_par_badge.md`. Piège trouvé et
      corrigé en cours de route : `git push` seul ne déploie jamais le frontend (git
      integration Vercel désactivée, voir `feedback_vercel_deploy.md`) — un
      `cd frontend && npx vercel --prod --yes` est nécessaire après chaque sync DB.

- [x] Chantier "villes manquantes" (2026-09-13) — deux suites actées par l'utilisateur le
      2026-09-14, toutes deux terminées le 2026-09-13, détail complet dans
      `.claude/memory/project_villes_expansion.md` :
      1. [x] **Vraies photos** — terminé le 2026-09-14 pour les hero/thumb des 13 lieux + 12
         villes, puis le 2026-09-13 (même session, chantier séparé) pour les 56 vignettes
         `activites[].image` des mêmes 13 lieux — `grep -c picsum data/lieux.json` renvoie
         désormais 0, plus aucun placeholder nulle part sur le site (lieux, villes,
         activités). Toutes créditées dans `credits/page.tsx`, synchronisées en DB prod et
         vérifiées en direct. Au passage : vérification systématique des 56 URLs
         d'activités de ces 13 lieux, 4 liens cassés trouvés et corrigés (domaine squatté,
         boucle de redirection, page déplacée, 404 réel).
      2. [x] **Enrichissement** — terminé le 2026-09-13. 3 nouveaux lieux distincts ajoutés
         (`golfe-juan` sur Vallauris, `plage-pampelonne` sur Ramatuelle, `peira-cava` sur
         Lucéram), chacun avec vraies photos Wikimedia et badges/coordonnées vérifiés ;
         `port-grimaud` explicitement écarté (architecture encore protégée par le droit
         d'auteur, voir `.claude/memory/project_villes_expansion.md`). 9 lieux qui n'avaient
         que le minimum (4 activités) ont reçu une 5e activité secrète/atypique avec vraie
         photo créditée. Détail complet dans `.claude/memory/project_villes_expansion.md`.
- [x] Finir les vraies images — les 27 lieux originaux ont une vraie photo (terminé le
      28/08 ; les 21 sourcées sur Wikimedia Commons cette session-là sont créditées sur
      `credits.html`, licences CC BY/CC BY-SA). Les 13 lieux ajoutés le 2026-09-13 ont
      aussi une vraie photo depuis le 2026-09-14 (voir l'item ci-dessus) — les 40 lieux du
      site ont désormais tous une vraie photo, plus aucun placeholder `picsum.photos`
- [x] Lien "Ouvrir dans Google Maps / Waze / Plans" sur chaque fiche lieu
- [x] Photo sur chaque carte `itin-preview-card` de la homepage — utilise le `thumbImage`
      du premier lieu de chaque itinéraire
- [x] Les pages `itin/*.html` ont leur propre hero carousel — les 6 itinéraires utilisent
      désormais les photos réelles des lieux qui les composent via `data-carousel-srcs`
- [~] Système d'images formalisé — **fait le 2026-09-14 pour le volet technique.**
      `frontend/scripts/images.mjs` normalise et contrôle les dimensions (`verifie` /
      `optimise`), génère les WebP et un manifeste de largeurs réelles ; le composant
      `Photo` sert du WebP avec repli JPEG et `srcset` mobile. Fiche `/lieux/eze-village` :
      **2 305 Ko → 1 041 Ko d'images**, zéro JPEG téléchargé par un navigateur moderne.
      46 fichiers surdimensionnés ré-encodés — dont un de **4,3 Mo** servi comme vignette.

      WebP **pré-générés** et non `next/image` : la transformation d'images de Vercel se
      facture à l'usage et le projet est sur le plan gratuit, dont les quotas de déploiement
      ont déjà été atteints une fois.

      **Reste** : les 133 photos plus petites que leur emplacement, listées dans
      `docs/photos-a-resourcer.md`. Aucun script ne peut les réparer — une image de 200×200
      ne contient pas l'information d'une 960×640. Chantier de contenu (re-sourçage
      Wikimedia), à lancer quand tu voudras. L'AVIF n'est pas fait non plus : gain marginal
      sur le WebP, et ça doublerait encore le nombre de fichiers.
- [~] Horaires et jours de fermeture des activités payantes — **fait le 2026-09-13 pour les
      22 sites à visiter** (musées, villas, jardins, monuments), FR + EN, 21 renseignés.
      **Périmètre volontairement restreint** : sur les 88 activités payantes, 37 sont des
      restaurants (horaires trop volatils — les figer donnerait une info périmée en quelques
      mois, pire que rien) et 12 des locations/sorties sur réservation. Le risque de porte
      close porte sur les sites qui ferment un jour fixe.
      Modèle : `fermeJours` (jsonb, 0=dimanche…6=samedi) exploitable par la machine +
      `horaires`/`horairesEn` en texte libre pour la saisonnalité. Migration EF
      `AddActiviteHoraires`. Le modèle "fermé le lundi" ne suffisait pas : Villa Ephrussi n'a
      aucun jour fixe, le fort de Sainte-Agnès n'ouvre que mercredi-dimanche, le fort
      Saint-Roch seulement les week-ends une partie de l'année.
      Affichage : horaires sous le prix + avertissement "⚠️ Fermé aujourd'hui" calculé
      **côté client** (la page est en ISR, un jour calculé serveur serait figé dans le cache)
      via `useSyncExternalStore`.
      **Trouvé au passage et corrigé le 2026-09-13** : le **Château de Gourdon est fermé au
      public** (confirmé sur chateau-gourdon.com, privatisé pour événements depuis 2015)
      alors que le site le recommandait à 6 €/adulte — et son `url` pointait vers
      `chateaudegourdon.com`, un **domaine viticole de la vallée du Rhône** sans aucun
      rapport. Sur décision de l'utilisateur, l'activité `chateau-musee-de-gourdon` a été
      **supprimée** : retirée de `data/lieux.json`, du `booking[]` de l'itinéraire
      `villages-perches`, de la DB prod (`remove-activite`), et son image orpheline
      `act-1.jpg` supprimée. Les badges du lieu restent cohérents (`randonnee` et
      `restaurant` ont toujours leur activité). **Gourdon a été réenrichi le 2026-09-13** :
      4 activités ajoutées (baptême de parapente 80–90 €, La Source Parfumée / distillerie
      Galimard gratuite, église Saint-Vincent, Verrerie d'Art et ateliers du village), soit
      7 au total. Écartés volontairement : la via ferrata (existe déjà sur le lieu
      `gorges-du-loup-cascade-courmes`, qui a sa propre fiche — doublon interdit), les
      remparts (les sources décrivant des remparts et une église gothique concernent
      **Gourdon dans le Lot**, autre village à 500 km — piège de recherche à connaître), le
      panorama place Victoria (déjà couvert par `panorama-depuis-la-falaise`) et les jardins
      Le Nôtre (ils appartiennent au château, donc fermés).
      **Reste aussi** : les 37 restaurants et les 12 locations/sorties, si on juge un jour
      que ça vaut le coup malgré la volatilité

## Découverte & navigation

- [x] Recherche textuelle client-side — **faite le 2026-09-13** (FR + EN). Input qui filtre
      la grille des lieux en temps réel, 100% client (les lieux sont déjà chargés sur la
      homepage). Cherche dans nom + commune + description + libellés de badges, dans la
      locale affichée ("plage" sur /fr et "beach" sur /en renvoient les mêmes 12 lieux) ;
      le nom français reste indexé même sur /en. Insensible aux accents dans les deux sens
      via `normalizeSearch()` (`src/lib/utils.ts`) : "eze" trouve "Èze". Se combine en ET
      avec les filtres badge existants, index mémoïsé par lieu, état vide distinct selon la
      cause avec bouton "Tout afficher"
- [~] Filtres supplémentaires sur la grille — **saison / durée / niveau faits le
      2026-09-13** (FR + EN), en `<select>` sous les badges. Attention au raccourci "données
      déjà disponibles, juste un filtre à câbler" : les `metaPills` ne sont **pas** des
      énumérations mais du texte libre (46 valeurs distinctes sur 43 lieux, du type "1 h 30
      à 2 h avec le musée"), il a fallu en dériver des catégories — règles dans
      `src/lib/lieu-filters.ts`, classement des 46 valeurs vérifié une par une (deux erreurs
      trouvées et corrigées au passage, cf. commit). Choix documentés : "Facile à modéré"
      compte dans les deux niveaux, "Demi-journée" vient du mot-clé explicite et non d'un
      seuil, un lieu "toute l'année" ressort sur les quatre saisons.
      **Filtre "Gratuit seulement" fait le 2026-09-13, mais déplacé sur la section
      activités** : au niveau du lieu il ne discriminait rien (42 lieux sur 43 ont au moins
      une activité gratuite, et aucun n'est entièrement gratuit). Au niveau des activités il
      sépare réellement — 12 gratuites / 24 payantes, avec de gros écarts par catégorie
      (outdoor 7/9, culture 1/10). Au passage, les trois sélecteurs ont été rhabillés
      (`appearance:none` + chevron maison, `colorScheme:dark` pour que la liste native ne
      s'ouvre pas en blanc sur mobile, état actif en terracotta, grille 2×2 en mobile)
- [x] "Surprends-moi" — **fait le 2026-09-13**. Pioche parmi les résultats courants (donc
      respecte recherche + badge + saison/durée/niveau), désactivé quand il n'y a aucun
      résultat, navigue via le router next-intl pour rester dans la locale
- [x] Géolocalisation "Près de moi" — **faite le 2026-09-13** (FR + EN). Trie les 43 lieux
      du plus proche au plus loin et affiche la distance sur chaque vignette. **Placée sur la
      grille et non sur la carte** comme le disait cette ligne : la carte homepage affiche
      les villes (34), or "lieux près de moi" concerne les lieux (43) — et la grille est
      l'endroit où le tri a du sens et où vivent déjà les filtres. Distance à vol d'oiseau
      (`distanceKm()` haversine dans `utils.ts`), assumée : un trajet réel demanderait une
      API de routage. Position demandée **au clic uniquement**, jamais au chargement ; second
      clic désactive sans redemander la permission ; trois états d'erreur distincts. Le tri
      s'applique dans le sous-ensemble filtré, donc se combine avec tous les autres filtres
- [ ] "Depuis Nice / Cannes / Monaco en X min" — stocker une durée de trajet approximative
      par lieu dans le JSON, exposer un filtre "moins de 45 min de [ville de départ]" ;
      pas d'appel API routage, estimation manuelle à la saisie (~data + 2h)

## Features UX

- [x] Filtres sur la grille des 27 lieux (par type : sentier, village, monument, île… —
      et par durée)
- [x] Favoris en localStorage — épingler des activités sans compte ni backend (♡ sur chaque
      activité depuis les fiches lieu et les pages ville, page `mes-favoris.html`)
- [x] Bouton de partage natif (`navigator.share`) sur les fiches lieu
- [x] Carte homepage : panneau latéral en desktop, bottom-sheet en mobile au clic marqueur
- [~] Page `/a-propos` — **faite le 2026-09-13** (FR + EN), comble le trou de confiance le
      plus cité par l'audit produit du 2026-09-12 (aucune page n'expliquait qui écrit, comment
      les lieux sont choisis, ni comment signaler une info obsolète). Contient l'angle
      éditorial ("carnet de repérage, pas un guide officiel"), le critère de sélection, la
      méthode de vérification (coordonnées GPS vérifiées une par une, badges praticables au
      lieu précis et non dans la commune, photos CC créditées, aucun lien affilié — vérifié,
      les URLs de réservation n'ont pas d'identifiant de parrainage) et une section honnête
      sur les limites (prix/horaires qui vieillissent). Comptes dérivés de l'API, pas écrits
      en dur. Liée depuis le footer, dans le sitemap avec hreflang.
      **Reste à faire** : le formulaire de contact/signalement lui-même — volontairement
      différé (décision utilisateur du 2026-09-13) pour ne pas exposer une adresse perso au
      scraping ; à ajouter une fois le nom de domaine acheté (voir "Mise en production
      réelle"), avec une adresse sur ce domaine. La section "Signaler une erreur" de la page
      annonce déjà ce formulaire à venir — **une section qui promet un canal sans en offrir
      un est pire que pas de section** (constat de l'audit du 2026-09-13).

- [~] **Mentions légales + politique de confidentialité** — **pages créées le 2026-09-14**
      (FR + EN), liées depuis le pied de page et dans le sitemap. Le contenu décrit ce que le
      code fait réellement, vérifié avant d'écrire : champs de la table `User`, cookies
      strictement nécessaires (d'où l'absence de bannière, qui est une dispense et non un
      oubli), stockage de session, cache du service worker, Plausible sans cookie, IP du rate
      limiter jamais écrites en base, et géolocalisation de « Près de moi » qui ne quitte
      jamais le navigateur.

      **Reste à faire, et seul l'éditeur peut le faire** : renseigner les trois champs marqués
      `[À compléter]` et surlignés dans la page — identité de l'éditeur, directeur de la
      publication, adresse de contact. Tant qu'ils y sont, les mentions ne sont pas conformes.
      L'adresse de contact dépend du domaine (voir « Acheter un nom de domaine »), pour ne pas
      exposer une adresse personnelle au moissonnage.
- [x] **Mention RGPD sur le formulaire d'inscription** — faite le 2026-09-14. Affichée
      uniquement en mode inscription (en mode connexion il n'y a pas de collecte nouvelle, et
      une mention permanente devient un décor qu'on ne lit plus), formulée en une phrase qui
      dit ce qui est réellement fait de la donnée plutôt qu'en renvoi sec au texte légal.
- [x] **Page `/activites` filtrable** — **faite le 2026-09-14**. Les 208 activités sont
      parcourables et cherchables : recherche libre, catégorie, durée, zone, tarif, et
      « masquer ce qui est fermé aujourd'hui ». Liée depuis la nav et depuis l'accueil, dont
      la section annonce maintenant « Voir les 208 activités » au lieu de laisser croire que
      les 36 curées étaient tout le catalogue. Dans le sitemap avec ses alternates.

      Le filtre de fermeture **masque ce qu'on sait fermé** plutôt que de garder « ce qui est
      ouvert » : seules 10 activités sur 208 déclarent leurs jours de fermeture, donc garder
      les ouvertes cacherait les 198 dont on ignore l'horaire — ce serait affirmer une
      fermeture qu'on ne connaît pas. Le jour est lu côté client, la page étant en ISR.
- [ ] **Enrichir les horaires pour rendre « ouvert maintenant » vraiment utile** — 10
      activités sur 208 renseignent `fermeJours`, 23 un texte d'horaires. C'est ce qui limite
      aujourd'hui le filtre le plus demandé par un visiteur sur place. Le périmètre resté de
      côté en 2026-09-13 (37 restaurants aux horaires trop volatils, 12 locations sur
      réservation) reste justifié ; ce sont les sites à visiter qu'il faut compléter.
- [ ] **Filtres situationnels manquants, faute de données** — « avec des enfants », « sans
      voiture », « éviter la foule » ont été volontairement écartés : 2 activités sur 208
      mentionnent les enfants, et rien ne décrit l'accès en transports ni l'affluence.
      Proposer ces filtres aujourd'hui donnerait des résultats faux. À rouvrir seulement si
      la donnée est ajoutée (un champ par activité, pas une heuristique sur le nom).
- [x] **« Mot de passe oublié »** — **fait le 2026-09-14**. `POST /api/auth/forgot-password`
      et `/reset-password`, migration `AddPasswordReset` appliquée en prod, page
      `/reinitialiser-mot-de-passe`, lien depuis `/connexion`, FR + EN.
      Expiry **1 h** et non 24 h comme la confirmation : un lien de réinitialisation est une
      clé d'accès au compte. Réponse générique même pour une adresse inconnue, pour ne pas
      faire de l'endpoint un oracle d'existence de comptes. Un compte Google pur ne reçoit
      rien, faute de mot de passe à réinitialiser. `EmailConfirmed` passe à `true` au passage,
      sans quoi un compte non confirmé buterait ensuite sur le 403.
      **Non vérifié de bout en bout** : le chemin nominal (jeton valide → nouveau mot de
      passe) demanderait d'envoyer un vrai email et de modifier le mot de passe d'un compte
      réel. Les tests ont tourné avec `Resend__ApiKey` vide. À faire une fois le domaine
      branché, en une minute depuis un compte de test.
- [x] **Messages d'erreur du backend traduits** — **fait le 2026-09-14**. Les 18 réponses
      d'erreur de l'API portent désormais un `code` machine en plus de leur `Error` français,
      et le frontend traduit depuis ce code via `src/lib/erreurs-api.ts` + le namespace
      `erreursApi`. C'était la dernière source de français sur le site anglais.

      Le repli est volontairement un message générique et non le champ `error` du backend :
      un code ajouté côté API sans sa traduction doit donner une phrase correcte dans la
      langue du visiteur, pas une phrase française. On perd un peu de précision, on ne
      régresse jamais.

      La page de réinitialisation, qui avait sa propre table locale, est alignée dessus —
      deux tables auraient divergé.
- [x] **Coordonnées et horaires dans l'export PDF** — **fait le 2026-09-14**. Une classe
      `.print-only`, miroir de `.no-print`, affiche sur le papier les coordonnées de chaque
      étape et les horaires des activités qui en déclarent. Les liens de navigation restent
      masqués : inutiles imprimés. Seules les activités renseignées apparaissent — 23 sur 208
      ont un texte d'horaires, et une ligne vide pour les autres laisserait croire à une
      information manquante plutôt qu'à une information jamais relevée.
- [x] **Navigation** — **fait le 2026-09-14**. « Lieux » et « Itinéraires » ajoutés à
      l'en-tête (ancres de l'accueil, les pages de liste ayant été supprimées le 2026-09-12),
      plus une entrée « Rechercher » qui amène au champ du catalogue **et lui donne le
      focus** — il vivait à ~2 700 px du haut, soit trois écrans et demi sur mobile.

      Deux ajustements imposés par la mesure : la barre complète bascule à `lg` (1024 px) et
      non plus `sm` (640 px), parce qu'avec sept entrées l'en-tête débordait dès 700 px
      (822 px de contenu pour 700 disponibles) ; et l'espacement passe à `gap-4` sous `xl`,
      la marge libre n'étant que de 9 px à 1024 px — un libellé un peu plus long et ça
      cassait. 81 px de marge après correction, FR et EN.

      Le défilement vers le champ est refait à la main plutôt que laissé à l'ancre : les
      images en chargement différé repoussent le champ après le saut, donc on recentre une
      dernière fois au `load`.
- [ ] **Filtres situationnels** sur la page `/activites` ci-dessus — l'utilisateur ne pense
      pas « destination » mais « situation » : *j'ai 3 h · je suis à Nice · gratuit · ouvert
      maintenant · sans voiture · avec des enfants · éviter la foule*. **Les données existent
      déjà** (`fermeJours`/`horaires` pour « ouvert maintenant », le badge gratuit pour les
      120 activités gratuites, `metaPills` pour durée et niveau, la géoloc pour « près de
      moi »). C'est la version utile des filtres catégoriels, et ça prolonge « Près de moi »,
      le meilleur composant du site, vers « qu'est-ce que je peux faire près d'ici,
      maintenant ». *(Piste issue d'un état des lieux produit externe, 2026-09-14.)*
- [x] **`/a-propos` atteignable** — **fait le 2026-09-14**. Section « Qui choisit ces
      lieux ? » en fin d'accueil, après le catalogue — c'est-à-dire au moment où la question
      se pose. Pas dans la nav : elle affiche déjà sept entrées pour 81 px de marge à
      1024 px, une huitième la cassait.
- [ ] **Préciser la promesse** — « hors des sentiers battus » / « lieux secrets » est
      contredit par Èze, Monaco, Saint-Paul, Cannes, Saint-Tropez, Pampelonne. Ces lieux ont
      un angle moins touristique, mais la promesse actuelle est plus risquée qu'utile. Piste :
      « la Côte d'Azur au-delà des cartes postales ». Même constat relevé indépendamment par
      l'audit interne (la « route des **classiques** ») et par l'évaluation externe — la
      convergence de deux lectures séparées en fait un point solide.
- [~] **Sélecteur de langue — le constat de l'audit ne tient pas** (vérifié le 2026-09-14,
      aucun changement fait). L'audit reprochait au bouton « FR » d'émettre `/fr/…` et de
      finir en anglais. Testé avec un vrai bocal à cookies, comme un navigateur : cliquer
      « FR » depuis un contexte anglais pose bien `NEXT_LOCALE=fr`, atterrit sur l'URL
      française, et la navigation suivante y reste. Le préfixe `/fr/` est **délibéré** — c'est
      ainsi que next-intl signale un choix explicite de langue et repose le cookie.

      Ce que le test a vraiment montré : ce n'est pas `/fr/` le déclencheur. **Toute** URL
      française non préfixée renvoie vers `/en/…` pour un visiteur dont le cookie ou le
      navigateur dit « anglais » — c'est `localeDetection`, et c'est le comportement voulu :
      un anglophone qui reçoit un lien français lit le site dans sa langue.

      Le seul cas réellement gênant serait un lien `/fr/…` copié et envoyé à quelqu'un qui
      veut du français mais dont le navigateur est anglais. Le corriger imposerait soit
      `localePrefix: "always"` — toutes les URL françaises deviennent `/fr/…`, changement
      d'URL massif et régression SEO — soit `localeDetection: false`, qui supprime la
      détection automatique pour tout le monde. Le remède est plus coûteux que le mal.
- [x] Créateur d'itinéraire à la volée — durée + zones/lieux au choix, génération auto,
      sauvegarde en localStorage (`creer-itineraire.html` / `mes-itineraires.html`)
- [x] Créateur d'itinéraire : rendu complet façon `itin/*.html` (blocs transit estimés,
      marqueurs sommeil pour 2-3 jours, cartes "à réserver" pour les activités payantes)
- [x] Créateur d'itinéraire : export/impression pour usage hors ligne sur le terrain —
      bouton "Exporter en PDF" (window.print + @media print thème clair, jours en colonne A4)
- [x] Bouton "Ajouter à mon itinéraire" directement sur chaque fiche lieu — mini-panneau
      déroulant listant les itinéraires sauvegardés, clic pour ajouter le lieu au dernier
      jour de l'itinéraire sans quitter la page
- [x] "Partir de cet itinéraire" — **fait le 2026-09-13** (FR + EN). Le bouton ouvre
      `/creer-itineraire` avec les étapes pré-cochées **et** la durée pré-sélectionnée
      (déduite du badge via `dureeKeyDepuisBadge()`). `?add=` accepte maintenant plusieurs
      slugs séparés par des virgules, en restant rétrocompatible avec le slug unique du
      bouton "Ajouter à un itinéraire" des fiches lieu (vérifié). Slugs inconnus ignorés
      silencieusement. **Piège** : `/creer-itineraire` charge ses lieux côté client et le
      CORS de l'API prod n'autorise que l'origine de prod — cette page ne peut pas être
      testée en local, il faut déployer d'abord
- [x] Créateur d'itinéraire : partage par URL — **fait le 2026-09-13** (FR + EN). Bouton
      "Partager le lien" sur la vue résultat ; le lien rouvre l'itinéraire tel quel chez le
      destinataire, sans connexion. **Partage l'arrangement et pas seulement la sélection**
      (que `?add=` couvrait déjà) : l'ordre des étapes et la répartition par jour sont ce que
      le visiteur ajuste à la main, les régénérer retomberait sur l'algorithme glouton. Format
      `?jours=slugA,slugB|slugC` (+ `duree`, `nom`), lisible plutôt que base64 — les slugs sont
      déjà URL-safe et un lien tronqué se diagnostique. Priorité `?id=` > `?jours=` > `?add=`,
      slugs inconnus filtrés, lien invalide → retour au sélecteur. `encodeJours`/`decodeJours`
      dans `src/lib/itineraire-logic.ts`.
      **Piège de test** : `/creer-itineraire` charge ses lieux côté client et le CORS de l'API
      prod n'autorise que l'origine de prod — la page n'est donc pas testable en local tant
      qu'on n'a pas lancé le backend localement (`Jwt__Secret` bidon + `Cors__AllowedOrigin=
      http://localhost:3000` + connection string de prod), en repointant `.env.local` puis en
      le restaurant.
- [~] PWA — **paliers 0 et 1 faits le 2026-09-13**, répond au constat de l'audit produit du
      2026-09-12 (les lieux "hors des sentiers battus" sont ceux où la couverture mobile est
      la plus faible, et le site dépendait entièrement d'une connexion live).
      - **Palier 0 — installable** : `src/app/manifest.ts` (hors `[locale]`, comme
        `sitemap.ts`), icônes 192/512/maskable + apple-touch-icon générées aux couleurs du
        site via `sharp` (déjà livré avec Next), `themeColor`.
      - **Palier 1 — "ce que tu as consulté reste consultable"** : `public/sw.js`, quatre
        caches plafonnés avec éviction FIFO (pages 80, images 120, tuiles OSM 250, assets
        120), page de secours `public/hors-ligne.html`. **Cache à l'usage, jamais par
        anticipation** : les images pèsent 58 Mo (37 Mo rien qu'en vignettes d'activités),
        précacher serait hostile sur un forfait mobile. Les pages étant en SSG/ISR, le HTML
        caché contient déjà le contenu — inutile de cacher l'API en plus.
      - **Écrit à la main, pas avec Serwist/next-pwa** : l'apport de ces outils est de
        générer un manifeste de précache, soit exactement ce dont cette stratégie n'a pas
        besoin, et `@serwist/next` ne supporte pas Turbopack (défaut de Next 16 au build).
        Le SW est un fichier statique : aucune étape de build, aucune dépendance.
      - Jamais mis en cache : `/api/auth`, `/api/favorites`, `/api/my-itineraires`.
      - Deux pièges rencontrés, documentés dans `public/sw.js` : le proxy next-intl localise
        toute route sans extension (d'où la page de secours en `.html` statique), et il
        redirige `/lieux/x` vers `/en/lieux/x` — seul ce dernier finit en cache, d'où une
        recherche tolérante au préfixe de locale.
      **Reste à faire (palier 2, optionnel)** : bouton "télécharger cet itinéraire" pour
      mettre en cache explicitement les N fiches + leurs photos (~2-3 Mo annoncés) avant de
      partir. Et côté carte, la Tile Usage Policy d'OSM **interdit le téléchargement en
      masse** : seules les tuiles réellement affichées sont gardées. Une vraie carte hors
      ligne demanderait de changer de fournisseur (MapTiler payant, ou auto-héberger du
      Protomaps `.pmtiles`) — décision séparée, avec un coût

## Maillage interne & SEO éditorial

- [x] Liens croisés itinéraire ↔ ville — **constaté déjà fait le 2026-09-13** (entrée
      périmée, jamais cochée) : `villes/[slug]` liste les itinéraires qui la traversent via
      `itinerairesIci`, `itineraires/[slug]` renvoie vers la page ville de chaque étape, et
      le fil d'ariane d'une fiche lieu pointe vers sa ville
- [ ] Structured data enrichi — schéma `Activity` sur les activités payantes pour apparaître
      dans Google Things to do ; il n'y a actuellement aucun JSON-LD sur les pages lieu
      (seulement homepage `ItemList` et ville `TouristDestination`, voir CLAUDE.md) — à
      ajouter dans `frontend/src/app/lieux/[slug]/page.tsx` (~2h)

## Audience & engagement

- [ ] Newsletter — "Un lieu secret par semaine" via Brevo ou Mailchimp (formulaire embed,
      aucun backend requis) ; meilleur levier de rétention avant le backend (30 min)
- [x] Version anglaise du site — **toutes les phases (0 à 5) faites et déployées le
      2026-09-13**, probablement le plus gros levier d'audience livré à ce jour. Routing
      `/en` (next-intl, slugs identiques FR/EN), colonnes `*En` nullables côté backend,
      homepage/villes/lieux/itinéraires/pages compte (`creer-itineraire`, `mes-itineraires`,
      `mes-favoris`, `connexion`, `confirmer-email`, `credits`) tous câblés et traduits, les
      43 lieux/34 villes/6 itinéraires/205 activités ont un contenu éditorial réellement
      traduit (synchronisé en DB prod), bouton FR/EN dans le nav, `noindex` retiré de `/en`,
      hreflang + sitemap avec alternates `/en`. Un sweep complet de l'app a aussi rattrapé
      plusieurs oublis dans des pages déjà "finies" (boutons partagés FavoriteButton/
      ShareButton/AddToItinButton, aria-labels du carrousel, le lien "Plans" d'Apple Maps,
      un bug de pluralisation anglaise, un compte de lieux hardcodé dans le meta description
      et le JSON-LD) — détail complet dans `.claude/memory/project_version_anglaise.md`.
      **Chantier entièrement terminé le 2026-09-13** — suite à "Faisons une migration
      backend pour fix tout ça", le dernier écart (tips/related d'un lieu, programme
      détaillé/réservations d'un itinéraire, durée/prix d'une activité) a été fermé, plus un
      gap jamais documenté trouvé au passage (les MetaPills saison/durée/niveau). Plus aucun
      champ backend n'est déféré — `/en` a une parité de contenu complète avec le français.
      Détail complet (migration, stratégie de traduction, bug "2h à 3h" trouvé en vérifiant
      la prod) dans `.claude/memory/project_version_anglaise.md`. Plan initial établi le
      2026-09-12, deux
      décisions validées par l'utilisateur avant de commencer (routing + stockage) :
      1. Routing en `frontend/src/app/[locale]/...` + `next-intl` pour la UI chrome, slugs
         de lieux/villes **identiques** dans les deux langues (pas de slug anglais dédié).
      2. Contenu traduit stocké en **colonnes jumelles nullable** sur les entités backend
         existantes (`Lieu.NomEn`, `DescriptionEn`, `Activite.NomEn`…) plutôt qu'une
         deuxième ligne/fichier dupliqué par langue — un champ non traduit retombe sur le
         français côté `/en/` au lieu de casser la page.
      Phasage proposé : 0) migration EF + routing + next-intl pour la chrome + hreflang/
      sitemap ; 1) MVP anglais (homepage, nav, listes) ; 2) traduction des 27 lieux/22
      villes/6 itinéraires (lot par lot, même rythme que le chantier "activités par badge") ;
      3) traduction des ~109 `activites[].nom/alt` (intégrable à la phase 2) ; 4) auth +
      emails Resend en anglais ; 5) polish SEO (hreflang croisés, og:locale). Explicitement
      déconseillé : slugs traduits, ou dupliquer `data/*.json` en `data/*.en.json` séparés
      (risque de désync avec le contenu français déjà enrichi).
- [x] Analytics respectueux de la vie privée (Plausible) — script déployé sur les 63 pages

## Portage site statique → Next.js (terminé le 2026-09-12)

`frontend/` est le seul stack désormais (voir CLAUDE.md) — le site statique a été supprimé du
repo le 2026-09-12 une fois la parité listée ci-dessous atteinte. Le suivi feature par feature
qui a servi à repérer ces trous (`.claude/memory/frontend_migration_checklist.md`) a été
supprimé avec le site statique lui-même, son rôle terminé.

Fait le 2026-09-11 dans cette passe : carte Leaflet homepage, section activités par catégorie,
filtres badge sur la grille lieux, images sur les cartes itinéraires (tous manquants avant),
décodage des entités HTML (`&amp;` → `&`), bascule des 4 cartes Leaflet sur OpenStreetMap
(CARTO a coupé l'accès anonyme à ses tuiles `dark_all`, renvoyait un "API key required").

- [x] Export PDF / impression de l'itinéraire créé (`/creer-itineraire`, 2026-09-12) — porté
      depuis le site statique (`window.print()` + `@media print`, classes `.no-print`/
      `.print-day`/`.print-stop`/`.print-header` dans `globals.css`)
- [x] Bouton "Partager" (Web Share API) sur les fiches lieu (2026-09-12) — porté depuis le
      site statique, `ShareButton.tsx`, fallback presse-papiers si l'API est indisponible
- [x] Bouton "Ajouter à un itinéraire" sur les fiches lieu (2026-09-12) — porté depuis le
      site statique, `AddToItinButton.tsx`, adapté pour passer par `/api/my-itineraires`
      (DB) au lieu de localStorage
- [x] Booking cards "À réserver" avec image + prix + durée (2026-09-12) — croise
      `b.lieuSlug`/`b.activiteId` avec l'activité réelle (déjà chargée via `lieuBySlug`),
      lien "Réserver" pointe maintenant vers l'URL réelle de l'activité au lieu de la fiche lieu
- [x] Section "Autres itinéraires" (suggestions) en bas d'une page itinéraire (2026-09-12) —
      grille 3 colonnes, href converti en route Next.js (même pattern que `lieu.related`)
- [x] Lien `?itin=<slug>` sur les stops + breadcrumb contextuel retour-vers-l'itinéraire
      (2026-09-12) — corrige au passage le crumb par défaut de la fiche lieu (pointait vers
      la liste générique `/lieux`, pointe maintenant vers la ville). `/lieux/[slug]` passe de
      statique à dynamique (rendu à la demande) suite à l'usage de `searchParams`
- [x] Hero carrousel ambiant sur la homepage (2026-09-12) — nouveau composant `HomeHero.tsx`
      (fondu auto 5s, sans contrôles — différent de `HeroCarousel.tsx` qui est manuel/à
      clics, utilisé sur lieu/itinéraire). Cycle de state React vérifié en prod (0→6 sur la
      durée du test) ; le rendu visuel exact de la transition CSS n'a pas pu être confirmé à
      l'oeil dans cette session (outil de capture instable), mais la logique est correcte et
      standard (`transition: opacity`)
- [x] JSON-LD `ItemList` sur la homepage Next.js (2026-09-12) — 22 `ListItem` (une par
      ville), même structure que le site statique, urls vers les routes Next.js
- [x] JSON-LD `TouristDestination` sur les pages ville Next.js (2026-09-12) — même structure
      que `ville.mjs`, image du premier lieu de la ville, urls vers les routes Next.js
- [x] `noindex` sur les pages user-generated (2026-09-12) — `/creer-itineraire`,
      `/mes-itineraires`, `/mes-favoris` (parité site statique) + `/connexion` et
      `/confirmer-email` (pages compte propres à Next.js, même traitement)
- [x] Apparition au scroll (IntersectionObserver) sur la grille homepage (2026-09-12) —
      mêmes valeurs que le site statique (threshold 0.15, one-shot, translateY 16px). Le
      comportement du `useEffect`/`IntersectionObserver` n'a pas pu être confirmé
      visuellement en prod dans cette session (l'onglet de test avait
      `document.visibilityState: "hidden"`, qui suspend l'API navigateur elle-même — même
      un observer trivial isolé ne se déclenche pas dans ces conditions) ; la logique est un
      portage exact et standard, aucune raison de douter du comportement en usage réel

- [x] Page `/credits` (attribution photos, 2026-09-12) — trou trouvé en auditant avant la
      suppression du site statique : `credits.html` listait les crédits CC BY/CC BY-SA
      obligatoires (licence) pour les photos Wikimedia Commons utilisées, sans équivalent sur
      Next.js. Contrairement aux autres items de cette liste ce n'était pas une feature UX
      optionnelle — retirer le site statique sans porter cette page aurait supprimé une
      attribution légalement requise du site réellement en ligne. Porté en premier, avant la
      suppression, précisément pour ça (`frontend/src/app/credits/page.tsx`)

**Site statique supprimé le 2026-09-12** — tous les items ci-dessus vérifiés en prod, la
parité fonctionnelle atteinte ; `index.html`, `lieux/`, `itin/`, `villes/`, `assets/`,
`scripts/`, `netlify.toml`, `vercel.json` racine, `sitemap.xml`, `robots.txt` supprimés du
repo. `data/*.json` conservé (seule source de seed du backend). Le projet Vercel
`riviera-secrete.vercel.app` qui hébergeait ce site n'a plus de code source dans ce repo —
ignorer cette URL, le seul vrai site est désormais `frontend-two-plum-92.vercel.app`.

## Communauté / comptes (backend requis)

- [x] Connexion Google (OAuth) via NextAuth.js (Option A retenue) — backend ASP.NET Core +
      PostgreSQL sur Railway (décision archi 2026-09-11), `frontend/` uniquement
- [x] Connexion par email/mot de passe (2026-09-12) — `CredentialsProvider` NextAuth +
      `POST /api/auth/{register,login}`, hash BCrypt, page `/connexion` unique (bascule
      login/inscription, Google et mot de passe côte à côte)
- [x] Confirmation d'email obligatoire à l'inscription par mot de passe (2026-09-12) —
      email envoyé via Resend (`backend/RivieraSecrete.Api/EmailService.cs`), login refusé
      tant que non confirmé, page `/confirmer-email`. **Limitation connue** : Resend est en
      mode sandbox (`onboarding@resend.dev`, aucun domaine vérifié) donc n'accepte d'envoyer
      qu'à l'adresse email du compte Resend lui-même — les vrais visiteurs ne recevront pas
      cet email tant qu'un domaine n'est pas vérifié sur resend.com/domains (voir la tâche
      domaine ci-dessous, `RESEND_API_KEY` déjà configurée sur Railway)
- [x] Migration favoris + itinéraires custom de localStorage → DB — favoris (`/mes-favoris`,
      `9e055b3`) et itinéraires custom (`fc84181`, DB-only) faits côté `frontend/` ; la
      version localStorage séparée du site statique (`mes-favoris.html`) était restée non
      migrée mais le site statique lui-même a été supprimé le 2026-09-12, donc sans objet
      désormais
- [ ] Social proof — "X personnes ont mis ce lieu en favori", visible publiquement
- [ ] "J'y suis allé" — visited tracker distinct des favoris
- [ ] Avis et notes sur les activités — étoiles + commentaire court, stockage backend,
      modération a minima ; dépend de la connexion Google
- [ ] Tips visiteurs — note courte laissée par les utilisateurs sur un lieu

**Ces quatre items renforcés par l'audit produit du 2026-09-12** : zéro avis, zéro note, zéro
photo déposée par un visiteur aujourd'hui — combiné à l'absence de page à propos (ci-dessus),
le site prive le visiteur de toute preuve sociale, dans une catégorie (voyage) où TripAdvisor/
Google Reviews ont habitué tout le monde à vérifier avant de se déplacer.

### Notes & avis communautaires — conception (idée utilisateur, 2026-09-14)

Regroupe et remplace les quatre items ci-dessus le jour où le chantier démarre. **Piste la
plus prometteuse identifiée à ce jour côté produit**, mais elle a des prérequis durs et un
piège de conception.

**Le piège à ne pas reproduire** : trier les recommandations par « les mieux notés » recrée
TripAdvisor et **enterre exactement ce qui fait le site**. Un lieu à 4,4 ★ sur 8 avis
disparaît derrière un lieu à 4,9 ★ sur 1 200 — alors que c'est précisément le premier qui est
« hors des sentiers battus ». La note doit *informer* le visiteur, pas *classer* la sélection.

**Conception retenue** — garder deux signaux séparés et visibles comme tels :

> **Sélection Riviera Secrète** · ⭐ 4,8 · 127 visiteurs · 94 % le recommandent

« Nous l'avons trouvé, vous jugez s'il vaut le détour. » L'éditorial reste le filtre d'entrée,
la communauté valide ou conteste — ça résout aussi le trou de confiance sans diluer la marque.

**Feedback structuré plutôt que texte libre**, au moins au démarrage : après une visite,
« Qu'avez-vous aimé ? » avec des cases (belle vue · authentique · peu fréquenté · bon rapport
qualité-prix · adapté aux enfants · accès facile · vaut le déplacement). Trois avantages : ça
alimente directement les filtres situationnels ci-dessus, ça permet d'afficher « surtout
apprécié pour : calme · vues · authenticité » qui aide bien plus à décider qu'un 4,7/5, et
**c'est incomparablement moins coûteux à modérer** que du texte libre.

**Prérequis durs — aucun n'est satisfait aujourd'hui** :
- [ ] **Politique de confidentialité + mentions légales** (déjà listées plus haut). Héberger
      des avis élargit nettement le périmètre RGPD : opinions rattachées à des personnes
      identifiables, droit de rectification et d'effacement à outiller.
- [ ] **Obligations d'hébergeur de contenus tiers** — signalement, retrait, traçabilité
      (LCEN + DSA). Un formulaire de signalement devient obligatoire, pas optionnel.
- [ ] **Transparence sur les avis en ligne** — la réglementation française impose de dire si
      les avis sont vérifiés, comment ils sont collectés et modérés, et d'afficher leur date.
      À prévoir dès la conception, pas après.
- [ ] **Récupération de compte** (« mot de passe oublié », listé plus haut) et **délivrabilité
      des emails** (domaine Resend vérifié) : une communauté sur un système de comptes dont on
      ne peut ni récupérer l'accès ni notifier les membres ne tient pas.

**Amorçage — le vrai risque.** « ⭐ 5,0 — 2 avis » n'inspire pas confiance, et « 0 avis »
affiché sur 43 fiches est **pire que pas de système du tout** : ça signale un site mort. Donc
ne pas afficher d'agrégat avant un seuil (ex. 5 avis), et d'ici là parler de « premières
impressions ». Point de départ le moins coûteux : brancher le feedback sur la fin d'un
itinéraire (« Comment s'est passée votre journée ? », note par étape) pour les comptes
connectés seulement — ça collecte sans exposer une coquille vide.

**Séquencement.** À faire *après* : les correctifs de fiabilité, le domaine + le juridique, la
réparation du générateur d'itinéraire (il ampute encore 4 itinéraires sur 6) et le mot de
passe oublié. Construire une couche communautaire sur un socle comptes incomplet, c'est bâtir
sur du sable. **Et la contrainte réelle reste l'acquisition** : le raisonnement « après 1 000
utilisateurs l'algo apprend » suppose un trafic qui n'existe pas encore — la boucle vertueuse
ne démarre pas toute seule.

## Mise en production réelle

### Domaine & DNS
- [x] Migrer de Netlify vers Vercel — site en prod sur Vercel (déploiement auto sur push
      `main`, `vercel.json` configuré avec cache et headers de sécurité)
- [ ] Acheter un nom de domaine (ex. `riviera-secrete.fr` ou `.com`) et le configurer sur
      Vercel — HTTPS Let's Encrypt activé automatiquement par Vercel une fois le domaine
      pointé. **Débloque deux choses en attente** : (1) vérifier un domaine sur Resend
      (resend.com/domains) pour lever la limitation d'envoi sandbox des emails de
      confirmation (voir "Communauté / comptes") ; (2) le formulaire de contact/signalement
      de `/a-propos`, différé pour éviter d'exposer une adresse perso (voir "Features UX")
- [x] Purger le champ `ogImage` de `data/lieux.json`/la DB — **fait le 2026-09-13**. Retiré
      des 43 lieux dans `data/lieux.json`, de l'entité `Lieu` et de `DatabaseSeeder.cs`, et du
      type `Lieu` côté frontend. Migration EF `RemoveLieuOgImage` (`DROP COLUMN`) appliquée en
      prod, backend redéployé, `og:image` toujours correctement dérivé de `heroImage` côté
      frontend (vérifié en prod — inchangé, comme attendu puisque ce champ n'était jamais lu).

### SEO & indexation
- [ ] Soumettre `sitemap.xml` dans Google Search Console après enregistrement du vrai domaine
- [x] Pages `noindex` — `/creer-itineraire`, `/mes-itineraires`, `/mes-favoris`, `/connexion`,
      `/confirmer-email` toutes exclues via `metadata.robots` (voir Portage ci-dessus,
      2026-09-12) ; `frontend/src/app/sitemap.ts` (route Next.js dynamique) ne les liste pas
- [ ] Ajouter le site dans Bing Webmaster Tools (2e moteur, souvent négligé)
- [x] **`/robots.txt`** — **fait le 2026-09-14** (`1b1dffa`). Le fichier n'existait pas et
      `/robots.txt` tombait dans la route attrape-tout `/[locale]`, qui répondait **500** :
      Google lit un 5xx sur ce fichier comme « ne pas explorer ce site » et suspend le
      crawl, ce qui neutralisait en partie le sitemap et les hreflang. `app/robots.ts`
      créé (hors `[locale]`, avec la ligne `Sitemap:`), et cause racine traitée par
      `dynamicParams = false` — tout chemin manquant portant une extension renvoie
      désormais 404 au lieu de 500. Voir `docs/audits/2026-09-14-ux-mobile-web.md`.
- [x] **`rel=canonical`** sur toutes les pages publiques — **fait le 2026-09-14**
      (`fb8d130`). Absent partout jusque-là, alors que `?itin=` génère ~25 URL dupliquées.
      Au passage, `/credits` sortie du `noindex` où elle était rangée par erreur avec les
      pages de compte (c'est une page d'attribution CC BY / CC BY-SA).

### Performance & cache
- [x] Règles de cache et headers de sécurité configurés dans `vercel.json`
- [ ] Minification CSS/JS au build (ex. via `esbuild` ou `lightningcss`)

### Monitoring
- [ ] Uptime monitor (ex. UptimeRobot gratuit) — alerte email si le site tombe
- [ ] Vérifier les Core Web Vitals dans Google Search Console après mise en ligne

### Versionning & déploiement
- [x] Code systématiquement commité et pushé sur `main` après chaque changement — mais
      déploiement **manuel** (`cd frontend && vercel --prod --yes`), pas automatique : la
      GitHub integration Vercel a été désactivée le 2026-09-11 (voir
      `feedback_vercel_deploy.md`) car elle re-déployait depuis la racine du repo au lieu de
      `frontend/`. Ne pas la reconnecter.
- [ ] Configurer une branche `staging` (ou Vercel Preview Deployments)
- [x] **Déploiement frontend débloqué le 2026-09-14** — la limite avait été atteinte la
      veille ; déploiement relancé et vérifié en ligne (photos Gourdon, crédits, partage par
      URL, plus les 14 correctifs UX de la nuit). L'item ci-dessous reste pour mémoire, le
      piège qu'il décrit étant toujours valable.
- [ ] ~~**Déploiement frontend en attente (2026-09-13)**~~ — la limite Vercel du plan gratuit a
      été atteinte (100 déploiements/jour, `api-deployments-free-per-day`). Les données sont
      en ligne (elles transitent par l'API, pas par le build), mais **3 photos d'activités de
      Gourdon (`act-5/6/7.jpg`), le renommage `act-8.jpg` et les 4 crédits photo n'arriveront
      qu'au prochain `vercel --prod`**. Rien d'autre à faire que relancer le déploiement une
      fois la limite réinitialisée. Piège à retenir : une édition de `data/*.json` synchronisée
      en base est visible immédiatement, alors qu'un fichier ajouté dans `public/` exige un
      déploiement — les deux ne vont pas au même rythme.

## SEO / technique

Section fusionnée le 2026-09-12 dans "Mise en production réelle" et "Portage" ci-dessus —
elle datait d'avant la décision de migrer vers Next.js (2026-09-11) et listait cette migration
elle-même comme non faite, ainsi qu'un `sitemap.xml` généré par le `build.mjs` du site
statique (remplacé depuis par `frontend/src/app/sitemap.ts`, une route Next.js dynamique).
