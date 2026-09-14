# Audits

Campagne menée dans la nuit du 2026-09-13 au 2026-09-14 par trois agents, chacun sur un
périmètre distinct.

| Document | Périmètre | État |
|---|---|---|
| [Sécurité backend](2026-09-13-securite-backend.md) | `backend/`, secrets du dépôt, dépendances | Corrigé sauf 2 arbitrages produit ; **1 action utilisateur urgente** |
| [Tests utilisateurs](2026-09-13-tests-utilisateurs.md) | Parcours complets, 8 personas, FR/EN, desktop/mobile, déconnecté | Constats ; corrections reportées sur les deux autres documents |
| [Passe UX mobile + web](2026-09-14-ux-mobile-web.md) | Correction des défauts UX identifiés | 14 commits, tout vérifié en navigateur |

## À savoir avant de lire

**Les personas et verbatims du rapport de tests utilisateurs sont simulés** — évaluation
experte produite par un agent, **pas des entretiens avec de vraies personnes**. Ne pas les
citer en externe comme des retours terrain. Les constats techniques, eux, sont
reproductibles (URL + étapes fournies).

**L'état connecté n'a pas été testé** : la reconnexion passe par Google et exige une saisie
d'identifiants. Favoris persistés, `/mes-itineraires` peuplée et édition d'un itinéraire
sauvegardé restent donc à couvrir.

**Deux constats de l'audit se sont révélés faux** à la vérification (bouton « Générer »,
libellés des radios de durée) — détaillés dans la passe UX. Un audit automatisé se vérifie
avant de se corriger.

## Actions restant à l'utilisateur

1. 🔴 **Rotation du mot de passe PostgreSQL de prod** — il est dans l'historique d'un dépôt
   public (commit `7f25aea`). Le retirer du fichier ne suffit pas.
2. **Vérifier `ASPNETCORE_ENVIRONMENT` sur Railway** — si elle vaut `Development`,
   `POST /api/seed` est exposé publiquement.
3. **Synchroniser les coordonnées corrigées en base** — voir `ROADMAP.md`.
4. **Déployer** backend et frontend : aucun correctif de cette campagne n'est en ligne.
