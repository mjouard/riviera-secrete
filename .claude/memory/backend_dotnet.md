---
name: backend-dotnet
description: "Backend ASP.NET Core .NET 10 — structure, entités, EF Core, endpoints publics + protégés, auth JWT, Railway"
metadata: 
  node_type: memory
  type: project
  originSessionId: 52dd96aa-badc-4607-83f8-5de46933687d
---

## Stack

- **.NET 10**, ASP.NET Core Minimal API
- **EF Core** + `Npgsql.EntityFrameworkCore.PostgreSQL`
- **Google.Apis.Auth** — validation des Google id_tokens côté serveur
- **Microsoft.AspNetCore.Authentication.JwtBearer** — JWT Bearer auth
- **PostgreSQL** sur Railway (projet `fearless-happiness`, service `Postgres`)
- **Déployé** sur Railway (service `api`, même projet)
- **URL prod** : `https://api-production-19623.up.railway.app`

## Structure du dépôt (`/backend/`)

```
RivieraSecrete.sln
RivieraSecrete.Domain/
  Entities/
    Lieu.cs          — Lieu, MetaPill, Tip, RelatedCard
    Activite.cs      — Activite (table propre, FK vers Lieu)
    Ville.cs         — Ville
    Itineraire.cs    — Itineraire, ItineraireItem, StopActivite, BookingRef, SuggestCard
    User.cs          — User (Id, GoogleId, Email, Nom, CreatedAt)
    UserFavorite.cs  — UserFavorite (Id, UserId, LieuSlug, CreatedAt)
    UserItineraire.cs — UserItineraire (Id, UserId, Nom, DureeKey, Days[][], CreatedAt, UpdatedAt)
RivieraSecrete.Infrastructure/
  Data/
    AppDbContext.cs               — DbSets: Lieux, Activites, Villes, Itineraires, Users, UserFavorites, UserItineraires
    DatabaseSeeder.cs             — seed depuis data/*.json (idempotent)
    Configurations/
      VilleConfiguration.cs
      LieuConfiguration.cs        — jsonb pour Badges, MetaPills, Tips, Related
      ItineraireConfiguration.cs  — jsonb pour MetaPills, Items, Booking, Suggestions
      UserConfiguration.cs        — gen_random_uuid(), index unique GoogleId, cascade delete
      UserFavoriteConfiguration.cs — unique(UserId, LieuSlug)
      UserItineraireConfiguration.cs — Days comme jsonb (string[][])
  Migrations/
    20260911093620_InitialCreate.cs
    20260911160215_AddUserTables.cs  — ← tables User, UserFavorite, UserItineraire
RivieraSecrete.Api/
  Program.cs           — endpoints Minimal API + JWT auth + CORS
  appsettings.json     — clés vides (placeholder), Jwt config, Google ClientId
  appsettings.Development.json  — GITIGNORE — vraies credentials (DB + secrets)
  Dockerfile
```

## Endpoints

### Publics

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/lieux` | 27 lieux avec activités |
| GET | `/api/lieux/{slug}` | Un lieu par slug |
| GET | `/api/villes` | 22 villes avec lieux |
| GET | `/api/villes/{slug}` | Une ville par slug |
| GET | `/api/itineraires` | 6 itinéraires |
| GET | `/api/itineraires/{slug}` | Un itinéraire par slug |
| GET | `/health` | `{"status":"ok"}` |
| POST | `/api/seed` | Dev-only — seed depuis data/*.json |

### Auth

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/google-signin` | Body: `{ idToken }` → valide Google id_token, upsert User, renvoie `{ token, user }` |

### Protégés (`.RequireAuthorization()` — JWT Bearer requis)

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/favorites` | Liste des slugs favoris de l'utilisateur |
| POST | `/api/favorites/{lieuSlug}` | Ajouter un favori |
| DELETE | `/api/favorites/{lieuSlug}` | Supprimer un favori |
| GET | `/api/my-itineraires` | Liste des itinéraires custom de l'utilisateur |
| POST | `/api/my-itineraires` | Créer un itinéraire |
| PUT | `/api/my-itineraires/{id:guid}` | Modifier un itinéraire |
| DELETE | `/api/my-itineraires/{id:guid}` | Supprimer un itinéraire |

## DTOs

```csharp
record GoogleSignInRequest(string IdToken);
record ItineraireUpsertRequest(string Nom, string DureeKey, string[][] Days);
```

La réponse `google-signin` retourne `{ Token, User: { Id, Email, Nom } }` (casing Pascal → JSON camelCase via `IgnoreCycles` options).

## JWT

- Généré dans `GenerateJwt(User, IConfiguration)` avec `HmacSha256`
- Claims : `sub` (User.Id), `email`, `nom`, `jti`
- Config dans `appsettings.json` : `Jwt.Secret`, `Jwt.Issuer = "riviera-secrete-api"`, `Jwt.Audience = "riviera-secrete-frontend"`, `Jwt.ExpiryDays = 30`
- `GetUserId(ClaimsPrincipal)` → parse `sub` → `Guid`

## Piège critique — JWT `MapInboundClaims`

**Symptôme** : tous les endpoints `.RequireAuthorization()` retournent 401 même avec un JWT valide.

**Cause** : par défaut, .NET JWT Bearer remplace `sub` par `ClaimTypes.NameIdentifier` (`http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier`). `FindFirstValue(JwtRegisteredClaimNames.Sub)` retourne alors `null`, `GetUserId()` retourne `null`, et l'endpoint répond 401.

**Fix — déjà appliqué dans `Program.cs`** :
```csharp
opts.MapInboundClaims = false; // conserve "sub" tel quel
```

Ne jamais enlever cette ligne. Ne jamais utiliser `ClaimTypes.NameIdentifier` à la place de `JwtRegisteredClaimNames.Sub` dans ce projet.

## Modèle de données — pièges EF Core

Les colonnes complexes sont en **JSONB** via `HasConversion()` + `System.Text.Json` :
- NE PAS utiliser `OwnsMany().ToJson()` avec records nullable → erreur "No suitable constructor found"
- NE PAS utiliser les collection expressions `[]` dans les lambdas EF → CS9175

**Format JSON calqué sur `data/lieux.json` exactement** :
- `MetaPill(string Label, string Valeur)` — pas Icon/Label/Value
- `Tip(string Label, string Texte)` — pas List\<string\>
- `SuggestCard` : champ `badge` (pas `etapes`)

**`UserItineraire.Days`** : `string[][]` stocké en JSONB (liste de jours, chaque jour = liste de slugs).

## Connexion DB

- **Dev local** : `appsettings.Development.json` → `Host=altaria.proxy.rlwy.net;Port=45165;Database=railway;Username=postgres;Password=VhelpxjudMIFKpApfRxrsYzcxIxlbJCS`
- **Railway prod** : var env `ConnectionStrings__DefaultConnection` → `Host=postgres.railway.internal;Port=5432;...`

## Seeder

`DatabaseSeeder.SeedAsync(db, dataDir)` — idempotent. Données déjà en prod, ne pas re-seeder sans vider les tables d'abord.

## Variables d'env Railway (à configurer si elles manquent)

```
ConnectionStrings__DefaultConnection   → postgres.railway.internal URL
Jwt__Secret                            → secret fort (≥32 chars)
Google__ClientId                       → 238986417715-sr32i4nepu37l12m0f8vm9ntnoio44hg.apps.googleusercontent.com
Cors__AllowedOrigin                    → https://frontend-two-plum-92.vercel.app
```

## Déploiement Railway

```bash
railway up --service api   # depuis /backend/
# ou via git push si GitHub integration active
```

Dockerfile multi-stage (SDK 10 → aspnet 10, port 8080).
