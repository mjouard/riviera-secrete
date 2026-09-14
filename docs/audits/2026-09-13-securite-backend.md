# Audit sécurité backend — 2026-09-13

**Périmètre** : `backend/` (ASP.NET Core, EF Core, PostgreSQL), secrets du dépôt,
dépendances. Frontend hors périmètre.
**Méthode** : relecture du code endpoint par endpoint, vérifications en exécution contre
l'API locale, `dotnet list package --vulnerable --include-transitive`, recherche de secrets
dans l'historique git complet.
**Résultat build** : `dotnet build` 0 erreur / 0 avertissement.

---

## 🔴 CRITIQUE — mot de passe PostgreSQL de prod dans un dépôt public

`.claude/memory/backend_dotnet.md`, introduit par le commit **`7f25aea`** (poussé sur
`origin/main`), retiré du fichier par `7f57c21` — **mais toujours lisible dans
l'historique**.

Exploitable immédiatement et sans authentification préalable :

- `mjouard/riviera-secrete` est **public** (`"private": false`, vérifié via l'API GitHub) ;
- l'hôte est le proxy **public** Railway (`altaria.proxy.rlwy.net`), joignable de partout.

Un lecteur du dépôt obtenait donc un accès `postgres` complet en lecture/écriture sur la
base de prod : comptes, hashs BCrypt, **tokens de confirmation d'email en clair** (donc
prise de contrôle de tout compte non confirmé), et suppression de données.

**La rotation du mot de passe est la seule correction réelle.** Retirer la ligne ne suffit
pas. À faire depuis Railway (service `Postgres`), puis mettre à jour
`ConnectionStrings__DefaultConnection` sur le service `api` et l'`appsettings.Development.json`
local. Considérer la base comme potentiellement compromise (inspecter les lignes de `Users`
non reconnues).

---

## 🟠 Élevée — corrigées

| Où | Problème | Commit |
|---|---|---|
| tous les `/api/auth/*` | Aucun rate limiting : `/login` brute-forçable sans limite, `/register` permettait de créer des comptes en boucle, `/resend-confirmation` de faire envoyer des emails en masse depuis notre expéditeur Resend (réputation du domaine). | `d0c8537` |
| `google-signin` | `payload.EmailVerified` n'était pas vérifié. Le code lie un `GoogleId` inconnu sur un compte existant **par email** : un id_token Google valide portant un email non vérifié (possible sur certains comptes Workspace) suffisait à se greffer sur un compte email/mot de passe et à en prendre le contrôle. | `d0c8537` |
| `Jwt:Secret` | `builder.Configuration["Jwt:Secret"]!` : secret absent → clé HMAC vide → **tout JWT forgeable par n'importe qui**, sans aucune erreur visible. Le démarrage est désormais refusé. | `d0c8537` |

Politiques de rate limiting retenues : `auth` = 20 req/min (`login`, `google-signin`,
`confirm-email`) ; `auth-email` = 10 req/15 min (`register`, `resend-confirmation`, qui
déclenchent un envoi Resend). Vérifié en exécution : 429 + en-tête `Retry-After`.

### Piège corrigé après coup — clé de partitionnement du rate limiter

La première version partitionnait sur la **dernière** entrée de `X-Forwarded-For`, en
appliquant la règle générale « le client peut falsifier le début de la chaîne, donc lis la
fin ». **Cette règle ne vaut pas derrière Railway** : leur edge *supprime* l'en-tête envoyé
par le client avant d'écrire le sien, donc la première entrée est déjà l'IP réelle et n'est
pas falsifiable. Railway pouvant ajouter un hop interne, lire la dernière entrée renvoyait
l'IP du proxy — **la même pour tout le monde** : quota unique partagé par tous les
visiteurs, et 20 requêtes/min depuis n'importe où auraient suffi à bloquer les connexions
de tout le site. Le garde-fou serait devenu le vecteur de déni de service qu'il prévient.
Corrigé en `c70e9e7` (première entrée), vérifié contre la documentation Railway.

---

## 🟡 Moyenne

| Où | Problème | Statut |
|---|---|---|
| `POST/PUT /api/my-itineraires` | `Days` (`string[][]`) partait en `jsonb` sans aucune borne : un compte authentifié pouvait y stocker des mégaoctets et créer des itinéraires en boucle. | Corrigé `203614e` — 10 jours / 200 étapes / 100 itinéraires par compte |
| `POST /api/favorites/{lieuSlug}` | Slug arbitraire accepté : >100 caractères → 500 à l'INSERT ; sinon remplissage libre de la table (l'index unique porte sur `(UserId, LieuSlug)`, pas sur la valeur). | Corrigé `203614e` — charset + existence dans `Lieux` |
| `login` | Énumération de comptes **par timing** : compte inexistant ou sans mot de passe → aucun BCrypt calculé, réponse en ~1 ms au lieu de ~100 ms. | Corrigé `d0c8537` — vérification systématique contre un hash factice |
| `appsettings.Development.json` | **Suivi par git** malgré `.gitignore` (une règle `.gitignore` n'agit pas sur un fichier déjà indexé). Le prochain `git add -A` après y avoir mis le mot de passe l'aurait commité silencieusement — exactement le scénario de la faille critique. Pas de `.dockerignore` non plus, alors que le Dockerfile fait `COPY . .` et que `railway up` envoie le dossier local : le fichier atterrissait dans une couche de l'image. | Corrigé `3e1c6db` — `git rm --cached` + `.dockerignore` |
| `register` | Énumération assumée : `409 "Un compte existe déjà avec cet email."` | **Non corrigé** — arbitrage produit |
| JWT | 30 jours, aucune denylist de `jti`, pas de refresh token : un token volé reste valable 30 jours, et une rotation du secret déconnecte tout le monde. | **Non corrigé** — arbitrage produit |

---

## 🔵 Faible — toutes corrigées (`d0c8537`)

Les records DTO **ne sont pas validés** par le binder minimal-API : un JSON sans la clé
arrive avec un `string` à `null` malgré `<Nullable>enable</Nullable>`, ce qui faisait
planter les `.Trim()` en 500 sur `register`/`login`/`resend-confirmation`. Idem pour les
chaînes plus longues que leur colonne (500 à l'INSERT au lieu d'un 400). Ajouté également :
refus des mots de passe > 72 octets (BCrypt tronque silencieusement au-delà) et garde sur
`confirm-email`, dont un token `null` se traduisait en `WHERE "EmailConfirmationToken" IS
NULL` côté EF — inoffensif aujourd'hui seulement parce que l'expiry `null` rattrape
derrière.

---

## Vérifié et sain

- **Autorisation / IDOR** — les 7 endpoints protégés portent `.RequireAuthorization()`, et
  **aucun n'accepte de `userId` du client** : tous filtrent sur `GetUserId(principal)` issu
  du claim `sub`. `PUT`/`DELETE /api/my-itineraires/{id}` filtrent sur
  `i.Id == id && i.UserId == userId` — viser l'itinéraire d'un autre renvoie 404, sans
  fuite. Vérifié en exécution : 401 sans token, 401 avec signature invalide.
- **Validation JWT** — issuer, audience, lifetime et clé de signature tous validés ;
  `HmacSha256` imposé à l'émission, clé symétrique unique à la validation : pas de confusion
  d'algorithme, `alg: none` rejeté.
- **Fuite de données sur les endpoints publics** — relecture champ par champ de
  `Lieu`/`Ville`/`Itineraire`/`Activite` : uniquement du contenu éditorial. `User` n'est
  jamais sérialisé (les endpoints d'auth projettent sur `{ Id, Email, Nom }`). Point
  important : **pas de lazy loading** (ni `EntityFrameworkCore.Proxies`, ni
  `UseLazyLoadingProxies`), donc la navigation `UserItineraire.User` reste `null` et
  n'entraîne pas `PasswordHash`/`EmailConfirmationToken` dans la réponse — c'était le risque
  réel vu l'architecture.
- **Injection SQL** — zéro `FromSql`/`ExecuteSql`/`NpgsqlCommand`/`CommandText` dans tout le
  backend. Le seul SQL brut est un `UPDATE` statique dans la migration
  `AddEmailConfirmation`, sans interpolation.
- **CORS** — une seule origine configurée, pas de `AllowAnyOrigin` ni `AllowCredentials`.
  Testé : aucun en-tête `Access-Control-Allow-Origin` pour une origine inconnue.
- **BCrypt** — work factor 11 (vérifié empiriquement, conforme OWASP) ; `Verify` ne lève pas
  sur mot de passe long ou vide, donc pas de DoS par ce biais.
- **Confirmation d'email** — token de 32 octets `RandomNumberGenerator` (256 bits), expiry
  24 h, usage unique effectif (token + expiry remis à `null`).
- **Dépendances** — aucun paquet vulnérable sur les 4 projets.
- **Secrets frontend** — `.env.local` non suivi, `.env.example` sans valeurs. Les deux
  variables `NEXT_PUBLIC_*` ne sont pas des secrets. Aucune clé Resend, `GOCSPX-` ni
  `NEXTAUTH_SECRET` dans l'historique git.

## Non vérifiable depuis le code

Les valeurs réelles des variables d'environnement Railway : force de `Jwt__Secret`, valeur
de `Cors__AllowedOrigin`, et surtout **`ASPNETCORE_ENVIRONMENT`** — si elle vaut
`Development`, `POST /api/seed` est exposé publiquement. En local, testé : 404 en
Production. À vérifier dans la console Railway.
