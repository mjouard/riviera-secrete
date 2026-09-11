---
name: frontend-nextjs
description: "Frontend Next.js 16 App Router — structure, pages, composants, auth NextAuth, déploiement Vercel"
metadata: 
  node_type: memory
  type: project
  originSessionId: 52dd96aa-badc-4607-83f8-5de46933687d
---

## Stack

- **Next.js 16.3.4** App Router, TypeScript, Tailwind CSS
- **next-auth 4.24.15** (Google OAuth + JWT .NET)
- **Leaflet** (maps côté client, import dynamique SSR disabled)
- **Déployé** sur Vercel (projet `frontend`, compte `maximejouard-6739`)
- **URL prod** : https://frontend-two-plum-92.vercel.app
- **Déploiement** : `cd frontend && npx vercel --prod --yes` (depuis `frontend/`, rootDirectory = null/auto)

## Structure (`/frontend/`)

```
src/
  lib/
    types.ts              — interfaces TS (Lieu, Activite, Ville, Itineraire, etc.)
    api.ts                — get<T>() + authFetch(path, token, options) pour routes protégées
    auth.ts               — authOptions NextAuth (GoogleProvider + callbacks jwt/session)
    itineraire-logic.ts   — port TS de itineraire-data.js (generateItineraire, saveItineraire, etc.)
  types/
    next-auth.d.ts        — extensions Session.apiToken + JWT.apiToken/apiUser
  components/
    NavHeader.tsx         — nav sticky + hamburger mobile + bouton Connexion/Déconnexion
    Providers.tsx         — SessionProvider wrapper ("use client")
    HeroCarousel.tsx      — carousel prev/next/dots ("use client")
    MapLieuWrapper.tsx    — "use client" + dynamic(ssr:false) pour LeafletLieuMap
    MapItinWrapper.tsx    — "use client" + dynamic(ssr:false) pour LeafletItinMap
    LeafletLieuMap.tsx    — carte Leaflet mini pour pages lieu (init+cleanup useEffect)
    LeafletItinMap.tsx    — carte Leaflet route pour pages itinéraire
    BuilderMap.tsx        — carte Leaflet stable pour créateur (init once, applyStops())
  app/
    layout.tsx            — RootLayout : Providers > NavHeader > main > footer, Plausible
    globals.css           — palette CSS vars + Tailwind
    page.tsx              — Homepage hero + itinéraires + lieux grid
    api/
      auth/[...nextauth]/route.ts  — handler NextAuth GET+POST
    lieux/
      page.tsx            — grille par région (5 régions)
      [slug]/page.tsx     — détail : HeroCarousel, metaPills, tips, activités, MapLieuWrapper
    itineraires/
      page.tsx            — liste 6 itinéraires
      [slug]/page.tsx     — programme, bookings, MapItinWrapper, buildGoogleMapsRouteUrl
    villes/
      page.tsx            — grille villes par région
      [slug]/page.tsx     — hero, description, MapLieuWrapper, grille lieux
    creer-itineraire/
      page.tsx            — créateur drag-and-drop, ▲/▼ mobile, BuilderMap, save localStorage
    mes-itineraires/
      page.tsx            — liste localStorage, liens vers créateur ?id=, delete
    sitemap.xml/
      route.ts            — sitemap dynamique (fetch all lieux/itins/villes)
```

## Routes

| Route | Type | Pages |
|---|---|---|
| `/` | SSG 1h | Homepage |
| `/lieux` | SSG 1h | Liste |
| `/lieux/[slug]` | SSG 1h | 27 pages lieu |
| `/itineraires` | SSG 1h | Liste |
| `/itineraires/[slug]` | SSG 1h | 6 pages |
| `/villes` | SSG 1h | Liste |
| `/villes/[slug]` | SSG 1h | 22 pages |
| `/creer-itineraire` | Client | Créateur |
| `/mes-itineraires` | Client | Liste sauvegardés |
| `/api/auth/[...nextauth]` | Dynamic | Handler NextAuth |
| `/sitemap.xml` | SSG 1h | Sitemap |

**Total au build** : 65 pages (27 lieux + 6 itin + 22 villes + statiques + sitemap).

## Auth NextAuth v4

**Flow** :
1. Utilisateur clique "Connexion" → `signIn("google")`
2. NextAuth redirige vers Google, récupère le `id_token`
3. Callback `jwt` envoie `id_token` à `POST /api/auth/google-signin` (backend .NET)
4. Backend valide via `Google.Apis.Auth`, upsert User, renvoie `{ token, user }`
5. `token.apiToken` et `token.apiUser` stockés dans le JWT NextAuth
6. Callback `session` expose `session.apiToken` et `session.user.id`

**Fichiers clés** :
- `src/lib/auth.ts` — `authOptions` (GoogleProvider, callbacks)
- `src/app/api/auth/[...nextauth]/route.ts` — `export { handler as GET, handler as POST }`
- `src/types/next-auth.d.ts` — augmentation `Session.apiToken`, `JWT.apiToken/apiUser`
- `src/components/Providers.tsx` — `<SessionProvider>` (wraps tout l'app dans layout.tsx)
- `src/components/NavHeader.tsx` — `useSession()` + `signIn/signOut`

**Appels API protégés** :
```ts
import { authFetch } from "@/lib/api";
const res = await authFetch("/api/favorites", session.apiToken, { method: "GET" });
```

## Patterns importants

**Leaflet** — ne JAMAIS importer directement dans un Server Component.
```ts
// Dans un "use client" wrapper :
const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });
```

**imgUrl(path)** — strip `../` → `/assets/images/...` (images dans `public/assets/images/`).

**parseHeroImgTag(tag)** — parse la string HTML brute `heroImgTag` de l'itinéraire pour extraire `src`, `alt`, `data-carousel-srcs`.

**buildMapLinks(lat, lng, nom)** — génère Google Maps / Waze / Apple Plans URLs.

## Variables d'environnement

| Variable | Dev (`.env.local`) | Prod (Vercel) |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api-production-19623.up.railway.app` | idem |
| `GOOGLE_CLIENT_ID` | `238986417715-sr32i4nepu37l12m0f8vm9ntnoio44hg.apps.googleusercontent.com` | idem |
| `GOOGLE_CLIENT_SECRET` | (secret) | (secret) |
| `NEXTAUTH_URL` | `http://localhost:3000` | `https://frontend-two-plum-92.vercel.app` |
| `NEXTAUTH_SECRET` | (généré) | (généré) |

**Google OAuth** — Authorized redirect URIs à configurer dans Google Cloud Console :
- `http://localhost:3000/api/auth/callback/google`
- `https://frontend-two-plum-92.vercel.app/api/auth/callback/google`

## Déploiement Vercel — pièges connus

Le projet `frontend` (Vercel) a `rootDirectory = null` (auto-detect).
- **Déployer depuis `frontend/`** : `npx vercel --prod --yes` ✅
- **Ne PAS déployer depuis la racine du repo** : Vercel lierait au projet `riviera-secrete` (le vieux site statique) ❌
- Si `rootDirectory` est mis à `"frontend"` dans les settings Vercel, les CLI deploys depuis `frontend/` échouent (il chercherait `frontend/frontend/`). Laisser à `null`.

## Design

Palette CSS (partagée avec le site statique) :
- `--bg: #0C1116` / `--surface: #151B22` / `--terracotta: #E8A33D` / `--azure: #4FC3C9`
- Police : Inter (Google Fonts)

## Dev local

```bash
cd frontend && npm run dev   # → http://localhost:3000
```
`.env.local` déjà configuré avec les bonnes valeurs. API Railway accessible en dev.

## Plausible Analytics

Script dans `layout.tsx` : `https://plausible.io/js/pa-R_6LcENgDIgoUpT8QUE4g.js`
Même script que le site statique → stats consolidées.
