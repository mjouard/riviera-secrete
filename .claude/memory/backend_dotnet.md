---
name: backend-dotnet
description: "Backend ASP.NET Core .NET 10 — structure, entités, EF Core, endpoints publics + protégés, auth Google+mot de passe/JWT, email Resend, Railway"
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
    User.cs          — User (Id, GoogleId?, PasswordHash?, Email, Nom, EmailConfirmed,
                       EmailConfirmationToken?, EmailConfirmationTokenExpiry?, CreatedAt)
                       — GoogleId et PasswordHash sont deux méthodes d'auth indépendantes
                       sur la même ligne (2026-09-12), Email unique across les deux
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
      UserConfiguration.cs        — gen_random_uuid(), index unique GoogleId (nullable donc
                                    plusieurs NULL autorisés par Postgres), index unique
                                    Email, index (non-unique) EmailConfirmationToken,
                                    cascade delete
      UserFavoriteConfiguration.cs — unique(UserId, LieuSlug)
      UserItineraireConfiguration.cs — Days comme jsonb (string[][])
  Migrations/
    20260911093620_InitialCreate.cs
    20260911160215_AddUserTables.cs        — ← tables User, UserFavorite, UserItineraire
    20260911213921_AddPasswordAuth.cs      — GoogleId nullable, +PasswordHash, index unique Email
    20260911224044_AddEmailConfirmation.cs — +EmailConfirmed/Token/Expiry, marque
                                              rétroactivement les Google existants confirmés
RivieraSecrete.Api/
  Program.cs           — endpoints Minimal API + JWT auth + CORS
  EmailService.cs      — envoi d'emails transactionnels via l'API HTTP Resend (2026-09-12)
  appsettings.json     — clés vides (placeholder), Jwt config, Google ClientId
  appsettings.Development.json  — GITIGNORE — vraies credentials (DB + secrets), absent sur
                                  un checkout neuf (jamais commité, faut le recréer ou passer
                                  les env vars directement à `dotnet run`)
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
| POST | `/api/auth/google-signin` | Body: `{ idToken }` → valide Google id_token, upsert User (lie sur Email si un compte mot de passe existe déjà), `EmailConfirmed=true`, renvoie `{ token, user }` |
| POST | `/api/auth/register` | Body: `{ email, password, nom }` → 400 si email/password/nom invalides, 409 si email déjà pris, sinon crée un User non confirmé + envoie l'email de confirmation, renvoie `{ status: "confirmation_required", email }` (**pas** de token) |
| POST | `/api/auth/login` | Body: `{ email, password }` → 401 si mauvais identifiants, 403 `{ code: "email_not_confirmed" }` si pas confirmé, sinon `{ token, user }` |
| POST | `/api/auth/confirm-email` | Body: `{ token }` → 400 si invalide/expiré, sinon `EmailConfirmed=true` + token effacé (usage unique), renvoie `{ status: "confirmed" }` |
| POST | `/api/auth/resend-confirmation` | Body: `{ email }` → régénère un token si le compte existe et n'est pas confirmé, renvoie toujours `{ status: "sent" }` (ne révèle jamais si l'email existe) |

**Énumération de comptes encore possible sur `register`** : il répond `409 "Un compte existe
déjà avec cet email."`, ce qui confirme qu'une adresse est inscrite. `login` et
`resend-confirmation` sont eux génériques (et `login` calcule toujours un BCrypt, même
compte inexistant, pour ne pas trahir la réponse par son temps d'exécution — voir la section
Validation). Corriger `register` demanderait de basculer sur un flux « on t'a envoyé un
email » indifférencié, ce qui change l'UX du frontend : arbitrage produit non tranché.

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
record RegisterRequest(string Email, string Password, string Nom);
record LoginRequest(string Email, string Password);
record ConfirmEmailRequest(string Token);
record ResendConfirmationRequest(string Email);
record ItineraireUpsertRequest(string Nom, string DureeKey, string[][] Days);
```

La réponse `google-signin` retourne `{ Token, User: { Id, Email, Nom } }` (casing Pascal → JSON camelCase via `IgnoreCycles` options).

## JWT

- Généré dans `GenerateJwt(User, IConfiguration)` avec `HmacSha256`
- Claims : `sub` (User.Id), `email`, `nom`, `jti`
- Config dans `appsettings.json` : `Jwt.Secret`, `Jwt.Issuer = "riviera-secrete-api"`, `Jwt.Audience = "riviera-secrete-frontend"`, `Jwt.ExpiryDays = 30`
- `GetUserId(ClaimsPrincipal)` → parse `sub` → `Guid`
- **`Program.cs` refuse de démarrer si `Jwt:Secret` est vide** (audit sécu 2026-09-13) : sans
  secret, l'API signait et acceptait des tokens avec une clé vide, donc forgeables. Un
  avertissement console est loggué si la clé fait moins de 32 octets.
- **Pas de révocation** : durée de vie 30 jours, aucune denylist de `jti`, aucun refresh
  token. Un JWT volé reste valable 30 jours et une rotation de `Jwt:Secret` déconnecte tout
  le monde d'un coup — arbitrage produit à trancher, pas encore fait.

## Rate limiting (audit sécu 2026-09-13)

`builder.Services.AddRateLimiter(...)` + `app.UseRateLimiter()` dans `Program.cs`, avec
`Microsoft.AspNetCore.RateLimiting` (dans le framework, aucun package NuGet ajouté). Deux
politiques appliquées via `.RequireRateLimiting("...")` :

| Politique | Limite | Endpoints |
|---|---|---|
| `auth` | 20 req/min par IP | `login`, `google-signin`, `confirm-email` |
| `auth-email` | 10 req/15 min par IP | `register`, `resend-confirmation` (ils déclenchent un envoi Resend) |

**Clé de partitionnement = `ClientKey(HttpContext)`, qui lit la *première* entrée de
`X-Forwarded-For`**, pas `RemoteIpAddress`. Derrière le proxy Railway, `RemoteIpAddress` est
celle du proxy, identique pour tout le monde : partitionner dessus ferait partager un quota
unique à tous les visiteurs (tout le site rate-limité dès qu'une personne dépasse).

**Piège — ne pas appliquer ici la règle générale « le client peut spoofer le début de la
chaîne, donc lis la fin ».** Elle vaut pour un proxy qui se contente d'ajouter à une chaîne
existante ; l'edge Railway, lui, *supprime* le `X-Forwarded-For` envoyé par le client avant
d'écrire le sien, donc la première entrée est déjà l'IP réelle et n'est pas falsifiable.
Railway peut en revanche ajouter un second hop interne : lire la dernière entrée renverrait
alors l'IP du proxy, la même pour tout le monde — exactement le quota global qu'on cherche à
éviter, et 20 req/min depuis n'importe où suffiraient à bloquer les connexions de tout le
site. La première version de ce code faisait ce contre-sens (corrigé le 2026-09-13 après
vérification de la doc Railway ; `x-real-ip` existe aussi mais est documenté comme non
fiable tant que le CDN est actif). Fallback sur `RemoteIpAddress` en local, sans l'en-tête.
**Si Railway change de comportement sur cet en-tête, le rate limiting devient soit global
soit contournable — c'est le point à revérifier en premier.**

## Validation des entrées (audit sécu 2026-09-13)

Les records DTO ne sont **pas** validés par le binder minimal-API : un JSON sans la clé
arrive avec un `string` à `null` malgré `<Nullable>enable</Nullable>`, et faisait planter les
`.Trim()` en 500. Tous les endpoints d'auth gardent désormais leurs champs, et les bornes de
longueur sont alignées sur les colonnes (dépasser la colonne = 500 à l'INSERT, pas 400) :

- `Email` ≤ 256, `Nom` ≤ 200, mot de passe ≥ 8 caractères et ≤ 72 **octets** (au-delà BCrypt
  tronque silencieusement — mieux vaut refuser)
- `UserFavorite.LieuSlug` : `[a-z0-9-]{1,100}` **et** doit exister dans `Lieux`
- `ItineraireUpsertRequest` : ≤ 10 jours, ≤ 200 étapes, slugs validés, `Nom` ≤ 200,
  `DureeKey` ≤ 20 ; ≤ 100 itinéraires par compte. `Days` part en jsonb sans aucune limite
  côté base, donc sans ces bornes un compte authentifié pouvait y stocker des mégaoctets.
- `confirm-email` refuse un token vide/null en amont : `EmailConfirmationToken == null` se
  traduit par un `WHERE ... IS NULL` côté EF, qui matche tous les comptes déjà confirmés.

`google-signin` refuse un `id_token` dont `email_verified` est faux — sinon un tel token
permettait de se lier automatiquement sur un compte email/mot de passe de même adresse
(le code lie par email quand le `GoogleId` est inconnu), donc d'en prendre le contrôle.

## Email transactionnel — Resend (2026-09-12)

`EmailService.SendConfirmationEmailAsync(toEmail, nom, token, config)` — POST HTTP brut vers
`api.resend.com/emails` (pas de SDK, juste `HttpClient` + `System.Text.Json`), utilisé
uniquement pour l'email de confirmation d'inscription pour l'instant.

- Config : `Resend:ApiKey`, `Resend:FromEmail` (défaut `onboarding@resend.dev`),
  `Frontend:Url` (pour construire le lien `{Frontend:Url}/confirmer-email?token=...`)
- **Piège sandbox Resend** : tant qu'aucun domaine n'est vérifié sur resend.com/domains,
  l'API refuse (403 `validation_error`) d'envoyer à toute adresse autre que celle du compte
  Resend lui-même — même un alias `+xxx@` du même Gmail est rejeté (testé, message d'erreur
  explicite : "You can only send testing emails to your own email address"). Donc en prod
  aujourd'hui, **seul le propriétaire du compte Resend recevra réellement l'email** — tous
  les autres inscrits auront un compte créé mais non confirmable tant qu'un domaine n'est
  pas vérifié. Pas un bug côté code, une limitation du compte Resend gratuit/non vérifié.
- Si l'appel Resend échoue (mauvaise clé, quota, réseau), `EmailService` logue dans la
  console et avale l'exception plutôt que de faire échouer `register`/`resend-confirmation`
  — un utilisateur peut donc se retrouver avec un compte créé mais aucun email reçu ; le
  endpoint `resend-confirmation` est la voie de rattrapage une fois Resend de nouveau
  joignable.
- Clé API stockée en variable d'env Railway (`Resend__ApiKey`), jamais dans le code ni
  commitée — même règle que pour `Jwt:Secret`.

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

- **Dev local** : `appsettings.Development.json` (gitignored) → connection string vers le proxy
  public Railway. **Ne jamais recopier le mot de passe ici ni dans aucun fichier commité** :
  le récupérer à la demande via `railway variables --service Postgres` (variable
  `DATABASE_PUBLIC_URL`, à convertir au format Npgsql). Ce dépôt est **public** sur GitHub —
  tout secret écrit dans un fichier suivi par git est immédiatement compromis et doit être
  révoqué, pas seulement supprimé du fichier (l'historique reste lisible).
- **Railway prod** : var env `ConnectionStrings__DefaultConnection` → `Host=postgres.railway.internal;Port=5432;...`

## Seeder

`DatabaseSeeder.SeedAsync(db, dataDir)` — idempotent. Données déjà en prod, ne pas re-seeder sans vider les tables d'abord.

## Variables d'env Railway (à configurer si elles manquent)

```
ConnectionStrings__DefaultConnection   → postgres.railway.internal URL
Jwt__Secret                            → secret fort (≥32 chars)
Google__ClientId                       → 238986417715-sr32i4nepu37l12m0f8vm9ntnoio44hg.apps.googleusercontent.com
Cors__AllowedOrigin                    → https://frontend-two-plum-92.vercel.app
Resend__ApiKey                         → clé API Resend (2026-09-12), jamais loguée/committée
Resend__FromEmail                      → onboarding@resend.dev (sandbox — voir section Email ci-dessus)
Frontend__Url                          → https://frontend-two-plum-92.vercel.app
```

## Outillage requis pour builder/migrer en local

- **.NET 10 SDK** (le projet cible `net10.0`) — `dotnet --list-sdks` pour vérifier ; un poste
  qui n'a que .NET 8 ou moins doit l'installer d'abord :
  `curl -sSL https://dot.net/v1/dotnet-install.sh | bash -s -- --channel 10.0 --install-dir ~/.dotnet`
  (écrire dans `/usr/local/share/dotnet` demande `sudo`, préférer `~/.dotnet`) puis ajouter
  `~/.dotnet` et `~/.dotnet/tools` au `PATH` et exporter `DOTNET_ROOT=~/.dotnet`.
- **`dotnet-ef`** (outil global) pour générer/appliquer les migrations :
  `dotnet tool install --global dotnet-ef`. Commandes lancées depuis `backend/RivieraSecrete.Api` :
  ```bash
  dotnet ef migrations add <Nom> --project ../RivieraSecrete.Infrastructure --startup-project .
  dotnet ef database update --project ../RivieraSecrete.Infrastructure --startup-project .
  ```
  `dotnet ef database update` lit la connection string comme l'app (config + env vars) —
  passer `ConnectionStrings__DefaultConnection` en variable d'env pour cibler la DB Railway
  de prod (voir "Connexion DB" ci-dessus pour la valeur externe/dev).
- **Railway CLI** (`npm install -g @railway/cli`, puis `railway login` — device-code flow
  interactif dans un navigateur, pas de mode non-interactif) pour déployer.

## Déploiement Railway

```bash
railway link --project fearless-happiness --service api --environment production  # une fois par machine
railway up --service api   # depuis /backend/, à chaque déploiement
# ou via git push si GitHub integration active
```

Dockerfile multi-stage (SDK 10 → aspnet 10, port 8080).

**Toute migration de schéma sur la DB Railway de prod (`dotnet ef database update`) est une
action à confirmer avec l'utilisateur avant de l'exécuter** — même quand elle est additive
et non destructive (colonnes nullable, index, data-fix `UPDATE`), c'est une modification
directe de la prod. Deux migrations ont été appliquées ainsi le 2026-09-11/12
(`AddPasswordAuth`, `AddEmailConfirmation`), demandées explicitement à chaque fois.
