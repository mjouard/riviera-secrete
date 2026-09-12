---
name: architecture-future
description: "Décisions d'architecture pour la stack cible — état d'avancement P1-P4.5 (tout fait), prochaines étapes"
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
  - Sauvegarde **DB uniquement depuis le 2026-09-11** (`fc84181`) — plus de localStorage,
    login requis, voir P4/P4.5
- `/mes-itineraires` — idem, DB uniquement, connexion requise

### ✅ P4 — Auth Google + JWT (terminé)

**Backend :**
- Entités `User`, `UserFavorite`, `UserItineraire`
- Migration `20260911160215_AddUserTables` appliquée en prod
- `POST /api/auth/google-signin` + endpoints favoris/itinéraires protégés
- JWT Bearer middleware configuré

**Frontend :**
- `next-auth@4.24.15` installé
- `src/lib/auth.ts` — authOptions
- `src/app/api/auth/[...nextauth]/route.ts` — route handler
- `src/types/next-auth.d.ts` — type extensions
- `src/components/Providers.tsx` — SessionProvider
- `src/components/NavHeader.tsx` — bouton Connexion/Déconnexion
- `src/lib/api.ts` — `authFetch()` helper
- Bouton favori ♡ sur pages lieu (`FavoriteButton.tsx`, `9e055b3`)
- `/mes-favoris` — liste DB, connexion requise
- `/mes-itineraires` — DB uniquement (pas de fallback localStorage, décision prise le
  2026-09-11 : simplifier plutôt que maintenir un hybride)

Tout P4 est fait — le item "callback URLs Google Cloud Console" listé comme manquant dans
une version antérieure de ce fichier avait en fait déjà été fait (l'auth Google fonctionne
en prod depuis un moment).

### ✅ P4.5 — Auth email/mot de passe + confirmation d'email (2026-09-12)

Ajouté après coup, à la demande explicite de l'utilisateur ("je veux que l'utilisateur
puisse se connecter avec Google mais aussi en créant un compte", puis "j'aimerais que les
mails soient checkés avec email de confirmation").

**Backend :**
- `User.GoogleId` devenu nullable, +`PasswordHash` (BCrypt), +`EmailConfirmed`/
  `EmailConfirmationToken`/`EmailConfirmationTokenExpiry`, index unique sur `Email`
  (migrations `AddPasswordAuth` puis `AddEmailConfirmation`, cette dernière marquant aussi
  rétroactivement tous les comptes Google existants comme confirmés)
- `POST /api/auth/{register,login,confirm-email,resend-confirmation}` — voir
  `backend_dotnet.md` pour le détail des contrats
- `EmailService.cs` — envoi via l'API HTTP Resend, **limitation sandbox connue** : sans
  domaine vérifié sur resend.com/domains, Resend refuse d'envoyer à toute adresse autre que
  celle du compte Resend lui-même (confirmé par l'utilisateur le 2026-09-12 : inscription
  fonctionne, mais aucun email reçu — message d'erreur Resend explicite en log serveur).
  **Pas un bug à corriger côté code** — la seule vraie solution est de vérifier un domaine,
  ce qui dépend de l'achat d'un nom de domaine (déjà dans `ROADMAP.md`). Solution de
  contournement pour tester en attendant : le compte propriétaire du compte Resend (l'email
  utilisé à l'inscription sur resend.com) peut recevoir des emails de test — mais si cet
  email est déjà un compte existant dans la DB (ex. déjà connecté via Google), `register`
  refusera (409, email déjà pris) ; pas de bonne solution de test à distance tant qu'aucun
  domaine n'est vérifié.

**Frontend :**
- `/connexion` — page unique login/inscription, Google + email/mot de passe, gère l'écran
  "vérifie ta boîte mail" et le cas "email pas confirmé" avec bouton renvoyer
- `/confirmer-email` — consomme le lien reçu par email
- `CredentialsProvider` ajouté à `auth.ts` à côté de `GoogleProvider`
- Tous les anciens `signIn("google")` directs (nav, favoris, mes-itinéraires, créateur)
  redirigent maintenant vers `/connexion?callbackUrl=…`

### ✅ Restauration de features homepage manquantes (2026-09-11/12)

Sans rapport avec l'auth — trouvé en comparant à l'oeil le site statique (avant sa
suppression) et le Next.js : carte Leaflet homepage, section activités par catégorie,
filtres badge sur la grille lieux, image sur les cartes itinéraires. Le suivi
feature-par-feature qui a permis de les repérer (`frontend_migration_checklist.md`) a été
supprimé le 2026-09-12 en même temps que le site statique lui-même, son rôle terminé — la
liste complète des items portés reste dans `ROADMAP.md`, section "Portage site statique →
Next.js".

### ✅ Autres corrections notables de cette période

- **Entités HTML non décodées** (`&amp;` affiché tel quel) — décodage centralisé dans
  `api.ts`, voir `frontend_nextjs.md`
- **Cartes Leaflet cassées** — CARTO a coupé l'accès anonyme à ses tuiles `dark_all`
  (renvoyait une image "API KEY REQUIRED" avec un statut 200 OK, donc invisible sans
  inspecter le contenu réel de la tuile) ; basculé sur OpenStreetMap + filtre CSS, voir
  `frontend_nextjs.md`

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

## Périmètre backend

- **Itinéraires custom** → `UserItineraire` en DB, fait (plus de localStorage)
- **Favoris** → `UserFavorite` en DB, fait (`/mes-favoris`)
- **Auth** → Google + email/mot de passe + confirmation d'email, fait (voir P4/P4.5)
- **Images** → servies depuis `frontend/public/assets/`, seule copie qui existe
  (l'ancien site statique avait sa propre copie, supprimée avec son code le 2026-09-12).
  Cloudflare R2 pas encore commencé — pas bloquant, juste une dette

## Site statique — supprimé le 2026-09-12

Après audit confirmant la parité fonctionnelle (liste complète dans `ROADMAP.md`, section
"Portage site statique → Next.js"), tout le code du site statique (racine `index.html`,
`lieux/`, `itin/`, `villes/`, `assets/`, `scripts/`, `netlify.toml`, `vercel.json` racine,
`sitemap.xml`, `robots.txt`) a été supprimé du repo. `data/*.json` a survécu — c'est la
seule chose qui restait utile (source de seed du backend). Le projet Vercel
`riviera-secrete` (`riviera-secrete.vercel.app`) a existé pour héberger ce site ; son code
source n'existe plus dans ce repo, donc ignorer cette URL — le frontend Next.js
(`frontend-two-plum-92.vercel.app`) est le seul vrai site désormais. Toujours déployer
le Next.js depuis `frontend/`, jamais depuis la racine du repo (voir
`feedback_vercel_deploy.md` — le risque de résoudre vers le mauvais projet Vercel reste le
même même si ce projet-là ne sert plus rien de valide).
