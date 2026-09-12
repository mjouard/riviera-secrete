# Memory index — Riviera Secrète

## Projet & stack
- [Vue d'ensemble](project_overview.md) — concept, URLs prod, 27 lieux, 6 itinéraires, règles éditoriales, structure monorepo (stack unique depuis 2026-09-12)
- [Backend .NET](backend_dotnet.md) — ASP.NET Core .NET 10, entités EF Core, endpoints API (Google+mot de passe+confirmation email), Resend, Railway, seeder, pièges connus
- [Frontend Next.js](frontend_nextjs.md) — Next.js 16 App Router, pages (dont /connexion, /confirmer-email, /credits), NextAuth Google+Credentials, homepage (carte/activités/filtres), Vercel, design
- [Architecture & roadmap](architecture_future.md) — décisions stack, état P1-P4.5 (tout fait), suppression du site statique le 2026-09-12, URLs Railway/Vercel

## Chantiers en cours
- [Version anglaise](project_version_anglaise.md) — plan établi 2026-09-12, pas démarré, 2 décisions à valider (routing + stockage traduction) avant la phase 0

## Chantiers terminés
- [Activités par badge](project_activites_par_badge.md) — terminé 2026-09-12, 23 lieux traités, 0 gap restant sur les 27 ; garder comme référence de process

## Feedback & pièges
- [Vercel deploy](feedback_vercel_deploy.md) — déployer depuis `frontend/`, rootDirectory null, ne pas déployer depuis la racine
- [JWT MapInboundClaims](backend_dotnet.md#piège-critique--jwt-mapinboundclaims) — `opts.MapInboundClaims = false` requis sinon 401 sur tous les endpoints protégés
- [Migration DB prod = toujours demander](backend_dotnet.md#déploiement-railway) — même additive/non-destructive, confirmer avec l'utilisateur avant tout `dotnet ef database update` sur Railway
- [Resend sandbox = un seul destinataire possible](backend_dotnet.md#email-transactionnel--resend-2026-09-12) — sans domaine vérifié, n'envoie qu'à l'adresse du compte Resend lui-même ; confirmé en prod le 2026-09-12 (utilisateur n'a rien reçu)
- [Tuiles CARTO cassées → OpenStreetMap](frontend_nextjs.md#patterns-importants) — CARTO exige une clé API depuis peu, renvoie un 200 OK avec une image "API KEY REQUIRED" au lieu d'une vraie tuile
- [.NET 10 SDK requis](backend_dotnet.md#outillage-requis-pour-buildermigrer-en-local) — un poste avec seulement .NET 8 doit l'installer (`~/.dotnet`, pas besoin de sudo)

## Utilisateur
- [Profil](user_profile.md) — développeur .NET au quotidien, projet personnel
