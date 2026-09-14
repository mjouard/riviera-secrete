# Roadmap — Riviera Secrète

## Suites des audits du 2026-09-14

Trois audits menés dans la nuit du 13 au 14 (sécurité backend, tests utilisateurs, UX
mobile/web) — rapports complets dans **`docs/audits/`**. **Tout est corrigé, poussé et
déployé le 2026-09-14** (backend Railway + frontend Vercel + synchro des coordonnées en
base), sauf ce qui est listé ci-dessous.

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
- [ ] **Le générateur reste trop conservateur hors itinéraire source** — constaté en
      corrigeant le point ci-dessus : `antibes-biot-juan` tient largement dans la journée
      (fin 17h55 pour un budget de 8 h) et perdait pourtant une étape. La coupure gloutonne
      se déclenche sur le budget *restant* d'une étape isolée, sans voir que le total passe.
      Même racine que l'item suivant.
- [ ] **« N lieux non inclus faute de temps » n'est pas crédible** — sur un 2 jours /
      13 lieux, 5 exclus alors que les journées finissent vers 16h et qu'Èze et le Cap
      Ferrat, exclus, sont *géographiquement entre* les étapes retenues. L'algorithme est
      glouton et dépendant de l'ordre. Piste : seconde passe d'insertion dans les créneaux
      restants, ou reformuler (« mis de côté pour garder le rythme »).

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
- [ ] **Revalidation ISR après écriture en base** — une page `/en` servait encore, figée au
      dernier build, une réservation à 6 € pour le château de Gourdon **fermé au public
      depuis 2015**, avec un lien vers un domaine viticole sans rapport. L'API était propre.
      Les corrections de contenu passent par la base et rien ne déclenche de revalidation :
      une page peu fréquentée sert du contenu vieux de plusieurs semaines. Piste :
      `revalidatePath()`/`revalidateTag` déclenché par le backend à chaque écriture ; à
      défaut, redéployer après chaque synchro et abaisser `revalidate`.
      **Règle à retenir** : un correctif de contenu « supprimé partout » se vérifie sur les
      pages rendues, pas seulement dans l'API.
- [x] **Lien de réservation mort** — corrigé le 2026-09-14. `laparte-villefranche-sur-mer.com`
      ne répond plus (échec TLS et connexion). Le restaurant, lui, existe toujours (sources
      de juin-juillet 2026, et il est littéralement au 1 rue Obscure) : l'activité est donc
      conservée, l'URL pointe vers une fiche qui résout, et le libellé passe à « En savoir
      plus » puisque ce n'est pas un lien de réservation. Les pages spécifiques de TheFork et
      Tripadvisor ont été essayées d'abord : toutes deux redirigent vers une liste générique,
      leur identifiant est périmé. (« Dîner au
      restaurant L'Aparté », 29–50 €) : échec TLS et 404. Seule URL vraiment morte sur les
      195 testées.
- [~] **Liens « Réserver » vers des pages génériques GetYourGuide** — **15** au total, pas
      11. Les URL ne sont pas cassées : ce sont de vraies pages, mais celles du catalogue
      d'une ville, pas de l'activité nommée. Le libellé passe donc de « Réserver » à « Voir
      les offres » (2026-09-14) : le bouton décrit maintenant ce qui va réellement se passer.
      **Reste à faire** : sourcer les 15 URL spécifiques, ce qui demande de vérifier chaque
      produit une par une chez GetYourGuide — un chantier de contenu, pas un correctif. Ne
      pas fabriquer ces URL de tête.
- [x] **Titre d'itinéraire trompeur** — corrigé le 2026-09-14. « Menton, Èze & Monaco : la
      route des classiques » cumulait les deux défauts relevés séparément : il annonçait une
      ville où l'itinéraire ne passe pas (la première étape est Roquebrune) et se vantait des
      « classiques », ce que `/a-propos` promet justement d'éviter. Devenu « Roquebrune, Èze
      & Monaco : la Riviera des corniches » — exact, et fidèle au parcours, qui emprunte
      réellement la Grande puis la Moyenne Corniche. Le slug reste `menton-eze-monaco` pour
      ne pas casser les URL partagées.
- [x] **Contradiction sur un temps de trajet** — corrigée le 2026-09-14. L'itinéraire
      annonçait « 60 min » Grasse → golfe là où le générateur calculait « ~1 h 33 ». Aucune
      des deux valeurs n'était juste : ~75 km de route, donc « 1 h 15 à 1 h 30 », formulé en
      fourchette comme le reste du site. Le générateur reste pessimiste (35 km/h de moyenne,
      inadapté à l'A8) — à revoir avec la coupure gloutonne ci-dessus.
- [~] **Tension de marque** — le titre « la route des classiques » est corrigé (voir
      ci-dessus), mais l'itinéraire enchaîne toujours Monaco, le Musée Océanographique, Èze
      et la Villa Ephrussi. Le contenu reste plus « incontournable » que le reste du site ;
      c'est un arbitrage éditorial, pas un bug. Lié à la reformulation de la promesse
      générale (voir « Préciser la promesse »).

### Positionnement & concurrence (état des lieux du 2026-09-14)

Le concurrent dangereux **n'est pas TripAdvisor**. C'est **Region Lovers / Provence Lovers**,
qui tient déjà la même promesse (« lieux secrets de Côte d'Azur, hors des sentiers battus »),
avec l'antériorité SEO, l'autorité de domaine et le volume éditorial. « Je référence des
endroits cachés » n'est donc pas, en soi, un avantage concurrentiel : TripAdvisor a déjà une
catégorie « attractions méconnues », l'Office de Tourisme a déjà carte + itinéraires +
personnalisation via le French Riviera Pass.

**Conséquence directe sur la stratégie de contenu : ne pas courir après le volume.** Ajouter
50 lieux de plus nous met sur le terrain où on perd par construction. L'avantage défendable
est **la manière d'aider à choisir** — « nous avons regardé 500 endroits, voici les 43 qui
valent votre temps », puis « voici les 3 que je ferais aujourd'hui, vu où vous êtes et le
temps dont vous disposez ». D'où la priorité donnée aux filtres situationnels et au moteur
d'itinéraire plutôt qu'à l'expansion du catalogue.

À garder en tête : **la contrainte réelle est l'acquisition**, pas la fonctionnalité. Aucun
des raisonnements en « après 1 000 utilisateurs, l'algorithme apprend » ne tient tant qu'il
n'y a pas de canal d'acquisition. La version anglaise et la newsletter sont, à ce titre, des
leviers plus décisifs que n'importe quelle feature.

### Ordre de traitement retenu

Les chantiers produit ci-dessus dépendent les uns des autres ; cet ordre évite de construire
sur du sable.

1. **Sécurité et fiabilité** — rotation du mot de passe Postgres, synchro des coordonnées,
   déploiements, badges non praticables, revalidation ISR.
2. **Domaine** — débloque Resend (emails de confirmation réellement délivrés), le formulaire
   de signalement et les URLs canoniques définitives.
3. **Juridique** — mentions légales + politique de confidentialité. Prérequis de tout ce qui
   suit, et à faire *avant* d'ouvrir quoi que ce soit aux contributions.
4. **Socle comptes** — « mot de passe oublié » et délivrabilité des emails. Sans ça, pas de
   communauté possible.
5. **Réparer le moteur d'itinéraire** — il ampute encore 4 itinéraires sur 6. C'est la
   fonctionnalité différenciante : la mettre en avant avant de la réparer amplifierait
   l'échec.
6. **Page `/activites` + filtres situationnels** — débloque les 208 activités, la donnée la
   plus actionnable du site, avec des champs déjà en base.
7. **Notes & avis communautaires** — voir la section de conception plus bas.

### Dette technique identifiée

- [ ] **Purger `extraSpans`/`extraSpansEn`** — champs morts depuis `68a78a8` (ils étaient le
      seul endroit qui recopiait un fait au lieu de le référencer, et il avait dérivé).
      Même opération que pour `ogImage` : JSON + entité `Itineraire` + migration EF.
- [ ] **Normaliser `prixEn` dans les données** — aujourd'hui le format euro anglais est
      corrigé à l'affichage (`08356cb`) faute de chemin de propagation vers la base.
- [ ] **Couvrir l'état connecté en test** — non testé par l'audit (la reconnexion Google
      exige une saisie d'identifiants) : favoris persistés, `/mes-itineraires` peuplée,
      édition et suppression d'un itinéraire sauvegardé.

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
- [ ] Système d'images formalisé — ratios/dimensions par composant (`heroImage`,
      `thumbImage`, cartes homepage, strip itinéraire…), résolution minimale, export
      WebP/AVIF + `srcset` ; chantier technique indépendant du choix des photos elles-mêmes
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

- [ ] **Mentions légales + politique de confidentialité** — `/mentions-legales`,
      `/confidentialite` et `/cgu` renvoient 404, alors que le site collecte email et
      prénom, dépose un cookie de session et charge Plausible. Le formulaire d'inscription
      ne présente aucune mention RGPD. **À régler avant l'achat du domaine, pas après.**
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
- [ ] **« Mot de passe oublié »** — ni page ni endpoint. Un compte créé par mot de passe et
      oublié est **définitivement perdu**, avec ses favoris et ses itinéraires. Le mécanisme
      de jeton à expiration de la confirmation d'email est réutilisable tel quel.
- [ ] **Coordonnées et horaires dans l'export PDF** — `.no-print` masque la carte *et*
      toutes les rangées de liens de navigation, donc le PDF ne contient ni adresse, ni
      coordonnées, ni horaires. Or il est présenté comme l'artefact « hors ligne sur le
      terrain » : sur papier le lien est inutile, mais les coordonnées sont exactement ce
      qu'on emporte.
- [ ] **Navigation : ni « Lieux » ni « Itinéraires »** dans l'en-tête — depuis une fiche
      lieu, revenir au catalogue impose logo → accueil → défiler. La recherche est par
      ailleurs la seule du site et n'est ni dans l'en-tête, ni sur les fiches, ni sur
      `/villes`.
- [ ] **Filtres situationnels** sur la page `/activites` ci-dessus — l'utilisateur ne pense
      pas « destination » mais « situation » : *j'ai 3 h · je suis à Nice · gratuit · ouvert
      maintenant · sans voiture · avec des enfants · éviter la foule*. **Les données existent
      déjà** (`fermeJours`/`horaires` pour « ouvert maintenant », le badge gratuit pour les
      120 activités gratuites, `metaPills` pour durée et niveau, la géoloc pour « près de
      moi »). C'est la version utile des filtres catégoriels, et ça prolonge « Près de moi »,
      le meilleur composant du site, vers « qu'est-ce que je peux faire près d'ici,
      maintenant ». *(Piste issue d'un état des lieux produit externe, 2026-09-14.)*
- [ ] **Rendre `/a-propos` atteignable** — elle n'est liée que depuis le pied de page. Un
      évaluateur externe qui a inspecté le site en 2026-09-14 a conclu qu'il « manquait une
      couche de confiance » alors que la page existe et contient exactement ce qu'il
      réclamait : si un évaluateur ne la trouve pas, les visiteurs non plus. Le problème
      n'est pas de l'écrire mais de l'exposer (hero ou nav).
- [ ] **Préciser la promesse** — « hors des sentiers battus » / « lieux secrets » est
      contredit par Èze, Monaco, Saint-Paul, Cannes, Saint-Tropez, Pampelonne. Ces lieux ont
      un angle moins touristique, mais la promesse actuelle est plus risquée qu'utile. Piste :
      « la Côte d'Azur au-delà des cartes postales ». Même constat relevé indépendamment par
      l'audit interne (la « route des **classiques** ») et par l'évaluation externe — la
      convergence de deux lectures séparées en fait un point solide.
- [ ] **Sélecteur de langue : le lien « FR » bascule en anglais** — il émet `href="/fr/…"`,
      or `/fr/x` redirige vers `/x`, qui redirige vers `/en/x` si le cookie `NEXT_LOCALE=en`
      est posé. Le clic *dans* l'app fonctionne (il repose le cookie) ; c'est le lien copié
      puis partagé qui trahit.

## Features différenciantes

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
