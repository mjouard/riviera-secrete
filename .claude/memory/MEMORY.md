# Memory index — Riviera Secrète

## Projet & stack
- [Vue d'ensemble](project_overview.md) — concept, URLs prod, 27 lieux, 6 itinéraires, règles éditoriales, structure monorepo
- [Backend .NET](backend_dotnet.md) — ASP.NET Core .NET 10, entités EF Core, endpoints API, Railway, seeder, pièges connus
- [Frontend Next.js](frontend_nextjs.md) — Next.js 16 App Router, pages, API client, Vercel, Plausible, design
- [Architecture & roadmap](architecture_future.md) — décisions stack, auth Option A/B, séquençage migration, URLs Railway/Vercel

## Site statique (legacy, en cours de remplacement)
- [Design system](project_design_system.md) — variables CSS, typographies, couleurs, Leaflet, composants
- [Patterns HTML](project_html_patterns.md) — structure pages lieu/itinéraire, JSON-LD, règles de cohérence
- [Skills Claude](project_skills.md) — `/add-activities` et `/build-itinerary`

## Feedback & pièges
- [Vercel deploy](feedback_vercel_deploy.md) — déployer depuis `frontend/`, rootDirectory null, ne pas déployer depuis la racine
- [JWT MapInboundClaims](backend_dotnet.md#piège-critique--jwt-mapinboundclaims) — `opts.MapInboundClaims = false` requis sinon 401 sur tous les endpoints protégés

## Utilisateur
- [Profil](user_profile.md) — développeur .NET au quotidien, projet personnel
