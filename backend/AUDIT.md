# Audit technique backend — 2026-09-17

Audit réalisé par analyse statique complète du code (Program.cs, entités, configs EF,
DatabaseSeeder, migrations, EmailService, Dockerfile). Chaque item indique le fichier,
la sévérité et un fix concret.

---

## 1. Sécurité

### Critique

**S1 — `Jwt:Issuer` et `Jwt:Audience` sans guard**
`Program.cs:42-43` — Lus avec `!` (null-forgiving) sans vérification préalable. Si ces clés
sont absentes de la config Railway, le token est émis avec `null` comme issuer/audience, et
la validation passe (`null == null`). Vecteur réel si une variable d'env est oubliée.

```csharp
// Fix : ajouter immédiatement après le guard sur Jwt:Secret
var jwtIssuer = builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException("Jwt:Issuer est requis.");
var jwtAudience = builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException("Jwt:Audience est requis.");
```

### Majeurs

**S2 — Comparaison de `EditToken` par `==` (timing attack)**
`Program.cs:583-584` — Une comparaison de chaîne ordinaire est mesurable à ~100 ns sur un
serveur moderne. Utiliser une comparaison à temps constant :

```csharp
if (!CryptographicOperations.FixedTimeEquals(
        Encoding.UTF8.GetBytes(editToken),
        Encoding.UTF8.GetBytes(itin.EditToken)))
    return Results.Unauthorized();
```

**S3 — Aucun header de sécurité HTTP**
`Program.cs` (global) — Pas de `X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`. Ajouter un middleware minimal avant `app.MapGet(...)` :

```csharp
app.Use(async (ctx, next) => {
    ctx.Response.Headers["X-Content-Type-Options"] = "nosniff";
    ctx.Response.Headers["X-Frame-Options"] = "DENY";
    ctx.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    await next();
});
```

**S4 — `/api/seed` gatedé par `IsDevelopment()` — vérifier Railway**
`Program.cs` — Si `ASPNETCORE_ENVIRONMENT` n'est pas explicitement `Production` sur Railway,
cet endpoint est accessible en production. Confirmer que Railway force cette variable, ou
ajouter une double protection (token secret en header).

**S5 — CORS : `AllowAnyHeader().AllowAnyMethod()`**
`Program.cs:26` — Tous les endpoints, y compris protégés, héritent de cette politique.
Restreindre les méthodes : `WithMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")`.

### Mineurs

**S6 — Double inscription simultanée → 500 au lieu de 409**
`Program.cs:300-316` — Race condition : si deux requêtes arrivent simultanément sur
`/register` avec le même email, l'index unique déclenche une `DbUpdateException` non catchée.

```csharp
try { await db.SaveChangesAsync(); }
catch (DbUpdateException) { return Results.Conflict(new { error = "Email déjà utilisé." }); }
```

**S7 — Validation email trop permissive**
`Program.cs:288` — `email.Contains('@')` laisse passer `a@` ou `@b`. Utiliser
`System.Net.Mail.MailAddress` (try/catch) ou une regex minimale :
`^[^@\s]+@[^@\s]+\.[^@\s]+$`.

**S8 — `AllowedHosts: "*"` dans `appsettings.json`**
Acceptable derrière Railway qui filtre les Host headers, mais à documenter explicitement pour
éviter de l'activer par inadvertance en dev exposé sur le réseau local.

---

## 2. Performance

### Majeurs

**P1 — Zéro `AsNoTracking()` sur les lectures publiques**
`Program.cs:100-101, 107-108` et variantes `/{slug}` — EF Core charge des snapshots
de change-tracking inutiles sur toutes les requêtes GET publiques. Gain estimé ~20-30 %.

```csharp
// Avant
db.Lieux.Include(l => l.Activites).OrderBy(l => l.Id).ToListAsync()
// Après
db.Lieux.AsNoTracking().Include(l => l.Activites).OrderBy(l => l.Id).ToListAsync()
```

**P2 — Aucun cache côté API**
`Program.cs` (global) — Chaque revalidation ISR du frontend frappe PostgreSQL. Un
`OutputCache` de 60 s sur les endpoints publics serait trivial :

```csharp
builder.Services.AddOutputCache();
// ...
app.UseOutputCache();
// Sur chaque endpoint public :
.CacheOutput(p => p.Expire(TimeSpan.FromSeconds(60)))
```

### Mineurs

**P3 — `GET /api/villes` charge tous les lieux de chaque ville**
`Program.cs:107-108` — `.Include(v => v.Lieux)` alors que la page listing n'a besoin que
du nom/slug/thumb. Une projection `.Select(v => new { v.Slug, v.Nom, ... })` suffit.

**P4 — `SyncNewContentAsync` fait N requêtes en boucle**
`DatabaseSeeder.cs:172` — Un `.Include(x => x.Activites).FirstAsync(...)` par lieu existant.
Charger tous les lieux existants en une seule requête avant la boucle.

---

## 3. Architecture & code

### Majeurs

**A1 — `EmailService` non injectable, `static HttpClient` sans `IHttpClientFactory`**
`RivieraSecrete.Api/EmailService.cs` — Classe `static`, pas d'interface `IEmailService`,
`HttpClient` à durée de vie infinie (les DNS Railway ne se renouvellent pas). Double problème :
non testable et potentiellement instable en production longue durée.

Fix : extraire vers Infrastructure, créer `IEmailService`, enregistrer via
`builder.Services.AddHttpClient<EmailService>()`.

**A2 — `Program.cs` de 767 lignes**
DTOs, helpers auth, constantes et tous les endpoints dans un seul fichier. Gérable
aujourd'hui, à décomposer progressivement : DTOs → `Dtos.cs`, helpers auth → `AuthHelpers.cs`.

### Mineurs

**A3 — Fonctions de validation non testables en isolation**
`ValiderItineraire`, `EstAutoriseSurItineraireCompose`, `EstSlugValide` sont des fonctions
locales dans `Program.cs` — correctes mais invisibles aux tests unitaires. Les extraire dans
une classe statique `Validators` permettrait de les tester sans démarrer l'hôte.

---

## 4. Maintenabilité & dette

### Critique

**M1 — Zéro test**
Aucun projet `*.Tests`. Les règles de validation et d'autorisation ne sont couvertes par rien.
Un bug dans `EstAutoriseSurItineraireCompose` ou `ValiderItineraireCompose` peut ouvrir un
vecteur d'abus sans filet.

Minimum vital :
- Tests unitaires sur `Valider*`, `EstAutorise*`, `EstSlugValide`
- 1 test d'intégration sur les endpoints auth (`/register`, `/login`, `/confirm-email`) avec
  SQLite in-memory

### Majeurs

**M2 — Logging via `Console.WriteLine`**
`EmailService.cs`, `RivieraSecrete.Tools/Program.cs` — Pas structuré, pas corrélé au request
ID, illisible dans les logs Railway agrégés. Migrer vers `ILogger<T>` / `ILoggerFactory`.

**M3 — Aucune gestion globale des exceptions**
Une `NullReferenceException` dans le seeder ou sur un champ `!` retourne un 500 sans log
utilisable. Ajouter `app.UseExceptionHandler(...)` ou un middleware de logging des 5xx.

**M4 — Inscription sans transaction groupée email + DB**
`Program.cs:300-316` — Si `SaveChangesAsync` réussit mais que l'email de confirmation part
en erreur non catchée, le compte existe sans que le mail soit parti. Toléré via le endpoint
`/resend-confirmation`, mais fragile si la propagation d'exception change.

### Mineurs

**M5 — `PasswordResetTokenExpiry` null sans assertion explicite**
`Program.cs:424` — `user.PasswordResetTokenExpiry < DateTime.UtcNow` avec un
`Nullable<DateTime>` : si `null`, la comparaison retourne `false` et un token sans expiry
passerait comme valide. Ne se produit pas en pratique (les deux champs sont toujours settés
ensemble), mais l'invariant n'est pas vérifié explicitement.

**M6 — Tag Docker `sdk:10.0` flottant**
`Dockerfile:1` — Un patch cassant de MS pourrait introduire une régression silencieuse.
Épingler sur `sdk:10.0.x` (version mineure fixée).

**M7 — `CreatedAt` non-nullable sans initialisation C#**
`UserConfiguration.cs:22` — `HasDefaultValueSql("now()")` fonctionne si EF n'envoie pas la
colonne explicitement. Si un code futur initialise `new User { CreatedAt = default }`,
PostgreSQL ne substitue pas le `DEFAULT`. Utiliser `DateTime?` ou `= DateTime.UtcNow` dans
le constructeur de `User`.

---

## Résumé des priorités

| Priorité | Items | Effort |
|----------|-------|--------|
| **Critiques** | S1 (JWT guard), M1 (tests) | < 1h pour S1 ; 1-2j pour M1 minimal |
| **Majeurs** | S2 (timing-safe), S3 (headers HTTP), P1 (AsNoTracking), P2 (OutputCache), A1 (EmailService), M2 (ILogger), B3 (vérifier Railway env) | 30 min chacun |
| **Mineurs** | S6 (DbUpdateException), S7 (email regex), P3 (projection villes), M6 (Docker tag), M7 (CreatedAt) | < 15 min chacun |
