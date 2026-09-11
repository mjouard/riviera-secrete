---
name: architecture-future
description: "Décisions d'architecture pour la stack cible — état d'avancement P1-P4, prochaines étapes"
metadata: 
  node_type: memory
  type: project
  originSessionId: 52dd96aa-badc-4607-83f8-5de46933687d
---

## Stack décidée (2026-09-11)

```
Frontend  : Next.js 16 App Router  →  Vercel (projet "frontend")
Backend   : ASP.NET Core Web API   →  Railway (service "api", projet "fearless-happiness")
DB        : PostgreSQL             →  Railway (même projet, service "Postgres")
Images    : Cloudflare R2          →  à faire (S3-compatible, CDN inclus, ~gratuit <10GB)
```

**Why:** l'utilisateur fait du .NET au quotidien — choix naturel. Railway pour la co-localisation API + DB. Vercel pour Next.js (zero-config).

## Auth — Option A retenue et implémentée

NextAuth.js (v4) gère le handshake Google OAuth côté Next.js, envoie le `id_token` à l'API .NET qui valide via `Google.Apis.Auth` et renvoie son propre JWT.

**Option B (en réserve)** : .NET gère tout le flow OAuth Google, émet le JWT.

## État d'avancement (2026-09-11)

### ✅ P1 — OG tags, sitemap

- OG tags sur toutes les pages (generateMetadata)
- Sitemap dynamique `/sitemap.xml`

### ✅ P2 — Maps, carousels

- Leaflet : `LeafletLieuMap`, `LeafletItinMap`, `BuilderMap` (stable, init once)
- HeroCarousel : prev/next/dots, CSS dans globals.css
- Pattern obligatoire : Leaflet dans "use client" wrapper + `dynamic(ssr:false)`
- `MapLieuWrapper.tsx`, `MapItinWrapper.tsx` pour encapsuler le dynamic import
- `imgUrl()`, `buildMapLinks()`, `buildGoogleMapsRouteUrl()`, `parseHeroImgTag()`

### ✅ P3 — Pages villes, créateur, mes-itinéraires

- Pages `/villes` et `/villes/[slug]` (22 pages SSG)
- `/creer-itineraire` — port complet de `creer-itineraire.html` :
  - `generateItineraire()` en TypeScript (`itineraire-logic.ts`)
  - Drag-and-drop natif HTML5 + ▲/▼ buttons (mobile-first)
  - `ProgrammeSection` (transit, sommeil, heures) + `BookingSection`
  - Sauvegarde localStorage via `saveItineraire()`
- `/mes-itineraires` — liste localStorage, liens `?id=`, delete

### ✅ P4 — Auth Google + JWT (partiellement fait)

**✅ Backend :**
- Entités `User`, `UserFavorite`, `UserItineraire`
- Migration `20260911160215_AddUserTables` appliquée en prod
- `POST /api/auth/google-signin` + endpoints favoris/itinéraires protégés
- JWT Bearer middleware configuré

**✅ Frontend :**
- `next-auth@4.24.15` installé
- `src/lib/auth.ts` — authOptions
- `src/app/api/auth/[...nextauth]/route.ts` — route handler
- `src/types/next-auth.d.ts` — type extensions
- `src/components/Providers.tsx` — SessionProvider
- `src/components/NavHeader.tsx` — bouton Connexion/Déconnexion
- `src/lib/api.ts` — `authFetch()` helper

**⚠️ Manquant pour terminer P4 :**
- Google OAuth : ajouter callback URLs dans Google Cloud Console (`/api/auth/callback/google` pour localhost + prod)
- Bouton favori ♡ sur pages lieu (P4 Step 4)
- `/mes-itineraires` hybride API/localStorage (P4 Step 5)
- Migration localStorage → DB au premier login (P4 Step 6)
- Sync créateur d'itinéraire avec DB quand connecté

## Connexions importantes

| Ressource | URL / Info |
|---|---|
| API prod | `https://api-production-19623.up.railway.app` |
| Frontend prod | `https://frontend-two-plum-92.vercel.app` |
| Railway projet | `fearless-happiness` |
| Railway DB (interne) | `postgres.railway.internal:5432` |
| Railway DB (externe/dev) | `altaria.proxy.rlwy.net:45165` |
| Vercel projet | `frontend` (org: `maximejouard-6739`) |
| Vercel project ID | `prj_GdzN9Ztzh4vByWz5C6rxgF7u4sCB` |
| Google OAuth Client ID | `238986417715-sr32i4nepu37l12m0f8vm9ntnoio44hg.apps.googleusercontent.com` |

## Périmètre backend (tout y passera)

Les features actuellement en localStorage sont provisoires :
- **Itinéraires custom** (`riviera-secrete:itineraires-custom`) → `UserItineraire` en DB
- **Favoris** → `UserFavorite` en DB (tables créées, endpoints prêts — manque juste l'UI)
- **Images** → Cloudflare R2 (pas encore commencé)

## Site statique legacy

`riviera-secrete.netlify.app` reste en ligne. Ne pas y investir. Le frontend Next.js est le nouveau site.
Deux projets Vercel coexistent : `frontend` (Next.js) et `riviera-secrete` (ancien static déployé sur Vercel aussi via `riviera-secrete.vercel.app`).
