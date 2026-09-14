# Positionnement produit & stratégie (2026-09-14)

Décisions de cadrage prises après trois audits internes et un état des lieux produit externe.
Le détail opérationnel vit dans `ROADMAP.md` (sections « Positionnement & concurrence »,
« Ordre de traitement retenu », « Notes & avis communautaires ») et dans `docs/audits/`.
Ce fichier garde le *pourquoi*, qui ne se déduit pas des tickets.

## Qui est le concurrent

**Pas TripAdvisor. Region Lovers / Provence Lovers** — même promesse (« lieux secrets de Côte
d'Azur, hors des sentiers battus »), avec antériorité SEO et autorité de domaine. TripAdvisor
a déjà une catégorie « attractions méconnues » ; l'Office de Tourisme a déjà carte +
itinéraires + personnalisation (French Riviera Pass).

**Donc « je référence des endroits cachés » n'est pas un avantage concurrentiel.** L'avantage
défendable est *la manière d'aider à choisir* : « nous avons regardé 500 endroits, voici les
43 qui valent votre temps », puis « voici les 3 que je ferais aujourd'hui, vu où vous êtes ».

**Corollaire opérationnel : ne pas courir après le volume de contenu.** Ajouter 50 lieux nous
place sur le terrain où on perd par construction. Priorité aux filtres situationnels et au
moteur d'itinéraire, pas à l'expansion du catalogue.

## La contrainte réelle est l'acquisition

Tout raisonnement en « après 1 000 utilisateurs, l'algorithme apprend » est circulaire tant
qu'il n'existe pas de canal d'acquisition. La version anglaise (livrée) et la newsletter sont
à ce titre des leviers plus décisifs que n'importe quelle fonctionnalité.

## La promesse est à préciser

« Lieux secrets » / « hors des sentiers battus » est contredit par Èze, Monaco, Saint-Paul,
Cannes, Saint-Tropez, Pampelonne — et par l'itinéraire vitrine, littéralement nommé « la
route des **classiques** ». Piste : « la Côte d'Azur au-delà des cartes postales ».

Point relevé **indépendamment** par l'audit interne et par l'évaluation externe. La
convergence de deux lectures séparées est ce qui en fait un point solide — c'est le critère
de tri à réutiliser sur les prochains audits.

## Avis communautaires : le piège de conception

Idée de l'utilisateur, la plus prometteuse identifiée à ce jour. **Mais ne jamais trier les
recommandations par « les mieux notés »** : ça recrée TripAdvisor et enterre exactement ce que
le site existe pour montrer (un 4,4 ★ sur 8 avis passe derrière un 4,9 ★ sur 1 200, alors que
c'est le premier qui est hors des sentiers battus). La note **informe** le visiteur, elle ne
**classe** pas la sélection.

Garder visiblement séparés : *sélection Riviera Secrète* (éditorial, filtre d'entrée) et
*note communautaire* (validation). « Nous l'avons trouvé, vous jugez s'il vaut le détour. »

Feedback **structuré** (cases à cocher) plutôt que texte libre : alimente les filtres
situationnels, aide plus à décider qu'un 4,7/5, et coûte incomparablement moins cher à
modérer.

Amorçage : « 0 avis » sur 43 fiches est **pire que pas de système** — ça signale un site mort.
Pas d'agrégat avant un seuil ; démarrer par la fin d'itinéraire, comptes connectés seulement.

## Comment lire une évaluation externe

Retour d'expérience du 2026-09-14, réutilisable. Une évaluation produite sans exécuter le site
(ici : l'évaluateur a lui-même signalé ne pas pouvoir juger le visuel) donne un cadrage
stratégique utile mais **zéro défaut réel**. La même journée, la mesure effective trouvait
Èze à 8 km en mer, `robots.txt` en 500 qui suspendait l'indexation Google, un sous-titre de
hero à 2,0:1 de contraste et une carte qui bloquait le défilement mobile — pendant que
l'évaluation notait « Design/finition 7,5/10 » et « Potentiel mobile ⭐⭐⭐⭐ ».

Trois réflexes : les notes chiffrées sans grille ne sont pas de l'information ; vérifier si ce
qui est « manquant » n'existe pas déjà (la « couche de confiance » réclamée était `/a-propos`,
livrée la veille — mais le fait qu'un évaluateur ne la trouve pas *est* le vrai signal) ; et
les angles réglementaires ou juridiques sont systématiquement absents de ce type de retour.
