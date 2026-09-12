---
name: project-version-anglaise
description: "Plan détaillé pour la version anglaise du site (pas encore démarré) — routing, stockage du contenu traduit, phasage, décisions à valider avant de commencer"
metadata:
  type: project
  originSessionId: 24767a28-abd9-41f0-9385-80f67dd8db6d
---

## Statut

Plan établi le 2026-09-12, **rien implémenté**. Item déjà présent dans `ROADMAP.md`
("Audience & engagement") depuis l'audit produit du 2026-09-12 — ce fichier ajoute le
détail derrière l'entrée résumée là-bas.

## État des lieux au moment du plan

Aucune infra i18n n'existe : pas de `next-intl` ni équivalent dans
`frontend/package.json`, pas de segment `[locale]` dans `frontend/src/app/`, et toutes les
entités backend (`Lieu`, `Ville`, `Itineraire`, `Activite`) sont mono-langue (`Nom`,
`Description`, etc. sans variante de langue). Volume de contenu éditorial à traduire au
2026-09-12 : 27 lieux, 22 villes, 6 itinéraires, ~109 activités (`data/lieux.json` = 3333
lignes, `data/villes.json` = 244, `data/itineraires.json` = 985).

## Les deux décisions à valider avant de commencer

1. **Routing** — recommandé : `frontend/src/app/[locale]/...` (segment dynamique App
   Router) + `next-intl` pour la UI chrome (nav, footer, formulaires, messages d'erreur).
   Slugs de lieux/villes **identiques** dans les deux langues (`/en/lieux/eze-village`, pas
   de slug anglais dédié) — évite une table de correspondance slug↔lieu séparée et des
   redirections cassées si un slug change un jour.
   Alternative écartée : sous-domaine `en.` — plus lourd à opérer (DNS, cookies
   cross-domain) sans bénéfice ici.

2. **Stockage du contenu traduit** — recommandé : **colonnes jumelles nullable** sur les
   entités backend existantes (`Lieu.NomEn`, `DescriptionEn`, `Description2En`,
   `Activite.NomEn`/`AltEn`, `Ville.NomEn`/`DescriptionEn`, `Itineraire.*En`…) plutôt qu'une
   deuxième ligne ou un fichier dupliqué par langue. Une seule ligne par lieu — lat/lng,
   images, badges, prix restent partagés et ne se dupliquent pas. Un champ `*En` encore
   `null` retombe simplement sur le français côté `/en/` en attendant sa traduction, au lieu
   de casser la page.
   Alternative écartée : dupliquer `data/lieux.json` en `data/lieux.en.json` (et
   équivalents) — risque de désync garanti avec le contenu français qui continue d'être
   enrichi (voir [[project-activites-par-badge]], ~12 lieux déjà retouchés en une session).

## Phasage proposé

0. **Fondations** — migration EF (colonnes `*En` nullable), routing `[locale]`, `next-intl`
   pour la chrome, `hreflang` + sitemap par langue.
1. **MVP anglais** — homepage, nav, footer, `/lieux`, `/villes`, `/itineraires` (pages
   listes) traduits : assez pour être indexé et utile à un visiteur anglophone.
2. **Contenu éditorial** — traduction des 27 lieux + 22 villes + 6 itinéraires
   (descriptions/tips), lot par lot au même rythme que le chantier "activités par badge".
3. **Activités** — traduction des ~109 `activites[].nom`/`alt`, intégrable directement à la
   phase 2 lieu par lieu.
4. **Auth & transactionnel** — `/connexion`, `/confirmer-email`, emails Resend en anglais.
5. **Polish SEO** — `hreflang` croisés, `og:locale`, sitemap complet, vérifier Search
   Console après mise en ligne.

## Explicitement déconseillé

- Traduire les slugs eux-mêmes.
- Dupliquer les fichiers `data/*.json` par langue.

Voir aussi [[project-activites-par-badge]] pour le processus lieu-par-lieu qui inspire le
phasage 2/3 ci-dessus, et [[feedback_vercel_deploy]] pour le piège de déploiement à ne pas
reproduire pendant ce chantier non plus.
