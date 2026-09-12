---
name: frontend-nextjs
description: "Frontend Next.js 16 App Router — structure, pages, composants, auth NextAuth (Google + email/mot de passe), déploiement Vercel"
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
    api.ts                — get<T>() (+ decodeDeep() pour les entités HTML, voir plus bas)
                            + authFetch(path, token, options) pour routes protégées
    auth.ts               — authOptions NextAuth (GoogleProvider + CredentialsProvider +
                            callbacks jwt/session — voir "Auth NextAuth v4" ci-dessous)
    utils.ts              — imgUrl, buildMapLinks, buildGoogleMapsRouteUrl, decodeEntities
                            (ajouté 2026-09-12 — décode "&amp;" etc., pur JS sans DOM)
    home-data.ts           — (2026-09-12) constantes homepage : REGION_ORDER/LABELS/COLORS,
                            BADGE_DEFS, ACTIVITY_CATEGORIES, FEATURED_ACTIVITIES (curation
                            activité→catégorie copiée depuis index.html du site statique —
                            garder synchro si l'un des deux change), truncate()
    map-tiles.ts           — (2026-09-12) MAP_TILE_URL/ATTRIBUTION (OpenStreetMap, plus
                            CARTO — voir section Leaflet), applyDarkTileFilter(map)
    itineraire-logic.ts   — port TS de itineraire-data.js (generateItineraire, saveItineraire, etc.)
  types/
    next-auth.d.ts        — extensions Session.apiToken, JWT.apiToken/apiUser,
                            User.apiToken (ajouté 2026-09-12 pour le CredentialsProvider)
  components/
    NavHeader.tsx         — nav sticky + hamburger mobile + lien "Connexion" → `/connexion`
                            (plus de signIn("google") direct depuis la nav, 2026-09-12)
    Providers.tsx         — SessionProvider wrapper ("use client")
    HeroCarousel.tsx      — carousel prev/next/dots ("use client")
    FavoriteButton.tsx    — bouton ♡/♥ sur pages lieu, redirige vers `/connexion?callbackUrl=…`
                            si non connecté (plus de signIn("google") direct, 2026-09-12)
    MapLieuWrapper.tsx    — "use client" + dynamic(ssr:false) pour LeafletLieuMap
    MapItinWrapper.tsx    — "use client" + dynamic(ssr:false) pour LeafletItinMap
    HomeMapWrapper.tsx    — (2026-09-12) "use client" + dynamic(ssr:false) pour HomeMap
    LeafletLieuMap.tsx    — carte Leaflet mini pour pages lieu (init+cleanup useEffect)
    LeafletItinMap.tsx    — carte Leaflet route pour pages itinéraire
    HomeMap.tsx           — (2026-09-12) carte Leaflet homepage, 22 villes colorées par
                            région, panneau d'info au clic, filtres région — a le guard
                            anti-double-init React Strict Mode que Leaflet{Lieu,Itin}Map
                            n'ont pas encore (voir section Leaflet)
    HomeActivities.tsx    — (2026-09-12) section "Activités" homepage, onglets par
                            catégorie, cartes construites depuis FEATURED_ACTIVITIES
    HomeLieuxGrid.tsx     — (2026-09-12) grille des 27 lieux + filtres badge (homepage)
    BuilderMap.tsx        — carte Leaflet stable pour créateur (init once, applyStops())
  app/
    layout.tsx            — RootLayout : Providers > NavHeader > main > footer, Plausible
    globals.css           — palette CSS vars + Tailwind
    page.tsx              — Homepage : hero, itinéraires (+ thumbnail depuis 2026-09-12),
                            HomeActivities, HomeMapWrapper, HomeLieuxGrid
    api/
      auth/[...nextauth]/route.ts  — handler NextAuth GET+POST
    connexion/
      page.tsx            — (2026-09-12) page unique login/inscription, voir "Auth NextAuth v4"
    confirmer-email/
      page.tsx            — (2026-09-12) consomme `?token=`, POST /api/auth/confirm-email
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
      page.tsx            — créateur drag-and-drop, ▲/▼ mobile, BuilderMap, save → DB (login requis)
    mes-itineraires/
      page.tsx            — liste DB (connexion requise), liens vers créateur ?id=, delete
    mes-favoris/
      page.tsx            — liste des favoris DB, retirer, lien vers /lieux si vide
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
| `/creer-itineraire` | Client | Créateur (save → DB si connecté, sinon redirige `/connexion`) |
| `/mes-itineraires` | Client | Liste DB (connexion requise) |
| `/mes-favoris` | Client | Liste favoris DB (connexion requise) |
| `/connexion` | Client | (2026-09-12) Login + inscription, Google + email/mot de passe |
| `/confirmer-email` | Client | (2026-09-12) Confirmation via `?token=` |
| `/api/auth/[...nextauth]` | Dynamic | Handler NextAuth |
| `/sitemap.xml` | SSG 1h | Sitemap |

**Total au build** : 66 pages SSG/SSR (27 lieux + 6 itin + 22 villes + statiques + sitemap) —
`/connexion`/`/confirmer-email` sont client-only, ne comptent pas dans ce total prerendered.

## Auth NextAuth v4 — Google **et** email/mot de passe (étendu 2026-09-12)

**Deux providers dans `authOptions.providers`** : `GoogleProvider` (inchangé) et
`CredentialsProvider` (nouveau). `pages.signIn` pointe vers `/connexion` (page custom, pas
la page par défaut de NextAuth).

**Flow Google** (inchangé) :
1. Clic sur "Continuer avec Google" (dans `/connexion`) → `signIn("google", { callbackUrl })`
2. NextAuth redirige vers Google, récupère le `id_token`
3. Callback `jwt` (branche `account?.id_token`) envoie `id_token` à
   `POST /api/auth/google-signin` (backend .NET)
4. Backend valide via `Google.Apis.Auth`, upsert/lie User, renvoie `{ token, user }`
5. `token.apiToken`/`token.apiUser` stockés dans le JWT NextAuth

**Flow email/mot de passe** (nouveau) :
1. `/connexion` (mode login) appelle **directement** `POST /api/auth/login` en premier —
   pas via NextAuth — pour distinguer un 401 (mauvais identifiants) d'un 403
   `email_not_confirmed` (affiche un bouton "Renvoyer" au lieu d'une erreur générique).
   NextAuth's `authorize()` ne renvoie qu'un `null` générique en cas d'échec, donc cette
   double-vérif est nécessaire pour un message d'erreur précis.
2. Une fois le login direct confirmé OK, appelle `signIn("credentials", { email, password,
   redirect:false, callbackUrl })` pour établir la vraie session NextAuth.
3. Côté `authorize()` (dans `auth.ts`), rappelle lui-même `POST /api/auth/login` et renvoie
   `{ id, email, name, apiToken }` — c'est ce `user.apiToken` que le callback `jwt` récupère
   (branche `else if (user?.apiToken)`, voir `next-auth.d.ts`'s `User.apiToken`).
4. `/connexion` (mode inscription) appelle `POST /api/auth/register` directement (jamais de
   session immédiate — le backend ne renvoie pas de token tant que l'email n'est pas
   confirmé) puis affiche l'écran "Vérifie ta boîte mail".

**Dans les deux cas**, la session finale expose `session.apiToken` et
`session.user.{id,name,email}` via le callback `session` — identique pour Google et
credentials, les composants consommateurs (`FavoriteButton`, `mes-favoris`, etc.) ne
distinguent jamais la méthode d'auth utilisée.

**Fichiers clés** :
- `src/lib/auth.ts` — `authOptions` (GoogleProvider + CredentialsProvider, callbacks)
- `src/app/connexion/page.tsx` — UI login/inscription, logique décrite ci-dessus
- `src/app/confirmer-email/page.tsx` — consomme le token de confirmation
- `src/app/api/auth/[...nextauth]/route.ts` — `export { handler as GET, handler as POST }`
- `src/types/next-auth.d.ts` — augmentation `Session.apiToken`, `JWT.apiToken/apiUser`,
  `User.apiToken`
- `src/components/Providers.tsx` — `<SessionProvider>` (wraps tout l'app dans layout.tsx)
- `src/components/NavHeader.tsx` — `useSession()` + lien `/connexion` + `signOut`

**Appels API protégés** :
```ts
import { authFetch } from "@/lib/api";
const res = await authFetch("/api/favorites", session.apiToken, { method: "GET" });
```

## Composants notables

- **`FavoriteButton`** (`src/components/FavoriteButton.tsx`) — bouton ♡/♥ sur les pages lieu. `useSession()` → si pas connecté, redirige vers `/connexion?callbackUrl=<url courante>`. Fetch la liste `/api/favorites` au mount, toggle POST/DELETE. "use client".
- **Tailwind preflight reset** — Tailwind v4 reset `button { cursor: default }`. Fix global dans `globals.css` : `button:not(:disabled) { cursor: pointer; }`. Ajouter aussi `cursor-pointer` explicite si besoin.
- **Décodage d'entités HTML** — `src/lib/api.ts`'s `get<T>()` applique `decodeDeep()` (walk
  récursif + `decodeEntities()` de `utils.ts`) à toute réponse JSON, pour corriger les
  `&amp;` littéraux venus de `data/lieux.json`/`itineraires.json` (écrits pour le rendu HTML
  brut du site statique) qui s'afficheraient sinon tels quels en JSX.

## Itinéraires — DB only (plus de localStorage)

Depuis la session 2026-09-11 :
- **`creer-itineraire`** : "Sauvegarder" → POST `/api/my-itineraires` (nouveau) ou PUT `/api/my-itineraires/{id}` (mise à jour). Si non connecté → `signIn("google", { callbackUrl })`. Charge depuis DB via `?id=` param (effet secondaire qui attend `session` + `lieux` avant de fetcher). Plus de `getSaved`/`saveItineraire` localStorage.
- **`mes-itineraires`** : uniquement DB. Bannière connexion si déconnecté. Plus de localStorage, plus de bridge/import.
- **`mes-favoris`** : liste des slugs favoris depuis `GET /api/favorites`, hydratée avec `GET /api/lieux`. Bouton "Retirer" → `DELETE /api/favorites/{slug}`.

## Patterns importants

**Leaflet** — ne JAMAIS importer directement dans un Server Component.
```ts
// Dans un "use client" wrapper :
const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });
```

**Tuiles Leaflet — OpenStreetMap, pas CARTO** (fixé 2026-09-12) : les 4 cartes
(`HomeMap`/`LeafletLieuMap`/`LeafletItinMap`/`BuilderMap`) utilisaient
`basemaps.cartocdn.com/dark_all` — CARTO a coupé l'accès anonyme à ce service, qui renvoie
maintenant une image "API KEY REQUIRED" en 200 OK (donc invisible à un simple check de
statut HTTP, seul un vrai screenshot ou une lecture de pixels le révèle). Utiliser
`MAP_TILE_URL`/`MAP_TILE_ATTRIBUTION` de `src/lib/map-tiles.ts` (OpenStreetMap standard,
gratuit, sans clé) + `applyDarkTileFilter(map)` juste après avoir ajouté le tile layer, pour
récupérer un rendu sombre proche de l'ancien via un filtre CSS sur le tile pane. Ne jamais
réintroduire l'URL CARTO.

**Race React Strict Mode sur l'init Leaflet** — le pattern `useEffect(() => {
import("leaflet").then(L => { map = L.map(...) }) })` peut créer deux instances Leaflet sur
le même noeud DOM en dev (Strict Mode monte/démonte/remonte l'effet, et si le cleanup de la
première passe tourne avant que la promesse résolve, `map` n'est jamais nettoyée) → erreur
"Map container is already initialized." Fix : un flag `cancelled` local à l'effet, vérifié
en tête du callback `.then()`, mis à `true` dans le cleanup. `HomeMap.tsx` a ce guard ;
`LeafletLieuMap.tsx`/`LeafletItinMap.tsx` ne l'ont pas encore (bug latent probable, pas
encore confirmé reproduit sur ces deux-là).

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

Palette CSS :
- `--bg: #0C1116` / `--surface: #151B22` / `--terracotta: #E8A33D` / `--azure: #4FC3C9`
- Police : Inter (Google Fonts)

## Dev local

```bash
cd frontend && npm run dev   # → http://localhost:3000
```
`.env.local` est gitignoré et **absent sur un checkout neuf** — à recréer soi-même (voir
"Variables d'environnement" ci-dessus pour les valeurs ; `NEXT_PUBLIC_API_URL` pointé sur
l'API Railway de prod suffit pour un dev en lecture, pas besoin de lancer le backend en
local sauf pour tester des changements backend). Sans ce fichier, l'app tombe sur le
défaut `http://localhost:5171` codé dans `api.ts` et toutes les requêtes échouent
silencieusement côté Server Component (`TypeError: fetch failed`, page 500 en dev).

## Plausible Analytics

Script dans `layout.tsx` : `https://plausible.io/js/pa-R_6LcENgDIgoUpT8QUE4g.js`
